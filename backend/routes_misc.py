import json
import os
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, EmergencyContact

contacts_bp = Blueprint('contacts', __name__, url_prefix='/api/contacts')
pestdata_bp = Blueprint('pestdata', __name__, url_prefix='/api/pestdata')


@contacts_bp.get('')
@jwt_required()
def list_contacts():
    user_id = int(get_jwt_identity())
    contacts = EmergencyContact.query.filter_by(user_id=user_id) \
        .order_by(EmergencyContact.created_at.desc()).all()
    return jsonify({'contacts': [c.to_dict() for c in contacts]}), 200


@contacts_bp.post('')
@jwt_required()
def create_contact():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}
    if not data.get('name') or not data.get('phone'):
        return jsonify({'error': 'Name and phone required'}), 400
    contact = EmergencyContact(
        user_id=user_id,
        name=data['name'].strip(),
        role=data.get('role'),
        phone=data['phone'].strip(),
        notes=data.get('notes'),
    )
    db.session.add(contact)
    db.session.commit()
    return jsonify({'contact': contact.to_dict()}), 201


@contacts_bp.put('/<int:contact_id>')
@jwt_required()
def update_contact(contact_id):
    user_id = int(get_jwt_identity())
    c = EmergencyContact.query.filter_by(id=contact_id, user_id=user_id).first()
    if not c:
        return jsonify({'error': 'Not found'}), 404
    data = request.get_json() or {}
    for field in ['name', 'role', 'phone', 'notes']:
        if field in data:
            setattr(c, field, data[field])
    db.session.commit()
    return jsonify({'contact': c.to_dict()}), 200


@contacts_bp.delete('/<int:contact_id>')
@jwt_required()
def delete_contact(contact_id):
    user_id = int(get_jwt_identity())
    c = EmergencyContact.query.filter_by(id=contact_id, user_id=user_id).first()
    if not c:
        return jsonify({'error': 'Not found'}), 404
    db.session.delete(c)
    db.session.commit()
    return jsonify({'message': 'Contact deleted'}), 200


# --- Pest data: serve the IP102 reference library ---

_pestdata_cache = None


def _load_pestdata():
    global _pestdata_cache
    if _pestdata_cache is None:
        path = current_app.config['PESTDATA_FILE']
        with open(path, 'r', encoding='utf-8') as f:
            _pestdata_cache = json.load(f)
    return _pestdata_cache


@pestdata_bp.get('')
def get_all_pestdata():
    """Public — the frontend uses this to map a model prediction to friendly info.
    Returns the full IP102 reference (excluding _meta keys)."""
    data = _load_pestdata()
    return jsonify(data), 200


@pestdata_bp.get('/<path:name>')
def get_one(name):
    data = _load_pestdata()
    # case-insensitive lookup
    for key, val in data.items():
        if key.lower() == name.lower():
            return jsonify({'name': key, **val}), 200
    return jsonify({'error': 'Pest not found in library'}), 404
