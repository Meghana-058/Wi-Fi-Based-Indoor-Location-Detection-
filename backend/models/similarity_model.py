import numpy as np
import json
import os
from typing import List, Dict, Any, Tuple
from sklearn.metrics.pairwise import cosine_similarity, euclidean_distances

# Try to import TensorFlow, but make it optional
try:
    import tensorflow as tf
    from tensorflow import keras
    from tensorflow.keras import layers
    TENSORFLOW_AVAILABLE = True
except (ImportError, OSError, Exception) as e:
    # Catch all exceptions including ImportError, OSError (dlopen), etc.
    TENSORFLOW_AVAILABLE = False
    tf = None
    keras = None
    layers = None
    print(f"Warning: TensorFlow not available: {type(e).__name__}: {e}")
    print("SimilarityModel will run in simulation mode.")

class SimilarityModel:
    def __init__(self, input_dim=117, embedding_dim=64):
        """
        Initialize the Siamese Network for Wi-Fi fingerprinting
        input_dim: Dimension of input fingerprint vector
        embedding_dim: Dimension of embedding space
        """
        self.input_dim = input_dim
        self.embedding_dim = embedding_dim
        self.model = None
        self.is_loaded = False
        self.model_path = 'models/similarity_model.h5'
        self.reference_embeddings = {}
        self.location_labels = {}
        self.tensorflow_available = TENSORFLOW_AVAILABLE
        
        # Create model directory
        os.makedirs('models', exist_ok=True)
        
        # Initialize the model only if TensorFlow is available
        if self.tensorflow_available:
            try:
                self._build_model()
            except Exception as e:
                print(f"Warning: Could not build model: {e}")
                self.is_loaded = False
        else:
            print("TensorFlow not available - running in simulation mode")
            self.is_loaded = False
    
    def _build_model(self):
        """Build the Siamese network architecture"""
        # Input layer
        input_layer = layers.Input(shape=(self.input_dim,), name='input')
        
        # Feature extraction layers
        x = layers.Dense(256, activation='relu', name='dense1')(input_layer)
        x = layers.BatchNormalization(name='bn1')(x)
        x = layers.Dropout(0.3, name='dropout1')(x)
        
        x = layers.Dense(128, activation='relu', name='dense2')(x)
        x = layers.BatchNormalization(name='bn2')(x)
        x = layers.Dropout(0.3, name='dropout2')(x)
        
        x = layers.Dense(96, activation='relu', name='dense3')(x)
        x = layers.BatchNormalization(name='bn3')(x)
        x = layers.Dropout(0.2, name='dropout3')(x)
        
        # Embedding layer
        embedding = layers.Dense(self.embedding_dim, activation='linear', name='embedding')(x)
        
        # L2 normalization for cosine similarity
        embedding_normalized = layers.Lambda(lambda x: tf.nn.l2_normalize(x, axis=1), name='embedding_normalized')(embedding)
        
        # Create the model
        self.model = keras.Model(inputs=input_layer, outputs=embedding_normalized, name='siamese_network')
        
        # Compile the model
        self.model.compile(
            optimizer=keras.optimizers.Adam(learning_rate=0.001),
            loss=self._contrastive_loss,
            metrics=['accuracy']
        )
    
    def _contrastive_loss(self, y_true, y_pred):
        """
        Contrastive loss function for Siamese network
        """
        margin = 1.0
        
        # Split the predictions into anchor and positive/negative
        anchor = y_pred[:, :self.embedding_dim//2]
        positive_negative = y_pred[:, self.embedding_dim//2:]
        
        # Calculate distances
        distance = tf.reduce_sum(tf.square(anchor - positive_negative), axis=1)
        
        # Contrastive loss
        loss = tf.reduce_mean(
            y_true * tf.square(distance) +
            (1 - y_true) * tf.square(tf.maximum(margin - distance, 0))
        )
        
        return loss
    
    def train(self, training_data: List[Dict[str, Any]], epochs=100, batch_size=32):
        """
        Train the similarity model
        """
        if not training_data:
            print("No training data provided")
            return {'success': False, 'error': 'No training data'}
        
        try:
            # Prepare training data
            X_train, y_train = self._prepare_training_data(training_data)
            
            if len(X_train) == 0:
                return {'success': False, 'error': 'No valid training samples'}
            
            # Create pairs for Siamese training
            pairs, labels = self._create_siamese_pairs(X_train, y_train)
            
            if len(pairs) == 0:
                return {'success': False, 'error': 'No valid pairs created'}
            
            # Train the model
            history = self.model.fit(
                pairs,
                labels,
                epochs=epochs,
                batch_size=batch_size,
                validation_split=0.2,
                verbose=1
            )
            
            # Generate embeddings for reference points
            self._generate_reference_embeddings(X_train, y_train)
            
            # Save the model
            self.save_model()
            
            self.is_loaded = True
            
            return {
                'success': True,
                'epochs': epochs,
                'final_loss': history.history['loss'][-1],
                'final_accuracy': history.history['accuracy'][-1],
                'training_samples': len(X_train),
                'reference_points': len(self.reference_embeddings)
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def _prepare_training_data(self, training_data: List[Dict[str, Any]]) -> Tuple[np.ndarray, np.ndarray]:
        """Prepare training data from raw format"""
        X_train = []
        y_train = []
        
        for data in training_data:
            rssi_data = data.get('rssi_data', [])
            location_id = data.get('location_id', 'unknown')
            
            if rssi_data:
                # Convert to fingerprint vector (simplified for demo)
                fingerprint = self._rssi_to_fingerprint(rssi_data)
                X_train.append(fingerprint)
                y_train.append(location_id)
        
        return np.array(X_train), np.array(y_train)
    
    def _rssi_to_fingerprint(self, rssi_data: List[Dict[str, Any]]) -> np.ndarray:
        """Convert RSSI data to fingerprint vector"""
        # Create a fixed-size fingerprint vector
        fingerprint = np.zeros(self.input_dim)
        
        if not rssi_data:
            return fingerprint
        
        # Extract RSSI values
        rssi_values = [net.get('signal', -100) for net in rssi_data]
        
        # Normalize RSSI values
        rssi_values = [(r + 100) / 100 for r in rssi_values]  # Scale to 0-1
        
        # Fill fingerprint vector
        for i, rssi in enumerate(rssi_values[:self.input_dim]):
            fingerprint[i] = rssi
        
        # Add statistical features
        if len(rssi_values) > 0:
            fingerprint[self.input_dim-10] = np.mean(rssi_values)
            fingerprint[self.input_dim-9] = np.std(rssi_values)
            fingerprint[self.input_dim-8] = np.min(rssi_values)
            fingerprint[self.input_dim-7] = np.max(rssi_values)
            fingerprint[self.input_dim-6] = len(rssi_values) / 20.0  # Normalize count
        
        return fingerprint
    
    def _create_siamese_pairs(self, X_train: np.ndarray, y_train: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """Create positive and negative pairs for Siamese training"""
        pairs = []
        labels = []
        
        # Get unique locations
        unique_locations = np.unique(y_train)
        
        for i, location in enumerate(unique_locations):
            # Get indices for this location
            location_indices = np.where(y_train == location)[0]
            
            # Create positive pairs (same location)
            for j in range(len(location_indices)):
                for k in range(j + 1, len(location_indices)):
                    idx1, idx2 = location_indices[j], location_indices[k]
                    pair = np.concatenate([X_train[idx1], X_train[idx2]])
                    pairs.append(pair)
                    labels.append(1)  # Positive pair
            
            # Create negative pairs (different locations)
            other_indices = np.where(y_train != location)[0]
            for j in range(min(len(location_indices), len(other_indices))):
                idx1 = location_indices[j]
                idx2 = other_indices[j % len(other_indices)]
                pair = np.concatenate([X_train[idx1], X_train[idx2]])
                pairs.append(pair)
                labels.append(0)  # Negative pair
        
        return np.array(pairs), np.array(labels)
    
    def _generate_reference_embeddings(self, X_train: np.ndarray, y_train: np.ndarray):
        """Generate embeddings for reference points"""
        self.reference_embeddings = {}
        self.location_labels = {}
        
        # Get unique locations
        unique_locations = np.unique(y_train)
        
        for location in unique_locations:
            # Get all samples for this location
            location_indices = np.where(y_train == location)[0]
            location_samples = X_train[location_indices]
            
            # Generate embeddings for all samples
            embeddings = self.model.predict(location_samples)
            
            # Average the embeddings for this location
            avg_embedding = np.mean(embeddings, axis=0)
            
            self.reference_embeddings[location] = avg_embedding
            self.location_labels[location] = location
    
    def predict_location(self, fingerprint: np.ndarray) -> Dict[str, Any]:
        """Predict location from fingerprint"""
        if not self.is_loaded or not self.reference_embeddings:
            return {
                'location': 'Unknown',
                'confidence': 0.0,
                'similarity_scores': {},
                'error': 'Model not loaded or no reference points'
            }
        
        try:
            # Generate embedding for input fingerprint
            input_embedding = self.model.predict(fingerprint.reshape(1, -1))[0]
            
            # Calculate similarities with reference points
            similarities = {}
            for location, ref_embedding in self.reference_embeddings.items():
                # Cosine similarity
                similarity = cosine_similarity([input_embedding], [ref_embedding])[0][0]
                similarities[location] = float(similarity)
            
            # Find best match
            best_location = max(similarities, key=similarities.get)
            confidence = similarities[best_location]
            
            return {
                'location': best_location,
                'confidence': confidence,
                'similarity_scores': similarities,
                'embedding': input_embedding.tolist()
            }
            
        except Exception as e:
            return {
                'location': 'Unknown',
                'confidence': 0.0,
                'similarity_scores': {},
                'error': str(e)
            }
    
    def save_model(self):
        """Save the trained model"""
        try:
            self.model.save(self.model_path)
            
            # Save reference embeddings
            embeddings_data = {
                'reference_embeddings': {k: v.tolist() for k, v in self.reference_embeddings.items()},
                'location_labels': self.location_labels,
                'input_dim': self.input_dim,
                'embedding_dim': self.embedding_dim
            }
            
            with open('models/reference_embeddings.json', 'w') as f:
                json.dump(embeddings_data, f)
            
            return True
        except Exception as e:
            print(f"Error saving model: {e}")
            return False
    
    def load_model(self):
        """Load the trained model"""
        try:
            if os.path.exists(self.model_path):
                self.model = keras.models.load_model(self.model_path, custom_objects={
                    '_contrastive_loss': self._contrastive_loss
                })
                
                # Load reference embeddings
                if os.path.exists('models/reference_embeddings.json'):
                    with open('models/reference_embeddings.json', 'r') as f:
                        embeddings_data = json.load(f)
                    
                    self.reference_embeddings = {
                        k: np.array(v) for k, v in embeddings_data['reference_embeddings'].items()
                    }
                    self.location_labels = embeddings_data['location_labels']
                
                self.is_loaded = True
                return True
            else:
                print("No saved model found")
                return False
        except Exception as e:
            print(f"Error loading model: {e}")
            return False
    
    def add_reference_point(self, location_id: str, fingerprint: np.ndarray):
        """Add a new reference point"""
        if not self.is_loaded:
            return False
        
        try:
            # Generate embedding for new reference point
            embedding = self.model.predict(fingerprint.reshape(1, -1))[0]
            
            # Add to reference embeddings
            self.reference_embeddings[location_id] = embedding
            self.location_labels[location_id] = location_id
            
            # Save updated embeddings
            embeddings_data = {
                'reference_embeddings': {k: v.tolist() for k, v in self.reference_embeddings.items()},
                'location_labels': self.location_labels,
                'input_dim': self.input_dim,
                'embedding_dim': self.embedding_dim
            }
            
            with open('models/reference_embeddings.json', 'w') as f:
                json.dump(embeddings_data, f)
            
            return True
        except Exception as e:
            print(f"Error adding reference point: {e}")
            return False
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get model information"""
        return {
            'is_loaded': self.is_loaded,
            'input_dim': self.input_dim,
            'embedding_dim': self.embedding_dim,
            'reference_points': len(self.reference_embeddings),
            'model_path': self.model_path,
            'locations': list(self.location_labels.keys())
        }
