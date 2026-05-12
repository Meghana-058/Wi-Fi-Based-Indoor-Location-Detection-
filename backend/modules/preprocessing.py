import numpy as np
import pandas as pd
from typing import List, Dict, Any, Tuple
from sklearn.preprocessing import StandardScaler, MinMaxScaler
import json

class DataPreprocessor:
    def __init__(self):
        self.scaler = StandardScaler()
        self.min_max_scaler = MinMaxScaler()
        self.feature_names = []
        self.is_fitted = False
        self.max_features = 50  # Maximum number of features to consider
    
    def preprocess(self, wifi_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Preprocess Wi-Fi scan data for model input
        """
        if not wifi_data:
            return self._get_empty_preprocessed_data()
        
        # Extract features from Wi-Fi data
        features = self._extract_features(wifi_data)
        
        # Normalize features
        normalized_features = self._normalize_features(features)
        
        # Create fingerprint vector
        fingerprint_vector = self._create_fingerprint_vector(normalized_features)
        
        return {
            'fingerprint_vector': fingerprint_vector,
            'raw_features': features,
            'normalized_features': normalized_features,
            'network_count': len(wifi_data),
            'timestamp': wifi_data[0].get('timestamp', 0) if wifi_data else 0
        }
    
    def preprocess_single(self, wifi_data: List[Dict[str, Any]]) -> np.ndarray:
        """
        Preprocess single Wi-Fi scan for prediction
        """
        preprocessed = self.preprocess(wifi_data)
        return preprocessed['fingerprint_vector']
    
    def _extract_features(self, wifi_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Extract relevant features from Wi-Fi data"""
        features = {
            'rssi_values': [],
            'frequencies': [],
            'security_types': [],
            'network_count': len(wifi_data),
            'signal_stats': {},
            'frequency_stats': {},
            'security_stats': {}
        }
        
        if not wifi_data:
            return features
        
        # Extract RSSI values and other features
        rssi_values = []
        frequencies = []
        security_types = []
        
        for network in wifi_data:
            rssi_values.append(network.get('signal', -100))
            frequencies.append(network.get('frequency', 2400))
            security_types.append(network.get('security', 'Unknown'))
        
        features['rssi_values'] = rssi_values
        features['frequencies'] = frequencies
        features['security_types'] = security_types
        
        # Calculate signal statistics
        features['signal_stats'] = {
            'mean': float(np.mean(rssi_values)),
            'std': float(np.std(rssi_values)),
            'min': float(np.min(rssi_values)),
            'max': float(np.max(rssi_values)),
            'median': float(np.median(rssi_values)),
            'q25': float(np.percentile(rssi_values, 25)),
            'q75': float(np.percentile(rssi_values, 75))
        }
        
        # Calculate frequency statistics
        features['frequency_stats'] = {
            'mean': float(np.mean(frequencies)),
            'std': float(np.std(frequencies)),
            'band_2_4ghz': sum(1 for f in frequencies if f < 3000),
            'band_5ghz': sum(1 for f in frequencies if f >= 3000)
        }
        
        # Calculate security statistics
        security_counts = {}
        for sec_type in security_types:
            security_counts[sec_type] = security_counts.get(sec_type, 0) + 1
        features['security_stats'] = security_counts
        
        return features
    
    def _normalize_features(self, features: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize features for consistent scaling"""
        normalized = {}
        
        # Normalize RSSI values
        if features['rssi_values']:
            rssi_array = np.array(features['rssi_values']).reshape(-1, 1)
            # RSSI values are typically between -100 and 0 dBm
            normalized_rssi = (rssi_array + 100) / 100  # Scale to 0-1
            normalized['rssi_values'] = normalized_rssi.flatten().tolist()
        else:
            normalized['rssi_values'] = []
        
        # Normalize frequencies
        if features['frequencies']:
            freq_array = np.array(features['frequencies']).reshape(-1, 1)
            # Normalize frequencies to 0-1 range
            normalized_freq = (freq_array - 2400) / (6000 - 2400)  # Scale to 0-1
            normalized_freq = np.clip(normalized_freq, 0, 1)
            normalized['frequencies'] = normalized_freq.flatten().tolist()
        else:
            normalized['frequencies'] = []
        
        # Normalize signal statistics
        signal_stats = features['signal_stats']
        normalized['signal_stats'] = {
            'mean': (signal_stats['mean'] + 100) / 100,
            'std': signal_stats['std'] / 100,
            'min': (signal_stats['min'] + 100) / 100,
            'max': (signal_stats['max'] + 100) / 100,
            'median': (signal_stats['median'] + 100) / 100,
            'q25': (signal_stats['q25'] + 100) / 100,
            'q75': (signal_stats['q75'] + 100) / 100
        }
        
        # Normalize frequency statistics
        freq_stats = features['frequency_stats']
        normalized['frequency_stats'] = {
            'mean': (freq_stats['mean'] - 2400) / (6000 - 2400),
            'std': freq_stats['std'] / (6000 - 2400),
            'band_2_4ghz': freq_stats['band_2_4ghz'] / max(features['network_count'], 1),
            'band_5ghz': freq_stats['band_5ghz'] / max(features['network_count'], 1)
        }
        
        # Keep security stats as is (counts)
        normalized['security_stats'] = features['security_stats']
        normalized['network_count'] = features['network_count']
        
        return normalized
    
    def _create_fingerprint_vector(self, normalized_features: Dict[str, Any]) -> np.ndarray:
        """Create a fixed-length fingerprint vector"""
        vector_components = []
        
        # Add RSSI values (pad or truncate to fixed length)
        rssi_values = normalized_features['rssi_values']
        if len(rssi_values) > self.max_features:
            rssi_values = rssi_values[:self.max_features]
        else:
            rssi_values.extend([0] * (self.max_features - len(rssi_values)))
        vector_components.extend(rssi_values)
        
        # Add frequency values (pad or truncate to fixed length)
        freq_values = normalized_features['frequencies']
        if len(freq_values) > self.max_features:
            freq_values = freq_values[:self.max_features]
        else:
            freq_values.extend([0] * (self.max_features - len(freq_values)))
        vector_components.extend(freq_values)
        
        # Add signal statistics
        signal_stats = normalized_features['signal_stats']
        vector_components.extend([
            signal_stats['mean'],
            signal_stats['std'],
            signal_stats['min'],
            signal_stats['max'],
            signal_stats['median'],
            signal_stats['q25'],
            signal_stats['q75']
        ])
        
        # Add frequency statistics
        freq_stats = normalized_features['frequency_stats']
        vector_components.extend([
            freq_stats['mean'],
            freq_stats['std'],
            freq_stats['band_2_4ghz'],
            freq_stats['band_5ghz']
        ])
        
        # Add network count (normalized)
        vector_components.append(normalized_features['network_count'] / 20.0)  # Normalize to 0-1
        
        # Add security type features (one-hot encoding)
        security_stats = normalized_features['security_stats']
        security_types = ['Open', 'WPA', 'WPA-PSK', 'WPA2', 'WPA2-PSK', 'Unknown']
        for sec_type in security_types:
            count = security_stats.get(sec_type, 0)
            vector_components.append(count / max(normalized_features['network_count'], 1))
        
        return np.array(vector_components, dtype=np.float32).tolist()
    
    def calculate_signal_metrics(self, wifi_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Calculate signal quality metrics"""
        if not wifi_data:
            return {
                'overall_quality': 'Poor',
                'average_rssi': -100,
                'strongest_signal': -100,
                'network_count': 0,
                'quality_score': 0.0
            }
        
        rssi_values = [net.get('signal', -100) for net in wifi_data]
        avg_rssi = np.mean(rssi_values)
        strongest_signal = np.max(rssi_values)
        
        # Calculate quality score (0-1)
        quality_score = max(0, min(1, (avg_rssi + 100) / 100))
        
        # Determine overall quality
        if avg_rssi >= -50:
            overall_quality = 'Excellent'
        elif avg_rssi >= -60:
            overall_quality = 'Good'
        elif avg_rssi >= -70:
            overall_quality = 'Fair'
        else:
            overall_quality = 'Poor'
        
        return {
            'overall_quality': overall_quality,
            'average_rssi': float(avg_rssi),
            'strongest_signal': float(strongest_signal),
            'network_count': len(wifi_data),
            'quality_score': float(quality_score),
            'rssi_distribution': {
                'excellent': sum(1 for r in rssi_values if r >= -50),
                'good': sum(1 for r in rssi_values if -60 <= r < -50),
                'fair': sum(1 for r in rssi_values if -70 <= r < -60),
                'poor': sum(1 for r in rssi_values if r < -70)
            }
        }
    
    def _get_empty_preprocessed_data(self) -> Dict[str, Any]:
        """Return empty preprocessed data structure"""
        empty_vector = np.zeros(self.max_features * 2 + 7 + 4 + 1 + 6, dtype=np.float32)
        return {
            'fingerprint_vector': empty_vector,
            'raw_features': {
                'rssi_values': [],
                'frequencies': [],
                'security_types': [],
                'network_count': 0,
                'signal_stats': {},
                'frequency_stats': {},
                'security_stats': {}
            },
            'normalized_features': {},
            'network_count': 0,
            'timestamp': 0
        }
    
    def fit_scaler(self, training_data: List[Dict[str, Any]]):
        """Fit the scaler on training data"""
        if not training_data:
            return
        
        # Extract all fingerprint vectors
        vectors = []
        for data in training_data:
            preprocessed = self.preprocess(data.get('rssi_data', []))
            vectors.append(preprocessed['fingerprint_vector'])
        
        if vectors:
            vectors_array = np.array(vectors)
            self.scaler.fit(vectors_array)
            self.is_fitted = True
    
    def transform_features(self, fingerprint_vector: np.ndarray) -> np.ndarray:
        """Transform features using fitted scaler"""
        if not self.is_fitted:
            return fingerprint_vector
        
        return self.scaler.transform(fingerprint_vector.reshape(1, -1)).flatten()
