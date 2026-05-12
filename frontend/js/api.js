// API Module for Wi-Fi Fingerprinting Dashboard
class WiFiAPI {
    constructor(baseURL = 'http://localhost:5001') {
        this.baseURL = baseURL;
        this.isConnected = false;
        this.retryCount = 0;
        this.maxRetries = 3;
    }

    async checkConnection() {
        try {
            const response = await fetch(`${this.baseURL}/api/status`);
            const data = await response.json();
            this.isConnected = data.success;
            return this.isConnected;
        } catch (error) {
            console.error('Connection check failed:', error);
            this.isConnected = false;
            return false;
        }
    }

    async scanWiFi() {
        try {
            console.log('Starting Wi-Fi scan...');
            const response = await fetch(`${this.baseURL}/api/scan`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Scan response:', data);
            
            if (!data.success) {
                throw new Error(data.error || 'Scan failed');
            }
            
            if (!data.networks || data.networks.length === 0) {
                console.warn('No networks found in scan response');
                return {
                    success: true,
                    networks: [],
                    message: 'No networks detected'
                };
            }
            
            console.log(`Scan successful: Found ${data.networks.length} networks`);
            return data;
        } catch (error) {
            console.error('WiFi scan failed:', error);
            throw error;
        }
    }

    async predictLocation(rssiData) {
        try {
            const response = await fetch(`${this.baseURL}/api/predict`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ rssi_data: rssiData })
            });
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Prediction failed');
            }
            
            return data;
        } catch (error) {
            console.error('Location prediction failed:', error);
            throw error;
        }
    }

    async getSignalQuality() {
        try {
            const response = await fetch(`${this.baseURL}/api/signal`);
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Signal quality check failed');
            }
            
            return data;
        } catch (error) {
            console.error('Signal quality check failed:', error);
            throw error;
        }
    }

    async getMapData() {
        try {
            const response = await fetch(`${this.baseURL}/api/map`);
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Map data fetch failed');
            }
            
            return data;
        } catch (error) {
            console.error('Map data fetch failed:', error);
            throw error;
        }
    }

    async getScanHistory() {
        try {
            const response = await fetch(`${this.baseURL}/api/history`);
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'History fetch failed');
            }
            
            return data;
        } catch (error) {
            console.error('Scan history fetch failed:', error);
            throw error;
        }
    }

    async trainModel(trainingData = null) {
        try {
            const response = await fetch(`${this.baseURL}/api/train`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ training_data: trainingData })
            });
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Model training failed');
            }
            
            return data;
        } catch (error) {
            console.error('Model training failed:', error);
            throw error;
        }
    }

    async addReferencePoint(locationId, rssiData = null) {
        try {
            console.log('Adding reference point:', locationId);
            
            // If no RSSI data provided, use current scan data
            if (!rssiData) {
                const scanData = await this.scanWiFi();
                rssiData = scanData.networks || [];
            }
            
            const response = await fetch(`${this.baseURL}/api/add_reference`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    location_id: locationId, 
                    rssi_data: rssiData 
                })
            });
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Reference point addition failed');
            }
            
            console.log('Reference point added:', data);
            return data;
        } catch (error) {
            console.error('Reference point addition failed:', error);
            throw error;
        }
    }

    async getSystemStatus() {
        try {
            const response = await fetch(`${this.baseURL}/api/status`);
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Status check failed');
            }
            
            return data;
        } catch (error) {
            console.error('System status check failed:', error);
            throw error;
        }
    }

    // Utility method to handle API errors with retry logic
    async withRetry(apiCall, ...args) {
        for (let i = 0; i < this.maxRetries; i++) {
            try {
                return await apiCall.apply(this, args);
            } catch (error) {
                if (i === this.maxRetries - 1) {
                    throw error;
                }
                
                // Wait before retry (exponential backoff)
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
            }
        }
    }

    // Method to start continuous scanning
    startContinuousScan(interval = 5000, callback) {
        this.scanInterval = setInterval(async () => {
            try {
                const scanData = await this.scanWiFi();
                const prediction = await this.predictLocation(scanData.networks);
                
                if (callback) {
                    callback({
                        scan: scanData,
                        prediction: prediction
                    });
                }
            } catch (error) {
                console.error('Continuous scan error:', error);
                if (callback) {
                    callback({ error: error.message });
                }
            }
        }, interval);
    }

    // Method to stop continuous scanning
    stopContinuousScan() {
        if (this.scanInterval) {
            clearInterval(this.scanInterval);
            this.scanInterval = null;
        }
    }

    // Location Tracking Methods
    async getTrackingInfo() {
        try {
            const response = await fetch(`${this.baseURL}/api/tracking`);
            return await response.json();
        } catch (error) {
            console.error('Failed to get tracking info:', error);
            return { success: false, error: error.message };
        }
    }

    async setDestination(locationId, coordinates) {
        try {
            const response = await fetch(`${this.baseURL}/api/tracking/destination`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ location_id: locationId, coordinates })
            });
            return await response.json();
        } catch (error) {
            console.error('Failed to set destination:', error);
            return { success: false, error: error.message };
        }
    }

    async clearDestination() {
        try {
            const response = await fetch(`${this.baseURL}/api/tracking/destination`, {
                method: 'DELETE'
            });
            return await response.json();
        } catch (error) {
            console.error('Failed to clear destination:', error);
            return { success: false, error: error.message };
        }
    }

    async getLocationHistory(limit = 20) {
        try {
            const response = await fetch(`${this.baseURL}/api/tracking/history?limit=${limit}`);
            return await response.json();
        } catch (error) {
            console.error('Failed to get location history:', error);
            return { success: false, error: error.message };
        }
    }

    // Metrics Methods
    async getMetrics() {
        try {
            const response = await fetch(`${this.baseURL}/api/metrics`);
            return await response.json();
        } catch (error) {
            console.error('Failed to get metrics:', error);
            return { success: false, error: error.message };
        }
    }

    async getRecentMetrics(hours = 24) {
        try {
            const response = await fetch(`${this.baseURL}/api/metrics/recent?hours=${hours}`);
            return await response.json();
        } catch (error) {
            console.error('Failed to get recent metrics:', error);
            return { success: false, error: error.message };
        }
    }

    async addGroundTruth(predictedLocation, actualLocation, confidence = 0.0) {
        try {
            const response = await fetch(`${this.baseURL}/api/metrics/ground_truth`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    predicted_location: predictedLocation,
                    actual_location: actualLocation,
                    confidence
                })
            });
            return await response.json();
        } catch (error) {
            console.error('Failed to add ground truth:', error);
            return { success: false, error: error.message };
        }
    }

    // Method to export data
    async exportData(format = 'json') {
        try {
            const history = await this.getScanHistory();
            const mapData = await this.getMapData();
            
            const exportData = {
                timestamp: new Date().toISOString(),
                history: history.history,
                mapData: mapData,
                format: format
            };
            
            if (format === 'json') {
                return JSON.stringify(exportData, null, 2);
            } else if (format === 'csv') {
                return this.convertToCSV(history.history);
            }
            
            return exportData;
        } catch (error) {
            console.error('Data export failed:', error);
            throw error;
        }
    }

    // Convert history data to CSV format
    convertToCSV(history) {
        if (!history || history.length === 0) {
            return 'timestamp,location,signal_quality,network_count\n';
        }
        
        const headers = ['timestamp', 'location', 'signal_quality', 'network_count'];
        const csvRows = [headers.join(',')];
        
        history.forEach(item => {
            const row = [
                item.timestamp,
                item.location || 'Unknown',
                item.signal_quality || 'Unknown',
                item.rssi_data ? item.rssi_data.length : 0
            ];
            csvRows.push(row.join(','));
        });
        
        return csvRows.join('\n');
    }

    // Method to download exported data
    downloadData(data, filename, type = 'application/json') {
        const blob = new Blob([data], { type });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}

// Create global API instance
window.wifiAPI = new WiFiAPI();
