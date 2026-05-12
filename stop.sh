#!/bin/bash

# Wi-Fi Fingerprinting System Stop Script
# This script stops all running components of the system

echo "🛑 Stopping Wi-Fi Fingerprinting System..."

# Find and kill Flask backend processes
echo "🔧 Stopping backend..."
BACKEND_PIDS=$(pgrep -f "python.*app.py")
if [ ! -z "$BACKEND_PIDS" ]; then
    echo "   Found backend processes: $BACKEND_PIDS"
    kill $BACKEND_PIDS
    sleep 2
    
    # Force kill if still running
    REMAINING=$(pgrep -f "python.*app.py")
    if [ ! -z "$REMAINING" ]; then
        echo "   Force killing remaining processes..."
        kill -9 $REMAINING
    fi
    echo "✅ Backend stopped"
else
    echo "   No backend processes found"
fi

# Find and kill frontend server processes
echo "🌐 Stopping frontend..."
FRONTEND_PIDS=$(pgrep -f "python.*http.server.*8080")
if [ ! -z "$FRONTEND_PIDS" ]; then
    echo "   Found frontend processes: $FRONTEND_PIDS"
    kill $FRONTEND_PIDS
    sleep 2
    
    # Force kill if still running
    REMAINING=$(pgrep -f "python.*http.server.*8080")
    if [ ! -z "$REMAINING" ]; then
        echo "   Force killing remaining processes..."
        kill -9 $REMAINING
    fi
    echo "✅ Frontend stopped"
else
    echo "   No frontend processes found"
fi

# Kill any Node.js processes (if using npm start)
NODE_PIDS=$(pgrep -f "node.*start")
if [ ! -z "$NODE_PIDS" ]; then
    echo "🌐 Stopping Node.js frontend..."
    kill $NODE_PIDS
    echo "✅ Node.js frontend stopped"
fi

# Check for any remaining processes on our ports
echo "🔍 Checking for remaining processes on ports 5000 and 8080..."

PORT_5000=$(lsof -ti:5000)
if [ ! -z "$PORT_5000" ]; then
    echo "   Found process on port 5000: $PORT_5000"
    kill $PORT_5000
fi

PORT_8080=$(lsof -ti:8080)
if [ ! -z "$PORT_8080" ]; then
    echo "   Found process on port 8080: $PORT_8080"
    kill $PORT_8080
fi

echo ""
echo "✅ Wi-Fi Fingerprinting System stopped successfully"
echo "👋 All processes have been terminated"
