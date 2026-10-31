@echo off
setlocal enabledelayedexpansion
title Akhand Bharat Seva - Live Production Publisher
echo ======================================================================
echo   AKHAND BHARAT SEVA - 1-CLICK PUBLIC LAUNCHER
echo ======================================================================
echo.
cd /d "%~dp0"

echo [1/3] Checking Python dependencies...
python -m pip install fastapi uvicorn pydantic requests jinja2 python-multipart --quiet

echo [2/3] Launching FastAPI Backend Server on http://127.0.0.1:8000 ...
start "ABS-Backend-Server" cmd /c "cd /d "%~dp0backend" && python -m uvicorn main:app --host 127.0.0.1 --port 8000"

timeout /t 3 /nobreak >nul

echo [3/3] Starting Cloudflare Tunnel Supervisor Watchdog...
start "ABS-Tunnel-Supervisor" cmd /c "cd /d "%~dp0" && python -u tunnel_supervisor.py"

timeout /t 5 /nobreak >nul

if exist "%~dp0LIVE_PUBLIC_URL.txt" (
    set /p LIVE_URL=<"%~dp0LIVE_PUBLIC_URL.txt"
    echo.
    echo ======================================================================
    echo   ONLINE! WEBSITE SUCCESSFULLY PUBLISHED TO CLOUDFLARE EDGE
    echo ======================================================================
    echo   Global Public URL : !LIVE_URL!
    echo   Public Launchpad  : !LIVE_URL!/live
    echo   Municipal Login   : !LIVE_URL!/admin/login
    echo   GIS Command Map   : !LIVE_URL!/admin/map
    echo   Local Dev URL     : http://127.0.0.1:8000/
    echo ======================================================================
    echo.
    echo Opening public site in your default browser...
    start !LIVE_URL!
) else (
    echo Opening local site in default browser...
    start http://127.0.0.1:8000/live
)

echo.
echo Both services are actively running in dedicated console windows.
echo Press any key to exit this launcher window (services will remain running).
pause >nul
