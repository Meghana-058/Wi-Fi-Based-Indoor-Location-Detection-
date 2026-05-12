@echo off
REM Wi-Fi Fingerprinting System - Windows Stop Script (Command Prompt)

echo.
echo [*] Stopping Wi-Fi Fingerprinting System...
echo.

REM Kill processes on ports
echo [INFO] Stopping processes on port 5001...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5001" ^| findstr "LISTENING"') do (
    echo [INFO] Killing process %%a...
    taskkill /F /PID %%a >nul 2>&1
)

echo [INFO] Stopping processes on port 8080...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8080" ^| findstr "LISTENING"') do (
    echo [INFO] Killing process %%a...
    taskkill /F /PID %%a >nul 2>&1
)

REM Kill from PID files
if exist "logs\backend.pid" (
    for /f %%a in (logs\backend.pid) do (
        echo [INFO] Killing backend process %%a...
        taskkill /F /PID %%a >nul 2>&1
    )
    del logs\backend.pid
)

if exist "logs\frontend.pid" (
    for /f %%a in (logs\frontend.pid) do (
        echo [INFO] Killing frontend process %%a...
        taskkill /F /PID %%a >nul 2>&1
    )
    del logs\frontend.pid
)

REM Kill all Python processes (fallback)
echo [INFO] Stopping all Python processes...
taskkill /F /IM python.exe /T >nul 2>&1
taskkill /F /IM pythonw.exe /T >nul 2>&1

echo.
echo [OK] System stopped successfully
echo.
pause


