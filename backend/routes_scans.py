import os
import uuid
import json
import base64
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Scan
import ml_service

scans_bp = Blueprint('scans', __name__, url_prefix='/api/scans')


def _allowed(filename):
    return '.' in filename and \
        filename.rsplit('.', 1)[1].lower() in current_app.config['ALLOWED_EXTENSIONS']


def _store_image(image_bytes, mime_type, ext, subfolder):
    """
    Store an uploaded image. Returns (image_path, image_data).
    - Prefers filesystem when DATA_DIR is set and writable (local dev or paid Render disk).
    - Falls back to embedding the image as a data URI inside the database
      (free Render tier with no persistent disk).
    """
    upload_folder = current_app.config['UPLOAD_FOLDER']
    try:
        os.makedirs(os.path.join(upload_folder, subfolder), exist_ok=True)
        filename = f"{uuid.uuid4().hex}.{ext}"
        full_path = os.path.join(upload_folder, subfolder, filename)
        with open(full_path, 'wb') as f:
            f.write(image_bytes)
        return f"{subfolder}/{filename}", None
    except (OSError, PermissionError) as e:
        # No writable disk — embed in DB
        print(f"[storage] Falling back to in-DB storage: {e}")
        b64 = base64.b64encode(image_bytes).decode('ascii')
        return None, f"data:{mime_type};base64,{b64}"


@scans_bp.post('')
@jwt_required()
def create_scan():
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

    if result.get('not_a_pest'):
        return jsonify({
            'error': 'no_pest_detected',
            'message': "We couldn't detect any pest in this image. Please upload a clear, close-up photo of the pest you want to identify.",
            'confidence': result['confidence'],
            'top_guess': result['predicted_class'],
        }), 422

    ext = file.filename.rsplit('.', 1)[1].lower()
    mime = file.mimetype or f"image/{ext}"
    image_path, image_data = _store_image(image_bytes, mime, ext, 'scans')

    scan = Scan(
        user_id=user_id,
        image_path=image_path,
        image_data=image_data,
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
    if scan.image_path:
        img_path = os.path.join(current_app.config['UPLOAD_FOLDER'], scan.image_path)
        try:
            if os.path.exists(img_path):
                os.remove(img_path)
        except Exception:
            pass
    db.session.delete(scan)
    db.session.commit()
    return jsonify({'message': 'Scan deleted'}), 200
