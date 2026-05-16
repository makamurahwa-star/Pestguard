import os
import uuid
import json
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Scan
import ml_service

scans_bp = Blueprint('scans', __name__, url_prefix='/api/scans')


def _allowed(filename):
    return '.' in filename and \
        filename.rsplit('.', 1)[1].lower() in current_app.config['ALLOWED_EXTENSIONS']


@scans_bp.post('')
@jwt_required()
def create_scan():
    """Run the AI on an uploaded image and persist the scan."""
    user_id = int(get_jwt_identity())
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400
    file = request.files['image']
    if not file.filename:
        return jsonify({'error': 'No file selected'}), 400
    if not _allowed(file.filename):
        return jsonify({'error': 'File type not allowed'}), 400

    image_bytes = file.read()
    result = ml_service.predict(
        image_bytes,
        class_names=current_app.config['CLASS_NAMES'],
        image_size=current_app.config['IMAGE_SIZE'],
    )

    # Reject images that don't look like a pest at all (uniform predictions).
    # We don't save these to the user's scan history.
    if result.get('not_a_pest'):
        return jsonify({
            'error': 'no_pest_detected',
            'message': "We couldn't detect any pest in this image. Please upload a clear, close-up photo of the pest you want to identify.",
            'confidence': result['confidence'],
            'top_guess': result['predicted_class'],
        }), 422

    ext = file.filename.rsplit('.', 1)[1].lower()
    filename = f"{uuid.uuid4().hex}.{ext}"
    upload_dir = os.path.join(current_app.config['UPLOAD_FOLDER'], 'scans')
    os.makedirs(upload_dir, exist_ok=True)
    with open(os.path.join(upload_dir, filename), 'wb') as f:
        f.write(image_bytes)
    relative_path = f"scans/{filename}"

    scan = Scan(
        user_id=user_id,
        image_path=relative_path,
        predicted_class=result['predicted_class'],
        confidence=result['confidence'],
        all_predictions=json.dumps(result['all_predictions']),
        detections=json.dumps(result.get('detections', [])),
        image_width=result.get('image_width'),
        image_height=result.get('image_height'),
        used_real_model=result['used_real_model'],
    )
    db.session.add(scan)
    db.session.commit()

    return jsonify({
        'scan': scan.to_dict(),
        'meets_threshold': result['confidence'] >= current_app.config['CONFIDENCE_THRESHOLD'],
        'confidence_threshold': current_app.config['CONFIDENCE_THRESHOLD'],
    }), 201


@scans_bp.get('')
@jwt_required()
def list_scans():
    user_id = int(get_jwt_identity())
    scans = Scan.query.filter_by(user_id=user_id).order_by(Scan.created_at.desc()).limit(200).all()
    return jsonify({'scans': [s.to_dict() for s in scans]}), 200


@scans_bp.get('/<int:scan_id>')
@jwt_required()
def get_scan(scan_id):
    user_id = int(get_jwt_identity())
    scan = Scan.query.filter_by(id=scan_id, user_id=user_id).first()
    if not scan:
        return jsonify({'error': 'Not found'}), 404
    return jsonify({'scan': scan.to_dict()}), 200


@scans_bp.delete('/<int:scan_id>')
@jwt_required()
def delete_scan(scan_id):
    user_id = int(get_jwt_identity())
    scan = Scan.query.filter_by(id=scan_id, user_id=user_id).first()
    if not scan:
        return jsonify({'error': 'Not found'}), 404
    # remove image file
    img_path = os.path.join(current_app.config['UPLOAD_FOLDER'], scan.image_path)
    try:
        if os.path.exists(img_path):
            os.remove(img_path)
    except Exception:
        pass
    db.session.delete(scan)
    db.session.commit()
    return jsonify({'message': 'Scan deleted'}), 200
