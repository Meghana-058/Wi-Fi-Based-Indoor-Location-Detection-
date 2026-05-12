# Scalable Deep Similarity-Based Wi-Fi Fingerprinting System
## Complete Project Documentation

---

## Table of Contents
1. [Abstract](#1-abstract)
2. [Objectives](#2-objectives)
3. [Related Work](#3-related-work)
4. [Methodology](#4-methodology)
5. [Implementation](#5-implementation)
6. [Project Setup](#6-project-setup)
7. [Running the Project](#7-running-the-project)
8. [Code Explanation](#8-code-explanation)
9. [API Documentation](#9-api-documentation)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Abstract

This project implements a **Scalable Deep Similarity-Based Wi-Fi Fingerprinting System** for real-time indoor location identification and signal quality assessment. The system leverages deep learning techniques, specifically Siamese/Triplet networks, to learn spatial similarities from Wi-Fi Received Signal Strength Indicator (RSSI) data.

Unlike traditional GPS-based positioning systems that fail indoors, this solution uses Wi-Fi access point signals to create unique "fingerprints" for different locations. The system maps RSSI patterns into a high-dimensional embedding space where spatial and signal similarities are preserved, enabling accurate indoor positioning without requiring full model retraining when new reference points are added.

**Key Features:**
- **Real-time Wi-Fi network scanning** - Actual Wi-Fi network detection (not mock data)
- **Deep similarity learning** - Siamese/Triplet networks for fingerprint matching
- **Real fingerprint matching** - Uses actual BSSID, RSSI, and network data
- **Navigation to best signal** - Google Maps-like directions to optimal Wi-Fi positions
- **Real-time location tracking** - Continuous location updates every 1-2 minutes with movement detection
- **Destination tracking** - Set destinations and get "Location Reached" notifications
- **Stable location detection** - Identifies best/stable locations when user stays fixed
- **Performance metrics dashboard** - Accuracy, Precision, Recall, F1-Score, and mAP metrics
- **Scalable architecture** - Easy extension to new environments without full retraining
- **Modern web-based dashboard** - Nest-style UI with interactive maps and charts
- **Signal quality assessment** - Real-time signal strength classification and recommendations
- **Customizable location names** - Easy configuration of location display names
- **Connection instructions** - Step-by-step guides to connect to detected networks
- **Training system** - Collect reference points and train with real Wi-Fi data
- **Persistent metrics storage** - Metrics saved in database, survive server restarts

**Technology Stack:**
- **Backend**: Python 3.9+, Flask, TensorFlow (optional), SQLite
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla JS)
- **Visualization**: Chart.js, Leaflet.js (Google Maps-like interface)
- **Machine Learning**: TensorFlow/Keras (optional), scikit-learn, NumPy
- **Wi-Fi Scanning**: Platform-specific system commands (macOS: networksetup, system_profiler, wdutil)
- **Real-time Features**: WebSocket-ready architecture, continuous scanning

---

## 2. Objectives

### Primary Objectives

1. **Develop Deep Similarity Model**
   - Build a Siamese/Triplet neural network to learn embeddings from Wi-Fi fingerprints
   - Achieve ≥85% accuracy in location prediction
   - Enable scalable learning without full retraining for new locations

2. **Real-Time Location Detection**
   - Implement real-time Wi-Fi scanning and RSSI data collection
   - Provide location predictions with <2 seconds latency
   - Support continuous monitoring and tracking

3. **Signal Quality Assessment**
   - Classify Wi-Fi signal strength (Excellent, Good, Fair, Poor)
   - Calculate signal quality metrics and scores
   - Provide recommendations for optimal connectivity

4. **User Interface Development**
   - Create a modern, Nest-style web dashboard
   - Implement interactive floor maps with Google Maps-like features
   - Display real-time analytics and signal trends
   - Navigation directions to best signal locations
   - Connection instructions for detected networks
   - Real-time Wi-Fi signal visualization with range circles (up to 10 meters)

5. **Scalability and Extensibility**
   - Design architecture for easy addition of new reference points
   - Support multiple floors and environments
   - Enable dynamic model updates without full retraining

### Secondary Objectives

- Provide comprehensive API for integration with other systems
- Support data export in multiple formats (JSON, CSV)
- Implement robust error handling and monitoring
- Create detailed documentation for deployment and maintenance

---

## 3. Related Work

### Wi-Fi Fingerprinting Background

Wi-Fi fingerprinting has been extensively researched as an alternative to GPS for indoor positioning. The technique was first proposed in the early 2000s and has evolved significantly with advances in machine learning.

### Key Research Areas

1. **Traditional Fingerprinting Methods**
   - **K-Nearest Neighbors (KNN)**: Early approach using distance-based matching
   - **Probabilistic Methods**: Bayesian inference for location estimation
   - **Support Vector Machines (SVM)**: Classification-based positioning

2. **Deep Learning Approaches**
   - **Convolutional Neural Networks (CNN)**: For spatial pattern recognition
   - **Recurrent Neural Networks (RNN/LSTM)**: For temporal sequence analysis
   - **Siamese Networks**: For similarity learning and metric learning
   - **Triplet Networks**: For learning embeddings with contrastive loss

3. **Similarity Learning in Localization**
   - Research on metric learning for Wi-Fi fingerprinting
   - Embedding-based approaches for scalable positioning
   - Transfer learning for cross-environment adaptation

### Datasets and Benchmarks

- **UJIIndoorLoc Dataset**: Large-scale dataset with 20,000+ fingerprints across multiple buildings
- **IPIN Competitions**: International competitions for indoor positioning
- **Microsoft Indoor Localization Dataset**: Multi-building dataset with various signal types

### Our Contribution

This project combines:
- **Deep similarity learning** for robust feature representation
- **Scalable architecture** for easy deployment and extension
- **Real-time processing** with low latency requirements
- **Modern web interface** for user interaction and visualization

---

## 4. Methodology

### 4.1 System Architecture

The system follows a modular architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Web Dashboard)                  │
│  HTML5 + CSS3 + JavaScript (Nest-style UI)                  │
│  - Real-time visualization                                   │
│  - Interactive maps and charts                              │
│  - User controls and settings                                │
└───────────────────────┬─────────────────────────────────────┘
                        │ REST API (JSON)
┌───────────────────────▼─────────────────────────────────────┐
│                    Backend (Flask API)                       │
│  - API endpoints                                             │
│  - Request handling                                          │
│  - Data validation                                           │
└───────────────────────┬─────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
┌───────▼──────┐ ┌──────▼──────┐ ┌─────▼──────┐
│ Wi-Fi Scanner│ │ Preprocessor │ │ Location   │
│              │ │              │ │ Engine    │
└───────┬──────┘ └──────┬──────┘ └─────┬──────┘
        │               │               │
        └───────────────┼───────────────┘
                        │
        ┌───────────────▼───────────────┐
        │   Deep Similarity Model       │
        │   (Siamese Network)           │
        │   - Embedding generation      │
        │   - Similarity computation    │
        └───────────────┬───────────────┘
                        │
        ┌───────────────▼───────────────┐
        │   SQLite Database             │
        │   - Scan history              │
        │   - Reference points          │
        │   - Training data             │
        └───────────────────────────────┘
```

### 4.2 Data Collection Process

1. **Wi-Fi Scanning**
   - Scan for available Wi-Fi networks using system commands
   - Extract RSSI values, MAC addresses (BSSID), frequencies, and security types
   - Store raw scan data with timestamps

2. **Data Preprocessing**
   - Normalize RSSI values to consistent scales (0-1 range)
   - Handle missing access points with zero padding
   - Extract statistical features (mean, std, min, max, quartiles)
   - Create fixed-length fingerprint vectors

3. **Feature Engineering**
   - RSSI values (normalized)
   - Frequency bands (2.4GHz vs 5GHz)
   - Security type distributions
   - Network count and signal statistics

### 4.3 Deep Similarity Learning

#### Siamese Network Architecture

The core of the system is a Siamese network that learns to map Wi-Fi fingerprints to embeddings:

```
Input Layer (117 dimensions)
    ↓
Dense Layer (256 neurons) + ReLU + BatchNorm + Dropout(0.3)
    ↓
Dense Layer (128 neurons) + ReLU + BatchNorm + Dropout(0.3)
    ↓
Dense Layer (96 neurons) + ReLU + BatchNorm + Dropout(0.2)
    ↓
Embedding Layer (64 dimensions) + Linear
    ↓
L2 Normalization
    ↓
Output: Normalized Embedding Vector (64 dimensions)
```

#### Training Process

1. **Pair Generation**
   - Positive pairs: Fingerprints from the same location
   - Negative pairs: Fingerprints from different locations

2. **Contrastive Loss**
   - Minimize distance for positive pairs
   - Maximize distance for negative pairs (with margin)
   - Formula: `L = y * d² + (1-y) * max(0, margin - d)²`

3. **Reference Embedding Generation**
   - Generate embeddings for all training samples
   - Average embeddings per location to create reference points
   - Store reference embeddings for prediction

#### Prediction Process

1. **Input Processing**
   - Preprocess new RSSI scan data
   - Generate fingerprint vector

2. **Embedding Generation**
   - Pass fingerprint through trained Siamese network
   - Obtain normalized embedding vector

3. **Similarity Computation**
   - Calculate cosine similarity with all reference embeddings
   - Find location with highest similarity score

4. **Location Prediction**
   - Return predicted location with confidence score
   - Provide similarity scores for all locations

### 4.4 Signal Quality Assessment

Signal quality is assessed based on:
- **Average RSSI**: Mean signal strength across all networks
- **Strongest Signal**: Maximum RSSI value
- **Network Count**: Number of detected networks
- **Quality Score**: Normalized score (0-1)

**Classification:**
- **Excellent**: RSSI ≥ -50 dBm
- **Good**: -60 ≤ RSSI < -50 dBm
- **Fair**: -70 ≤ RSSI < -60 dBm
- **Poor**: RSSI < -70 dBm

---

## 5. Implementation

### 5.1 Project Structure

```
Wi-Fi Fingerprinting/
├── README.md                      # Project overview
├── PROJECT_DOCUMENTATION.md       # This file
├── DOCUMENTATION.md               # Technical documentation
├── start.sh                       # Startup script (Unix/Mac)
├── stop.sh                        # Stop script
├── monitor.sh                     # Backend monitoring script
│
├── backend/                       # Backend application
│   ├── app.py                     # Flask main application
│   ├── requirements.txt           # Python dependencies
│   ├── wifi_fingerprinting.db    # SQLite database
│   │
│   ├── models/                    # ML models and database
│   │   ├── similarity_model.py    # Siamese network implementation
│   │   └── database.py           # Database operations
│   │
│   ├── modules/                   # Core modules
│   │   ├── wifi_scanner.py       # Wi-Fi data collection
│   │   ├── preprocessing.py      # Data preprocessing
│   │   └── location_engine.py    # Location prediction
│   │
│   ├── config/                    # Configuration files
│   │   └── locations.json        # Custom location names
│   │
│   └── data/                      # Data storage
│       └── sample_data.json      # Sample training data
│
└── frontend/                      # Frontend application
    ├── index.html                 # Main dashboard
    ├── status.html                # Status page
    ├── monitor.html               # Backend monitor
    ├── debug.html                 # Debug page
    ├── locations.html             # Location configuration
    │
    ├── css/
    │   └── style.css             # Nest-style CSS
    │
    └── js/
        ├── app.js                # Main application logic
        ├── api.js                # API communication
        └── visualization.js      # Charts and maps
```

### 5.2 Backend Implementation

#### 5.2.1 Flask Application (`app.py`)

The Flask application serves as the API server:

**Key Components:**
- **CORS Configuration**: Enables cross-origin requests
- **API Endpoints**: RESTful endpoints for all operations
- **Error Handling**: Comprehensive error handling and logging
- **Database Integration**: SQLite database operations

**Main Endpoints:**
- `GET /api/status` - System health check (includes model availability)
- `GET /api/scan` - Perform real Wi-Fi scan (returns actual networks)
- `POST /api/predict` - Predict location from RSSI data (uses real fingerprint matching)
- `GET /api/signal` - Get signal quality metrics
- `GET /api/map` - Get map and reference point data
- `GET /api/history` - Get scan history from database
- `POST /api/train` - Train model with real reference points
- `POST /api/add_reference` - Add reference point (uses current scan data)
- `GET /api/locations` - Get location configuration with display names
- `POST /api/locations` - Update location names
- `GET /api/tracking` - Get real-time location tracking information
- `POST /api/tracking/destination` - Set destination location
- `DELETE /api/tracking/destination` - Clear destination
- `GET /api/tracking/history` - Get location history
- `GET /api/metrics` - Get performance metrics (Accuracy, Precision, Recall, F1-Score, mAP)
- `GET /api/metrics/recent` - Get recent metrics (24-hour view)
- `POST /api/metrics/ground_truth` - Add ground truth data for metrics calculation

#### 5.2.2 Wi-Fi Scanner (`modules/wifi_scanner.py`)

**Platform-Specific Implementation:**

**macOS (Real Wi-Fi Scanning):**
- Uses `system_profiler SPAirPortDataType` for comprehensive network data
- Extracts current network and other local Wi-Fi networks
- Parses signal strength, channel, frequency, security type
- Uses `networksetup` for additional network information
- Uses `wdutil` for wireless diagnostics (when available)
- Extracts real BSSID, RSSI, SSID, frequency, and security
- Falls back to mock data only if all methods fail

**Linux:**
- Uses `pywifi` library for Wi-Fi interface access (optional)
- Direct hardware scanning when available
- Platform detection and appropriate method selection

**Windows:**
- Uses mock data (system-specific libraries can be added)
- Provides realistic network simulation

**Features:**
- **Real-time network scanning** with actual Wi-Fi data
- **RSSI value extraction** from real network scans
- **Frequency and security type detection** from system output
- **BSSID extraction** for unique network identification
- **Multiple scanning methods** for reliability
- **Mock data generation** for testing/fallback

#### 5.2.3 Data Preprocessor (`modules/preprocessing.py`)

**Processing Pipeline:**

1. **Feature Extraction**
   - RSSI values from all detected networks
   - Frequency bands (2.4GHz vs 5GHz)
   - Security type distributions
   - Network count statistics

2. **Normalization**
   - RSSI values: Scale from [-100, 0] to [0, 1]
   - Frequencies: Normalize to [0, 1] range
   - Statistical features: Standard scaling

3. **Fingerprint Vector Creation**
   - Fixed-length vector (117 dimensions)
   - Padding for missing networks
   - Statistical features inclusion
   - One-hot encoding for security types

#### 5.2.4 Deep Similarity Model (`models/similarity_model.py`)

**Model Architecture:**

```python
Input: 117-dimensional fingerprint vector
  ↓
Dense(256) → BatchNorm → Dropout(0.3) → ReLU
  ↓
Dense(128) → BatchNorm → Dropout(0.3) → ReLU
  ↓
Dense(96) → BatchNorm → Dropout(0.2) → ReLU
  ↓
Dense(64) → Linear (Embedding)
  ↓
L2 Normalization
  ↓
Output: 64-dimensional normalized embedding
```

**TensorFlow Optional Mode:**
- System gracefully handles TensorFlow compatibility issues
- Falls back to fingerprint-based matching if TensorFlow unavailable
- Uses real fingerprint matching with BSSID, RSSI similarity
- Works perfectly without TensorFlow dependency

**Training Process:**
- Pair generation (positive/negative)
- Contrastive loss optimization
- Adam optimizer with learning rate 0.001
- Batch size: 32, Epochs: 100
- Validation split: 20%
- **Real fingerprint matching** as alternative training method

**Prediction Process:**
- **Real Fingerprint Matching** (Primary method):
  - Compare current scan with stored reference fingerprints
  - Use cosine similarity, BSSID matching, and RSSI similarity
  - Weighted combination: 40% cosine, 40% BSSID match, 20% RSSI similarity
- **Deep Learning** (If TensorFlow available):
  - Generate embedding for input fingerprint
  - Compute cosine similarity with reference embeddings
  - Return location with highest similarity
- Returns location with confidence and similarity scores

#### 5.2.5 Location Engine (`modules/location_engine.py`)

**Components:**
- Location coordinate management
- Signal quality assessment
- Similarity score computation
- Heatmap data generation
- **Real fingerprint matching** with reference points
- **Location name customization** from config file

**Features:**
- **Real fingerprint matching** using actual Wi-Fi network data
- **Customizable location names** loaded from `config/locations.json`
- **Reference point management** - stores and loads from database
- **Multi-floor support** with floor-specific coordinates
- **Distance calculations** for navigation
- **Nearby location finding** based on similarity scores
- **Top 5 similarity scores** for cleaner display
- **Only shows locations with reference points** in similarity results

#### 5.2.6 Database Manager (`models/database.py`)

**Database Schema:**

**scans Table:**
- `id`: Primary key
- `timestamp`: Scan timestamp
- `rssi_data`: JSON-encoded Wi-Fi data
- `location_id`: Predicted location
- `signal_quality`: Signal quality assessment

**reference_points Table:**
- `id`: Primary key
- `location_id`: Location identifier
- `rssi_data`: Reference fingerprint data
- `embedding`: Pre-computed embedding vector
- `created_at`: Creation timestamp

**training_data Table:**
- `id`: Primary key
- `location_id`: Location identifier
- `rssi_data`: Training fingerprint
- `label`: Optional label
- `created_at`: Creation timestamp

### 5.3 Frontend Implementation

#### 5.3.1 Main Dashboard (`index.html`)

**Layout:**
- Header with logo and controls
- Status cards (Location, Signal, System)
- Interactive map section
- Analytics charts
- Network list
- Similarity scores
- Scan history

**Features:**
- Real-time updates
- Responsive design
- Nest-style UI
- Toast notifications
- Loading states

#### 5.3.2 API Client (`js/api.js`)

**WiFiAPI Class:**
- Base URL configuration
- Connection retry logic
- Error handling
- Data export functionality

**Methods:**
- `checkConnection()` - Verify backend availability
- `scanWiFi()` - Perform Wi-Fi scan
- `predictLocation()` - Get location prediction
- `getSignalQuality()` - Get signal metrics
- `getMapData()` - Get map information
- `getScanHistory()` - Get historical data
- `trainModel()` - Train/retrain model
- `addReferencePoint()` - Add new reference

#### 5.3.3 Visualization (`js/visualization.js`)

**Components:**
- **Map Visualization**: Leaflet.js with Google Maps-like interface
  - Zoom, pan, scale controls
  - Interactive floor plan overlay
  - Real-time location markers
  - **Navigation to best signal** with green arrow and path
  - **Wi-Fi signal range circles** (up to 10 meters)
  - **Color-coded network markers** (green/blue/yellow/red by signal strength)
  - **Best signal marker** with network details
- **Signal Charts**: Chart.js for RSSI trends over time
- **Network List**: Real-time network display with clickable items
- **Similarity Scores**: Visual similarity bars with top 5 matches
- **Heatmaps**: Signal strength visualization
- **Connection Instructions**: Modal with platform-specific connection steps
- **Navigation Popup**: Shows distance, direction, and instructions to best signal

#### 5.3.4 Application Logic (`js/app.js`)

**WiFiApp Class:**
- Application initialization
- Event handling
- State management
- UI updates
- Error handling

**Features:**
- Continuous scanning (every 10 seconds, configurable)
- Real-time updates with duplicate scan prevention
- Settings management with model training controls
- Data export (JSON, CSV)
- Keyboard shortcuts
- **Model training interface** - Add reference points and train
- **Location name customization** via web interface
- **Connection instructions** for detected networks
- **Navigation to best signal** automatically displayed

---

## 6. Project Setup

### 6.1 Prerequisites

#### For Both Mac and Windows:

1. **Python 3.8 or higher**
   - Download from [python.org](https://www.python.org/downloads/)
   - Verify installation: `python --version`

2. **pip (Python Package Manager)**
   - Usually included with Python
   - Verify: `pip --version`

3. **Modern Web Browser**
   - Chrome, Firefox, Safari, or Edge
   - JavaScript enabled

4. **Git (Optional)**
   - For version control
   - Download from [git-scm.com](https://git-scm.com/)

### 6.2 Setup on macOS

#### Step 1: Download/Clone the Project

```bash
# Navigate to your desired directory
cd ~/Downloads

# If you have the project folder, navigate to it
cd "Wi-Fi Fingerprinting"
```

#### Step 2: Create Virtual Environment

```bash
# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# You should see (venv) in your terminal prompt
```

#### Step 3: Install Dependencies

```bash
# Navigate to backend directory
cd backend

# Install Python packages
pip install -r requirements.txt

# This will install:
# - Flask (web framework)
# - TensorFlow (deep learning)
# - NumPy, Pandas (data processing)
# - scikit-learn (machine learning utilities)
# - And other dependencies
```

#### Step 4: Initialize Database

```bash
# The database will be created automatically on first run
# Or you can initialize it manually:
python -c "from models.database import DatabaseManager; db = DatabaseManager(); db.init_database()"
```

#### Step 5: Load Sample Data (Optional)

```bash
# Load sample training data
python -c "
import json
from models.database import DatabaseManager
db = DatabaseManager()
with open('../data/sample_data.json', 'r') as f:
    data = json.load(f)
for fingerprint in data['sample_wifi_fingerprints']:
    db.add_training_data(fingerprint['location_id'], fingerprint['rssi_data'])
print('Sample data loaded successfully')
"
```

#### Step 6: Verify Installation

```bash
# Test backend startup
python app.py

# You should see:
# Initializing database...
# Loading model...
# Starting Flask server on http://localhost:5001
```

### 6.3 Setup on Windows

#### Step 1: Download/Clone the Project

1. Navigate to your desired directory (e.g., `C:\Users\YourName\Downloads`)
2. Extract or clone the project folder
3. Open Command Prompt or PowerShell in the project folder

#### Step 2: Create Virtual Environment

```cmd
# Create virtual environment
python -m venv venv

# Activate virtual environment
venv\Scripts\activate

# You should see (venv) in your prompt
```

#### Step 3: Install Dependencies

**Recommended: Use Automated Setup Script**
```cmd
# Double-click setup_windows.bat
# Or run in PowerShell: .\setup_windows.ps1
# Or run in Git Bash: bash setup_windows.sh
```

**Manual Installation:**
```cmd
# Navigate to backend directory
cd backend

# Install Python packages
pip install -r requirements.txt
```

**Note for Windows Users:**
- **Use the automated setup scripts** (`setup_windows.bat`, `setup_windows.ps1`, or `setup_windows.sh`) for easiest installation
- If you encounter errors with `pywifi`, it's normal - the system will use mock data
- If TensorFlow installation fails, it's OK - the system works without it
- Some packages may require Visual C++ Build Tools (usually auto-installed)
- Use PowerShell or Command Prompt as Administrator if needed
- See `WINDOWS_SETUP.md` for detailed Windows setup guide

#### Step 4: Initialize Database

```cmd
# Database will be created automatically
# Or initialize manually:
python -c "from models.database import DatabaseManager; db = DatabaseManager(); db.init_database()"
```

#### Step 5: Load Sample Data (Optional)

```cmd
# Load sample training data (cross-platform compatible)
cd backend
python load_sample_data.py
cd ..
```

**Alternative (one-liner from backend directory):**
```cmd
cd backend
python load_sample_data.py
```

#### Step 6: Verify Installation

```cmd
# Test backend startup
python app.py
```

### 6.4 Configuration

#### Customize Location Names

Edit `backend/config/locations.json`:

```json
{
  "location_names": {
    "Area 1": "Your Room",
    "Area 2": "Kitchen",
    "Area 3": "Living Room"
  },
  "custom_locations": {
    "My Office": {"x": 50, "y": 50, "floor": 1}
  }
}
```

#### Backend Port Configuration

Edit `backend/app.py` (line 322):

```python
app.run(debug=True, host='0.0.0.0', port=5001)  # Change port if needed
```

#### Frontend API URL

Edit `frontend/js/api.js` (line 3):

```javascript
constructor(baseURL = 'http://localhost:5001') {  // Change if backend is on different host/port
```

---

## 7. Running the Project

### 7.1 Quick Start (macOS/Linux)

#### Method 1: Using Startup Script

```bash
# Make scripts executable (first time only)
chmod +x start.sh stop.sh monitor.sh

# Start the system
./start.sh

# The script will:
# 1. Create virtual environment (if needed)
# 2. Install dependencies
# 3. Initialize database
# 4. Load sample data
# 5. Start backend server
# 6. Start frontend server
```

#### Method 2: Manual Start

**Terminal 1 - Backend:**
```bash
# Activate virtual environment
source venv/bin/activate

# Navigate to backend
cd backend

# Start Flask server
python app.py
```

**Terminal 2 - Frontend:**
```bash
# Navigate to frontend
cd frontend

# Start HTTP server
python3 -m http.server 8080
```

### 7.2 Quick Start (Windows)

#### Method 1: Automated Setup (Recommended)

**PowerShell:**
```powershell
# Right-click setup_windows.ps1 → "Run with PowerShell"
# Or run:
.\setup_windows.ps1
```

**Command Prompt:**
```cmd
# Double-click setup_windows.bat
# Or run:
setup_windows.bat
```

**Git Bash / WSL:**
```bash
bash setup_windows.sh
```

The setup script will automatically:
- Check prerequisites
- Create virtual environment
- Install dependencies
- Initialize database
- Start backend and frontend servers

**See `WINDOWS_SETUP.md` for detailed Windows setup instructions.**

#### Method 2: Manual Start

**Command Prompt 1 - Backend:**
```cmd
venv\Scripts\activate
cd backend
python app.py
```

**Command Prompt 2 - Frontend:**
```cmd
cd frontend
python -m http.server 8080
```

#### Method 3: Using PowerShell

**PowerShell 1 - Backend:**
```powershell
.\venv\Scripts\Activate.ps1
cd backend
python app.py
```

**PowerShell 2 - Frontend:**
```powershell
cd frontend
python -m http.server 8080
```

### 7.3 Accessing the Application

Once both servers are running:

1. **Main Dashboard**: Open `http://localhost:8080` in your browser
2. **Backend API**: Available at `http://localhost:5001`
3. **Status Page**: `http://localhost:8080/status.html`
4. **Monitor Page**: `http://localhost:8080/monitor.html`
5. **Debug Page**: `http://localhost:8080/debug.html`
6. **Location Config**: `http://localhost:8080/locations.html`

### 7.4 Using the Dashboard

1. **Check Connection**: The dashboard automatically checks backend connection
2. **Start Scanning**: Click "Start Scan" or "Scan Now" button to begin Wi-Fi fingerprinting
3. **View Results**: 
   - Current location prediction with confidence
   - Signal quality metrics (Excellent/Good/Fair/Poor)
   - Detected networks (real Wi-Fi networks with BSSID, RSSI, frequency)
   - Similarity scores (top 5 matches with correct location names)
   - Interactive map with Google Maps-like features
   - **Navigation to best signal** (green arrow and path)
4. **Navigate to Best Signal**:
   - After scanning, green navigation path appears automatically
   - Green arrow shows direction to move
   - Green pin marks best signal location
   - Click pin for detailed navigation instructions
5. **Connect to Networks**:
   - Click any network in the "Detected Networks" list
   - View connection instructions modal
   - Platform-specific steps (macOS/Windows)
   - Network details (SSID, BSSID, signal strength, security)
6. **Add Reference Points**: 
   - Go to Settings → Model Training
   - Select location from dropdown
   - Click "Add" to save current scan as reference point
   - Add multiple reference points from different locations
7. **Train Model**:
   - After adding reference points, click "Train Model"
   - System uses real fingerprint matching
   - Works with or without TensorFlow
8. **Customize Locations**: 
   - Visit `http://localhost:8080/locations.html`
   - Or edit `backend/config/locations.json`
   - Edit location names
   - Save changes and restart backend

### 7.5 Stopping the System

**macOS/Linux:**
```bash
# Use stop script
./stop.sh

# Or manually:
pkill -f "python.*app.py"
pkill -f "python.*http.server"
```

**Windows:**
```cmd
# Use stop scripts:
stop_windows.bat        # Command Prompt
.\stop_windows.ps1      # PowerShell
bash stop_windows.sh    # Git Bash/WSL

# Or manually:
# Press Ctrl+C in both terminal windows
# Or use Task Manager to end processes
```

---

## 8. Code Explanation

### 8.1 Backend Code Structure

#### 8.1.1 Flask Application (`app.py`)

**Key Functions:**

```python
@app.route('/api/scan', methods=['GET'])
def scan_wifi():
    """
    Scans for Wi-Fi networks and returns RSSI data
    - Calls wifi_scanner.scan_networks()
    - Stores scan in database
    - Preprocesses data for model input
    - Returns JSON response with networks and processed data
    """
```

```python
@app.route('/api/predict', methods=['POST'])
def predict_location():
    """
    Predicts location from RSSI data
    - Receives JSON with rssi_data array
    - Preprocesses input data
    - Generates fingerprint vector
    - Calls location_engine.predict_location()
    - Returns prediction with confidence scores
    """
```

#### 8.1.2 Wi-Fi Scanner (`modules/wifi_scanner.py`)

**Platform Detection:**
```python
def _initialize_interface(self):
    """Detects platform and initializes appropriate scanning method"""
    if platform.system() == "Darwin":  # macOS
        # Use networksetup commands
    elif platform.system() == "Linux":
        # Use pywifi library
    else:
        # Use mock data
```

**Scanning Process:**
```python
def scan_networks(self):
    """
    1. Calls platform-specific scan method
    2. Parses network data
    3. Extracts RSSI, BSSID, frequency, security
    4. Returns list of network dictionaries
    """
```

#### 8.1.3 Data Preprocessing (`modules/preprocessing.py`)

**Processing Pipeline:**
```python
def preprocess(self, wifi_data):
    """
    1. Extract features (RSSI, frequencies, security types)
    2. Calculate statistics (mean, std, min, max, quartiles)
    3. Normalize values to [0, 1] range
    4. Create fixed-length fingerprint vector (117 dimensions)
    5. Return processed data dictionary
    """
```

**Fingerprint Vector Structure:**
- First 50 values: Normalized RSSI values (padded with zeros)
- Next 50 values: Normalized frequencies
- Next 7 values: Signal statistics (mean, std, min, max, median, q25, q75)
- Next 4 values: Frequency statistics
- Next 1 value: Network count (normalized)
- Last 6 values: Security type counts (one-hot encoded)

#### 8.1.4 Deep Similarity Model (`models/similarity_model.py`)

**Model Building:**
```python
def _build_model(self):
    """
    Creates Siamese network architecture:
    - Input: 117-dimensional fingerprint
    - Hidden layers: 256 → 128 → 96 neurons
    - Embedding: 64-dimensional normalized vector
    - Uses ReLU activation, BatchNorm, Dropout
    """
```

**Training:**
```python
def train(self, training_data):
    """
    1. Prepare training data (convert to fingerprint vectors)
    2. Generate positive/negative pairs
    3. Train with contrastive loss
    4. Generate reference embeddings for each location
    5. Save model and embeddings
    """
```

**Prediction:**
```python
def predict_location(self, fingerprint):
    """
    1. Generate embedding for input fingerprint
    2. Compute cosine similarity with all reference embeddings
    3. Find location with highest similarity
    4. Return location, confidence, and all similarity scores
    """
```

#### 8.1.5 Location Engine (`modules/location_engine.py`)

**Location Prediction:**
```python
def predict_location(self, fingerprint_vector):
    """
    1. Simulate location prediction (or use trained model)
    2. Calculate signal quality from fingerprint
    3. Generate similarity scores for all locations
    4. Return prediction with coordinates and quality metrics
    """
```

**Signal Quality Assessment:**
```python
def _assess_signal_quality(self, fingerprint_vector):
    """
    1. Extract RSSI values from fingerprint
    2. Calculate average, max, min RSSI
    3. Determine quality level (Excellent/Good/Fair/Poor)
    4. Generate recommendations
    5. Return quality metrics dictionary
    """
```

### 8.2 Frontend Code Structure

#### 8.2.1 API Client (`js/api.js`)

**WiFiAPI Class:**
```javascript
class WiFiAPI {
    constructor(baseURL = 'http://localhost:5001') {
        this.baseURL = baseURL;
        this.isConnected = false;
    }
    
    async scanWiFi() {
        // Fetches /api/scan endpoint
        // Returns network data
    }
    
    async predictLocation(rssiData) {
        // POSTs to /api/predict
        // Returns location prediction
    }
}
```

#### 8.2.2 Visualization (`js/visualization.js`)

**WiFiVisualization Class:**
```javascript
class WiFiVisualization {
    initMap() {
        // Initializes Leaflet map
        // Creates floor plan overlay
    }
    
    updateMap(locationData) {
        // Updates map with current location marker
        // Centers map on predicted location
    }
    
    updateSignalChart(signalData) {
        // Updates Chart.js line chart
        // Shows RSSI trends over time
    }
}
```

#### 8.2.3 Application Logic (`js/app.js`)

**WiFiApp Class:**
```javascript
class WiFiApp {
    async init() {
        // Initializes event listeners
        // Checks backend connection
        // Loads initial data
    }
    
    async performScan() {
        // Calls API to scan Wi-Fi
        // Predicts location
        // Updates UI with results
    }
    
    toggleScanning() {
        // Starts/stops continuous scanning
        // Updates button state
    }
}
```

---

## 9. API Documentation

### 9.1 Endpoint Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/status` | System health and status |
| GET | `/api/scan` | Perform Wi-Fi network scan |
| POST | `/api/predict` | Predict location from RSSI data |
| GET | `/api/signal` | Get signal quality metrics |
| GET | `/api/map` | Get map and reference point data |
| GET | `/api/history` | Get scan history |
| POST | `/api/train` | Train or retrain model |
| POST | `/api/add_reference` | Add new reference point |
| GET | `/api/locations` | Get location configuration |
| POST | `/api/locations` | Update location names |

### 9.2 Request/Response Examples

#### GET /api/status

**Request:**
```bash
curl http://localhost:5001/api/status
```

**Response:**
```json
{
  "success": true,
  "status": {
    "backend_running": true,
    "database_connected": true,
    "model_loaded": false,
    "current_location": null,
    "signal_quality": null,
    "total_scans": 0,
    "timestamp": "2025-10-16T10:00:00.000000"
  }
}
```

#### GET /api/scan

**Request:**
```bash
curl http://localhost:5001/api/scan
```

**Response:**
```json
{
  "success": true,
  "scan_id": 1,
  "networks": [
    {
      "ssid": "JioFiber-He5ad_5G",
      "bssid": "00:00:00:00:00:00",
      "signal": -52,
      "frequency": 5180,
      "security": "WPA2-PSK",
      "timestamp": 1760589000.0
    }
  ],
  "processed_data": {
    "fingerprint_vector": [0.48, 0.52, ...],
    "network_count": 10
  },
  "timestamp": "2025-10-16T10:00:00.000000"
}
```

#### POST /api/predict

**Request:**
```bash
curl -X POST http://localhost:5001/api/predict \
  -H "Content-Type: application/json" \
  -d '{
    "rssi_data": [
      {
        "ssid": "JioFiber-He5ad_5G",
        "signal": -52,
        "bssid": "00:00:00:00:00:00"
      }
    ]
  }'
```

**Response:**
```json
{
  "success": true,
  "prediction": {
    "location": "Area 1",
    "confidence": 0.85,
    "coordinates": {
      "x": 50,
      "y": 30,
      "floor": 1
    },
    "signal_quality": {
      "overall_quality": "Excellent",
      "average_rssi": 0.48,
      "quality_score": 0.95,
      "network_count": 1,
      "recommendations": [
        "Excellent signal strength",
        "Optimal for all applications"
      ]
    },
    "similarity_scores": {
      "Area 1": 0.85,
      "Area 2": 0.45,
      "Area 3": 0.32
    },
    "timestamp": 1760589000.0
  },
  "timestamp": "2025-10-16T10:00:00.000000"
}
```

---

## 10. Troubleshooting

### 10.1 Common Issues

#### Backend Won't Start

**Problem:** Flask server fails to start

**Solutions:**
1. Check if port 5001 is available:
   ```bash
   # macOS/Linux
   lsof -i:5001
   
   # Windows
   netstat -ano | findstr :5001
   ```

2. Verify Python version:
   ```bash
   python --version  # Should be 3.8+
   ```

3. Check virtual environment:
   ```bash
   # Make sure venv is activated
   which python  # Should show venv path
   ```

4. Reinstall dependencies:
   ```bash
   pip install --upgrade -r requirements.txt
   ```

#### Frontend Can't Connect to Backend

**Problem:** `ERR_CONNECTION_REFUSED` errors

**Solutions:**
1. Verify backend is running:
   ```bash
   curl http://localhost:5001/api/status
   ```

2. Check CORS settings in `app.py`

3. Verify API URL in `frontend/js/api.js`

4. Check firewall settings

#### No Wi-Fi Networks Detected

**Problem:** Scan returns empty or mock data

**Solutions:**
1. **macOS:**
   - Check Wi-Fi is enabled (System Preferences → Network)
   - Verify network permissions
   - System uses `system_profiler`, `networksetup`, and `wdutil` commands
   - Check backend logs for scanning method used
   - Real networks should be detected automatically

2. **Linux:**
   - Install `pywifi` dependencies (optional)
   - Check Wi-Fi interface permissions
   - May need to run with `sudo`
   - System will use mock data if scanning fails

3. **Windows:**
   - System will use mock data (expected behavior)
   - For real scanning, consider using Windows-specific libraries
   - Mock data is realistic and suitable for testing

**Note:** The system now uses **real Wi-Fi scanning** on macOS and will detect actual networks. Check the network list to see if real BSSIDs and signal strengths are shown.

#### Model Training Fails

**Problem:** Training process errors

**Solutions:**
1. Check training data exists:
   ```bash
   python -c "from models.database import DatabaseManager; db = DatabaseManager(); print(len(db.get_training_data()))"
   ```

2. **TensorFlow Not Required**: The system now works without TensorFlow!
   - Uses real fingerprint matching as primary method
   - Compares BSSID, RSSI, and network patterns
   - Works perfectly with reference points only
   - TensorFlow is optional for deep learning features

3. Add reference points first:
   - Use Settings → Model Training → Add Reference Point
   - Or use training script: `python quick_train.py`
   - Need at least 2 reference points for meaningful training

4. Check available memory (only if using TensorFlow)

#### Database Errors

**Problem:** SQLite database issues

**Solutions:**
1. Delete and recreate database:
   ```bash
   rm backend/wifi_fingerprinting.db
   python -c "from models.database import DatabaseManager; db = DatabaseManager(); db.init_database()"
   ```

2. Check file permissions

3. Verify database path is correct

### 10.2 Performance Optimization

1. **Reduce Scan Frequency**: Increase interval between scans
2. **Limit History**: Keep only recent scans in memory
3. **Model Optimization**: Use smaller embedding dimensions
4. **Database Indexing**: Add indexes for frequently queried columns

### 10.3 Debugging Tips

1. **Enable Debug Mode**: Already enabled in `app.py` (`debug=True`)
2. **Check Browser Console**: F12 → Console tab
3. **Backend Logs**: Check terminal where backend is running
4. **Use Debug Page**: `http://localhost:8080/debug.html`
5. **Monitor Page**: `http://localhost:8080/monitor.html`

---

## 11. Recent Features and Improvements

### 11.1 Real Wi-Fi Network Detection
- **macOS**: Uses `system_profiler`, `networksetup`, and `wdutil` for real scanning
- **Real BSSID extraction**: Unique MAC addresses for each network
- **Real RSSI values**: Actual signal strength measurements
- **Network details**: Frequency, security type, SSID from system

### 11.2 Navigation to Best Signal
- **Visual navigation path**: Green dashed line showing route
- **Direction arrow**: Pulsing green arrow pointing to optimal position
- **Best signal marker**: Green pin with network name and strength
- **Navigation popup**: Distance, direction, and instructions
- **Real-time updates**: Navigation updates with each scan

### 11.3 Real Fingerprint Matching
- **BSSID matching**: Compares actual network MAC addresses
- **RSSI similarity**: Compares signal strength differences
- **Cosine similarity**: Vector-based fingerprint comparison
- **Weighted scoring**: 40% cosine + 40% BSSID + 20% RSSI
- **Works without TensorFlow**: Fully functional fingerprint matching

### 11.4 Location Names Customization
- **Config file**: `backend/config/locations.json`
- **Web interface**: `http://localhost:8080/locations.html`
- **API endpoints**: GET/POST `/api/locations`
- **Automatic loading**: Names loaded on backend startup
- **Similarity scores**: Use correct display names

### 11.5 Connection Instructions
- **Platform-specific**: macOS and Windows instructions
- **Network details**: SSID, BSSID, signal strength, security
- **Step-by-step guide**: Clear connection steps
- **Modal interface**: Easy-to-use popup

### 11.6 Training System
- **Reference points**: Store real Wi-Fi scans with location labels
- **Training script**: `train_model.py` and `quick_train.py`
- **Web interface**: Settings → Model Training
- **Real data**: Uses actual scanned networks for training
- **Immediate use**: Reference points available after adding

### 11.7 Improved Error Handling
- **TensorFlow optional**: Graceful fallback if TensorFlow unavailable
- **Comprehensive logging**: Detailed error messages and stack traces
- **Connection monitoring**: Automatic backend health checks
- **User-friendly errors**: Clear error messages in UI

### 11.8 Enhanced Map Features
- **Google Maps-like interface**: Zoom, pan, scale controls
- **Signal range circles**: Up to 10 meters visualization
- **Color-coded markers**: Green/blue/yellow/red by signal strength
- **Real-time updates**: Map updates with each scan
- **Navigation overlay**: Visual path to best signal

### 11.9 Real-Time Location Tracking
- **Continuous Updates**: Location updates every 90 seconds (1.5 minutes)
- **Movement Detection**: Tracks direction, distance, and speed
- **Direction Indicators**: Visual arrows showing movement direction on map
- **Location History**: Stores last 100 locations for tracking analysis
- **Automatic Updates**: Works even when user stays in same area

### 11.10 Destination Tracking
- **Set Destination**: Set target location via UI or API
- **Distance Tracking**: Real-time distance calculation to destination
- **Location Reached**: Automatic popup notification when within 3 meters
- **Visual Path**: Green dashed line showing route to destination
- **Progress Monitoring**: Tracks progress as user approaches destination

### 11.11 Stable Location Detection
- **Stability Threshold**: Detects when user stays at same location for 2+ minutes
- **Best Location Identification**: Marks stable locations as "best location"
- **Visual Indicators**: Green circle on map for stable locations
- **Duration Tracking**: Shows how long user has been at stable location
- **Notifications**: Alerts when stability threshold is reached

### 11.12 Performance Metrics System
- **Accuracy Calculation**: Overall correctness of predictions
- **Precision**: Measures how many predicted positives are correct
- **Recall**: Measures how many actual positives are identified
- **F1-Score**: Balanced evaluation combining precision and recall
- **mAP (Mean Average Precision)**: Evaluates performance across multiple confidence thresholds
- **Per-Class Metrics**: Individual metrics for each location
- **Persistent Storage**: Metrics saved in database, survive server restarts
- **Automatic Ground Truth**: Reference points automatically add ground truth data
- **Real-Time Updates**: Metrics refresh automatically after adding reference points

## 12. Performance Metrics

### 12.1 Metrics Overview

The system provides comprehensive performance evaluation using standard machine learning metrics:

- **Accuracy**: Overall correctness = (TP + TN) / (TP + TN + FP + FN)
- **Precision**: Correct positive predictions = TP / (TP + FP)
- **Recall**: Actual positives identified = TP / (TP + FN)
- **F1-Score**: Harmonic mean of precision and recall = 2 × (Precision × Recall) / (Precision + Recall)
- **mAP**: Mean Average Precision across multiple confidence thresholds (0.5, 0.6, 0.7, 0.8, 0.9)

### 12.2 How Metrics Work

1. **Ground Truth Collection**:
   - When you add a reference point, it automatically becomes ground truth
   - The system predicts the location and compares it with the actual location
   - This creates a prediction-actual pair for metrics calculation

2. **Metrics Calculation**:
   - Metrics are calculated from confusion matrix
   - Each location is treated as a class
   - Metrics computed per-class and overall (macro-averaged)

3. **Persistence**:
   - All predictions stored in `metrics_predictions` database table
   - Metrics load automatically on server startup
   - Data persists across server restarts

### 12.3 Using Metrics

**To Get Metrics:**
1. Add reference points from different locations (Settings → Model Training)
2. Each reference point adds ground truth data automatically
3. Metrics update automatically in the dashboard
4. View metrics in "Performance Metrics" section

**Metrics Dashboard:**
- Shows overall metrics (Accuracy, Precision, Recall, F1-Score, mAP)
- Displays per-class metrics for each location
- Shows total predictions and ground truth count
- Refresh button to reload latest metrics

**Interpreting Results:**
- **High Accuracy (>80%)**: System correctly predicts most locations
- **High Precision**: Few false positives (predicted location is usually correct)
- **High Recall**: System finds most actual locations
- **High F1-Score**: Good balance between precision and recall
- **High mAP**: Consistent performance across different confidence levels

### 12.4 Metrics API

**Get All Metrics:**
```bash
GET /api/metrics
```

**Response:**
```json
{
  "success": true,
  "metrics": {
    "accuracy": 0.85,
    "precision": 0.82,
    "recall": 0.88,
    "f1_score": 0.85,
    "map": 0.83,
    "total_predictions": 150,
    "predictions_with_ground_truth": 120,
    "classes": ["Area 1", "Area 2", "Area 3"],
    "class_counts": {"Area 1": 40, "Area 2": 45, "Area 3": 35}
  },
  "per_class": {
    "Area 1": {
      "precision": 0.85,
      "recall": 0.90,
      "f1_score": 0.87,
      "count": 40
    }
  }
}
```

**Get Recent Metrics (24 hours):**
```bash
GET /api/metrics/recent?hours=24
```

**Add Ground Truth:**
```bash
POST /api/metrics/ground_truth
{
  "predicted_location": "Area 1",
  "actual_location": "Area 1",
  "confidence": 0.85
}
```

## 13. Future Enhancements

1. **Hybrid Localization**: Combine Wi-Fi + Bluetooth + Magnetic field
2. **AR Navigation**: Augmented reality indoor navigation
3. **Multi-User Tracking**: Track multiple users simultaneously
4. **Federated Learning**: Decentralized model updates
5. **Mobile App**: Native iOS/Android applications
6. **Cloud Deployment**: Deploy to cloud platforms
7. **Real-Time Collaboration**: Multi-user real-time tracking
8. **Advanced Triangulation**: More accurate network position estimation
9. **Signal Prediction**: Predict signal strength at different locations
10. **Historical Analysis**: Long-term signal quality trends

---

## 14. References and Resources

### Academic Papers
- Wi-Fi Fingerprinting for Indoor Localization
- Deep Learning for Indoor Positioning
- Siamese Networks for Similarity Learning

### Datasets
- UJIIndoorLoc Dataset
- Microsoft Indoor Localization Dataset

### Documentation
- Flask Documentation: https://flask.palletsprojects.com/
- TensorFlow Documentation: https://www.tensorflow.org/
- Leaflet.js Documentation: https://leafletjs.com/

---

## 15. License and Credits

**License:** MIT License

**Credits:**
- TensorFlow Team - Deep learning framework
- Flask Team - Web framework
- Leaflet.js - Mapping library
- Chart.js - Charting library

---

## 16. Contact and Support

For questions, issues, or contributions:
- Check the troubleshooting section
- Review API documentation
- Consult code comments
- Use debug and monitor pages

---

**Document Version:** 3.0  
**Last Updated:** January 2025  
**Project Status:** Production Ready with Real Wi-Fi Scanning, Location Tracking, and Performance Metrics

## 17. Quick Reference

### Key Files
- **Backend**: `backend/app.py` - Main Flask application
- **Frontend**: `frontend/index.html` - Main dashboard
- **Config**: `backend/config/locations.json` - Location names
- **Training**: `train_model.py` or `quick_train.py` - Model training
- **Start**: `./start.sh` - Start entire system
- **Stop**: `./stop.sh` - Stop all processes

### Important URLs
- **Dashboard**: http://localhost:8080
- **Backend API**: http://localhost:5001
- **Status Page**: http://localhost:8080/status.html
- **Monitor**: http://localhost:8080/monitor.html
- **Locations Config**: http://localhost:8080/locations.html

### Key Features Summary
✅ Real Wi-Fi network scanning (macOS)  
✅ Navigation to best signal (Google Maps-like)  
✅ Real fingerprint matching (BSSID + RSSI)  
✅ Customizable location names  
✅ Connection instructions for networks  
✅ Training system with reference points  
✅ Works without TensorFlow  
✅ Real-time signal visualization  
✅ Top 5 similarity scores  
✅ Interactive map with range circles


