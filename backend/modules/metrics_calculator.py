"""
Performance Metrics Calculator
Calculates Accuracy, Precision, Recall, F1-Score, and mAP
"""
import numpy as np
from collections import defaultdict
from datetime import datetime, timedelta
import sys
import os

# Add models to path for database access
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'models'))
from database import DatabaseManager

class MetricsCalculator:
    def __init__(self, db_manager=None):
        self.predictions = []  # List of predictions with ground truth
        self.confusion_matrix = defaultdict(lambda: defaultdict(int))
        self.class_counts = defaultdict(int)
        self.db_manager = db_manager or DatabaseManager()
        
        # Load existing predictions from database
        self._load_predictions_from_db()
    
    def _load_predictions_from_db(self):
        """Load predictions from database on initialization"""
        try:
            db_predictions = self.db_manager.get_metrics_predictions()
            for pred in db_predictions:
                self.predictions.append(pred)
                if pred['actual']:
                    self.confusion_matrix[pred['actual']][pred['predicted']] += 1
                    self.class_counts[pred['actual']] += 1
            print(f"Loaded {len(db_predictions)} predictions from database")
        except Exception as e:
            print(f"Warning: Could not load predictions from database: {e}")
        
    def add_prediction(self, predicted_location, actual_location=None, confidence=0.0):
        """
        Add a prediction for metrics calculation
        
        Args:
            predicted_location: Predicted location ID
            actual_location: Actual/ground truth location ID (optional)
            confidence: Prediction confidence score
        """
        # Store in database for persistence
        try:
            self.db_manager.add_metrics_prediction(predicted_location, actual_location, confidence)
        except Exception as e:
            print(f"Warning: Could not store prediction in database: {e}")
        
        # Add to in-memory list
        pred_data = {
            'predicted': predicted_location,
            'actual': actual_location,
            'confidence': confidence,
            'timestamp': datetime.now().isoformat()
        }
        self.predictions.append(pred_data)
        
        if actual_location:
            self.confusion_matrix[actual_location][predicted_location] += 1
            self.class_counts[actual_location] += 1
            print(f"Added ground truth: predicted={predicted_location}, actual={actual_location}, confidence={confidence:.2f}")
        else:
            print(f"Added prediction (no ground truth): predicted={predicted_location}, confidence={confidence:.2f}")
    
    def calculate_accuracy(self):
        """
        Calculate overall accuracy
        
        Accuracy = (TP + TN) / (TP + TN + FP + FN)
        """
        if not self.predictions:
            return 0.0
        
        correct = sum(1 for p in self.predictions 
                     if p['actual'] and p['predicted'] == p['actual'])
        total = sum(1 for p in self.predictions if p['actual'])
        
        return correct / total if total > 0 else 0.0
    
    def calculate_precision(self, location_id=None):
        """
        Calculate precision for a specific location or overall
        
        Precision = TP / (TP + FP)
        """
        if location_id:
            # Precision for specific location
            tp = self.confusion_matrix[location_id][location_id]
            fp = sum(self.confusion_matrix[other][location_id] 
                    for other in self.confusion_matrix if other != location_id)
            return tp / (tp + fp) if (tp + fp) > 0 else 0.0
        else:
            # Macro-averaged precision
            precisions = []
            for loc in self.class_counts:
                prec = self.calculate_precision(loc)
                if prec > 0:
                    precisions.append(prec)
            return np.mean(precisions) if precisions else 0.0
    
    def calculate_recall(self, location_id=None):
        """
        Calculate recall for a specific location or overall
        
        Recall = TP / (TP + FN)
        """
        if location_id:
            # Recall for specific location
            tp = self.confusion_matrix[location_id][location_id]
            fn = sum(self.confusion_matrix[location_id][other] 
                    for other in self.confusion_matrix if other != location_id)
            return tp / (tp + fn) if (tp + fn) > 0 else 0.0
        else:
            # Macro-averaged recall
            recalls = []
            for loc in self.class_counts:
                rec = self.calculate_recall(loc)
                if rec > 0:
                    recalls.append(rec)
            return np.mean(recalls) if recalls else 0.0
    
    def calculate_f1_score(self, location_id=None):
        """
        Calculate F1-Score for a specific location or overall
        
        F1 = 2 * (Precision * Recall) / (Precision + Recall)
        """
        if location_id:
            precision = self.calculate_precision(location_id)
            recall = self.calculate_recall(location_id)
            return 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0
        else:
            # Macro-averaged F1
            f1_scores = []
            for loc in self.class_counts:
                f1 = self.calculate_f1_score(loc)
                if f1 > 0:
                    f1_scores.append(f1)
            return np.mean(f1_scores) if f1_scores else 0.0
    
    def calculate_map(self, confidence_thresholds=[0.5, 0.6, 0.7, 0.8, 0.9]):
        """
        Calculate Mean Average Precision (mAP)
        
        mAP = Average of AP across all classes at different confidence thresholds
        """
        if not self.predictions or not any(p['actual'] for p in self.predictions):
            return 0.0
        
        aps = []
        
        for threshold in confidence_thresholds:
            # Filter predictions above confidence threshold
            filtered_preds = [p for p in self.predictions 
                            if p['confidence'] >= threshold and p['actual']]
            
            if not filtered_preds:
                continue
            
            # Calculate AP for each class
            class_aps = []
            for location_id in self.class_counts:
                # Get predictions for this class
                relevant = [p for p in filtered_preds if p['actual'] == location_id]
                if not relevant:
                    continue
                
                # Sort by confidence
                relevant.sort(key=lambda x: x['confidence'], reverse=True)
                
                # Calculate precision at each rank
                tp = 0
                precisions = []
                for i, pred in enumerate(relevant):
                    if pred['predicted'] == location_id:
                        tp += 1
                    precisions.append(tp / (i + 1))
                
                # Average precision for this class
                ap = np.mean(precisions) if precisions else 0.0
                class_aps.append(ap)
            
            # Mean AP at this threshold
            if class_aps:
                aps.append(np.mean(class_aps))
        
        # Mean of all APs across thresholds
        return np.mean(aps) if aps else 0.0
    
    def get_all_metrics(self):
        """Get all calculated metrics"""
        return {
            'accuracy': self.calculate_accuracy(),
            'precision': self.calculate_precision(),
            'recall': self.calculate_recall(),
            'f1_score': self.calculate_f1_score(),
            'map': self.calculate_map(),
            'total_predictions': len(self.predictions),
            'predictions_with_ground_truth': sum(1 for p in self.predictions if p['actual']),
            'classes': list(self.class_counts.keys()),
            'class_counts': dict(self.class_counts),
            'confusion_matrix': {k: dict(v) for k, v in self.confusion_matrix.items()}
        }
    
    def get_per_class_metrics(self):
        """Get metrics for each location class"""
        per_class = {}
        for location_id in self.class_counts:
            per_class[location_id] = {
                'precision': self.calculate_precision(location_id),
                'recall': self.calculate_recall(location_id),
                'f1_score': self.calculate_f1_score(location_id),
                'count': self.class_counts[location_id]
            }
        return per_class
    
    def reset(self):
        """Reset all metrics"""
        self.predictions = []
        self.confusion_matrix = defaultdict(lambda: defaultdict(int))
        self.class_counts = defaultdict(int)
    
    def get_recent_metrics(self, hours=24):
        """Get metrics for recent predictions only"""
        cutoff_time = datetime.now() - timedelta(hours=hours)
        recent_preds = [p for p in self.predictions 
                       if datetime.fromisoformat(p['timestamp']) >= cutoff_time]
        
        if not recent_preds:
            return None
        
        # Create temporary calculator with recent predictions
        temp_calc = MetricsCalculator()
        temp_calc.predictions = recent_preds
        for p in recent_preds:
            if p['actual']:
                temp_calc.confusion_matrix[p['actual']][p['predicted']] += 1
                temp_calc.class_counts[p['actual']] += 1
        
        return temp_calc.get_all_metrics()

