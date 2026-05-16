from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import bcrypt

db = SQLAlchemy()


class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(120), nullable=False)
    phone = db.Column(db.String(20))
    region = db.Column(db.String(100))
    farm_name = db.Column(db.String(120))
    farm_size_hectares = db.Column(db.Float)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    scans = db.relationship('Scan', backref='user', lazy=True, cascade='all, delete-orphan',
                            foreign_keys='Scan.user_id')
    reports = db.relationship('Report', backref='user', lazy=True, cascade='all, delete-orphan',
                              foreign_keys='Report.user_id')
    emergency_contacts = db.relationship('EmergencyContact', backref='user', lazy=True,
                                         cascade='all, delete-orphan')

    def set_password(self, password):
        self.password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    def check_password(self, password):
        return bcrypt.checkpw(password.encode('utf-8'), self.password_hash.encode('utf-8'))

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'full_name': self.full_name,
            'phone': self.phone,
            'region': self.region,
            'farm_name': self.farm_name,
            'farm_size_hectares': self.farm_size_hectares,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class Scan(db.Model):
    """Every AI scan (pest identification) the user runs."""
    __tablename__ = 'scans'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    image_path = db.Column(db.String(255), nullable=False)
    predicted_class = db.Column(db.String(100), nullable=False)
    confidence = db.Column(db.Float, nullable=False)
    all_predictions = db.Column(db.Text)  # JSON
    detections = db.Column(db.Text)  # JSON list of bounding boxes
    image_width = db.Column(db.Integer)
    image_height = db.Column(db.Integer)
    used_real_model = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        import json
        return {
            'id': self.id,
            'user_id': self.user_id,
            'image_path': self.image_path,
            'predicted_class': self.predicted_class,
            'confidence': self.confidence,
            'all_predictions': json.loads(self.all_predictions) if self.all_predictions else {},
            'detections': json.loads(self.detections) if self.detections else [],
            'image_width': self.image_width,
            'image_height': self.image_height,
            'used_real_model': self.used_real_model,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class Report(db.Model):
    """Pest outbreak report — feeds the Detection Map and Learn → Reported Outbreaks tab."""
    __tablename__ = 'reports'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    scan_id = db.Column(db.Integer, db.ForeignKey('scans.id'), nullable=True)
    pest_class = db.Column(db.String(100), nullable=False)
    severity = db.Column(db.String(20), nullable=False)  # low | medium | high | critical
    crop_affected = db.Column(db.String(100))
    estimated_area_hectares = db.Column(db.Float)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    region = db.Column(db.String(100))
    description = db.Column(db.Text)
    image_path = db.Column(db.String(255))
    status = db.Column(db.String(20), default='active')  # active | resolved
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self, include_user=True):
        d = {
            'id': self.id,
            'user_id': self.user_id,
            'scan_id': self.scan_id,
            'pest_class': self.pest_class,
            'severity': self.severity,
            'crop_affected': self.crop_affected,
            'estimated_area_hectares': self.estimated_area_hectares,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'region': self.region,
            'description': self.description,
            'image_path': self.image_path,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
        if include_user and self.user:
            d['user_name'] = self.user.full_name
            d['user_region'] = self.user.region
        return d


class EmergencyContact(db.Model):
    """User-added emergency contacts (extension officer, neighbour farmer, agro-vet, etc)."""
    __tablename__ = 'emergency_contacts'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(120), nullable=False)
    role = db.Column(db.String(80))  # e.g. "Extension Officer", "Neighbour"
    phone = db.Column(db.String(30), nullable=False)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'role': self.role,
            'phone': self.phone,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
