@echo off
REM Launcher for Satellite Change Detection Web UI

echo ========================================
echo   Satellite Change Detection Web UI
echo ========================================
echo.
echo Starting Streamlit server...
echo The web interface will open in your browser automatically.
echo.
echo Press Ctrl+C to stop the server.
echo ========================================
echo.

cd /d "%~dp0"
"%~dp0venv\Scripts\python.exe" -m streamlit run app.py

pause
