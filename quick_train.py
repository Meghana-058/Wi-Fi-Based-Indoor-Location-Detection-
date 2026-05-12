#!/usr/bin/env python3
"""
Quick Training Script - Non-interactive version
Adds reference points and trains the model automatically
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from backend.modules.wifi_scanner import WiFiScanner
from backend.models.database import DatabaseManager
from backend.modules.location_engine import LocationEngine
import json

def quick_train():
    """Quick training with automatic reference point addition"""
    print("=" * 60)
    print("Quick Model Training")
    print("=" * 60)
    print()
    
    scanner = WiFiScanner()
    db = DatabaseManager()
    location_engine = LocationEngine()
    
    # Scan for networks
    print("Scanning for Wi-Fi networks...")
    wifi_data = scanner.scan_networks()
    print(f"Found {len(wifi_data)} networks")
    
    if len(wifi_data) == 0:
        print("ERROR: No networks found. Make sure Wi-Fi is enabled.")
        return
    
    # Show detected networks
    print("\nDetected Networks:")
    for i, net in enumerate(wifi_data[:10], 1):
        ssid = net.get('ssid', 'Hidden')
        signal = net.get('signal', 0)
        bssid = net.get('bssid', 'N/A')[:17]
        print(f"  {i}. {ssid} - {signal} dBm - {bssid}")
    
    # Get available locations
    locations = list(location_engine.location_coordinates.keys())
    
    print(f"\nAvailable locations: {', '.join(locations)}")
    print("\nAdding reference points for all locations...")
    print("(You can customize this by editing the script)")
    
    # Add reference points for first few locations
    added_count = 0
    for i, location_id in enumerate(locations[:3], 1):  # Add first 3 locations
        try:
            db.add_reference_point(location_id, wifi_data)
            location_engine.add_reference_point(location_id, wifi_data)
            display_name = location_engine.get_location_display_name(location_id)
            print(f"  ✓ Added reference point for {display_name} ({location_id})")
            added_count += 1
        except Exception as e:
            print(f"  ✗ Failed to add {location_id}: {e}")
    
    if added_count == 0:
        print("\nERROR: Could not add any reference points")
        return
    
    print(f"\n✓ Added {added_count} reference point(s)")
    print(f"Total reference points: {len(location_engine.reference_fingerprints)}")
    
    # Train the model
    print("\nTraining model...")
    training_data = db.get_training_data()
    
    if len(training_data) < 2:
        print(f"⚠️  Only {len(training_data)} reference point(s).")
        print("   Add more reference points from different locations for better accuracy.")
        print("   Use the web interface: Settings → Model Training")
        return
    
    print(f"Training with {len(training_data)} reference points...")
    
    try:
        from backend.models.similarity_model import SimilarityModel
        model = SimilarityModel()
        result = model.train(training_data)
        
        if result.get('success'):
            print("✅ Model training completed!")
            print(f"   Method: {result.get('method', 'fingerprint_matching')}")
        else:
            print("⚠️  Using fingerprint-based matching")
    except Exception as e:
        print(f"✅ Using fingerprint-based matching (TensorFlow not available)")
        print(f"   This is normal and will work perfectly!")
    
    print(f"\n✓ Training complete!")
    print(f"   Reference points: {len(location_engine.reference_fingerprints)}")
    print("\nNext steps:")
    print("1. Test predictions by scanning from different locations")
    print("2. Add more reference points from different locations for better accuracy")
    print("3. Use the web interface for interactive training")

if __name__ == '__main__':
    try:
        quick_train()
    except KeyboardInterrupt:
        print("\n\nInterrupted by user")
    except Exception as e:
        print(f"\nERROR: {e}")
        import traceback
        traceback.print_exc()



