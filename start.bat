@echo off
TITLE VIT Underpass Automated AI Traffic Controller
COLOR 0A
cls

echo =========================================================================
echo   VIT UNDERPASS AUTOMATED AI TRAFFIC CONTROLLER & REAL-TIME DIGITAL TWIN
echo =========================================================================
echo.
echo [1/3] Activating Virtual Environment...
call venv\Scripts\activate.bat

echo [2/3] Launching Web Browser at http://localhost:8000 ...
timeout /t 2 /nobreak >nul
start http://localhost:8000

echo [3/3] Starting FastAPI Server & WebSocket Bridge...
echo.
echo CTRL+C to stop the system.
echo =========================================================================
python scripts/run_demo.py
pause
