"""
PestGuard backend + frontend (combined).

Locally:
    python app.py
On Hugging Face Spaces:
    Docker image runs `gunicorn app:app --bind 0.0.0.0:7860`

In production we also serve the built React frontend from /app/static so that
the whole app lives at one URL. In dev STATIC_DIR is unset and Flask only serves
the API — Vite's dev server handles the frontend separately on port 5173.
"""
import os
import socket
from flask import Flask, jsonify, send_from_directory, abort
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
    # Where the production frontend was built to (set in Dockerfile)
    static_dir = os.environ.get('STATIC_DIR')
    if static_dir and os.path.exists(static_dir):
        app = Flask(__name__, static_folder=static_dir, static_url_path='')
        serving_frontend = True
    else:
        app = Flask(__name__)
        serving_frontend = False
    app.config.from_object(Config)

    CORS(app, resources={
        r"/api/*": {"origins": app.config['CORS_ORIGINS']},
        r"/uploads/*": {"origins": app.config['CORS_ORIGINS']},
    }, supports_credentials=True)
    db.init_app(app)
    JWTManager(app)

    # Ensure upload folders exist (try; if /data isn't writable, in-DB fallback kicks in)
    try:
        os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
        os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'scans'), exist_ok=True)
        os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'reports'), exist_ok=True)
    except (OSError, PermissionError) as e:
        print(f"[init] Upload folder not writable, will use in-DB images: {e}")

    os.makedirs(os.path.dirname(app.config['MODEL_PATH']), exist_ok=True)

    with app.app_context():
        ml_service.load_model(app.config['MODEL_PATH'])

    # API blueprints
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
            'serving_frontend': serving_frontend,
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

    # ===== Serve the React frontend (production only) =====
    if serving_frontend:
        @app.get('/')
        def index():
            return send_from_directory(static_dir, 'index.html')

        @app.get('/<path:path>')
        def frontend(path):
            # API & uploads handled above by blueprints/serve_upload
            if path.startswith('api/') or path.startswith('uploads/'):
                abort(404)
            # Try to serve the exact file (CSS, JS, icons, etc.)
            full = os.path.join(static_dir, path)
            if os.path.isfile(full):
                return send_from_directory(static_dir, path)
            # Otherwise this is a React Router route — serve index.html and let
            # the client-side router handle it.
            return send_from_directory(static_dir, 'index.html')

    @app.errorhandler(404)
    def nf(e):
        # API 404s stay JSON. Frontend routes are caught above.
        return jsonify({'error': 'Not found'}), 404

    @app.errorhandler(413)
    def too_large(e):
        return jsonify({'error': 'File too large (max 16 MB)'}), 413

    with app.app_context():
        db.create_all()

    return app


def _lan_ip():
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
