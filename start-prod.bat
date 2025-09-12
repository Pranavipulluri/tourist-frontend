@echo off
echo 🚀 Starting Tourist Safety Platform in Production Mode...
echo.
echo 🔨 Building frontend...
call npm run build
if errorlevel 1 (
    echo ❌ Build failed
    pause
    exit /b 1
)
echo 🔧 Starting backend server...
cd server
set NODE_ENV=production
npm start
