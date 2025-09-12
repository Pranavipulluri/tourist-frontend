@echo off
echo 🚀 Starting Tourist Safety System - Firebase Development Mode
echo =============================================================

echo.
echo � Starting Firebase Emulators...
echo This will start local development environment
echo.
echo Services that will start:
echo - 🔥 Firestore Database (port 8080)
echo - ⚡ Cloud Functions (port 5001) 
echo - 🔐 Authentication (port 9099)
echo - 📁 Cloud Storage (port 9199)
echo - 🌐 Firebase Console (port 4000)
echo.
echo 📱 After emulators start, run 'npm run dev' in a new terminal
echo 🌐 Then open: http://localhost:5173
echo.
echo Press Ctrl+C to stop all services
echo.
call firebase emulators:start
