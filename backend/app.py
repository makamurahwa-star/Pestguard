"""
PestGuard backend.

Launch:
    python app.py

Binds to 0.0.0.0 so the dev frontend (and a phone on the same Wi-Fi) can reach it.
"""
import os
import socket
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager

from config import Config
from models import db
from routes_auth import auth_bp
from routes_scans import scans_bp
from routes_reports import reports_bp
from routes_misc import contacts_bp, pestdata_bp
import ml_service


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(app, resources={
        r"/api/*": {"origins": app.config['CORS_ORIGINS']},
        r"/uploads/*": {"origins": app.config['CORS_ORIGINS']},
    }, supports_credentials=True)
    db.init_app(app)
    JWTManager(app)

    # Folders
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'scans'), exist_ok=True)
    os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'reports'), exist_ok=True)
    os.makedirs(os.path.dirname(app.config['MODEL_PATH']), exist_ok=True)

    # Load model (silently falls back to mock if missing/no TF)
    with app.app_context():
        ml_service.load_model(app.config['MODEL_PATH'])

    # Blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(scans_bp)
    app.register_blueprint(reports_bp)
    app.register_blueprint(contacts_bp)
    app.register_blueprint(pestdata_bp)

    @app.get('/api/health')
    def health():
        return jsonify({
            'status': 'ok',
            'service': 'pestguard-api',
            'ml_model': ml_service.status(),
            'class_count': len(app.config['CLASS_NAMES']),
        }), 200

    @app.get('/api/config')
    def config_endpoint():
        return jsonify({
            'class_names': app.config['CLASS_NAMES'],
            'confidence_threshold': app.config['CONFIDENCE_THRESHOLD'],
            'allowed_extensions': sorted(app.config['ALLOWED_EXTENSIONS']),
            'max_image_size_mb': app.config['MAX_CONTENT_LENGTH'] // (1024 * 1024),
            'ml_model_loaded': ml_service.is_loaded(),
        }), 200

    @app.get('/uploads/<path:filename>')
    def serve_upload(filename):
        return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

    @app.errorhandler(404)
    def nf(e):
        return jsonify({'error': 'Not found'}), 404

    @app.errorhandler(413)
    def too_large(e):
        return jsonify({'error': 'File too large (max 16 MB)'}), 413

    with app.app_context():
        db.create_all()

    return app


def _lan_ip():
    """Best-effort detection of the LAN IP for the start banner."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return None


app = create_app()


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    lan = _lan_ip()
    print("\n🌱 PestGuard API")
    print(f"   Local:   http://localhost:{port}")
    if lan:
        print(f"   LAN:     http://{lan}:{port}   (open this from your phone)")
    print(f"   Health:  http://localhost:{port}/api/health\n")
    app.run(host='0.0.0.0', port=port, debug=os.environ.get('FLASK_DEBUG', '1') == '1')
