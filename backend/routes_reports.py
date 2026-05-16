import os
import uuid
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func
from models import db, Report, Scan

reports_bp = Blueprint('reports', __name__, url_prefix='/api/reports')


@reports_bp.post('')
@jwt_required()
def create_report():
    user_id = int(get_jwt_identity())
    if request.content_type and 'multipart' in request.content_type:
        data = request.form.to_dict()
        image_file = request.files.get('image')
    else:
        data = request.get_json() or {}
        image_file = None

    required = ['pest_class', 'severity', 'latitude', 'longitude']
    missing = [f for f in required if data.get(f) in (None, '')]
    if missing:
        return jsonify({'error': f"Missing: {', '.join(missing)}"}), 400

    try:
        latitude = float(data['latitude'])
        longitude = float(data['longitude'])
    except (TypeError, ValueError):
        return jsonify({'error': 'Invalid coordinates'}), 400
    if not (-90 <= latitude <= 90 and -180 <= longitude <= 180):
        return jsonify({'error': 'Coordinates out of range'}), 400

    severity = data['severity'].lower()
    if severity not in ('low', 'medium', 'high', 'critical'):
        return jsonify({'error': 'Invalid severity'}), 400

    # If pest_class doesn't exist in our class list, still accept (frontend already validates)
    pest_class = data['pest_class']

    image_path = None
    if image_file and image_file.filename:
        ext = image_file.filename.rsplit('.', 1)[-1].lower()
        if ext not in current_app.config['ALLOWED_EXTENSIONS']:
            return jsonify({'error': 'Invalid image type'}), 400
        filename = f"{uuid.uuid4().hex}.{ext}"
        upload_dir = os.path.join(current_app.config['UPLOAD_FOLDER'], 'reports')
        os.makedirs(upload_dir, exist_ok=True)
        image_file.save(os.path.join(upload_dir, filename))
        image_path = f"reports/{filename}"

    area = data.get('estimated_area_hectares')
    try:
        area = float(area) if area not in (None, '') else None
    except (TypeError, ValueError):
        area = None

    scan_id = data.get('scan_id')
    try:
        scan_id = int(scan_id) if scan_id not in (None, '') else None
    except (TypeError, ValueError):
        scan_id = None

    report = Report(
        user_id=user_id,
        scan_id=scan_id,
        pest_class=pest_class,
        severity=severity,
        crop_affected=data.get('crop_affected'),
        estimated_area_hectares=area,
        latitude=latitude,
        longitude=longitude,
        region=data.get('region'),
        description=data.get('description'),
        image_path=image_path,
    )
    db.session.add(report)
    db.session.commit()
    return jsonify({'report': report.to_dict()}), 201


@reports_bp.get('')
@jwt_required()
def list_reports():
    """List reports. By default returns everyone's (so the user can see outbreaks
    near them); set ?mine=true to filter to the current user's reports only."""
    user_id = int(get_jwt_identity())
    query = Report.query

    if request.args.get('mine', '').lower() == 'true':
        query = query.filter_by(user_id=user_id)

    pest_class = request.args.get('pest_class')
    if pest_class:
        query = query.filter_by(pest_class=pest_class)
    severity = request.args.get('severity')
    if severity:
        query = query.filter_by(severity=severity)
    status = request.args.get('status')
    if status:
        query = query.filter_by(status=status)
    region = request.args.get('region')
    if region:
        query = query.filter(Report.region.ilike(f"%{region}%"))
    days = request.args.get('days', type=int)
    if days:
        since = datetime.utcnow() - timedelta(days=days)
        query = query.filter(Report.created_at >= since)

    reports = query.order_by(Report.created_at.desc()).limit(500).all()
    return jsonify({'reports': [r.to_dict() for r in reports]}), 200


@reports_bp.get('/map')
@jwt_required()
def map_data():
    days = request.args.get('days', 60, type=int)
    since = datetime.utcnow() - timedelta(days=days)
    reports = Report.query.filter(Report.created_at >= since, Report.status == 'active').all()
    return jsonify({
        'markers': [{
            'id': r.id,
            'lat': r.latitude,
            'lng': r.longitude,
            'pest_class': r.pest_class,
            'severity': r.severity,
            'region': r.region,
            'crop': r.crop_affected,
            'created_at': r.created_at.isoformat(),
            'user_name': r.user.full_name if r.user else 'Farmer',
        } for r in reports]
    }), 200


@reports_bp.get('/<int:report_id>')
@jwt_required()
def get_report(report_id):
    report = Report.query.get(report_id)
    if not report:
        return jsonify({'error': 'Not found'}), 404
    return jsonify({'report': report.to_dict()}), 200


@reports_bp.put('/<int:report_id>')
@jwt_required()
def update_report(report_id):
    user_id = int(get_jwt_identity())
    report = Report.query.filter_by(id=report_id, user_id=user_id).first()
    if not report:
        return jsonify({'error': 'Not found or not yours'}), 404
    data = request.get_json() or {}
    for field in ['severity', 'crop_affected', 'description', 'status', 'region']:
        if field in data:
            setattr(report, field, data[field])
    db.session.commit()
    return jsonify({'report': report.to_dict()}), 200


@reports_bp.delete('/<int:report_id>')
@jwt_required()
def delete_report(report_id):
    user_id = int(get_jwt_identity())
    report = Report.query.filter_by(id=report_id, user_id=user_id).first()
    if not report:
        return jsonify({'error': 'Not found or not yours'}), 404
    if report.image_path:
        img_path = os.path.join(current_app.config['UPLOAD_FOLDER'], report.image_path)
        try:
            if os.path.exists(img_path):
                os.remove(img_path)
        except Exception:
            pass
    db.session.delete(report)
    db.session.commit()
    return jsonify({'message': 'Report deleted'}), 200


@reports_bp.get('/stats')
@jwt_required()
def stats():
    user_id = int(get_jwt_identity())
    days = request.args.get('days', 30, type=int)
    since = datetime.utcnow() - timedelta(days=days)

    # User's stats
    my_total = Report.query.filter_by(user_id=user_id).count()
    my_recent = Report.query.filter(Report.user_id == user_id, Report.created_at >= since).count()
    my_today = Report.query.filter(
        Report.user_id == user_id,
        Report.created_at >= datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    ).count()
    my_active = Report.query.filter_by(user_id=user_id, status='active').count()
    my_scans = Scan.query.filter_by(user_id=user_id).count()

    # Most-scanned pest
    top_pest_row = db.session.query(Scan.predicted_class, func.count(Scan.id).label('c')) \
        .filter(Scan.user_id == user_id).group_by(Scan.predicted_class) \
        .order_by(func.count(Scan.id).desc()).first()
    top_pest = top_pest_row[0] if top_pest_row else None

    # Community-wide breakdown for charts
    by_pest = dict(db.session.query(Report.pest_class, func.count(Report.id))
                   .group_by(Report.pest_class).all())
    by_severity = dict(db.session.query(Report.severity, func.count(Report.id))
                       .group_by(Report.severity).all())
    by_region = dict(db.session.query(Report.region, func.count(Report.id))
                     .filter(Report.region.isnot(None)).group_by(Report.region).all())
    daily = db.session.query(
        func.date(Report.created_at).label('day'),
        func.count(Report.id).label('count')
    ).filter(Report.created_at >= since).group_by('day').all()

    return jsonify({
        'my': {
            'total_reports': my_total,
            'recent_reports': my_recent,
            'today_reports': my_today,
            'active_reports': my_active,
            'total_scans': my_scans,
            'top_pest': top_pest,
        },
        'community': {
            'by_pest_class': by_pest,
            'by_severity': by_severity,
            'by_region': by_region,
            'daily_trend': [{'date': str(d.day), 'count': d.count} for d in daily],
        }
    }), 200
