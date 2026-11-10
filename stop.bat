@echo off
cd /d "%~dp0"
title ClimaCrave Stopper
echo ===================================================
echo             Stopping ClimaCrave...
echo ===================================================
echo.

set FOUND=0
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do (
    set FOUND=1
    echo Terminating server process PID: %%a ...
    taskkill /f /pid %%a >nul 2>&1
)

if "%FOUND%"=="1" (
    echo [SUCCESS] ClimaCrave server stopped successfully.
) else (
    echo [INFO] No ClimaCrave server was running on port 3000.
)

echo.
pause
