"""
Quick MySQL connection test.

Run this before migrating to verify:
1. PyMySQL is installed
2. Your DATABASE_URL is set
3. MySQL is running
4. The pestguard database exists

Usage:
    python test_mysql.py
"""
import sys
from dotenv import load_dotenv
load_dotenv()
import os

db_url = os.environ.get('DATABASE_URL', '')
print(f"DATABASE_URL: {db_url}")
print()

if not db_url:
    print("❌ DATABASE_URL is not set.")
    print("   Make sure you have a .env file with DATABASE_URL=mysql+pymysql://...")
    sys.exit(1)

if not db_url.startswith(('mysql', 'mysql+')):
    print(f"❌ DATABASE_URL doesn't look like MySQL.")
    print(f"   Expected something like: mysql+pymysql://root:@localhost:3306/pestguard")
    sys.exit(1)

try:
    from sqlalchemy import create_engine, text
except ImportError:
    print("❌ SQLAlchemy isn't installed. Run: pip install -r requirements.txt")
    sys.exit(1)

try:
    engine = create_engine(db_url, pool_pre_ping=True)
    with engine.connect() as conn:
        result = conn.execute(text("SELECT VERSION() AS v"))
        version = result.scalar()
        print(f"✅ Connected to MySQL/MariaDB version: {version}")

        # Check current database
        result = conn.execute(text("SELECT DATABASE() AS db"))
        current_db = result.scalar()
        print(f"✅ Current database: {current_db}")

        # List tables
        result = conn.execute(text("SHOW TABLES"))
        tables = [r[0] for r in result]
        if tables:
            print(f"✅ Existing tables ({len(tables)}): {', '.join(tables)}")
        else:
            print("ℹ️  Database is empty (ready for migration)")

except Exception as e:
    print(f"❌ Connection failed: {e}")
    print()
    print("Common causes:")
    print("  - MySQL not started in XAMPP Control Panel")
    print("  - Wrong password (default is empty: root:@)")
    print("  - Database `pestguard` doesn't exist — create it in phpMyAdmin first")
    sys.exit(1)

print()
print("🎉 Ready to migrate! Run: python migrate_sqlite_to_mysql.py")
