@echo off
title Akhand Bharat Seva - Integrated Backend Server (Port 8000)
color 0B
cd /d "%~dp0\backend"

echo ==============================================================================
echo    AKHAND BHARAT SEVA + GEMMA 4 CIVIC TRIAGE SERVER
echo    Serving Angular Frontend & REST API at http://127.0.0.1:8000
echo ==============================================================================
echo.
echo [*] Angular Frontend: http://127.0.0.1:8000/
echo [*] Citizen Reporting: http://127.0.0.1:8000/report
echo [*] Track Grievance:  http://127.0.0.1:8000/track
echo [*] Admin Dashboard:  http://127.0.0.1:8000/admin
echo [*] Gemma 4 AI HUD:   http://127.0.0.1:8000/hud
echo.
echo Starting Uvicorn...
python -m uvicorn main:app --host 127.0.0.1 --port 8000
pause
