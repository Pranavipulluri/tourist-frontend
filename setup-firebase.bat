@echo off
echo 🚀 Tourist Safety System - Firebase Setup
echo ========================================

echo.
echo 📋 Step 1: Installing Firebase CLI...
call npm install -g firebase-tools
if %errorlevel% neq 0 (
    echo ❌ Firebase CLI installation failed
    pause
    exit /b 1
)

echo.
echo 📦 Step 2: Installing project dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ❌ npm install failed
    pause
    exit /b 1
)

echo.
echo 🔥 Step 3: Installing Firebase SDK...
call npm install firebase
if %errorlevel% neq 0 (
    echo ❌ Firebase SDK installation failed
    pause
    exit /b 1
)

echo.
echo ✅ Installation complete!
echo.
echo 🔑 Next Steps:
echo 1. Run: firebase login
echo 2. Create Firebase project at: https://console.firebase.google.com/
echo 3. Run: firebase init
echo 4. Update src/config/firebase.ts with your Firebase config
echo 5. Run: firebase emulators:start
echo 6. In new terminal, run: npm run dev
echo.
echo 📖 Full guide: HOW_TO_RUN.md
echo.
pause