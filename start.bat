@echo off
cd /d "%~dp0"
title ClimaCrave Server Launcher

echo ========================================================
echo             Starting ClimaCrave Web Server...
echo ========================================================
echo.

:: 1. Check if Node.js is installed
set NODE_CMD=node
where node >nul 2>nul
if %ERRORLEVEL% EQU 0 goto run_server

:: 2. Check if local portable node exists
if exist "%~dp0.bin\node.exe" (
    set NODE_CMD="%~dp0.bin\node.exe"
    goto run_server
)

:: 3. Automatically download portable Node.js if missing
echo [!] Node.js runtime not detected on your system.
echo [*] Downloading portable Node.js from nodejs.org...
echo [*] Please wait a moment...
echo.

if not exist "%~dp0.bin" mkdir "%~dp0.bin"

powershell -NoProfile -ExecutionPolicy Bypass -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; (New-Object System.Net.WebClient).DownloadFile('https://nodejs.org/dist/v22.12.0/win-x64/node.exe', '%~dp0.bin\node.exe')"

if exist "%~dp0.bin\node.exe" (
    set NODE_CMD="%~dp0.bin\node.exe"
    echo [SUCCESS] Node.js runtime is ready!
    echo.
    goto run_server
)

echo.
echo [ERROR] Automatic download failed.
echo Please install Node.js (version 22+) from https://nodejs.org/
echo.
pause
exit /b 1

:run_server
:: 4. Start ClimaCrave Node.js server
echo Starting ClimaCrave local server...
start "ClimaCrave Server" cmd /c "%NODE_CMD% server.js"

:: Give the server 2 seconds to bind
ping 127.0.0.1 -n 3 >nul

:: 5. Open in the default web browser (Chrome, Edge, Firefox, etc.)
echo Opening http://localhost:3000 in your web browser...
start "" "http://localhost:3000"

echo.
echo ========================================================
echo ClimaCrave is now live at:
echo http://localhost:3000
echo.
echo To stop the server anytime, double-click stop.bat
echo ========================================================
echo.
pause
exit /b 0
