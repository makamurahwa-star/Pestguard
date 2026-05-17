"""
PestGuard SQLite → MySQL data migration.

How it works:
1. Connects to the OLD SQLite database directly (read-only).
2. Connects to the NEW MySQL database via SQLAlchemy.
3. Creates the schema in MySQL (db.create_all()).
4. Copies every row in order: User → Scan → Report → EmergencyContact.

Run this AFTER:
  - You've created the empty MySQL database `pestguard`
  - You've set DATABASE_URL in your .env file
  - You've run `pip install -r requirements.txt`

Usage (from backend/):
  python migrate_sqlite_to_mysql.py [--sqlite-path PATH]

The SQLite file stays untouched — this is a one-way copy, not a move.
If anything fails, your data is still safe in pestguard.db.
"""
import os
import sys
import json
import sqlite3
import argparse
from datetime import datetime

# Load env vars BEFORE importing app modules
from dotenv import load_dotenv
load_dotenv()


def parse_sqlite_datetime(s):
    """SQLite stores datetimes as ISO strings; MySQL needs Python datetime."""
    if s is None:
        return None
    if isinstance(s, datetime):
        return s
    s = str(s)
    # Try a few common formats
    for fmt in ('%Y-%m-%d %H:%M:%S.%f', '%Y-%m-%d %H:%M:%S', '%Y-%m-%dT%H:%M:%S.%f', '%Y-%m-%dT%H:%M:%S'):
        try:
            return datetime.strptime(s, fmt)
        except ValueError:
            continue
    return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--sqlite-path', default='pestguard.db',
                    help='Path to the existing SQLite database (default: pestguard.db)')
    args = ap.parse_args()

    sqlite_path = args.sqlite_path
    if not os.path.exists(sqlite_path):
        print(f"❌ SQLite file not found: {sqlite_path}")
        print(f"   Pass --sqlite-path PATH if your file is elsewhere.")
        sys.exit(1)

    # Confirm MySQL URL is set
    db_url = os.environ.get('DATABASE_URL', '')
    if not db_url.startswith(('mysql', 'mysql+')):
        print(f"❌ DATABASE_URL doesn't look like MySQL. Got: {db_url[:30]}...")
        print(f"   Set DATABASE_URL in your .env file first.")
        print(f"   Example: DATABASE_URL=mysql+pymysql://root:@localhost:3306/pestguard?charset=utf8mb4")
        sys.exit(1)

    print(f"📂 Source (SQLite): {sqlite_path}")
    print(f"🎯 Target (MySQL): {db_url.split('@')[1] if '@' in db_url else db_url}")
    print()

    # Connect to SQLite directly with sqlite3 — no schema definition needed
    sqlite_conn = sqlite3.connect(sqlite_path)
    sqlite_conn.row_factory = sqlite3.Row

    # Connect to MySQL via SQLAlchemy — uses your models
    from app import create_app
    from models import db, User, Scan, Report, EmergencyContact

    app = create_app()
    with app.app_context():
        # 1. Create schema in MySQL
        print("📐 Creating schema in MySQL...")
        db.create_all()
        print("   ✓ Schema ready")
        print()

        # Safety check: refuse to migrate if MySQL already has data
        if User.query.count() > 0:
            print("⚠️  MySQL already has data (users found). Refusing to migrate to avoid duplicates.")
            print("   To re-run: empty the MySQL database in phpMyAdmin, then try again.")
            sys.exit(1)

        # ────────────────────────────────────────────────────────────
        # 2. Migrate users
        # ────────────────────────────────────────────────────────────
        print("👥 Migrating users...")
        rows = sqlite_conn.execute("SELECT * FROM users").fetchall()
        for r in rows:
            d = dict(r)
            user = User(
                id=d.get('id'),
                username=d.get('username'),
                email=d.get('email'),
                password_hash=d.get('password_hash'),
                full_name=d.get('full_name'),
                phone=d.get('phone'),
                region=d.get('region'),
                farm_name=d.get('farm_name'),
                farm_size_hectares=d.get('farm_size_hectares'),
                is_active=bool(d.get('is_active', True)),
                created_at=parse_sqlite_datetime(d.get('created_at')),
                updated_at=parse_sqlite_datetime(d.get('updated_at')),
            )
            db.session.add(user)
        db.session.commit()
        print(f"   ✓ {len(rows)} user(s) migrated")

        # ────────────────────────────────────────────────────────────
        # 3. Migrate scans
        # ────────────────────────────────────────────────────────────
        try:
            rows = sqlite_conn.execute("SELECT * FROM scans").fetchall()
        except sqlite3.OperationalError:
            print("📷 No scans table in SQLite — skipping")
            rows = []
        if rows:
            print(f"📷 Migrating scans...")
            for r in rows:
                d = dict(r)
                scan = Scan(
                    id=d.get('id'),
                    user_id=d.get('user_id'),
                    image_path=d.get('image_path'),
                    image_data=d.get('image_data'),
                    predicted_class=d.get('predicted_class'),
                    confidence=d.get('confidence'),
                    all_predictions=d.get('all_predictions'),
                    detections=d.get('detections'),
                    image_width=d.get('image_width'),
                    image_height=d.get('image_height'),
                    used_real_model=bool(d.get('used_real_model', False)),
                    created_at=parse_sqlite_datetime(d.get('created_at')),
                )
                db.session.add(scan)
            db.session.commit()
            print(f"   ✓ {len(rows)} scan(s) migrated")

        # ────────────────────────────────────────────────────────────
        # 4. Migrate reports
        # ────────────────────────────────────────────────────────────
        try:
            rows = sqlite_conn.execute("SELECT * FROM reports").fetchall()
        except sqlite3.OperationalError:
            print("🗺️  No reports table in SQLite — skipping")
            rows = []
        if rows:
            print(f"🗺️  Migrating reports...")
            for r in rows:
                d = dict(r)
                report = Report(
                    id=d.get('id'),
                    user_id=d.get('user_id'),
                    scan_id=d.get('scan_id'),
                    pest_class=d.get('pest_class'),
                    severity=d.get('severity'),
                    crop_affected=d.get('crop_affected'),
                    estimated_area_hectares=d.get('estimated_area_hectares'),
                    latitude=d.get('latitude'),
                    longitude=d.get('longitude'),
                    region=d.get('region'),
                    description=d.get('description'),
                    image_path=d.get('image_path'),
                    image_data=d.get('image_data'),
                    status=d.get('status', 'active'),
                    created_at=parse_sqlite_datetime(d.get('created_at')),
                    updated_at=parse_sqlite_datetime(d.get('updated_at')),
                )
                db.session.add(report)
            db.session.commit()
            print(f"   ✓ {len(rows)} report(s) migrated")

        # ────────────────────────────────────────────────────────────
        # 5. Migrate emergency contacts
        # ────────────────────────────────────────────────────────────
        try:
            rows = sqlite_conn.execute("SELECT * FROM emergency_contacts").fetchall()
        except sqlite3.OperationalError:
            rows = []
        if rows:
            print(f"📞 Migrating emergency contacts...")
            for r in rows:
                d = dict(r)
                contact = EmergencyContact(
                    id=d.get('id'),
                    user_id=d.get('user_id'),
                    name=d.get('name'),
                    role=d.get('role'),
                    phone=d.get('phone'),
                    notes=d.get('notes'),
                    created_at=parse_sqlite_datetime(d.get('created_at')),
                )
                db.session.add(contact)
            db.session.commit()
            print(f"   ✓ {len(rows)} contact(s) migrated")

        # ────────────────────────────────────────────────────────────
        # 6. Fix MySQL auto-increment counters so new rows don't collide
        # ────────────────────────────────────────────────────────────
        print()
        print("🔧 Updating auto-increment counters...")
        from sqlalchemy import text
        for table in ['users', 'scans', 'reports', 'emergency_contacts']:
            try:
                result = db.session.execute(text(f"SELECT MAX(id) FROM {table}")).scalar()
                if result and result > 0:
                    db.session.execute(text(f"ALTER TABLE {table} AUTO_INCREMENT = {result + 1}"))
            except Exception as e:
                print(f"   ! could not update {table}: {e}")
        db.session.commit()
        print("   ✓ Done")

        # Final summary
        print()
        print("═" * 50)
        print("✅ Migration complete!")
        print()
        print(f"   Users:    {User.query.count()}")
        print(f"   Scans:    {Scan.query.count()}")
        print(f"   Reports:  {Report.query.count()}")
        print(f"   Contacts: {EmergencyContact.query.count()}")
        print()
        print("Your SQLite file is untouched. Restart `python app.py` to use MySQL.")

    sqlite_conn.close()


if __name__ == '__main__':
    main()
