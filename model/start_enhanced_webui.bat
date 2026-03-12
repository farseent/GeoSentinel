@echo off
REM Launcher for Enhanced Satellite Change Detection Web UI

echo ========================================
echo   ENHANCED Change Detection Web UI
echo ========================================
echo.
echo Features:
echo  - Multiple accuracy improvement methods
echo  - Post-processing (+3-5%% accuracy)
echo  - Test-Time Augmentation (+5-8%% accuracy)
echo  - Hybrid Detection (+3-7%% accuracy)
echo  - Method comparison
echo.
echo Starting Streamlit server...
echo The web interface will open automatically.
echo.
echo Press Ctrl+C to stop the server.
echo ========================================
echo.

cd /d "%~dp0"
"%~dp0venv\Scripts\python.exe" -m streamlit run app_enhanced.py

pause
