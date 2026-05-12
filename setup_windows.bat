@echo off
REM Wi-Fi Fingerprinting System - Windows Setup Script (Command Prompt)
REM This script automatically sets up and runs the project on Windows
REM Usage: Double-click this file or run from Command Prompt

echo.
echo ================================================
echo  Wi-Fi Fingerprinting System - Windows Setup
echo ================================================
echo.

REM Check if Python is installed
echo [*] Checking prerequisites...
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed!
    echo Please install Python 3.8 or higher from https://www.python.org/downloads/
    echo Make sure to check 'Add Python to PATH' during installation
    pause
    exit /b 1
)

for /f "tokens=2" %%i in ('python --version 2^>^&1') do set PYTHON_VERSION=%%i
echo [OK] Found Python %PYTHON_VERSION%

REM Check if pip is installed
python -m pip --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] pip is not installed!
    echo Installing pip...
    python -m ensurepip --upgrade
)

echo [OK] Found pip

REM Check if ports are available
echo.
echo [*] Checking port availability...

REM Check port 5001
netstat -ano | findstr ":5001" >nul 2>&1
if not errorlevel 1 (
    echo [WARNING] Port 5001 is already in use. Attempting to free it...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5001" ^| findstr "LISTENING"') do (
        echo [INFO] Killing process %%a on port 5001...
        taskkill /F /PID %%a >nul 2>&1
    )
    timeout /t 2 /nobreak >nul
)

REM Check port 8080
netstat -ano | findstr ":8080" >nul 2>&1
if not errorlevel 1 (
    echo [WARNING] Port 8080 is already in use. Attempting to free it...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8080" ^| findstr "LISTENING"') do (
        echo [INFO] Killing process %%a on port 8080...
        taskkill /F /PID %%a >nul 2>&1
    )
    timeout /t 2 /nobreak >nul
)

REM Create virtual environment if it doesn't exist
echo.
echo [*] Setting up virtual environment...
if not exist "venv" (
    echo [INFO] Creating virtual environment...
    python -m venv venv
    if errorlevel 1 (
        echo [ERROR] Failed to create virtual environment
        pause
        exit /b 1
    )
    echo [OK] Virtual environment created
) else (
    echo [OK] Virtual environment already exists
)

REM Activate virtual environment
echo.
echo [*] Activating virtual environment...
call venv\Scripts\activate.bat
if errorlevel 1 (
    echo [ERROR] Could not activate virtual environment
    pause
    exit /b 1
)

REM Upgrade pip
echo.
echo [*] Upgrading pip...
python -m pip install --upgrade pip --quiet
echo [OK] pip upgraded

REM Install Python dependencies
echo.
echo [*] Installing Python dependencies...
echo This may take a few minutes...
echo.

cd backend

REM Install core dependencies first
echo [INFO] Installing core dependencies...
python -m pip install Flask==2.3.3 Flask-CORS==4.0.0 numpy==1.24.3 pandas==2.0.3 scikit-learn==1.3.0 --quiet

echo [INFO] Installing visualization libraries...
python -m pip install matplotlib==3.7.2 seaborn==0.12.2 plotly==5.15.0 --quiet

echo [INFO] Installing utility libraries...
python -m pip install requests==2.31.0 python-dateutil==2.8.2 --quiet

echo [INFO] Attempting to install TensorFlow (optional)...
python -m pip install tensorflow==2.13.0 --quiet >nul 2>&1
if errorlevel 1 (
    echo [WARNING] TensorFlow installation failed (optional - system will work without it)
) else (
    echo [OK] TensorFlow installed successfully
)

REM Install all other dependencies
python -m pip install -r requirements.txt --quiet >nul 2>&1

echo [OK] Dependencies installed

cd ..

REM Create necessary directories
echo.
echo [*] Creating necessary directories...
if not exist "backend\models" mkdir backend\models
if not exist "backend\data" mkdir backend\data
if not exist "backend\config" mkdir backend\config
if not exist "frontend\assets" mkdir frontend\assets
if not exist "logs" mkdir logs

echo [OK] Directories created

REM Initialize database
echo.
echo [*] Initializing database...
cd backend
python -c "import sys; sys.path.append('.'); from models.database import DatabaseManager; db = DatabaseManager(); print('[OK] Database initialized successfully')" 2>nul
if errorlevel 1 (
    echo [WARNING] Database initialization warning - will be created on first run
)
cd ..

REM Load sample data (optional)
echo.
echo [*] Loading sample data (optional)...
if exist "data\sample_data.json" (
    cd backend
    python load_sample_data.py 2>nul
    if errorlevel 1 (
        echo [WARNING] Sample data loading skipped
    )
    cd ..
) else (
    echo [WARNING] Sample data file not found (optional)
)

REM Start the Flask backend
echo.
echo [*] Starting Flask backend...
cd backend

start "Wi-Fi Fingerprinting Backend" /MIN python app.py
timeout /t 5 /nobreak >nul

echo [OK] Backend started on http://localhost:5001
echo [INFO] Check logs\backend.log for backend output

cd ..

REM Start frontend server
echo.
echo [*] Starting frontend server...
cd frontend

start "Wi-Fi Fingerprinting Frontend" /MIN python -m http.server 8080
timeout /t 2 /nobreak >nul

echo [OK] Frontend started on http://localhost:8080
echo [INFO] Check logs\frontend.log for frontend output

cd ..

REM Display system information
echo.
echo ================================================
echo  [OK] Wi-Fi Fingerprinting System is running!
echo ================================================
echo.
echo System Information:
echo    Backend API:    http://localhost:5001
echo    Frontend:       http://localhost:8080
echo.
echo Quick Start:
echo    1. Open http://localhost:8080 in your browser
echo    2. Click 'Scan Now' to begin Wi-Fi fingerprinting
echo    3. View real-time location and signal quality
echo.
echo Logs:
echo    Backend:  logs\backend.log
echo    Frontend: logs\frontend.log
echo.
echo To stop the system:
echo    - Close the two minimized windows (Backend and Frontend)
echo    - Or run: stop_windows.bat
echo    - Or use Task Manager to end Python processes
echo.
echo System is running in background windows.
echo Press any key to exit this setup script (system will continue running)...
pause >nul


