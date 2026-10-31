@echo off
echo ========================================================
echo  Syncing GitLaunch Project to External Hard Drive (D:)
echo ========================================================
powershell -ExecutionPolicy Bypass -File "%~dp0sync-to-drive-d.ps1"
pause
