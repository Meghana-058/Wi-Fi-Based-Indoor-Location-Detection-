#!/usr/bin/env python3
"""
Training script for Wi-Fi Fingerprinting Model
This script collects real Wi-Fi scans and trains the model
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from backend.modules.wifi_scanner import WiFiScanner
from backend.modules.preprocessing import DataPreprocessor
from backend.models.database import DatabaseManager
from backend.modules.location_engine import LocationEngine
import json
import time

def collect_training_data():
    """Collect real Wi-Fi scan data for training"""
    print("=" * 60)
    print("Wi-Fi Fingerprinting Model Training")
    print("=" * 60)
    print()
    
    scanner = WiFiScanner()
    db = DatabaseManager()
    location_engine = LocationEngine()
    
    print("Step 1: Scanning for Wi-Fi networks...")
    wifi_data = scanner.scan_networks()
    print(f"Found {len(wifi_data)} networks")
    
    if len(wifi_data) == 0:
        print("ERROR: No networks found. Make sure Wi-Fi is enabled.")
        return
    
    print("\nDetected Networks:")
    for i, net in enumerate(wifi_data[:10], 1):
        print(f"  {i}. {net.get('ssid', 'Hidden')} - {net.get('signal', 0)} dBm - {net.get('bssid', 'N/A')}")
    
    print("\nStep 2: Adding reference points...")
    print("Available locations:")
    locations = list(location_engine.location_coordinates.keys())
    for i, loc in enumerate(locations, 1):
        display_name = location_engine.get_location_display_name(loc)
        print(f"  {i}. {display_name} ({loc})")
    
    print("\nEnter location number to add this scan as a reference point:")
    print("(Press Enter to skip, or 'q' to quit)")
    
    choice = input("Choice: ").strip()
    
    if choice.lower() == 'q':
        print("Exiting...")
        return
    
    if choice.isdigit():
        idx = int(choice) - 1
        if 0 <= idx < len(locations):
            location_id = locations[idx]
            display_name = location_engine.get_location_display_name(location_id)
            
            # Add reference point
            db.add_reference_point(location_id, wifi_data)
            location_engine.add_reference_point(location_id, wifi_data)
            
            print(f"\n✅ Reference point added for {display_name}!")
            print(f"   Networks: {len(wifi_data)}")
            print(f"   Total reference points: {len(location_engine.reference_fingerprints)}")
        else:
            print("Invalid location number")
    else:
        print("Skipped adding reference point")
    
    print("\nStep 3: Training model...")
    training_data = db.get_training_data()
    
    if len(training_data) < 2:
        print(f"⚠️  Only {len(training_data)} reference point(s) available.")
        print("   Add at least 2 reference points for meaningful training.")
        print("   Run this script again from different locations.")
        return
    
    print(f"Training with {len(training_data)} reference points...")
    
    # Train the model
    try:
        from backend.models.similarity_model import SimilarityModel
        model = SimilarityModel()
        result = model.train(training_data)
        
        if result.get('success'):
            print("✅ Model training completed!")
            print(f"   Method: {result.get('method', 'deep_learning')}")
            print(f"   Reference points: {result.get('reference_points', len(training_data))}")
        else:
            print("⚠️  Model training completed with fingerprint matching")
            print(f"   Reference points: {len(location_engine.reference_fingerprints)}")
    except Exception as e:
        print(f"⚠️  Using fingerprint-based matching (TensorFlow not available)")
        print(f"   Reference points: {len(location_engine.reference_fingerprints)}")
        print(f"   Error: {e}")
    
    print("\n" + "=" * 60)
    print("Training complete!")
    print("=" * 60)
    print("\nNext steps:")
    print("1. Run this script from different locations to add more reference points")
    print("2. The more reference points, the better the accuracy")
    print("3. Test predictions by scanning from known locations")

if __name__ == '__main__':
    try:
        collect_training_data()
    except KeyboardInterrupt:
        print("\n\nInterrupted by user")
    except Exception as e:
        print(f"\nERROR: {e}")
        import traceback
        traceback.print_exc()



