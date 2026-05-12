import sqlite3
import json
import numpy as np
from datetime import datetime
import os

class DatabaseManager:
    def __init__(self, db_path='wifi_fingerprinting.db'):
        self.db_path = db_path
        self.init_database()
    
    def init_database(self):
        """Initialize the SQLite database with required tables"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Create scans table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS scans (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                rssi_data TEXT,
                location_id TEXT,
                signal_quality TEXT,
                processed_data TEXT
            )
        ''')
        
        # Create reference_points table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS reference_points (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                location_id TEXT NOT NULL,
                rssi_data TEXT NOT NULL,
                embedding TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Create training_data table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS training_data (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                location_id TEXT NOT NULL,
                rssi_data TEXT NOT NULL,
                label TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Create model_metadata table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS model_metadata (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                model_name TEXT NOT NULL,
                accuracy REAL,
                training_date DATETIME,
                parameters TEXT,
                model_path TEXT
            )
        ''')
        
        # Create metrics_predictions table for persistent metrics storage
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS metrics_predictions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                predicted_location TEXT NOT NULL,
                actual_location TEXT,
                confidence REAL DEFAULT 0.0,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        conn.commit()
        conn.close()
    
    def test_connection(self):
        """Test database connection"""
        try:
            conn = sqlite3.connect(self.db_path)
            conn.close()
            return True
        except:
            return False
    
    def store_scan(self, wifi_data, location_id=None, signal_quality=None):
        """Store Wi-Fi scan data"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        rssi_json = json.dumps(wifi_data)
        signal_quality_json = json.dumps(signal_quality) if signal_quality else None
        
        cursor.execute('''
            INSERT INTO scans (rssi_data, timestamp, location_id, signal_quality)
            VALUES (?, ?, ?, ?)
        ''', (rssi_json, datetime.now(), location_id, signal_quality_json))
        
        scan_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return scan_id
    
    def update_scan_with_prediction(self, scan_id, location_id, signal_quality):
        """Update scan with location prediction"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        signal_quality_json = json.dumps(signal_quality) if signal_quality else None
        
        cursor.execute('''
            UPDATE scans 
            SET location_id = ?, signal_quality = ?
            WHERE id = ?
        ''', (location_id, signal_quality_json, scan_id))
        
        conn.commit()
        conn.close()
    
    def get_scan_history(self, limit=50):
        """Get scan history from database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, timestamp, location_id, signal_quality
            FROM scans
            ORDER BY timestamp DESC
            LIMIT ?
        ''', (limit,))
        
        scans = []
        for row in cursor.fetchall():
            signal_quality = None
            if row[3]:
                try:
                    signal_quality = json.loads(row[3])
                except:
                    signal_quality = row[3]
            
            scans.append({
                'id': row[0],
                'timestamp': row[1],
                'location_id': row[2] or 'Unknown',
                'signal_quality': signal_quality
            })
        
        conn.close()
        return scans
    
    def add_reference_point(self, location_id, rssi_data):
        """Add a new reference point"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        rssi_json = json.dumps(rssi_data)
        
        cursor.execute('''
            INSERT INTO reference_points (location_id, rssi_data)
            VALUES (?, ?)
        ''', (location_id, rssi_json))
        
        ref_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return ref_id
    
    def add_metrics_prediction(self, predicted_location, actual_location=None, confidence=0.0):
        """Add a prediction for metrics calculation"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO metrics_predictions (predicted_location, actual_location, confidence)
            VALUES (?, ?, ?)
        ''', (predicted_location, actual_location, confidence))
        
        pred_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return pred_id
    
    def get_metrics_predictions(self, limit=None):
        """Get all metrics predictions"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        query = 'SELECT predicted_location, actual_location, confidence, timestamp FROM metrics_predictions ORDER BY timestamp DESC'
        if limit:
            query += f' LIMIT {limit}'
        
        cursor.execute(query)
        
        predictions = []
        for row in cursor.fetchall():
            predictions.append({
                'predicted': row[0],
                'actual': row[1],
                'confidence': row[2],
                'timestamp': row[3]
            })
        
        conn.close()
        return predictions
    
    def get_reference_points(self):
        """Get all reference points"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, location_id, rssi_data, embedding, created_at
            FROM reference_points
            ORDER BY created_at DESC
        ''')
        
        points = []
        for row in cursor.fetchall():
            points.append({
                'id': row[0],
                'location_id': row[1],
                'rssi_data': json.loads(row[2]),
                'embedding': json.loads(row[3]) if row[3] else None,
                'created_at': row[4]
            })
        
        conn.close()
        return points
    
    def get_training_data(self):
        """Get training data for model training (from both training_data and reference_points tables)"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        training_data = []
        
        # Get from training_data table
        cursor.execute('''
            SELECT location_id, rssi_data, label
            FROM training_data
            ORDER BY created_at DESC
        ''')
        
        for row in cursor.fetchall():
            try:
                rssi_data = json.loads(row[1]) if isinstance(row[1], str) else row[1]
                training_data.append({
                    'location_id': row[0],
                    'rssi_data': rssi_data,
                    'label': row[2]
                })
            except:
                pass
        
        # Also get from reference_points table (preferred for training)
        cursor.execute('''
            SELECT location_id, rssi_data
            FROM reference_points
            ORDER BY created_at DESC
        ''')
        
        for row in cursor.fetchall():
            try:
                rssi_data = json.loads(row[1]) if isinstance(row[1], str) else row[1]
                training_data.append({
                    'location_id': row[0],
                    'rssi_data': rssi_data,
                    'label': None
                })
            except:
                pass
        
        conn.close()
        return training_data
    
    def add_training_data(self, location_id, rssi_data, label=None):
        """Add training data"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        rssi_json = json.dumps(rssi_data)
        
        cursor.execute('''
            INSERT INTO training_data (location_id, rssi_data, label)
            VALUES (?, ?, ?)
        ''', (location_id, rssi_json, label))
        
        conn.commit()
        conn.close()
    
    def update_scan_location(self, scan_id, location_id, signal_quality):
        """Update scan with predicted location"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            UPDATE scans 
            SET location_id = ?, signal_quality = ?
            WHERE id = ?
        ''', (location_id, signal_quality, scan_id))
        
        conn.commit()
        conn.close()
    
    def get_recent_scans(self, limit=50):
        """Get recent scans"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, timestamp, rssi_data, location_id, signal_quality
            FROM scans
            ORDER BY timestamp DESC
            LIMIT ?
        ''', (limit,))
        
        scans = []
        for row in cursor.fetchall():
            scans.append({
                'id': row[0],
                'timestamp': row[1],
                'rssi_data': json.loads(row[2]),
                'location_id': row[3],
                'signal_quality': row[4]
            })
        
        conn.close()
        return scans
    
    def save_model_metadata(self, model_name, accuracy, parameters, model_path):
        """Save model metadata"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO model_metadata (model_name, accuracy, training_date, parameters, model_path)
            VALUES (?, ?, ?, ?, ?)
        ''', (model_name, accuracy, datetime.now(), json.dumps(parameters), model_path))
        
        conn.commit()
        conn.close()
    
    def get_latest_model_metadata(self):
        """Get latest model metadata"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT model_name, accuracy, training_date, parameters, model_path
            FROM model_metadata
            ORDER BY training_date DESC
            LIMIT 1
        ''')
        
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return {
                'model_name': row[0],
                'accuracy': row[1],
                'training_date': row[2],
                'parameters': json.loads(row[3]),
                'model_path': row[4]
            }
        return None
