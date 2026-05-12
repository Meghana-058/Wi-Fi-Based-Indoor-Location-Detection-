#!/bin/bash

# Wi-Fi Fingerprinting System - Windows Stop Script (Git Bash/WSL)
# This script stops all running instances of the system

echo "🛑 Stopping Wi-Fi Fingerprinting System..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Kill processes on ports
if command -v netstat &> /dev/null; then
    # Kill backend (port 5001)
    PIDS=$(netstat -ano | grep ":5001 " | grep LISTENING | awk '{print $5}' | sort -u)
    for PID in $PIDS; do
        if [ ! -z "$PID" ]; then
            echo "Killing backend process $PID..."
            taskkill //F //PID $PID 2>/dev/null || kill -9 $PID 2>/dev/null || true
        fi
    done
    
    # Kill frontend (port 8080)
    PIDS=$(netstat -ano | grep ":8080 " | grep LISTENING | awk '{print $5}' | sort -u)
    for PID in $PIDS; do
        if [ ! -z "$PID" ]; then
            echo "Killing frontend process $PID..."
            taskkill //F //PID $PID 2>/dev/null || kill -9 $PID 2>/dev/null || true
        fi
    done
fi

# Kill from PID files
if [ -f "logs/backend.pid" ]; then
    PID=$(cat logs/backend.pid)
    if [ ! -z "$PID" ]; then
        echo "Killing backend from PID file: $PID"
        taskkill //F //PID $PID 2>/dev/null || kill -9 $PID 2>/dev/null || true
    fi
    rm -f logs/backend.pid
fi

if [ -f "logs/frontend.pid" ]; then
    PID=$(cat logs/frontend.pid)
    if [ ! -z "$PID" ]; then
        echo "Killing frontend from PID file: $PID"
        taskkill //F //PID $PID 2>/dev/null || kill -9 $PID 2>/dev/null || true
    fi
    rm -f logs/frontend.pid
fi

# Kill Python processes (fallback)
if command -v taskkill &> /dev/null; then
    taskkill //F //IM python.exe //T 2>/dev/null || true
    taskkill //F //IM pythonw.exe //T 2>/dev/null || true
fi

echo -e "${GREEN}✅ System stopped successfully${NC}"


