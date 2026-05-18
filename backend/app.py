"""
PestGuard backend.

Launch (dev):
    python app.py

Production (Hugging Face Spaces):
    The Dockerfile builds the React frontend into ./static, then runs this app.
    When ./static exists, Flask serves the React app from / and the API from /api/*.

Binds to 0.0.0.0 so the dev frontend (and a phone on the same Wi-Fi) can reach it.
"""
import os
import socket

# Load .env file if present (for DATABASE_URL, secrets, etc.)
from dotenv import load_dotenv
load_dotenv()
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
    # ── Detect if a built frontend exists, and configure Flask accordingly ──
    # In production (Docker / Hugging Face) the Dockerfile copies the built
    # React app into ./static (relative to the backend folder). When that
    # folder exists we tell Flask to serve it as the static root, so visiting
    # `/` returns the React index.html and other paths fall through to React
    # Router. In local dev (where the frontend is run separately via Vite),
    # this folder won't exist and Flask runs as API-only.
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    static_dir = os.environ.get('STATIC_DIR') or os.path.join(backend_dir, 'static')
    serving_frontend = os.path.isdir(static_dir) and os.path.isfile(os.path.join(static_dir, 'index.html'))

    if serving_frontend:
        app = Flask(__name__, static_folder=static_dir, static_url_path='')
        print(f"[init] Serving frontend from: {static_dir}")
    else:
        app = Flask(__name__)
        print(f"[init] API-only mode (no frontend found at {static_dir})")

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

    # ─── Frontend routes (production only) ───────────────────────────────────
    # IMPORTANT: these must be registered AFTER all `/api/*` routes so the API
    # takes priority. The catch-all below serves index.html for any unknown
    # path so React Router can handle client-side routing (e.g. /reports/new,
    # /scans/123 — these aren't real backend routes, they're React routes).
    if serving_frontend:
        @app.get('/')
        def index():
            return send_from_directory(static_dir, 'index.html')

        @app.get('/<path:path>')
        def frontend_catchall(path):
            # Never intercept API or uploads — those have their own handlers.
            if path.startswith('api/') or path.startswith('uploads/'):
                return jsonify({'error': 'Not found'}), 404
            # If it's a real static file (CSS, JS, image, favicon), serve it.
            full_path = os.path.join(static_dir, path)
            if os.path.isfile(full_path):
                return send_from_directory(static_dir, path)
            # Otherwise let React Router handle it client-side.
            return send_from_directory(static_dir, 'index.html')

    @app.errorhandler(404)
    def nf(e):
        # In production, if the frontend is being served, a 404 on a non-API
        # path means React Router will pick it up — but only if we serve
        # index.html. In API-only mode we just return JSON like before.
        if serving_frontend:
            from flask import request
            if not request.path.startswith('/api/') and not request.path.startswith('/uploads/'):
                return send_from_directory(static_dir, 'index.html')
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
