@echo off
setlocal
echo ======================================================================
echo  AKHAND BHARAT SEVA - CLOUDFLARE PUBLIC TUNNEL
echo ======================================================================
cd /d "%~dp0"

echo Target local endpoint: http://127.0.0.1:8000
echo Creating secure HTTPS tunnel to Cloudflare Edge...
echo.

if exist "%~dp0cloudflared.exe" (
    "%~dp0cloudflared.exe" tunnel --url http://127.0.0.1:8000
) else (
    cloudflared tunnel --url http://127.0.0.1:8000
)

pause
