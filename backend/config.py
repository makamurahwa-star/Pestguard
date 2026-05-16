import os
import json
from datetime import timedelta

BASE_DIR = os.path.abspath(os.path.dirname(__file__))


def _load_class_names():
    """
    Read class names from the IP102 pest data file. The order in the JSON file IS
    the class order. If the user's model uses a different order, edit
    ml_model/class_names.txt (one class per line, in model output order) — that
    file takes precedence.
    """
    override = os.path.join(BASE_DIR, 'ml_model', 'class_names.txt')
    if os.path.exists(override):
        with open(override, 'r', encoding='utf-8') as f:
            names = [line.strip() for line in f if line.strip()]
            if names:
                return names
    # default: take all keys from the pest data file in order (excluding _meta)
    pestdata_path = os.path.join(BASE_DIR, 'pestdata', 'ip102_pests.json')
    if os.path.exists(pestdata_path):
        with open(pestdata_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            return [k for k in data.keys() if not k.startswith('_')]
    return []


class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'pestguard-dev-secret-change-in-production')
    
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        'DATABASE_URL',
        f"sqlite:///{os.path.join(BASE_DIR, 'pestguard.db')}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'pestguard-jwt-secret-change-in-production')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=30)
    
    UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'heic'}
    
    MODEL_PATH = os.environ.get('MODEL_PATH', os.path.join(BASE_DIR, 'ml_model', 'pestguard_model.pt'))
    CLASS_NAMES = _load_class_names()
    CONFIDENCE_THRESHOLD = 0.75
    IMAGE_SIZE = (224, 224)
    PESTDATA_FILE = os.path.join(BASE_DIR, 'pestdata', 'ip102_pests.json')
    
    # CORS: allow LAN IPs so phone-on-LAN access works.
    # In dev we use a permissive wildcard regex; lock this down in production.
    CORS_ORIGINS = '*'
