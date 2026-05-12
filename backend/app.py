from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import sqlite3
import json
import numpy as np
import pandas as pd
from datetime import datetime
import os
import sys

# Add modules to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'modules'))
sys.path.append(os.path.join(os.path.dirname(__file__), 'models'))

from wifi_scanner import WiFiScanner
from preprocessing import DataPreprocessor
from location_engine import LocationEngine
from database import DatabaseManager
from location_tracker import LocationTracker
from metrics_calculator import MetricsCalculator

# Try to import similarity model, but make it optional
try:
    from similarity_model import SimilarityModel
    SIMILARITY_MODEL_AVAILABLE = True
except ImportError as e:
    print(f"Warning: SimilarityModel not available: {e}")
    print("System will run with simulated predictions only.")
    SIMILARITY_MODEL_AVAILABLE = False
    SimilarityModel = None

app = Flask(__name__)
CORS(app)

# Initialize components
db_manager = DatabaseManager()
wifi_scanner = WiFiScanner()
preprocessor = DataPreprocessor()
location_engine = LocationEngine()
location_tracker = LocationTracker()
metrics_calculator = MetricsCalculator(db_manager=db_manager)

# Initialize similarity model only if available
if SIMILARITY_MODEL_AVAILABLE and SimilarityModel:
    try:
        similarity_model = SimilarityModel()
    except Exception as e:
        print(f"Warning: Could not initialize SimilarityModel: {e}")
        similarity_model = None
else:
    similarity_model = None

# Global variables
current_location = None
signal_quality = None
scan_history = []

@app.route('/')
def index():
    """Serve the main dashboard"""
    return render_template('index.html')

@app.route('/api/scan', methods=['GET'])
def scan_wifi():
    """Get current Wi-Fi scan data"""
    try:
        print("Starting Wi-Fi scan...")
        # Scan for Wi-Fi networks
        wifi_data = wifi_scanner.scan_networks()
        print(f"Found {len(wifi_data)} networks")
        
        # Store scan data (will be updated with location after prediction)
        scan_id = db_manager.store_scan(wifi_data)
        print(f"Stored scan with ID: {scan_id}")
        
        # Preprocess the data
        processed_data = preprocessor.preprocess(wifi_data)
        print("Data preprocessing completed")
        
        return jsonify({
            'success': True,
            'scan_id': scan_id,
            'networks': wifi_data,
            'processed_data': processed_data,
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        print(f"Error in Wi-Fi scan: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/predict', methods=['POST'])
def predict_location():
    """Predict location from RSSI data"""
    try:
        data = request.get_json()
        rssi_data = data.get('rssi_data', [])
        
        if not rssi_data:
            return jsonify({
                'success': False,
                'error': 'No RSSI data provided'
            }), 400
        
        # Preprocess the input data
        processed_input = preprocessor.preprocess_single(rssi_data)
        
        # Get prediction from location engine (pass both fingerprint and raw RSSI data)
        prediction = location_engine.predict_location(processed_input, rssi_data)
        
        # Update global state
        global current_location, signal_quality
        current_location = prediction['location']
        signal_quality = prediction['signal_quality']
        
        # Update location tracker (only if interval has passed)
        if location_tracker.should_update():
            tracking_info = location_tracker.update_location({
                'location': current_location,
                'coordinates': prediction.get('coordinates', {}),
                'confidence': prediction.get('confidence', 0)
            })
            
            # Add to metrics calculator (if we have ground truth, use it)
            # For now, we'll track predictions for future evaluation
            metrics_calculator.add_prediction(
                predicted_location=current_location,
                actual_location=None,  # Can be set if ground truth is available
                confidence=prediction.get('confidence', 0)
            )
        
        # Store scan in database with prediction
        try:
            scan_id = db_manager.store_scan(
                rssi_data, 
                location_id=current_location,
                signal_quality=signal_quality
            )
            print(f"Stored scan {scan_id} with location {current_location}")
        except Exception as e:
            print(f"Warning: Could not store scan: {e}")
        
        # Add to scan history (in-memory cache)
        scan_history.append({
            'timestamp': datetime.now().isoformat(),
            'location': current_location,
            'signal_quality': signal_quality,
            'rssi_data': rssi_data
        })
        
        return jsonify({
            'success': True,
            'prediction': prediction,
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/signal', methods=['GET'])
def get_signal_quality():
    """Get current signal quality information"""
    try:
        # Get latest scan data
        latest_scan = wifi_scanner.scan_networks()
        
        # Calculate signal quality metrics
        signal_metrics = preprocessor.calculate_signal_metrics(latest_scan)
        
        return jsonify({
            'success': True,
            'signal_quality': signal_metrics,
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/map', methods=['GET'])
def get_map_data():
    """Get floor map and heatmap data"""
    try:
        # Get reference points from database
        reference_points = db_manager.get_reference_points()
        
        # Generate heatmap data
        heatmap_data = location_engine.generate_heatmap_data(reference_points)
        
        return jsonify({
            'success': True,
            'reference_points': reference_points,
            'heatmap_data': heatmap_data,
            'current_location': current_location
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/history', methods=['GET'])
def get_scan_history():
    """Get scan history from database"""
    try:
        # Get scan history from database
        db_scans = db_manager.get_recent_scans(limit=50)
        
        # Format history for frontend
        history = []
        for scan in db_scans:
            signal_quality = scan.get('signal_quality', 'Unknown')
            # Handle signal_quality if it's a dict
            if isinstance(signal_quality, dict):
                signal_quality = signal_quality.get('overall_quality', 'Unknown')
            elif isinstance(signal_quality, str):
                try:
                    import json
                    signal_quality = json.loads(signal_quality)
                    if isinstance(signal_quality, dict):
                        signal_quality = signal_quality.get('overall_quality', 'Unknown')
                except:
                    pass
            
            history.append({
                'timestamp': scan.get('timestamp', ''),
                'location': scan.get('location_id', 'Unknown'),
                'signal_quality': signal_quality
            })
        
        return jsonify({
            'success': True,
            'history': history,
            'total_scans': len(history)
        })
    except Exception as e:
        print(f"Error getting scan history: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e),
            'history': []
        }), 500

@app.route('/api/train', methods=['POST'])
def train_model():
    """Train the model using real Wi-Fi fingerprint data"""
    try:
        data = request.get_json()
        training_data = data.get('training_data', [])
        
        if not training_data:
            # Use data from database
            training_data = db_manager.get_training_data()
        
        if not training_data:
            return jsonify({
                'success': False,
                'error': 'No training data available. Please add reference points first.'
            }), 400
        
        print(f"Training with {len(training_data)} samples")
        
        # Add reference points to location engine
        for sample in training_data:
            location_id = sample.get('location_id')
            rssi_data = sample.get('rssi_data', [])
            if location_id and rssi_data:
                # Parse JSON if needed
                if isinstance(rssi_data, str):
                    import json
                    rssi_data = json.loads(rssi_data)
                location_engine.add_reference_point(location_id, rssi_data)
        
        # Try to train the similarity model if available
        training_result = {}
        if similarity_model:
            try:
                training_result = similarity_model.train(training_data)
            except Exception as e:
                print(f"Model training failed (using fingerprint matching instead): {e}")
                training_result = {
                    'success': True,
                    'method': 'fingerprint_matching',
                    'reference_points': len(location_engine.reference_fingerprints),
                    'message': 'Using fingerprint-based matching (TensorFlow not available)'
                }
        else:
            training_result = {
                'success': True,
                'method': 'fingerprint_matching',
                'reference_points': len(location_engine.reference_fingerprints),
                'message': 'Using fingerprint-based matching'
            }
        
        return jsonify({
            'success': True,
            'training_result': training_result,
            'reference_points_count': len(location_engine.reference_fingerprints),
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        print(f"Error in train_model: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/add_reference', methods=['POST'])
def add_reference_point():
    """Add a new reference point for training using real Wi-Fi scan data"""
    try:
        data = request.get_json()
        location_id = data.get('location_id')
        rssi_data = data.get('rssi_data', [])
        
        if not location_id:
            return jsonify({
                'success': False,
                'error': 'location_id is required'
            }), 400
        
        if not rssi_data:
            # Try to get the most recent scan
            recent_scans = db_manager.get_recent_scans(limit=1)
            if recent_scans:
                import json
                rssi_data = json.loads(recent_scans[0].get('rssi_data', '[]'))
            else:
                return jsonify({
                    'success': False,
                    'error': 'No RSSI data provided and no recent scans available'
                }), 400
        
        print(f"Adding reference point for location: {location_id}")
        print(f"RSSI data: {len(rssi_data)} networks")
        
        # Store in database
        ref_id = db_manager.add_reference_point(location_id, rssi_data)
        
        # Add to location engine for immediate use
        location_engine.add_reference_point(location_id, rssi_data)
        
        # When adding a reference point, also add it as ground truth for metrics
        # Get a prediction for this location to use as ground truth
        try:
            processed_input = preprocessor.preprocess_single(rssi_data)
            prediction = location_engine.predict_location(processed_input, rssi_data)
            
            # Add to metrics calculator with ground truth
            metrics_calculator.add_prediction(
                predicted_location=prediction.get('location', location_id),
                actual_location=location_id,  # This is the ground truth
                confidence=prediction.get('confidence', 0.8)
            )
        except Exception as e:
            print(f"Warning: Could not add ground truth for metrics: {e}")
        
        return jsonify({
            'success': True,
            'reference_id': ref_id,
            'message': f'Reference point added successfully for {location_id}',
            'networks_count': len(rssi_data),
            'total_reference_points': len(location_engine.reference_fingerprints)
        })
    except Exception as e:
        print(f"Error adding reference point: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/status', methods=['GET'])
def get_system_status():
    """Get system status and health"""
    try:
        status = {
            'backend_running': True,
            'database_connected': db_manager.test_connection(),
            'model_loaded': similarity_model.is_loaded if similarity_model else False,
            'model_available': similarity_model is not None,
            'current_location': current_location,
            'signal_quality': signal_quality,
            'total_scans': len(scan_history),
            'timestamp': datetime.now().isoformat()
        }
        
        return jsonify({
            'success': True,
            'status': status
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/locations', methods=['GET'])
def get_locations():
    """Get all available locations with their display names"""
    try:
        locations = {}
        for location_id, coords in location_engine.location_coordinates.items():
            display_name = location_engine.get_location_display_name(location_id)
            locations[location_id] = {
                'display_name': display_name,
                'coordinates': coords
            }
        
        return jsonify({
            'success': True,
            'locations': locations
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/locations', methods=['POST'])
def update_location_names():
    """Update location display names"""
    try:
        data = request.get_json()
        location_names = data.get('location_names', {})
        
        # Update the location engine's display names
        location_engine.location_names.update(location_names)
        
        # Save to config file
        config_path = os.path.join('config', 'locations.json')
        os.makedirs('config', exist_ok=True)
        
        config = {
            'location_names': location_engine.location_names,
            'custom_locations': {}
        }
        
        with open(config_path, 'w') as f:
            json.dump(config, f, indent=2)
        
        return jsonify({
            'success': True,
            'message': 'Location names updated successfully'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/tracking', methods=['GET'])
def get_tracking_info():
    """Get real-time location tracking information"""
    try:
        tracking_info = location_tracker.get_tracking_info()
        return jsonify({
            'success': True,
            'tracking': tracking_info
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/tracking/destination', methods=['POST'])
def set_destination():
    """Set a destination location"""
    try:
        data = request.get_json()
        location_id = data.get('location_id')
        coordinates = data.get('coordinates')
        
        if not location_id:
            return jsonify({
                'success': False,
                'error': 'location_id is required'
            }), 400
        
        destination = location_tracker.set_destination(location_id, coordinates)
        return jsonify({
            'success': True,
            'destination': destination
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/tracking/destination', methods=['DELETE'])
def clear_destination():
    """Clear the destination"""
    try:
        location_tracker.clear_destination()
        return jsonify({
            'success': True,
            'message': 'Destination cleared'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/tracking/history', methods=['GET'])
def get_location_history():
    """Get location history"""
    try:
        limit = request.args.get('limit', 20, type=int)
        history = location_tracker.get_location_history(limit)
        return jsonify({
            'success': True,
            'history': history,
            'count': len(history)
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/metrics', methods=['GET'])
def get_metrics():
    """Get performance metrics"""
    try:
        # Reload predictions from database to ensure we have latest data
        try:
            metrics_calculator._load_predictions_from_db()
        except Exception as e:
            print(f"Warning: Could not reload predictions: {e}")
        
        metrics = metrics_calculator.get_all_metrics()
        per_class = metrics_calculator.get_per_class_metrics()
        
        print(f"Metrics request: total={metrics['total_predictions']}, with_ground_truth={metrics['predictions_with_ground_truth']}")
        
        return jsonify({
            'success': True,
            'metrics': metrics,
            'per_class': per_class
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/metrics/recent', methods=['GET'])
def get_recent_metrics():
    """Get metrics for recent predictions"""
    try:
        hours = request.args.get('hours', 24, type=int)
        metrics = metrics_calculator.get_recent_metrics(hours)
        
        if metrics:
            return jsonify({
                'success': True,
                'metrics': metrics,
                'hours': hours
            })
        else:
            return jsonify({
                'success': True,
                'metrics': None,
                'message': 'No recent predictions available'
            })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/metrics/ground_truth', methods=['POST'])
def add_ground_truth():
    """Add ground truth data for metrics calculation"""
    try:
        data = request.get_json()
        predicted_location = data.get('predicted_location')
        actual_location = data.get('actual_location')
        confidence = data.get('confidence', 0.0)
        
        if not predicted_location or not actual_location:
            return jsonify({
                'success': False,
                'error': 'predicted_location and actual_location are required'
            }), 400
        
        metrics_calculator.add_prediction(
            predicted_location=predicted_location,
            actual_location=actual_location,
            confidence=confidence
        )
        
        return jsonify({
            'success': True,
            'message': 'Ground truth added successfully'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    try:
        # Initialize database
        print("Initializing database...")
        db_manager.init_database()
        
        # Load or train initial model
        print("Loading model...")
        try:
            similarity_model.load_model()
            print("Model loaded successfully")
        except Exception as e:
            print(f"No pre-trained model found: {e}")
            print("Training new model...")
            training_data = db_manager.get_training_data()
            if training_data:
                similarity_model.train(training_data)
                print("Model trained successfully")
            else:
                print("No training data available")
        
        print("Starting Flask server on http://localhost:5001")
        # Start Flask app
        app.run(debug=True, host='0.0.0.0', port=5001)
        
    except Exception as e:
        print(f"Fatal error starting application: {e}")
        import traceback
        traceback.print_exc()
