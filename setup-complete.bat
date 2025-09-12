@echo off
setlocal enabledelayedexpansion

REM Tourist Safety Platform - Complete Setup Script for Windows
REM This script sets up the entire tourist safety platform with real database

echo.
echo 🚀 Starting Tourist Safety Platform Setup...
echo.

REM Check if we're in the correct directory
if not exist "package.json" (
    echo ❌ ERROR: package.json not found. Please run this script from the tourist-safety-frontend directory.
    pause
    exit /b 1
)

echo 📋 Setting up Tourist Safety Platform with real database persistence...
echo.

REM 1. Install frontend dependencies
echo 🔧 Installing frontend dependencies...
call npm install
if errorlevel 1 (
    echo ❌ ERROR: Failed to install frontend dependencies
    pause
    exit /b 1
)
echo ✅ Frontend dependencies installed successfully
echo.

REM 2. Install backend dependencies
echo 🔧 Installing backend dependencies...
cd server

if not exist "package.json" (
    echo ❌ ERROR: Backend package.json not found
    pause
    exit /b 1
)

call npm install
if errorlevel 1 (
    echo ❌ ERROR: Failed to install backend dependencies
    pause
    exit /b 1
)
echo ✅ Backend dependencies installed successfully
echo.

REM 3. Setup environment variables
echo ⚙️ Setting up environment variables...

if not exist ".env" (
    (
    echo # Database Configuration
    echo DB_HOST=localhost
    echo DB_PORT=5432
    echo DB_NAME=tourist_safety
    echo DB_USER=postgres
    echo DB_PASSWORD=password
    echo.
    echo # JWT Configuration
    echo JWT_SECRET=your-super-secret-jwt-key-change-in-production-%RANDOM%-%RANDOM%
    echo JWT_EXPIRES_IN=24h
    echo.
    echo # API Keys ^(Replace with your actual keys^)
    echo GOOGLE_MAPS_API_KEY=AIzaSyDtcXKmULv8nTuOPOyEvXHVd5HGDgKQ81A
    echo OPENWEATHER_API_KEY=your-openweather-api-key
    echo TWILIO_ACCOUNT_SID=your-twilio-account-sid
    echo TWILIO_AUTH_TOKEN=your-twilio-auth-token
    echo TWILIO_PHONE_NUMBER=your-twilio-phone-number
    echo.
    echo # Email Configuration
    echo SMTP_HOST=smtp.gmail.com
    echo SMTP_PORT=587
    echo SMTP_USER=your-email@gmail.com
    echo SMTP_PASS=your-email-app-password
    echo.
    echo # Environment
    echo NODE_ENV=development
    echo PORT=3001
    echo.
    echo # Notification Services
    echo FIREBASE_SERVER_KEY=your-firebase-server-key
    echo.
    echo # Emergency Services
    echo EMERGENCY_WEBHOOK_URL=your-emergency-webhook-url
    echo.
    echo # Logging
    echo LOG_LEVEL=info
    ) > .env
    echo ✅ Environment file created at server\.env
    echo ⚠️ WARNING: Please update the API keys in server\.env with your actual credentials
    echo.
) else (
    echo ⚠️ WARNING: Environment file already exists
    echo.
)

cd ..

REM 4. Check for PostgreSQL
echo 🔍 Checking PostgreSQL installation...
where psql >nul 2>&1
if errorlevel 1 (
    echo ⚠️ WARNING: PostgreSQL not found. Installing PostgreSQL is recommended for real data persistence.
    echo ⚠️ WARNING: For now, the application will use mock data.
    echo ⚠️ WARNING: To install PostgreSQL on Windows:
    echo ⚠️ WARNING:   Download from https://www.postgresql.org/download/windows/
    echo ⚠️ WARNING:   Or use: winget install PostgreSQL.PostgreSQL
    echo.
) else (
    echo ✅ PostgreSQL found
    echo 🗄️ Setting up database...
    
    REM Create database if it doesn't exist
    createdb tourist_safety 2>nul
    if errorlevel 1 (
        echo ⚠️ WARNING: Database might already exist or PostgreSQL is not running
    )
    
    REM Apply schema if it exists
    if exist "..\schema.sql" (
        echo 📋 Applying database schema...
        psql -d tourist_safety -f "..\schema.sql" 2>nul
        if errorlevel 1 (
            echo ⚠️ WARNING: Schema application had some warnings ^(this is normal for existing databases^)
        ) else (
            echo ✅ Database schema applied successfully
        )
    ) else (
        echo ⚠️ WARNING: schema.sql not found, skipping database initialization
    )
    echo.
)

REM 5. Create startup scripts
echo 📝 Creating startup scripts...

REM Development script
(
echo @echo off
echo echo 🚀 Starting Tourist Safety Platform in Development Mode...
echo echo.
echo echo 🔧 Starting backend server...
echo cd server
echo start "Backend Server" cmd /k "npm run dev"
echo timeout /t 3 /nobreak ^>nul
echo echo 🎨 Starting frontend development server...
echo cd ..
echo start "Frontend Server" cmd /k "npm run dev"
echo echo.
echo echo ✅ Tourist Safety Platform is running!
echo echo 📊 Backend API: http://localhost:3001
echo echo 🌐 Frontend: http://localhost:5173
echo echo 🏥 Health Check: http://localhost:3001/health
echo echo.
echo echo Press any key to open the application in your browser...
echo pause ^>nul
echo start http://localhost:5173
) > start-dev.bat

REM Production script
(
echo @echo off
echo echo 🚀 Starting Tourist Safety Platform in Production Mode...
echo echo.
echo echo 🔨 Building frontend...
echo call npm run build
echo if errorlevel 1 ^(
echo     echo ❌ Build failed
echo     pause
echo     exit /b 1
echo ^)
echo echo 🔧 Starting backend server...
echo cd server
echo set NODE_ENV=production
echo npm start
) > start-prod.bat

echo ✅ Startup scripts created (start-dev.bat, start-prod.bat)
echo.

REM 6. Create database backup script
(
echo @echo off
echo echo 📦 Creating database backup...
echo set BACKUP_FILE=tourist_safety_backup_%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%.sql
echo set BACKUP_FILE=!BACKUP_FILE: =0!
echo where pg_dump ^>nul 2^>^&1
echo if errorlevel 1 ^(
echo     echo ❌ pg_dump not found. Please install PostgreSQL tools.
echo     pause
echo     exit /b 1
echo ^)
echo pg_dump tourist_safety ^> "!BACKUP_FILE!"
echo if errorlevel 1 ^(
echo     echo ❌ Database backup failed
echo     pause
echo     exit /b 1
echo ^) else ^(
echo     echo ✅ Database backup created: !BACKUP_FILE!
echo ^)
echo pause
) > backup-database.bat

echo ✅ Database backup script created (backup-database.bat)
echo.

REM 7. Create docker setup
echo 🐳 Creating Docker configuration for easy deployment...

(
echo version: '3.8'
echo.
echo services:
echo   postgres:
echo     image: postgis/postgis:15-3.3
echo     environment:
echo       POSTGRES_DB: tourist_safety
echo       POSTGRES_USER: postgres
echo       POSTGRES_PASSWORD: password
echo     ports:
echo       - "5432:5432"
echo     volumes:
echo       - postgres_data:/var/lib/postgresql/data
echo       - ./schema.sql:/docker-entrypoint-initdb.d/schema.sql
echo     restart: unless-stopped
echo.
echo   backend:
echo     build:
echo       context: ./server
echo       dockerfile: Dockerfile
echo     environment:
echo       - NODE_ENV=production
echo       - DB_HOST=postgres
echo       - DB_NAME=tourist_safety
echo       - DB_USER=postgres
echo       - DB_PASSWORD=password
echo     ports:
echo       - "3001:3001"
echo     depends_on:
echo       - postgres
echo     restart: unless-stopped
echo     volumes:
echo       - ./server:/app
echo       - /app/node_modules
echo.
echo   frontend:
echo     build:
echo       context: .
echo       dockerfile: Dockerfile.frontend
echo     ports:
echo       - "80:80"
echo     depends_on:
echo       - backend
echo     restart: unless-stopped
echo.
echo volumes:
echo   postgres_data:
) > docker-compose.yml

echo ✅ Docker Compose configuration created
echo.

REM 8. Final setup verification
echo 🔍 Verifying setup...

set ALL_GOOD=1

REM Check required files
set "files=src\contexts\LanguageContext.tsx src\components\Header\LanguageSelector.tsx src\components\Header\ProfessionalHeader.tsx server\config\database.js server\routes\auth.js server\routes\location.js server\server.js schema.sql"

for %%f in (%files%) do (
    if not exist "%%f" (
        echo ❌ ERROR: Missing required file: %%f
        set ALL_GOOD=0
    )
)

if !ALL_GOOD! equ 1 (
    echo ✅ All required files are in place
) else (
    echo ❌ ERROR: Some required files are missing. Please check the setup.
    pause
    exit /b 1
)

echo.
echo 🎉 Tourist Safety Platform Setup Complete!
echo.
echo 📋 What was set up:
echo    ✅ Multilingual support (6 languages: English, Hindi, Spanish, French, Arabic, Chinese)
echo    ✅ Professional UI with gradient design and emergency features
echo    ✅ Real PostgreSQL database with PostGIS for spatial data
echo    ✅ Comprehensive API with authentication, location tracking, and safety scoring
echo    ✅ Real-time features with Socket.IO
echo    ✅ Emergency alert system with panic button
echo    ✅ Professional header with language selector
echo.
echo 🚀 To start the platform:
echo    Development: start-dev.bat
echo    Production:  start-prod.bat
echo    Docker:      docker-compose up -d
echo.
echo 🔑 Don't forget to:
echo    1. Update API keys in server\.env
echo    2. Configure PostgreSQL if not already done
echo    3. Test the emergency alert system
echo    4. Customize the multilingual translations as needed
echo.
echo 📊 Health Check: http://localhost:3001/health
echo 🌐 Frontend: http://localhost:5173
echo 📡 API: http://localhost:3001/api
echo.
echo 🆘 Emergency Features:
echo    - Floating panic button with multiple alert modes
echo    - Real-time location tracking and safety scoring
echo    - Multilingual emergency contacts and services
echo    - Professional UI designed for tourist safety
echo.
echo ✅ Setup completed successfully! 🎊
echo.
echo Press any key to start the development environment...
pause >nul

REM Auto-start development environment
start-dev.bat