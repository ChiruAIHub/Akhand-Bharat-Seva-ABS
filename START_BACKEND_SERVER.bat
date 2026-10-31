@echo off
setlocal
echo ======================================================================
echo  STARTING GITLAUNCH BACKEND SERVER (FastAPI + Uvicorn)
echo ======================================================================
cd /d "%~dp0"

REM If running from Drive D root, enter current\backend
if exist "%~dp0current\backend\main.py" (
    cd /d "%~dp0current\backend"
)

REM If running from project root, enter backend
if exist "%~dp0backend\main.py" (
    cd /d "%~dp0backend"
)

echo Checking Python dependencies...
python -m pip install fastapi uvicorn pydantic requests jinja2 python-multipart --quiet

echo Starting backend on http://127.0.0.1:8000 ...
echo Swagger UI docs available at: http://127.0.0.1:8000/docs
echo Interactive Web UI available at: http://127.0.0.1:8000/
echo.
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
pause
