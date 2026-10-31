@echo off
echo ========================================================
echo  Pulling latest GitLaunch Code from Drive D:
echo ========================================================
powershell -ExecutionPolicy Bypass -File "%~dp0pull-from-drive-d.ps1"
pause
