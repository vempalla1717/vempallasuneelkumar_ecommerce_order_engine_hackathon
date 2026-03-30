@echo off
echo ============================================
echo   Starting E-Commerce Frontend Server
echo ============================================
echo.
echo Frontend will be available at: http://localhost:8081
echo.

cd /d "%~dp0frontend"
"%~dp0venv\Scripts\python.exe" -m http.server 8081
pause
