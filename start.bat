@echo off
REM ====================================================================
REM  PestGuard - One-command launcher (Windows)
REM  Starts the Flask backend and the Vite frontend in two windows.
REM ====================================================================

setlocal enabledelayedexpansion

cd /d "%~dp0"

echo.
echo ==================================================
echo   PestGuard - starting backend + frontend
echo ==================================================
echo.

REM --- Detect LAN IP so the phone-on-LAN URL is easy to copy ---
set "LAN_IP="
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /R /C:"IPv4 Address"') do (
    set "ip=%%a"
    set "ip=!ip: =!"
    if not defined LAN_IP if not "!ip:~0,3!"=="127" set "LAN_IP=!ip!"
)

REM --- Backend ---
echo [1/3] Setting up backend...
cd backend
if not exist venv (
    echo       Creating virtual environment...
    python -m venv venv
)
echo       Installing requirements...
call venv\Scripts\activate.bat
python -m pip install --quiet --upgrade pip
python -m pip install --quiet -r requirements.txt
call venv\Scripts\deactivate.bat
cd ..

REM --- Frontend ---
echo [2/3] Setting up frontend...
cd frontend
if not exist node_modules (
    echo       Installing npm packages (first run only, takes a minute)...
    call npm install --silent
)
cd ..

REM --- Launch both ---
echo [3/3] Launching servers...
echo.
if defined LAN_IP (
    echo   Backend:  http://localhost:5000
    echo   Frontend: http://localhost:5173
    echo   Phone:    http://!LAN_IP!:5173   ^<-- open this from a phone on the same Wi-Fi
) else (
    echo   Backend:  http://localhost:5000
    echo   Frontend: http://localhost:5173
)
echo.
echo   Close the two new windows to stop the servers.
echo.

start "PestGuard Backend"  cmd /k "cd /d %~dp0backend && call venv\Scripts\activate.bat && python app.py"
timeout /t 3 /nobreak >nul
start "PestGuard Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo Both servers launched. You can close this window.
timeout /t 5 /nobreak >nul

endlocal
