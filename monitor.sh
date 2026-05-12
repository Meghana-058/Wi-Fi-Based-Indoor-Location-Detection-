#!/bin/bash

# Wi-Fi Fingerprinting Backend Monitor
# This script monitors the backend and restarts it if it goes down

API_URL="http://localhost:5001/api/status"
BACKEND_DIR="backend"
VENV_DIR="venv"

echo "🔍 Wi-Fi Fingerprinting Backend Monitor"
echo "========================================"

monitor_backend() {
    while true; do
        # Check if backend is responding
        if ! curl -s "$API_URL" > /dev/null 2>&1; then
            echo "❌ Backend is not responding at $(date)"
            echo "🔄 Attempting to restart backend..."
            
            # Kill any existing backend processes
            pkill -f "python.*app.py" 2>/dev/null
            
            # Wait a moment
            sleep 2
            
            # Start backend
            cd "$BACKEND_DIR"
            source "../$VENV_DIR/bin/activate"
            python app.py &
            BACKEND_PID=$!
            
            echo "✅ Backend restarted with PID: $BACKEND_PID"
            
            # Wait for backend to start
            sleep 5
            
            # Verify it's working
            if curl -s "$API_URL" > /dev/null 2>&1; then
                echo "✅ Backend is now responding"
            else
                echo "❌ Backend failed to start properly"
            fi
            
            cd ..
        else
            echo "✅ Backend is healthy at $(date)"
        fi
        
        # Wait 30 seconds before next check
        sleep 30
    done
}

# Handle script interruption
trap 'echo "🛑 Monitor stopped"; exit 0' INT TERM

# Start monitoring
monitor_backend
