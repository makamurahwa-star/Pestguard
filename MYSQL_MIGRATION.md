# PestGuard — Switching to MySQL

How to migrate your local development database from SQLite to MySQL (via XAMPP).

## Files in this patch

| File | What |
|---|---|
| `backend/requirements.txt` | adds `PyMySQL` + `cryptography` (MySQL driver) |
| `backend/.env.example` | template for the `.env` file (you'll rename it) |
| `backend/app.py` | loads `.env` on startup |
| `backend/test_mysql.py` | quick connection test before migration |
| `backend/migrate_sqlite_to_mysql.py` | data migration script |
| `MYSQL_MIGRATION.md` | this guide |

## Step 1 — Apply the patch

```powershell
cd C:\dev\pestguard

Expand-Archive -Path "$env:USERPROFILE\Downloads\mysql-patch.zip" -DestinationPath "$env:TEMP\mysql" -Force
Copy-Item -Path "$env:TEMP\mysql\mysql-patch\*" -Destination "C:\dev\pestguard\" -Recurse -Force
Remove-Item -Recurse -Force "$env:TEMP\mysql"
```

## Step 2 — Install + start XAMPP

1. Download from https://www.apachefriends.org/download.html
2. Install with defaults
3. Open **XAMPP Control Panel** → click **Start** next to **MySQL**
4. Also click **Start** next to **Apache** (needed for phpMyAdmin)

## Step 3 — Create the `pestguard` database

In XAMPP Control Panel, click **Admin** next to MySQL. phpMyAdmin opens.

1. Left sidebar → **New**
2. Database name: `pestguard`
3. Collation: `utf8mb4_unicode_ci`
4. Click **Create**

Leave the database empty — the backend will create the tables.

## Step 4 — Create your `.env` file

In your `backend/` folder:

```powershell
cd backend
Copy-Item .env.example .env
```

Open `.env` in VS Code. Default values work for fresh XAMPP install
(user `root` with empty password). If you've set a MySQL password,
edit the line:

```
DATABASE_URL=mysql+pymysql://root:YOUR_PASSWORD@localhost:3306/pestguard?charset=utf8mb4
```

## Step 5 — Install the new dependencies

```powershell
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

This installs `PyMySQL` and `cryptography`. Should take <30 seconds.

## Step 6 — Test the connection

```powershell
python test_mysql.py
```

You should see:
```
DATABASE_URL: mysql+pymysql://root:@localhost:3306/pestguard?charset=utf8mb4

✅ Connected to MySQL/MariaDB version: 10.x.x-MariaDB
✅ Current database: pestguard
ℹ️  Database is empty (ready for migration)

🎉 Ready to migrate! Run: python migrate_sqlite_to_mysql.py
```

If you get an error, see Troubleshooting below.

## Step 7 — Run the migration

Make sure your SQLite file `backend/pestguard.db` still exists. Then:

```powershell
python migrate_sqlite_to_mysql.py
```

You'll see something like:
```
📂 Source (SQLite): pestguard.db
🎯 Target (MySQL): localhost:3306/pestguard

📐 Creating schema in MySQL...
   ✓ Schema ready

👥 Migrating users...
   ✓ 3 user(s) migrated
📷 Migrating scans...
   ✓ 12 scan(s) migrated
🗺️  Migrating reports...
   ✓ 5 report(s) migrated
📞 Migrating emergency contacts...
   ✓ 2 contact(s) migrated

🔧 Updating auto-increment counters...
   ✓ Done

══════════════════════════════════════════════════
✅ Migration complete!

   Users:    3
   Scans:    12
   Reports:  5
   Contacts: 2
```

## Step 8 — Verify in phpMyAdmin

In phpMyAdmin, click the `pestguard` database in the left sidebar.
You should see tables: `users`, `scans`, `reports`, `emergency_contacts`.

Click `users` → you'll see your existing users in MySQL.

## Step 9 — Restart the backend

```powershell
python app.py
```

You'll see `Database: mysql+pymysql://...` in the startup banner
(if your config logs it). Login with any existing user — everything
works exactly as before, but the data is now in MySQL!

## Going back to SQLite

If anything breaks, just comment out the `DATABASE_URL` line in `.env`:
```
# DATABASE_URL=mysql+pymysql://...
```

The backend falls back to SQLite (`pestguard.db`) and your old data is
still intact.

## Troubleshooting

### "Connection refused"
MySQL isn't running. Open XAMPP Control Panel and click **Start** next to MySQL.

### "Access denied for user 'root'"
You've set a MySQL password. Either:
- Add it to `.env`: `DATABASE_URL=mysql+pymysql://root:YOUR_PW@localhost:3306/pestguard?charset=utf8mb4`
- Or reset it in phpMyAdmin → User accounts

### "Unknown database 'pestguard'"
You skipped Step 3. Open phpMyAdmin → New → create the `pestguard` database.

### "No such file or directory: pestguard.db"
Your SQLite file is elsewhere. Run with `--sqlite-path`:
```powershell
python migrate_sqlite_to_mysql.py --sqlite-path "..\some\other\path\pestguard.db"
```

### "ModuleNotFoundError: No module named 'pymysql'"
You haven't installed the new requirements. Run `pip install -r requirements.txt`.

### "MySQL already has data (users found)"
The migration is idempotent — it refuses to run a second time to avoid duplicates.
To re-migrate: drop and recreate the `pestguard` database in phpMyAdmin, then re-run.
