#!/bin/bash

# Wi-Fi Fingerprinting System Startup Script
# This script sets up and starts the complete system

echo "🚀 Starting Wi-Fi Fingerprinting System..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 is not installed. Please install pip3."
    exit 1
fi

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install Python dependencies
echo "📥 Installing Python dependencies..."
cd backend
pip install -r requirements.txt

# Check if Node.js is installed (for frontend)
if ! command -v node &> /dev/null; then
    echo "⚠️  Node.js is not installed. Frontend will be served via Python HTTP server."
    USE_NODE=false
else
    # Check if package.json exists
    if [ ! -f "frontend/package.json" ]; then
        echo "⚠️  No package.json found. Frontend will be served via Python HTTP server."
        USE_NODE=false
    else
        USE_NODE=true
    fi
fi

# Go back to root directory
cd ..

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p backend/models
mkdir -p backend/data
mkdir -p frontend/assets
mkdir -p logs

# Initialize database
echo "🗄️  Initializing database..."
cd backend
python -c "
import sys
sys.path.append('.')
from models.database import DatabaseManager
db = DatabaseManager()
print('✅ Database initialized successfully')
"

# Load sample data
echo "📊 Loading sample data..."
python load_sample_data.py

cd ..

# Start the Flask backend
echo "🔧 Starting Flask backend..."
cd backend
python app.py &
BACKEND_PID=$!

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
sleep 5

# Check if backend is running
if ! curl -s http://localhost:5001/api/status > /dev/null; then
    echo "❌ Backend failed to start. Please check the logs."
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

echo "✅ Backend started successfully on http://localhost:5001"

# Start frontend server
cd ../frontend

if [ "$USE_NODE" = true ]; then
    echo "🌐 Starting frontend with Node.js..."
    if [ ! -d "node_modules" ]; then
        npm install
    fi
    npm start &
    FRONTEND_PID=$!
else
    echo "🌐 Starting frontend with Python HTTP server..."
    python3 -m http.server 8080 &
    FRONTEND_PID=$!
fi

echo "✅ Frontend started successfully on http://localhost:8080"

# Display system information
echo ""
echo "🎉 Wi-Fi Fingerprinting System is now running!"
echo ""
echo "📊 System Information:"
echo "   Backend API: http://localhost:5001"
echo "   Frontend Dashboard: http://localhost:8080"
echo "   Backend PID: $BACKEND_PID"
echo "   Frontend PID: $FRONTEND_PID"
echo ""
echo "🔧 Available API Endpoints:"
echo "   GET  /api/status          - System status"
echo "   GET  /api/scan           - Scan Wi-Fi networks"
echo "   POST /api/predict        - Predict location"
echo "   GET  /api/signal         - Get signal quality"
echo "   GET  /api/map            - Get map data"
echo "   GET  /api/history        - Get scan history"
echo "   POST /api/train          - Train model"
echo "   POST /api/add_reference  - Add reference point"
echo ""
echo "📖 Usage Instructions:"
echo "   1. Open http://localhost:8080 in your browser"
echo "   2. Click 'Start Scan' to begin Wi-Fi fingerprinting"
echo "   3. View real-time location and signal quality"
echo "   4. Use the map to visualize your position"
echo "   5. Check the analytics for signal trends"
echo ""
echo "🛑 To stop the system, press Ctrl+C or run: ./stop.sh"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping Wi-Fi Fingerprinting System..."
    
    # Kill backend
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
        echo "✅ Backend stopped"
    fi
    
    # Kill frontend
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
        echo "✅ Frontend stopped"
    fi
    
    # Deactivate virtual environment
    deactivate 2>/dev/null
    
    echo "👋 System stopped successfully"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Keep script running
echo "🔄 System is running... Press Ctrl+C to stop"
wait
