# Windows Setup Guide - Wi-Fi Fingerprinting System

This guide provides step-by-step instructions for setting up and running the Wi-Fi Fingerprinting System on Windows.

## Quick Start

### Option 1: PowerShell (Recommended)
1. Right-click `setup_windows.ps1`
2. Select "Run with PowerShell"
3. Wait for setup to complete
4. Open http://localhost:8080 in your browser

### Option 2: Command Prompt
1. Double-click `setup_windows.bat`
2. Wait for setup to complete
3. Open http://localhost:8080 in your browser

### Option 3: Git Bash / WSL
1. Open Git Bash or WSL terminal
2. Run: `bash setup_windows.sh`
3. Wait for setup to complete
4. Open http://localhost:8080 in your browser

## Prerequisites

### Required
- **Windows 10/11** (64-bit)
- **Python 3.8 or higher**
  - Download from: https://www.python.org/downloads/
  - ⚠️ **IMPORTANT**: Check "Add Python to PATH" during installation
- **Internet connection** (for downloading dependencies)

### Optional
- **Git Bash** (for .sh scripts): https://git-scm.com/downloads/win
- **PowerShell 5.1+** (usually pre-installed on Windows 10/11)

## Detailed Setup Instructions

### Step 1: Install Python

1. Download Python from https://www.python.org/downloads/
2. Run the installer
3. **CRITICAL**: Check the box "Add Python to PATH"
4. Click "Install Now"
5. Verify installation:
   ```cmd
   python --version
   ```
   Should show: `Python 3.x.x`

### Step 2: Download the Project

1. Extract the project folder to a location like:
   - `C:\Users\YourName\Downloads\Wi-Fi Fingerprinting`
   - Or `D:\Projects\Wi-Fi Fingerprinting`

2. Open the project folder

### Step 3: Run Setup Script

Choose one of the following methods:

#### Method A: PowerShell (Recommended)

1. Open PowerShell in the project folder:
   - Right-click in the folder → "Open in Terminal"
   - Or press `Shift + Right-click` → "Open PowerShell window here"

2. If you see an execution policy error, run:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

3. Run the setup script:
   ```powershell
   .\setup_windows.ps1
   ```

#### Method B: Command Prompt

1. Open Command Prompt in the project folder:
   - Press `Shift + Right-click` → "Open Command Prompt here"
   - Or type `cmd` in the address bar

2. Run the setup script:
   ```cmd
   setup_windows.bat
   ```

#### Method C: Git Bash / WSL

1. Open Git Bash or WSL terminal in the project folder

2. Run the setup script:
   ```bash
   bash setup_windows.sh
   ```

### Step 4: Wait for Setup

The setup script will:
- ✅ Check Python installation
- ✅ Create virtual environment
- ✅ Install all dependencies
- ✅ Initialize database
- ✅ Start backend server (port 5001)
- ✅ Start frontend server (port 8080)

**Setup time**: 5-10 minutes (depending on internet speed)

### Step 5: Access the Dashboard

1. Open your web browser
2. Navigate to: **http://localhost:8080**
3. You should see the Wi-Fi Fingerprinting Dashboard

## Common Issues and Solutions

### Issue 1: "Python is not recognized"

**Problem**: Python is not in your PATH

**Solution**:
1. Reinstall Python and check "Add Python to PATH"
2. Or manually add Python to PATH:
   - Search "Environment Variables" in Windows
   - Edit "Path" variable
   - Add: `C:\Python3x` and `C:\Python3x\Scripts`

### Issue 2: "Execution Policy" Error (PowerShell)

**Problem**: PowerShell blocks script execution

**Solution**:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Issue 3: Port Already in Use

**Problem**: Port 5001 or 8080 is already in use

**Solution**:
1. Run the stop script first: `stop_windows.bat` or `stop_windows.ps1`
2. Or manually kill processes:
   ```cmd
   netstat -ano | findstr :5001
   taskkill /F /PID <PID_NUMBER>
   ```

### Issue 4: TensorFlow Installation Fails

**Problem**: TensorFlow fails to install

**Solution**: 
- This is **OK**! The system works without TensorFlow
- TensorFlow is optional - the system uses real fingerprint matching instead
- You can ignore this warning

### Issue 5: "pip is not recognized"

**Problem**: pip is not installed

**Solution**:
```cmd
python -m ensurepip --upgrade
```

### Issue 6: Permission Denied Errors

**Problem**: Scripts can't create files/folders

**Solution**:
1. Run Command Prompt/PowerShell as Administrator
2. Right-click → "Run as administrator"

### Issue 7: Virtual Environment Activation Fails

**Problem**: Can't activate venv

**Solution**:
1. Delete the `venv` folder
2. Run setup script again
3. Or manually create:
   ```cmd
   python -m venv venv
   venv\Scripts\activate
   ```

### Issue 8: Backend Won't Start

**Problem**: Backend fails to start

**Solution**:
1. Check `logs\backend.log` for errors
2. Verify port 5001 is free:
   ```cmd
   netstat -ano | findstr :5001
   ```
3. Try restarting the setup script

### Issue 9: Frontend Can't Connect to Backend

**Problem**: `ERR_CONNECTION_REFUSED` in browser

**Solution**:
1. Verify backend is running:
   ```cmd
   curl http://localhost:5001/api/status
   ```
2. Check Windows Firewall settings
3. Restart backend:
   ```cmd
   cd backend
   venv\Scripts\activate
   python app.py
   ```

## Manual Setup (If Scripts Don't Work)

If the automated scripts fail, follow these manual steps:

### 1. Create Virtual Environment
```cmd
python -m venv venv
venv\Scripts\activate
```

### 2. Install Dependencies
```cmd
cd backend
pip install --upgrade pip
pip install -r requirements.txt
cd ..
```

### 3. Initialize Database
```cmd
cd backend
python -c "from models.database import DatabaseManager; db = DatabaseManager()"
cd ..
```

### 4. Start Backend
```cmd
cd backend
venv\Scripts\activate
python app.py
```

### 5. Start Frontend (New Terminal)
```cmd
cd frontend
..\venv\Scripts\activate
python -m http.server 8080
```

## Stopping the System

### Method 1: Stop Scripts
- **PowerShell**: `.\stop_windows.ps1`
- **Command Prompt**: `stop_windows.bat`
- **Git Bash**: `bash stop_windows.sh`

### Method 2: Manual Stop
1. Close the terminal windows running backend/frontend
2. Or use Task Manager to end Python processes

### Method 3: Kill by Port
```cmd
netstat -ano | findstr :5001
taskkill /F /PID <PID_NUMBER>

netstat -ano | findstr :8080
taskkill /F /PID <PID_NUMBER>
```

## Running the System After Setup

Once setup is complete, you can run the system in two ways:

### Option 1: Use Setup Scripts Again
The setup scripts will detect existing installations and skip setup steps.

### Option 2: Manual Start

**Terminal 1 - Backend:**
```cmd
cd backend
venv\Scripts\activate
python app.py
```

**Terminal 2 - Frontend:**
```cmd
cd frontend
..\venv\Scripts\activate
python -m http.server 8080
```

## System Requirements

- **OS**: Windows 10/11 (64-bit)
- **RAM**: 4GB minimum, 8GB recommended
- **Disk Space**: 2GB free space
- **Python**: 3.8 or higher
- **Internet**: Required for initial setup

## Features Available on Windows

✅ **Real-time Wi-Fi scanning** (uses mock data - realistic simulation)  
✅ **Location prediction** (fingerprint-based matching)  
✅ **Signal quality assessment**  
✅ **Interactive dashboard**  
✅ **Training system**  
✅ **Navigation to best signal**  
✅ **Connection instructions**  

⚠️ **Note**: Windows uses mock Wi-Fi data (realistic simulation). For real Wi-Fi scanning, use macOS or Linux.

## Getting Help

If you encounter issues:

1. **Check the logs**:
   - `logs\backend.log` - Backend errors
   - `logs\frontend.log` - Frontend errors

2. **Verify installation**:
   ```cmd
   python --version
   pip --version
   ```

3. **Test backend**:
   ```cmd
   curl http://localhost:5001/api/status
   ```

4. **Check ports**:
   ```cmd
   netstat -ano | findstr ":5001 :8080"
   ```

## Next Steps

After successful setup:

1. Open http://localhost:8080
2. Click "Scan Now" to test the system
3. Add reference points from different locations
4. Train the model with your data
5. Customize location names in `backend\config\locations.json`

## Troubleshooting Checklist

- [ ] Python 3.8+ installed and in PATH
- [ ] Virtual environment created successfully
- [ ] All dependencies installed (check for errors)
- [ ] Database initialized
- [ ] Ports 5001 and 8080 are free
- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Browser can access http://localhost:8080
- [ ] Backend API responds at http://localhost:5001/api/status

---

**Need more help?** Check `PROJECT_DOCUMENTATION.md` for detailed documentation.


