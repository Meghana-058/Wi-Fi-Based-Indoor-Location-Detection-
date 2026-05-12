#!/usr/bin/env python3
"""
Load sample data into the database.
This script handles cross-platform path resolution.
"""
import json
import os
import sys
from pathlib import Path

# Add current directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from models.database import DatabaseManager

def load_sample_data():
    """Load sample data from sample_data.json"""
    # Get the project root directory (parent of backend)
    script_dir = Path(__file__).parent.absolute()
    project_root = script_dir.parent
    sample_data_path = project_root / 'data' / 'sample_data.json'
    
    # Convert to string for compatibility
    sample_data_path_str = str(sample_data_path)
    
    # Check if file exists
    if not os.path.exists(sample_data_path_str):
        print(f"Error: Sample data file not found at: {sample_data_path_str}")
        print(f"Current working directory: {os.getcwd()}")
        print(f"Script directory: {script_dir}")
        sys.exit(1)
    
    try:
        # Load the JSON data
        with open(sample_data_path_str, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Initialize database
        db = DatabaseManager()
        
        # Load sample fingerprints
        sample_fingerprints = data.get('sample_wifi_fingerprints', [])
        
        if not sample_fingerprints:
            print("Warning: No sample fingerprints found in the data file")
            return
        
        # Add each fingerprint to the database
        count = 0
        for fingerprint in sample_fingerprints:
            location_id = fingerprint.get('location_id')
            rssi_data = fingerprint.get('rssi_data', [])
            
            if location_id and rssi_data:
                db.add_training_data(location_id, rssi_data)
                count += 1
        
        print(f"✅ Successfully loaded {count} sample fingerprint(s) into the database")
        
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON format in sample data file")
        print(f"Details: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"Error loading sample data: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    load_sample_data()

