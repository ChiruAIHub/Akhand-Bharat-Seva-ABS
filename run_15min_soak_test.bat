@echo off
title Akhand Bharat Seva - 15-Minute Continuous Stress & Soak Test Runner
color 0A
cd /d "%~dp0"

echo ==============================================================================
echo    AKHAND BHARAT SEVA + GEMMA 4 CIVIC TRIAGE: 15-MINUTE SOAK TEST
echo ==============================================================================
echo.
echo [*] Starting in-process FastAPI server, Chrome CDP browser testing,
echo     multi-image verification, and 15-minute stress load loop...
echo.

python backend/run_standalone_15min_test.py 900

echo.
echo ==============================================================================
echo [DONE] 15-Minute Test Run Completed. Full logs written to:
echo        dist\test_15min_execution.log
echo        dist\akhand_bharat_15min_test_report.json
echo ==============================================================================
pause
