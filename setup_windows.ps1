# Wi-Fi Fingerprinting System - Windows Setup Script (PowerShell)
# This script automatically sets up and runs the project on Windows
# Usage: Right-click and "Run with PowerShell" or run: powershell -ExecutionPolicy Bypass -File setup_windows.ps1

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host " Wi-Fi Fingerprinting System - Windows Setup" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Function to print colored messages
function Write-Success {
    Write-Host "✅ $args" -ForegroundColor Green
}

function Write-Error {
    Write-Host "❌ $args" -ForegroundColor Red
}

function Write-Warning {
    Write-Host "⚠️  $args" -ForegroundColor Yellow
}

function Write-Info {
    Write-Host "ℹ️  $args" -ForegroundColor Blue
}

# Check if Python is installed
Write-Host "📋 Checking prerequisites..." -ForegroundColor Cyan
try {
    $pythonVersion = python --version 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Python not found"
    }
    Write-Success "Found $pythonVersion"
} catch {
    Write-Error "Python is not installed!"
    Write-Host "Please install Python 3.8 or higher from https://www.python.org/downloads/"
    Write-Host "Make sure to check 'Add Python to PATH' during installation"
    Read-Host "Press Enter to exit"
    exit 1
}

# Check Python version
$versionString = python --version 2>&1 | Out-String
if ($versionString -match "Python (\d+)\.(\d+)") {
    $major = [int]$matches[1]
    $minor = [int]$matches[2]
    if ($major -lt 3 -or ($major -eq 3 -and $minor -lt 8)) {
        Write-Error "Python 3.8 or higher is required. Found: $major.$minor"
        Read-Host "Press Enter to exit"
        exit 1
    }
}

# Check if pip is installed
try {
    python -m pip --version | Out-Null
    Write-Success "Found pip"
} catch {
    Write-Error "pip is not installed!"
    Write-Host "Installing pip..."
    python -m ensurepip --upgrade
}

# Check if ports are available
Write-Host ""
Write-Host "🔍 Checking port availability..." -ForegroundColor Cyan

function Test-Port {
    param([int]$Port)
    $connection = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    return $null -ne $connection
}

# Check and free port 5001
if (Test-Port -Port 5001) {
    Write-Warning "Port 5001 is already in use. Attempting to free it..."
    $processes = Get-NetTCPConnection -LocalPort 5001 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($pid in $processes) {
        Write-Info "Killing process $pid on port 5001..."
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Seconds 2
}

# Check and free port 8080
if (Test-Port -Port 8080) {
    Write-Warning "Port 8080 is already in use. Attempting to free it..."
    $processes = Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($pid in $processes) {
        Write-Info "Killing process $pid on port 8080..."
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Seconds 2
}

# Create virtual environment if it doesn't exist
Write-Host ""
Write-Host "📦 Setting up virtual environment..." -ForegroundColor Cyan
if (-not (Test-Path "venv")) {
    Write-Info "Creating virtual environment..."
    python -m venv venv
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to create virtual environment"
        Read-Host "Press Enter to exit"
        exit 1
    }
    Write-Success "Virtual environment created"
} else {
    Write-Success "Virtual environment already exists"
}

# Activate virtual environment
Write-Host ""
Write-Host "🔧 Activating virtual environment..." -ForegroundColor Cyan
& "venv\Scripts\Activate.ps1"
if ($LASTEXITCODE -ne 0) {
    Write-Error "Could not activate virtual environment"
    Read-Host "Press Enter to exit"
    exit 1
}

# Upgrade pip
Write-Host ""
Write-Host "⬆️  Upgrading pip..." -ForegroundColor Cyan
python -m pip install --upgrade pip --quiet
Write-Success "pip upgraded"

# Install Python dependencies
Write-Host ""
Write-Host "📥 Installing Python dependencies..." -ForegroundColor Cyan
Write-Host "This may take a few minutes..."
Write-Host ""

Set-Location backend

# Install core dependencies first
Write-Info "Installing core dependencies..."
python -m pip install Flask==2.3.3 Flask-CORS==4.0.0 numpy==1.24.3 pandas==2.0.3 scikit-learn==1.3.0 --quiet

Write-Info "Installing visualization libraries..."
python -m pip install matplotlib==3.7.2 seaborn==0.12.2 plotly==5.15.0 --quiet

Write-Info "Installing utility libraries..."
python -m pip install requests==2.31.0 python-dateutil==2.8.2 --quiet

Write-Info "Attempting to install TensorFlow (optional)..."
python -m pip install tensorflow==2.13.0 --quiet 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Success "TensorFlow installed successfully"
} else {
    Write-Warning "TensorFlow installation failed (optional - system will work without it)"
}

# Install all other dependencies
python -m pip install -r requirements.txt --quiet 2>$null

Write-Success "Dependencies installed"

Set-Location ..

# Create necessary directories
Write-Host ""
Write-Host "📁 Creating necessary directories..." -ForegroundColor Cyan
@("backend\models", "backend\data", "backend\config", "frontend\assets", "logs") | ForEach-Object {
    if (-not (Test-Path $_)) {
        New-Item -ItemType Directory -Path $_ -Force | Out-Null
    }
}
Write-Success "Directories created"

# Initialize database
Write-Host ""
Write-Host "🗄️  Initializing database..." -ForegroundColor Cyan
Set-Location backend
python -c "import sys; sys.path.append('.'); from models.database import DatabaseManager; db = DatabaseManager(); print('✅ Database initialized successfully')" 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Warning "Database initialization warning - will be created on first run"
}
Set-Location ..

# Load sample data (optional)
Write-Host ""
Write-Host "📊 Loading sample data (optional)..." -ForegroundColor Cyan
if (Test-Path "data\sample_data.json") {
    Set-Location backend
    python load_sample_data.py 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "Sample data loading skipped"
    }
    Set-Location ..
} else {
    Write-Warning "Sample data file not found (optional)"
}

# Start the Flask backend
Write-Host ""
Write-Host "🔧 Starting Flask backend..." -ForegroundColor Cyan
Set-Location backend

$backendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    Set-Location backend
    & "..\venv\Scripts\python.exe" app.py
} | Out-Null

# Wait for backend to start
Write-Host "⏳ Waiting for backend to start..."
Start-Sleep -Seconds 5

# Check if backend is running
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5001/api/status" -TimeoutSec 2 -ErrorAction Stop
    Write-Success "Backend started successfully on http://localhost:5001"
} catch {
    Write-Warning "Backend may not be fully started yet. Check logs\backend.log"
}

Set-Location ..

# Start frontend server
Write-Host ""
Write-Host "🌐 Starting frontend server..." -ForegroundColor Cyan
Set-Location frontend

$frontendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    Set-Location frontend
    & "..\venv\Scripts\python.exe" -m http.server 8080
} | Out-Null

Start-Sleep -Seconds 2
Write-Success "Frontend started on http://localhost:8080"

Set-Location ..

# Display system information
Write-Host ""
Write-Host "================================================" -ForegroundColor Green
Write-Host "🎉 Wi-Fi Fingerprinting System is now running!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""
Write-Host "📊 System Information:"
Write-Host "   Backend API:    http://localhost:5001"
Write-Host "   Frontend:       http://localhost:8080"
Write-Host ""
Write-Host "📖 Quick Start:"
Write-Host "   1. Open http://localhost:8080 in your browser"
Write-Host "   2. Click 'Scan Now' to begin Wi-Fi fingerprinting"
Write-Host "   3. View real-time location and signal quality"
Write-Host ""
Write-Host "📝 Logs:"
Write-Host "   Backend:  logs\backend.log"
Write-Host "   Frontend: logs\frontend.log"
Write-Host ""
Write-Host "🛑 To stop the system:"
Write-Host "   - Press Ctrl+C in this window"
Write-Host "   - Or run: .\stop_windows.ps1"
Write-Host "   - Or use Task Manager to end Python processes"
Write-Host ""
Write-Host "🔄 System is running... Press Ctrl+C to stop"
Write-Host ""

# Function to cleanup on exit
function Cleanup {
    Write-Host ""
    Write-Host "🛑 Stopping Wi-Fi Fingerprinting System..." -ForegroundColor Yellow
    
    # Stop background jobs
    Get-Job | Stop-Job -ErrorAction SilentlyContinue
    Get-Job | Remove-Job -ErrorAction SilentlyContinue
    
    # Kill Python processes on ports
    Get-NetTCPConnection -LocalPort 5001 -ErrorAction SilentlyContinue | ForEach-Object {
        Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
    }
    Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue | ForEach-Object {
        Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
    }
    
    Write-Success "System stopped successfully"
}

# Set up cleanup on exit
Register-EngineEvent PowerShell.Exiting -Action { Cleanup } | Out-Null

# Keep script running
try {
    while ($true) {
        Start-Sleep -Seconds 1
    }
} catch {
    Cleanup
}


