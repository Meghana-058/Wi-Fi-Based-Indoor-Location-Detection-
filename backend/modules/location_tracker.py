"""
Location Tracking Module
Tracks user movement, direction, destination, and stable locations
"""
import json
import math
from datetime import datetime, timedelta
from collections import deque

class LocationTracker:
    def __init__(self):
        self.location_history = deque(maxlen=100)  # Store last 100 locations
        self.current_location = None
        self.previous_location = None
        self.destination = None
        self.stable_location = None
        self.stable_location_start_time = None
        self.stable_location_threshold = 120  # 2 minutes in seconds
        self.movement_threshold = 5.0  # 5 meters movement threshold
        self.update_interval = 90  # 90 seconds (1.5 minutes)
        self.last_update_time = None
        
    def update_location(self, location_data):
        """
        Update current location and track movement
        
        Args:
            location_data: Dict with 'location', 'coordinates' (x, y), 'confidence'
        """
        timestamp = datetime.now()
        
        # Store previous location
        if self.current_location:
            self.previous_location = {
                'location': self.current_location['location'],
                'coordinates': self.current_location.get('coordinates', {}),
                'timestamp': self.current_location.get('timestamp')
            }
        
        # Update current location
        self.current_location = {
            'location': location_data.get('location'),
            'coordinates': location_data.get('coordinates', {}),
            'confidence': location_data.get('confidence', 0),
            'timestamp': timestamp.isoformat()
        }
        
        # Add to history
        self.location_history.append({
            'location': location_data.get('location'),
            'coordinates': location_data.get('coordinates', {}),
            'confidence': location_data.get('confidence', 0),
            'timestamp': timestamp.isoformat()
        })
        
        self.last_update_time = timestamp
        
        return self.get_tracking_info()
    
    def set_destination(self, location_id, coordinates=None):
        """Set a destination location"""
        self.destination = {
            'location': location_id,
            'coordinates': coordinates or {},
            'set_at': datetime.now().isoformat()
        }
        return self.destination
    
    def clear_destination(self):
        """Clear the destination"""
        self.destination = None
    
    def get_movement_direction(self):
        """
        Calculate movement direction based on location history
        
        Returns:
            dict with 'direction' (degrees), 'distance' (meters), 'speed' (m/s)
        """
        if len(self.location_history) < 2:
            return {
                'direction': None,
                'distance': 0,
                'speed': 0,
                'moving': False
            }
        
        # Get last two locations
        current = self.location_history[-1]
        previous = self.location_history[-2]
        
        curr_coords = current.get('coordinates', {})
        prev_coords = previous.get('coordinates', {})
        
        if not curr_coords or not prev_coords:
            return {
                'direction': None,
                'distance': 0,
                'speed': 0,
                'moving': False
            }
        
        # Calculate distance
        dx = curr_coords.get('x', 0) - prev_coords.get('x', 0)
        dy = curr_coords.get('y', 0) - prev_coords.get('y', 0)
        distance = math.sqrt(dx**2 + dy**2)
        
        # Calculate direction (0-360 degrees, 0 = North)
        if distance > 0.1:  # Only calculate if moved significantly
            direction = math.degrees(math.atan2(dx, dy))
            if direction < 0:
                direction += 360
            
            # Calculate time difference
            curr_time = datetime.fromisoformat(current['timestamp'])
            prev_time = datetime.fromisoformat(previous['timestamp'])
            time_diff = (curr_time - prev_time).total_seconds()
            
            speed = distance / time_diff if time_diff > 0 else 0
            
            return {
                'direction': direction,
                'distance': distance,
                'speed': speed,
                'moving': distance > self.movement_threshold
            }
        else:
            return {
                'direction': None,
                'distance': 0,
                'speed': 0,
                'moving': False
            }
    
    def check_destination_reached(self):
        """
        Check if destination has been reached
        
        Returns:
            dict with 'reached': bool, 'distance': float, 'message': str
        """
        if not self.destination or not self.current_location:
            return {
                'reached': False,
                'distance': None,
                'message': None
            }
        
        dest_coords = self.destination.get('coordinates', {})
        curr_coords = self.current_location.get('coordinates', {})
        
        if not dest_coords or not curr_coords:
            return {
                'reached': False,
                'distance': None,
                'message': None
            }
        
        # Calculate distance to destination
        dx = curr_coords.get('x', 0) - dest_coords.get('x', 0)
        dy = curr_coords.get('y', 0) - dest_coords.get('y', 0)
        distance = math.sqrt(dx**2 + dy**2)
        
        # Consider reached if within 3 meters
        reached = distance <= 3.0
        
        if reached:
            message = f"Location Reached: {self.destination.get('location', 'Destination')}"
        else:
            message = f"Distance to destination: {distance:.1f}m"
        
        return {
            'reached': reached,
            'distance': distance,
            'message': message,
            'destination': self.destination.get('location')
        }
    
    def check_stable_location(self):
        """
        Check if user has been at the same location for a threshold period
        
        Returns:
            dict with 'stable': bool, 'location': str, 'duration': seconds
        """
        if not self.current_location or len(self.location_history) < 2:
            return {
                'stable': False,
                'location': None,
                'duration': 0
            }
        
        current = self.location_history[-1]
        current_coords = current.get('coordinates', {})
        current_location = current.get('location')
        
        # Check if location has been stable
        stable_count = 0
        for loc in reversed(list(self.location_history)[-10:]):  # Check last 10 locations
            loc_coords = loc.get('coordinates', {})
            if loc_coords and current_coords:
                dx = abs(loc_coords.get('x', 0) - current_coords.get('x', 0))
                dy = abs(loc_coords.get('y', 0) - current_coords.get('y', 0))
                distance = math.sqrt(dx**2 + dy**2)
                
                if distance <= self.movement_threshold and loc.get('location') == current_location:
                    stable_count += 1
        
        # Calculate duration
        if len(self.location_history) >= 2:
            first_stable = self.location_history[-min(stable_count, len(self.location_history))]
            first_time = datetime.fromisoformat(first_stable['timestamp'])
            current_time = datetime.fromisoformat(current['timestamp'])
            duration = (current_time - first_time).total_seconds()
        else:
            duration = 0
        
        is_stable = duration >= self.stable_location_threshold
        
        if is_stable:
            self.stable_location = current_location
            self.stable_location_start_time = first_time if len(self.location_history) >= 2 else datetime.now()
        
        return {
            'stable': is_stable,
            'location': current_location if is_stable else None,
            'duration': duration,
            'is_best_location': is_stable  # Stable location is considered best
        }
    
    def get_tracking_info(self):
        """Get comprehensive tracking information"""
        movement = self.get_movement_direction()
        destination_status = self.check_destination_reached()
        stable_status = self.check_stable_location()
        
        return {
            'current_location': self.current_location,
            'previous_location': self.previous_location,
            'destination': self.destination,
            'movement': movement,
            'destination_status': destination_status,
            'stable_location': stable_status,
            'location_history_count': len(self.location_history),
            'last_update': self.last_update_time.isoformat() if self.last_update_time else None,
            'update_interval': self.update_interval
        }
    
    def get_location_history(self, limit=20):
        """Get recent location history"""
        return list(self.location_history)[-limit:]
    
    def should_update(self):
        """Check if location should be updated based on interval"""
        if not self.last_update_time:
            return True
        
        time_since_update = (datetime.now() - self.last_update_time).total_seconds()
        return time_since_update >= self.update_interval

