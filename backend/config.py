import os
import json
from datetime import timedelta

BASE_DIR = os.path.abspath(os.path.dirname(__file__))

# On Render we'll mount a persistent disk at /var/data. Locally, fall back to
# the project's backend folder so dev still works without any env vars set.
DATA_DIR = os.environ.get('DATA_DIR', BASE_DIR)


def _load_class_names():
    """Read class names from the IP102 pest data file."""
    override = os.path.join(BASE_DIR, 'ml_model', 'class_names.txt')
    if os.path.exists(override):
        with open(override, 'r', encoding='utf-8') as f:
            names = [line.strip() for line in f if line.strip()]
            if names:
                return names
    pestdata_path = os.path.join(BASE_DIR, 'pestdata', 'ip102_pests.json')
    if os.path.exists(pestdata_path):
        with open(pestdata_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            return [k for k in data.keys() if not k.startswith('_')]
    return []


class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'pestguard-dev-secret-change-in-production')

    # On Render, DATABASE_URL is set to the managed PostgreSQL URL (if attached),
    # otherwise we fall back to SQLite on the persistent disk.
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        'DATABASE_URL',
        f"sqlite:///{os.path.join(DATA_DIR, 'pestguard.db')}"
    )
    # Render's PostgreSQL URLs start with postgres:// but SQLAlchemy needs postgresql://
    if SQLALCHEMY_DATABASE_URI.startswith('postgres://'):
        SQLALCHEMY_DATABASE_URI = SQLALCHEMY_DATABASE_URI.replace('postgres://', 'postgresql://', 1)
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'pestguard-jwt-secret-change-in-production')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=30)

    UPLOAD_FOLDER = os.environ.get('UPLOAD_FOLDER', os.path.join(DATA_DIR, 'uploads'))
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'heic'}

    MODEL_PATH = os.environ.get('MODEL_PATH', os.path.join(BASE_DIR, 'ml_model', 'pestguard_model.pt'))
    CLASS_NAMES = _load_class_names()
    CONFIDENCE_THRESHOLD = 0.75
    IMAGE_SIZE = (224, 224)
    PESTDATA_FILE = os.path.join(BASE_DIR, 'pestdata', 'ip102_pests.json')

    # CORS_ORIGINS: comma-separated whitelist of allowed origins.
    # In dev, '*' works. In production set this to your Vercel URL,
    # e.g. CORS_ORIGINS=https://pestguard.vercel.app
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '*')
