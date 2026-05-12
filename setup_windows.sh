#!/bin/bash

# Wi-Fi Fingerprinting System - Windows Setup Script (Git Bash/WSL)
# This script automatically sets up and runs the project on Windows
# Usage: Run this script in Git Bash or WSL

echo "🚀 Wi-Fi Fingerprinting System - Windows Setup"
echo "================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored messages
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if Python is installed
echo "📋 Checking prerequisites..."
if ! command -v python &> /dev/null && ! command -v python3 &> /dev/null; then
    print_error "Python is not installed!"
    echo "Please install Python 3.8 or higher from https://www.python.org/downloads/"
    echo "Make sure to check 'Add Python to PATH' during installation"
    exit 1
fi

# Determine Python command
if command -v python &> /dev/null; then
    PYTHON_CMD="python"
    PYTHON_VERSION=$(python --version 2>&1)
else
    PYTHON_CMD="python3"
    PYTHON_VERSION=$(python3 --version 2>&1)
fi

print_success "Found $PYTHON_VERSION"

# Check Python version
PYTHON_VER=$($PYTHON_CMD -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
PYTHON_MAJOR=$(echo $PYTHON_VER | cut -d. -f1)
PYTHON_MINOR=$(echo $PYTHON_VER | cut -d. -f2)

if [ "$PYTHON_MAJOR" -lt 3 ] || ([ "$PYTHON_MAJOR" -eq 3 ] && [ "$PYTHON_MINOR" -lt 8 ]); then
    print_error "Python 3.8 or higher is required. Found: $PYTHON_VER"
    exit 1
fi

# Check if pip is installed
if ! command -v pip &> /dev/null && ! command -v pip3 &> /dev/null; then
    print_error "pip is not installed!"
    echo "Installing pip..."
    $PYTHON_CMD -m ensurepip --upgrade
fi

# Determine pip command
if command -v pip &> /dev/null; then
    PIP_CMD="pip"
else
    PIP_CMD="pip3"
fi

print_success "Found pip"

# Check if ports are available
echo ""
echo "🔍 Checking port availability..."

# Function to check if port is in use (Windows compatible)
check_port() {
    local port=$1
    if command -v netstat &> /dev/null; then
        netstat -ano | grep -q ":$port " && return 0 || return 1
    elif command -v ss &> /dev/null; then
        ss -tuln | grep -q ":$port " && return 0 || return 1
    else
        return 1
    fi
}

if check_port 5001; then
    print_warning "Port 5001 is already in use. Attempting to free it..."
    # Try to kill process on port 5001 (Windows)
    if command -v netstat &> /dev/null; then
        PID=$(netstat -ano | grep ":5001 " | grep LISTENING | awk '{print $5}' | head -1)
        if [ ! -z "$PID" ]; then
            print_info "Killing process $PID on port 5001..."
            taskkill //F //PID $PID 2>/dev/null || kill -9 $PID 2>/dev/null || true
            sleep 2
        fi
    fi
fi

if check_port 8080; then
    print_warning "Port 8080 is already in use. Attempting to free it..."
    if command -v netstat &> /dev/null; then
        PID=$(netstat -ano | grep ":8080 " | grep LISTENING | awk '{print $5}' | head -1)
        if [ ! -z "$PID" ]; then
            print_info "Killing process $PID on port 8080..."
            taskkill //F //PID $PID 2>/dev/null || kill -9 $PID 2>/dev/null || true
            sleep 2
        fi
    fi
fi

# Create virtual environment if it doesn't exist
echo ""
echo "📦 Setting up virtual environment..."
if [ ! -d "venv" ]; then
    print_info "Creating virtual environment..."
    $PYTHON_CMD -m venv venv
    if [ $? -ne 0 ]; then
        print_error "Failed to create virtual environment"
        exit 1
    fi
    print_success "Virtual environment created"
else
    print_success "Virtual environment already exists"
fi

# Activate virtual environment
echo ""
echo "🔧 Activating virtual environment..."
if [ -f "venv/Scripts/activate" ]; then
    source venv/Scripts/activate
elif [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
else
    print_error "Could not find virtual environment activation script"
    exit 1
fi

# Upgrade pip
echo ""
echo "⬆️  Upgrading pip..."
$PIP_CMD install --upgrade pip --quiet
print_success "pip upgraded"

# Install Python dependencies
echo ""
echo "📥 Installing Python dependencies..."
echo "This may take a few minutes..."

cd backend

# Try installing TensorFlow, but don't fail if it doesn't work
print_info "Installing core dependencies..."
$PIP_CMD install Flask==2.3.3 Flask-CORS==4.0.0 numpy==1.24.3 pandas==2.0.3 scikit-learn==1.3.0 --quiet

print_info "Installing visualization libraries..."
$PIP_CMD install matplotlib==3.7.2 seaborn==0.12.2 plotly==5.15.0 --quiet

print_info "Installing utility libraries..."
$PIP_CMD install requests==2.31.0 python-dateutil==2.8.2 --quiet

print_info "Attempting to install TensorFlow (optional)..."
$PIP_CMD install tensorflow==2.13.0 --quiet 2>/dev/null
if [ $? -eq 0 ]; then
    print_success "TensorFlow installed successfully"
else
    print_warning "TensorFlow installation failed (optional - system will work without it)"
fi

# Install all other dependencies
$PIP_CMD install -r requirements.txt --quiet 2>&1 | grep -v "ERROR" || true

print_success "Dependencies installed"

cd ..

# Create necessary directories
echo ""
echo "📁 Creating necessary directories..."
mkdir -p backend/models
mkdir -p backend/data
mkdir -p backend/config
mkdir -p frontend/assets
mkdir -p logs

print_success "Directories created"

# Initialize database
echo ""
echo "🗄️  Initializing database..."
cd backend
$PYTHON_CMD -c "
import sys
sys.path.append('.')
try:
    from models.database import DatabaseManager
    db = DatabaseManager()
    print('✅ Database initialized successfully')
except Exception as e:
    print(f'⚠️  Database initialization warning: {e}')
    print('Database will be created on first run')
" 2>&1

cd ..

# Load sample data (optional, don't fail if it doesn't work)
echo ""
echo "📊 Loading sample data (optional)..."
if [ -f "data/sample_data.json" ]; then
    cd backend
    $PYTHON_CMD load_sample_data.py 2>&1 || print_warning "Sample data loading skipped"
    cd ..
else
    print_warning "Sample data file not found (optional)"
fi

# Start the Flask backend
echo ""
echo "🔧 Starting Flask backend..."
cd backend

# Start backend in background
$PYTHON_CMD app.py > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > ../logs/backend.pid

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
sleep 5

# Check if backend is running
if command -v curl &> /dev/null; then
    if curl -s http://localhost:5001/api/status > /dev/null 2>&1; then
        print_success "Backend started successfully on http://localhost:5001"
    else
        print_warning "Backend may not be fully started yet. Check logs/backend.log"
    fi
else
    print_warning "curl not found. Cannot verify backend status. Check logs/backend.log"
fi

cd ..

# Start frontend server
echo ""
echo "🌐 Starting frontend server..."
cd frontend

# Start frontend in background
$PYTHON_CMD -m http.server 8080 > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > ../logs/frontend.pid

sleep 2
print_success "Frontend started on http://localhost:8080"

cd ..

# Display system information
echo ""
echo "================================================"
echo -e "${GREEN}🎉 Wi-Fi Fingerprinting System is now running!${NC}"
echo "================================================"
echo ""
echo "📊 System Information:"
echo "   Backend API:    http://localhost:5001"
echo "   Frontend:       http://localhost:8080"
echo "   Backend PID:    $BACKEND_PID"
echo "   Frontend PID:   $FRONTEND_PID"
echo ""
echo "📖 Quick Start:"
echo "   1. Open http://localhost:8080 in your browser"
echo "   2. Click 'Scan Now' to begin Wi-Fi fingerprinting"
echo "   3. View real-time location and signal quality"
echo ""
echo "📝 Logs:"
echo "   Backend:  logs/backend.log"
echo "   Frontend: logs/frontend.log"
echo ""
echo "🛑 To stop the system:"
echo "   - Press Ctrl+C in this terminal"
echo "   - Or run: ./stop_windows.sh"
echo "   - Or manually kill PIDs: $BACKEND_PID and $FRONTEND_PID"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping Wi-Fi Fingerprinting System..."
    
    # Kill backend
    if [ ! -z "$BACKEND_PID" ] && kill -0 $BACKEND_PID 2>/dev/null; then
        kill $BACKEND_PID 2>/dev/null
        print_success "Backend stopped"
    fi
    
    # Kill frontend
    if [ ! -z "$FRONTEND_PID" ] && kill -0 $FRONTEND_PID 2>/dev/null; then
        kill $FRONTEND_PID 2>/dev/null
        print_success "Frontend stopped"
    fi
    
    # Also try Windows taskkill
    if command -v taskkill &> /dev/null; then
        taskkill //F //PID $BACKEND_PID 2>/dev/null || true
        taskkill //F //PID $FRONTEND_PID 2>/dev/null || true
    fi
    
    # Deactivate virtual environment
    deactivate 2>/dev/null || true
    
    print_success "System stopped successfully"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Keep script running
echo "🔄 System is running... Press Ctrl+C to stop"
echo ""
wait

