@echo off
echo Starting VivaLife Pharmacy Management System...
echo.

REM Start the Flask API server in a new window
echo Starting API server...
start "API Server" cmd /k "cd online-store\api && python server.py"

REM Wait a moment for the server to start
timeout /t 3 >nul

REM Open the main pharmacy system
echo Opening Pharmacy Management System...
start "" "index.html"

REM Wait a moment
timeout /t 2 >nul

REM Open the online store
echo Opening Online Store...
start "" "online-store\index.html"

echo.
echo System started successfully!
echo - Pharmacy Management System: index.html
echo - Online Store: online-store\index.html
echo - API Server: http://localhost:5000
echo.
pause