# Model Training Guide
## How to Train the Model with Real Wi-Fi Networks

This guide explains how to train the Wi-Fi Fingerprinting model using real network data for accurate location predictions.

---

## Overview

The system uses **fingerprint-based matching** to identify locations. It compares current Wi-Fi scans with stored reference points (fingerprints) collected from known locations.

---

## Training Process

### Method 1: Using the Web Interface (Recommended)

1. **Start the System**
   ```bash
   ./start.sh
   ```
   Or manually:
   ```bash
   # Terminal 1 - Backend
   cd backend && source ../venv/bin/activate && python app.py
   
   # Terminal 2 - Frontend
   cd frontend && python3 -m http.server 8080
   ```

2. **Open the Dashboard**
   - Go to `http://localhost:8080`
   - Click "Scan Now" to detect current Wi-Fi networks
   - Wait for networks to appear in the list

3. **Add Reference Points**
   - Click "Settings" button (gear icon)
   - In the "Model Training" section:
     - Select a location from the dropdown (e.g., "Area 1", "Area 2")
     - Click "Add" button
   - Repeat this process from different physical locations
   - **Important**: Add at least 2-3 reference points for meaningful training

4. **Train the Model**
   - After adding reference points, click "Train Model" button
   - Wait for training to complete
   - You'll see a success message with the number of reference points

5. **Test Predictions**
   - Scan from a known location
   - The system will match your current scan with stored reference points
   - View the predicted location and confidence score

### Method 2: Using the Training Script

1. **Run the Training Script**
   ```bash
   cd "/Users/ramakotirk/Downloads/Wi-Fi Fingerprinting"
   source venv/bin/activate
   python train_model.py
   ```

2. **Follow the Interactive Prompts**
   - The script will scan for Wi-Fi networks
   - Select a location number to add as reference point
   - Repeat from different locations
   - The script will automatically train when you have enough data

### Method 3: Using API Endpoints

**Add Reference Point:**
```bash
curl -X POST http://localhost:5001/api/add_reference \
  -H "Content-Type: application/json" \
  -d '{
    "location_id": "Area 1",
    "rssi_data": [
      {
        "ssid": "YourNetwork",
        "bssid": "00:11:22:33:44:55",
        "signal": -52,
        "frequency": 2412,
        "security": "WPA2-PSK"
      }
    ]
  }'
```

**Train Model:**
```bash
curl -X POST http://localhost:5001/api/train \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

## How It Works

### Fingerprint Matching Algorithm

1. **Reference Point Collection**
   - Each reference point stores:
     - Location ID (e.g., "Area 1")
     - Complete Wi-Fi scan data (SSID, BSSID, RSSI, frequency, security)
     - Timestamp

2. **Fingerprint Creation**
   - Current scan is converted to a normalized fingerprint vector
   - Includes:
     - RSSI values from all detected networks
     - Statistical features (mean, std, min, max)
     - Network count and distribution

3. **Similarity Matching**
   - Compares current fingerprint with all reference fingerprints
   - Uses three similarity metrics:
     - **Cosine Similarity** (40% weight): Vector similarity
     - **BSSID Matching** (40% weight): How many networks match
     - **RSSI Similarity** (20% weight): Signal strength differences
   - Combined score determines the best match

4. **Location Prediction**
   - Returns location with highest similarity score
   - Confidence based on similarity score
   - Provides similarity scores for all locations

---

## Best Practices

### 1. Collect Reference Points
- **Minimum**: 2-3 reference points
- **Recommended**: 5-10 reference points for better accuracy
- **Optimal**: 10+ reference points covering all areas

### 2. Location Selection
- Choose distinct physical locations
- Space them at least 3-5 meters apart
- Cover all areas you want to identify

### 3. Scan Quality
- Ensure Wi-Fi is enabled
- Wait for scan to complete (2-3 seconds)
- Avoid moving during scan
- Scan multiple times from the same location for better accuracy

### 4. Network Environment
- More networks = better fingerprints
- Stable network environment improves accuracy
- Avoid scanning during network changes

---

## Expected Results

### With Real Training Data

**Before Training:**
- Predictions use simulated algorithm
- Lower accuracy (~60-70%)
- Generic location assignments

**After Training:**
- Predictions use real fingerprint matching
- Higher accuracy (85-95% with good data)
- Accurate location identification
- Real similarity scores based on actual networks

### Output Format

```json
{
  "location": "Area 1",
  "confidence": 0.87,
  "coordinates": {"x": 50, "y": 30, "floor": 1},
  "signal_quality": {
    "overall_quality": "Excellent",
    "average_rssi": -48,
    "network_count": 12
  },
  "similarity_scores": {
    "Area 1": 0.87,
    "Area 2": 0.45,
    "Area 3": 0.32
  },
  "method": "real_fingerprint_matching"
}
```

---

## Troubleshooting

### No Networks Detected
- **Check**: Wi-Fi is enabled
- **Check**: System permissions for network access
- **Solution**: The system will use mock data if real scanning fails

### Low Accuracy
- **Cause**: Insufficient reference points
- **Solution**: Add more reference points from different locations
- **Cause**: Similar fingerprints at different locations
- **Solution**: Add reference points from more distinct locations

### Training Fails
- **Check**: At least 2 reference points exist
- **Check**: Backend logs for errors
- **Solution**: System will use fingerprint matching even if TensorFlow fails

---

## Advanced: Custom Locations

Edit `backend/config/locations.json`:

```json
{
  "location_names": {
    "Area 1": "Living Room",
    "Area 2": "Kitchen",
    "Area 3": "Bedroom"
  },
  "custom_locations": {
    "My Office": {"x": 50, "y": 50, "floor": 1},
    "Meeting Room": {"x": 30, "y": 70, "floor": 2}
  }
}
```

---

## Summary

1. **Scan** for Wi-Fi networks
2. **Add** reference points from different locations
3. **Train** the model
4. **Test** predictions from known locations
5. **Refine** by adding more reference points

The more reference points you collect, the more accurate the predictions will be!

