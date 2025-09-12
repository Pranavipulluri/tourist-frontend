@echo off
echo 📦 Creating database backup...
set BACKUP_FILE=tourist_safety_backup_20251109_214216.sql
set BACKUP_FILE= =0
where pg_dump >nul 2>&1
if errorlevel 1 (
    echo ❌ pg_dump not found. Please install PostgreSQL tools.
    pause
    exit /b 1
)
pg_dump tourist_safety > ""
if errorlevel 1 (
    echo ❌ Database backup failed
    pause
    exit /b 1
) else (
    echo ✅ Database backup created: 
)
pause
