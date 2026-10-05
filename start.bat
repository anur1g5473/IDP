@echo off
TITLE VIT Underpass Automated AI Traffic Controller
COLOR 0A
cls

echo =========================================================================
echo   VIT UNDERPASS AUTOMATED AI TRAFFIC CONTROLLER ^& REAL-TIME DIGITAL TWIN
echo =========================================================================
echo.

echo [1/4] Checking for existing servers on Port 8000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do (
    echo Stopping existing process PID %%a...
    taskkill /f /pid %%a >nul 2>&1
)

echo [2/4] Activating Virtual Environment...
call venv\Scripts\activate.bat

echo [3/4] Launching Web Browser at http://localhost:8000 ...
timeout /t 2 /nobreak >nul
start http://localhost:8000

echo [4/4] Starting FastAPI Server ^& WebSocket Bridge...
echo.
echo CTRL+C to stop the system.
echo =========================================================================
python scripts/run_demo.py
pause

