// Main Application Logic for Wi-Fi Fingerprinting Dashboard
class WiFiApp {
    constructor() {
        this.isScanning = false;
        this.scanInterval = null;
        this.trackingInterval = null; // For 1-2 minute location updates
        this.scanInProgress = false; // Prevent duplicate scans
        this.currentData = null;
        this.scanCount = 0;
        this.destination = null;
        this.lastLocation = null;
        this.locationReachedNotified = false;
        this.init();
    }

    async init() {
        console.log('Initializing Wi-Fi Fingerprinting Dashboard...');
        
        // Initialize event listeners
        this.initEventListeners();
        
        // Check backend connection
        await this.checkConnection();
        
        // Load initial data
        await this.loadInitialData();
        
        console.log('Dashboard initialized successfully');
    }

    initEventListeners() {
        // Start scan button
        const startScanBtn = document.getElementById('startScanBtn');
        if (startScanBtn) {
            startScanBtn.addEventListener('click', () => this.toggleScanning());
        }

        // Settings button
        const settingsBtn = document.getElementById('settingsBtn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => this.showSettings());
        }

        const helpBtn = document.getElementById('helpBtn');
        if (helpBtn) {
            helpBtn.addEventListener('click', () => this.showHelp());
        }

        // Settings modal
        const settingsModal = document.getElementById('settingsModal');
        const closeSettingsModal = document.getElementById('closeSettingsModal');
        
        if (closeSettingsModal) {
            closeSettingsModal.addEventListener('click', () => this.hideSettings());
        }

        // Help modal
        const helpModal = document.getElementById('helpModal');
        const closeHelpModal = document.getElementById('closeHelpModal');
        if (closeHelpModal) {
            closeHelpModal.addEventListener('click', () => this.hideHelp());
        }
        if (helpModal) {
            helpModal.addEventListener('click', (e) => {
                if (e.target === helpModal) {
                    this.hideHelp();
                }
            });
        }

        // Connection modal - set up close button with multiple handlers
        const connectionModal = document.getElementById('connectionModal');
        const closeConnectionModal = document.getElementById('closeConnectionModal');
        
        if (closeConnectionModal) {
            // Use capture phase for better reliability
            closeConnectionModal.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Close button clicked from app.js');
                this.hideConnectionModal();
                return false;
            }, true);
            
            // Also add mousedown handler
            closeConnectionModal.addEventListener('mousedown', (e) => {
                e.preventDefault();
                e.stopPropagation();
            }, true);
            
            // Backup onclick handler
            closeConnectionModal.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Close button onclick from app.js');
                this.hideConnectionModal();
                return false;
            };
            
            // Make sure button is clickable
            closeConnectionModal.style.pointerEvents = 'auto';
            closeConnectionModal.style.cursor = 'pointer';
        }
        
        if (connectionModal) {
            // Close on background click
            connectionModal.addEventListener('click', (e) => {
                if (e.target === connectionModal) {
                    console.log('Background clicked, closing modal');
                    this.hideConnectionModal();
                }
            });
            
            // Close on ESC key
            const escKeyHandler = (e) => {
                if (e.key === 'Escape' && connectionModal.classList.contains('show')) {
                    console.log('ESC key pressed, closing modal');
                    this.hideConnectionModal();
                }
            };
            document.addEventListener('keydown', escKeyHandler);
            
            // Store handler for cleanup
            connectionModal._escKeyHandler = escKeyHandler;
        }

        if (settingsModal) {
            settingsModal.addEventListener('click', (e) => {
                if (e.target === settingsModal) {
                    this.hideSettings();
                }
            });
        }

        // Map controls
        const scanMapBtn = document.getElementById('scanMapBtn');
        const toggleHeatmapBtn = document.getElementById('toggleHeatmap');
        const toggleSignalsBtn = document.getElementById('toggleSignals');
        const refreshMapBtn = document.getElementById('refreshMap');
        
        if (scanMapBtn) {
            scanMapBtn.addEventListener('click', () => this.performScan());
        }
        
        if (toggleHeatmapBtn) {
            toggleHeatmapBtn.addEventListener('click', () => this.toggleHeatmap());
        }
        
        if (toggleSignalsBtn) {
            toggleSignalsBtn.addEventListener('click', () => this.toggleSignals());
        }
        
        if (refreshMapBtn) {
            refreshMapBtn.addEventListener('click', () => this.refreshMap());
        }

        // History controls
        const clearHistoryBtn = document.getElementById('clearHistory');
        const exportHistoryBtn = document.getElementById('exportHistory');
        
        if (clearHistoryBtn) {
            clearHistoryBtn.addEventListener('click', () => this.clearHistory());
        }
        
        if (exportHistoryBtn) {
            exportHistoryBtn.addEventListener('click', () => this.exportHistory());
        }

        // Training controls
        const addReferenceBtn = document.getElementById('addReferenceBtn');
        const trainModelBtn = document.getElementById('trainModelBtn');
        
        if (addReferenceBtn) {
            addReferenceBtn.addEventListener('click', () => this.addReferencePoint());
        }
        
        if (trainModelBtn) {
            trainModelBtn.addEventListener('click', () => this.trainModel());
        }

        // Settings controls
        const confidenceThreshold = document.getElementById('confidenceThreshold');
        const confidenceValue = document.getElementById('confidenceValue');
        
        if (confidenceThreshold && confidenceValue) {
            confidenceThreshold.addEventListener('input', (e) => {
                confidenceValue.textContent = e.target.value;
            });
        }

        const addReferencePointBtn = document.getElementById('addReferencePoint');
        if (addReferencePointBtn) {
            addReferencePointBtn.addEventListener('click', () => this.addReferencePoint());
        }

        const retrainModelBtn = document.getElementById('retrainModel');
        if (retrainModelBtn) {
            retrainModelBtn.addEventListener('click', () => this.retrainModel());
        }

        const resetModelBtn = document.getElementById('resetModel');
        if (resetModelBtn) {
            resetModelBtn.addEventListener('click', () => this.resetModel());
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 's':
                        e.preventDefault();
                        this.toggleScanning();
                        break;
                    case 'h':
                        e.preventDefault();
                        this.toggleHeatmap();
                        break;
                    case 'r':
                        e.preventDefault();
                        this.refreshMap();
                        break;
                }
            }
        });
    }

    async checkConnection() {
        try {
            this.showLoading('Checking connection...');
            console.log('Checking backend connection...');
            
            if (!window.wifiAPI) {
                console.error('wifiAPI is not defined. Make sure api.js is loaded first.');
                throw new Error('wifiAPI not available');
            }
            
            const isConnected = await window.window.wifiAPI.checkConnection();
            console.log('Connection result:', isConnected);
            
            if (isConnected) {
                this.updateSystemStatus('connected', 'Connected');
                if (window.wifiViz) {
                    window.wifiViz.showToast('Connected to backend successfully', 'success');
                }
                console.log('✅ Backend connection successful');
            } else {
                this.updateSystemStatus('error', 'Connection Failed');
                if (window.wifiViz) {
                    window.wifiViz.showToast('Failed to connect to backend', 'error');
                }
                console.log('❌ Backend connection failed');
            }
        } catch (error) {
            console.error('Connection check failed:', error);
            this.updateSystemStatus('error', 'Connection Error');
            if (window.wifiViz) {
                window.wifiViz.showToast('Connection error: ' + error.message, 'error');
            }
        } finally {
            this.hideLoading();
        }
    }

    async loadInitialData() {
        try {
            // Load map data
            const mapData = await window.wifiAPI.getMapData();
            if (mapData.success) {
                window.wifiViz.updateMapWithReferencePoints(mapData.reference_points);
            }

            // Load scan history
            const historyData = await window.wifiAPI.getScanHistory();
            if (historyData.success) {
                window.wifiViz.updateScanHistory(historyData.history);
                this.scanCount = historyData.total_scans;
                this.updateScanCount();
            }

            // Load system status
            const statusData = await window.wifiAPI.getSystemStatus();
            if (statusData.success) {
                this.updateSystemInfo(statusData.status);
            }

            // Load metrics
            await this.loadMetrics();
        } catch (error) {
            console.error('Failed to load initial data:', error);
            window.wifiViz.showToast('Failed to load initial data', 'error');
        }
    }

    async toggleScanning() {
        if (this.isScanning) {
            this.stopScanning();
        } else {
            await this.startScanning();
        }
    }

    async startScanning() {
        try {
            this.isScanning = true;
            this.updateScanButton(true);
            this.showLoading('Starting scan...');

            // Perform initial scan
            await this.performScan();

            // Start continuous scanning (every 10 seconds for network updates)
            this.scanInterval = setInterval(() => {
                if (!this.scanInProgress) {
                    this.performScan();
                }
            }, 10000); // Scan every 10 seconds for network updates

            // Start location tracking updates (every 90 seconds = 1.5 minutes)
            this.trackingInterval = setInterval(() => {
                this.updateLocationTracking();
            }, 90000); // Update location every 90 seconds (1.5 minutes)

            // Initial tracking update
            this.updateLocationTracking();

            window.wifiViz.showToast('Scanning started', 'success');
        } catch (error) {
            console.error('Failed to start scanning:', error);
            window.wifiViz.showToast('Failed to start scanning: ' + error.message, 'error');
            this.isScanning = false;
            this.updateScanButton(false);
        } finally {
            this.hideLoading();
        }
    }

    stopScanning() {
        this.isScanning = false;
        
        if (this.scanInterval) {
            clearInterval(this.scanInterval);
            this.scanInterval = null;
        }

        if (this.trackingInterval) {
            clearInterval(this.trackingInterval);
            this.trackingInterval = null;
        }

        this.updateScanButton(false);
        window.wifiViz.showToast('Scanning stopped', 'info');
    }

    async updateLocationTracking() {
        try {
            // Get tracking information
            const trackingData = await window.wifiAPI.getTrackingInfo();
            
            if (!trackingData.success || !trackingData.tracking) {
                return;
            }

            const tracking = trackingData.tracking;
            
            // Update movement visualization
            if (tracking.movement && tracking.movement.moving) {
                this.updateMovementDisplay(tracking.movement);
            }

            // Check destination status
            if (tracking.destination_status) {
                this.handleDestinationStatus(tracking.destination_status);
            }

            // Check stable location
            if (tracking.stable_location && tracking.stable_location.stable) {
                this.handleStableLocation(tracking.stable_location);
            }

            // Update location history display
            if (tracking.current_location) {
                this.lastLocation = tracking.current_location;
                if (window.wifiViz) {
                    window.wifiViz.updateLocationTracking(tracking);
                }
            }
        } catch (error) {
            console.error('Location tracking update failed:', error);
        }
    }

    updateMovementDisplay(movement) {
        if (!movement.moving) return;

        const direction = movement.direction;
        const distance = movement.distance;
        const speed = movement.speed;

        // Update direction indicator
        if (window.wifiViz) {
            window.wifiViz.updateMovementDirection(direction, distance, speed);
        }

        // Show movement notification
        if (distance > 5) { // Only notify for significant movement
            const directionText = this.getDirectionText(direction);
            window.wifiViz.showToast(
                `Moving ${directionText} (${distance.toFixed(1)}m)`,
                'info'
            );
        }
    }

    getDirectionText(degrees) {
        if (degrees === null || degrees === undefined) return 'Unknown';
        
        const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
        const index = Math.round(degrees / 45) % 8;
        return directions[index];
    }

    handleDestinationStatus(destinationStatus) {
        if (!destinationStatus) return;

        if (destinationStatus.reached && !this.locationReachedNotified) {
            // Show location reached notification
            this.showLocationReachedNotification(destinationStatus);
            this.locationReachedNotified = true;
        } else if (!destinationStatus.reached) {
            // Reset notification flag if moved away
            this.locationReachedNotified = false;
            
            // Update distance to destination
            if (window.wifiViz) {
                window.wifiViz.updateDestinationDistance(destinationStatus.distance);
            }
        }
    }

    showLocationReachedNotification(destinationStatus) {
        // Create popup notification
        const notification = document.createElement('div');
        notification.className = 'location-reached-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">✓</div>
                <div class="notification-text">
                    <h3>Location Reached!</h3>
                    <p>You have reached: ${destinationStatus.destination || 'Destination'}</p>
                </div>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);

        // Also show toast
        if (window.wifiViz) {
            window.wifiViz.showToast(
                `Location Reached: ${destinationStatus.destination || 'Destination'}`,
                'success'
            );
        }
    }

    handleStableLocation(stableStatus) {
        if (!stableStatus.stable) return;

        const location = stableStatus.location;
        const duration = stableStatus.duration;

        // Show stable location notification (only once per stable period)
        if (duration >= 120 && duration < 130) { // Show once when threshold is reached
            if (window.wifiViz) {
                window.wifiViz.showToast(
                    `Stable location detected: ${location} (${Math.floor(duration / 60)} min)`,
                    'info'
                );
            }
        }

        // Update UI to show stable/best location
        if (window.wifiViz) {
            window.wifiViz.updateStableLocation(location, duration);
        }
    }

    async setDestination(locationId, coordinates) {
        try {
            const result = await window.wifiAPI.setDestination(locationId, coordinates);
            if (result.success) {
                this.destination = result.destination;
                if (window.wifiViz) {
                    window.wifiViz.showDestination(this.destination);
                    window.wifiViz.showToast('Destination set successfully', 'success');
                }
            }
            return result;
        } catch (error) {
            console.error('Failed to set destination:', error);
            return { success: false, error: error.message };
        }
    }

    async clearDestination() {
        try {
            const result = await window.wifiAPI.clearDestination();
            if (result.success) {
                this.destination = null;
                this.locationReachedNotified = false;
                if (window.wifiViz) {
                    window.wifiViz.clearDestination();
                    window.wifiViz.showToast('Destination cleared', 'info');
                }
            }
            return result;
        } catch (error) {
            console.error('Failed to clear destination:', error);
            return { success: false, error: error.message };
        }
    }

    async performScan() {
        // Prevent multiple simultaneous scans
        if (this.isScanning && this.scanInProgress) {
            console.log('Scan already in progress, skipping...');
            return;
        }
        
        try {
            this.scanInProgress = true;
            
            // Only show loading if not in continuous scan mode
            if (!this.scanInterval) {
                this.showLoading('Scanning for Wi-Fi networks...');
            }
            
            // Perform Wi-Fi scan
            const scanData = await window.wifiAPI.scanWiFi();
            
            console.log('Scan data received:', scanData);
            
            if (!scanData || !scanData.success) {
                throw new Error(scanData?.error || 'Scan failed');
            }
            
            if (!scanData.networks || scanData.networks.length === 0) {
                if (window.wifiViz) {
                    window.wifiViz.showToast('No networks found. Make sure Wi-Fi is enabled.', 'warning');
                    window.wifiViz.updateNetworkList([]);
                }
                return;
            }
            
            console.log(`Found ${scanData.networks.length} networks`);
            
            // Update network list
            if (window.wifiViz) {
                window.wifiViz.updateNetworkList(scanData.networks);
            }
            
            // Predict location
            const prediction = await window.wifiAPI.predictLocation(scanData.networks);
            
            // Update UI with results
            this.updateLocationInfo(prediction.prediction);
            this.updateSignalInfo(scanData.networks);
            this.updateSimilarityScores(prediction.prediction.similarity_scores);
            
            // Update map with location and Wi-Fi signals
            if (window.wifiViz) {
                window.wifiViz.updateMap(prediction.prediction, scanData.networks);
            }
            
            // Store current prediction for potential ground truth addition
            this.lastPrediction = {
                predicted: prediction.prediction.location,
                confidence: prediction.prediction.confidence || 0,
                timestamp: new Date().toISOString()
            };
            
            // Update signal chart
            const signalMetrics = this.calculateSignalMetrics(scanData.networks);
            if (window.wifiViz) {
                window.wifiViz.updateSignalChart(signalMetrics);
            }
            
            // Update scan count
            this.scanCount++;
            this.updateScanCount();
            this.updateLastUpdate();
            
            // Store current data
            this.currentData = {
                scan: scanData,
                prediction: prediction.prediction,
                timestamp: new Date().toISOString()
            };
            
            if (window.wifiViz && !this.scanInterval) {
                // Only show toast for manual scans, not continuous scans
                window.wifiViz.showToast(`Found ${scanData.networks.length} network(s)`, 'success');
            }

        } catch (error) {
            console.error('Scan failed:', error);
            if (window.wifiViz) {
                window.wifiViz.showToast('Scan failed: ' + error.message, 'error');
                window.wifiViz.updateNetworkList([]);
            }
        } finally {
            this.scanInProgress = false;
            // Only hide loading if not in continuous scan mode
            if (!this.scanInterval) {
                this.hideLoading();
            }
        }
    }

    updateLocationInfo(prediction) {
        const currentLocation = document.getElementById('currentLocation');
        const locationCoords = document.getElementById('locationCoords');
        const confidence = document.getElementById('confidence');

        if (currentLocation) {
            currentLocation.textContent = prediction.location || 'Unknown';
        }

        if (locationCoords && prediction.coordinates) {
            locationCoords.textContent = `Coordinates: (${prediction.coordinates.x}, ${prediction.coordinates.y})`;
        }

        if (confidence) {
            confidence.textContent = `Confidence: ${(prediction.confidence * 100).toFixed(1)}%`;
        }
    }

    updateSignalInfo(networks) {
        const signalQuality = document.getElementById('signalQuality');
        const signalScore = document.getElementById('signalScore');
        const networkCount = document.getElementById('networkCount');

        const metrics = this.calculateSignalMetrics(networks);

        if (signalQuality) {
            signalQuality.textContent = metrics.overall_quality;
            signalQuality.className = `signal-quality ${metrics.overall_quality.toLowerCase()}`;
        }

        if (signalScore) {
            signalScore.textContent = `Score: ${metrics.quality_score.toFixed(2)}`;
        }

        if (networkCount) {
            networkCount.textContent = `Networks: ${networks.length}`;
        }
    }

    updateSimilarityScores(similarityScores) {
        window.wifiViz.updateSimilarityScores(similarityScores);
    }

    updateSystemStatus(status, message) {
        const systemStatus = document.getElementById('systemStatus');
        if (systemStatus) {
            const icon = systemStatus.querySelector('i');
            const text = systemStatus.querySelector('span');
            
            systemStatus.className = `status-indicator ${status}`;
            
            if (icon) {
                icon.className = `fas fa-circle`;
            }
            
            if (text) {
                text.textContent = message;
            }
        }
    }

    updateSystemInfo(status) {
        this.updateSystemStatus('connected', 'Connected');
        
        // Update additional system info if available
        if (status.current_location) {
            this.updateLocationInfo({ location: status.current_location });
        }
        
        if (status.signal_quality) {
            this.updateSignalInfo([]);
        }
    }

    updateScanButton(isScanning) {
        const startScanBtn = document.getElementById('startScanBtn');
        if (startScanBtn) {
            const icon = startScanBtn.querySelector('i');
            const text = startScanBtn.querySelector('span') || startScanBtn.childNodes[1];
            
            if (isScanning) {
                startScanBtn.innerHTML = '<i class="fas fa-stop"></i> Stop Scan';
                startScanBtn.classList.add('btn-danger');
                startScanBtn.classList.remove('btn-primary');
            } else {
                startScanBtn.innerHTML = '<i class="fas fa-play"></i> Start Scan';
                startScanBtn.classList.add('btn-primary');
                startScanBtn.classList.remove('btn-danger');
            }
        }
    }

    updateScanCount() {
        const scanCount = document.getElementById('scanCount');
        if (scanCount) {
            scanCount.textContent = `Scans: ${this.scanCount}`;
        }
    }

    updateLastUpdate() {
        const lastUpdate = document.getElementById('lastUpdate');
        if (lastUpdate) {
            lastUpdate.textContent = `Last Update: ${new Date().toLocaleTimeString()}`;
        }
    }

    calculateSignalMetrics(networks) {
        if (!networks || networks.length === 0) {
            return {
                overall_quality: 'Poor',
                average_rssi: -100,
                strongest_signal: -100,
                quality_score: 0.0
            };
        }

        const rssiValues = networks.map(net => net.signal);
        const avgRssi = rssiValues.reduce((sum, val) => sum + val, 0) / rssiValues.length;
        const strongestSignal = Math.max(...rssiValues);
        
        let overallQuality;
        if (avgRssi >= -50) {
            overallQuality = 'Excellent';
        } else if (avgRssi >= -60) {
            overallQuality = 'Good';
        } else if (avgRssi >= -70) {
            overallQuality = 'Fair';
        } else {
            overallQuality = 'Poor';
        }

        const qualityScore = Math.max(0, Math.min(1, (avgRssi + 100) / 100));

        return {
            overall_quality: overallQuality,
            average_rssi: avgRssi,
            strongest_signal: strongestSignal,
            quality_score: qualityScore
        };
    }

    showSettings() {
        const settingsModal = document.getElementById('settingsModal');
        if (settingsModal) {
            settingsModal.classList.add('show');
        }
    }

    hideSettings() {
        const settingsModal = document.getElementById('settingsModal');
        if (settingsModal) {
            settingsModal.classList.remove('show');
        }
    }

    showHelp() {
        const helpModal = document.getElementById('helpModal');
        if (helpModal) {
            helpModal.classList.add('show');
        }
    }

    hideHelp() {
        const helpModal = document.getElementById('helpModal');
        if (helpModal) {
            helpModal.classList.remove('show');
        }
    }

    hideConnectionModal() {
        const connectionModal = document.getElementById('connectionModal');
        if (connectionModal) {
            // Remove show class
            connectionModal.classList.remove('show');
            
            // Remove all inline styles that were added to show the modal
            connectionModal.style.display = '';
            connectionModal.style.visibility = '';
            connectionModal.style.opacity = '';
            connectionModal.style.zIndex = '';
            connectionModal.style.position = '';
            connectionModal.style.top = '';
            connectionModal.style.left = '';
            connectionModal.style.width = '';
            connectionModal.style.height = '';
            connectionModal.style.backgroundColor = '';
            connectionModal.style.alignItems = '';
            connectionModal.style.justifyContent = '';
            
            // Remove ESC key handler if it exists
            if (connectionModal._escHandler) {
                document.removeEventListener('keydown', connectionModal._escHandler);
                delete connectionModal._escHandler;
            }
            
            console.log('Connection modal closed');
        }
    }

    async toggleHeatmap() {
        try {
            const mapData = await window.wifiAPI.getMapData();
            window.wifiViz.toggleHeatmap(mapData.heatmap_data);
        } catch (error) {
            console.error('Failed to toggle heatmap:', error);
            window.wifiViz.showToast('Failed to toggle heatmap', 'error');
        }
    }

    toggleSignals() {
        window.wifiViz.toggleSignals();
        const toggleSignalsBtn = document.getElementById('toggleSignals');
        if (toggleSignalsBtn) {
            toggleSignalsBtn.textContent = window.wifiViz.isSignalsVisible ? 'Hide Signals' : 'Show Signals';
        }
    }

    async addReferencePoint() {
        const locationSelect = document.getElementById('trainLocation');
        const locationId = locationSelect?.value;
        
        if (!locationId) {
            window.wifiViz.showToast('Please select a location', 'warning');
            return;
        }
        
        if (!this.currentData || !this.currentData.scan || !this.currentData.scan.networks) {
            window.wifiViz.showToast('Please scan for networks first', 'warning');
            return;
        }
        
        try {
            this.showLoading('Adding reference point...');
            
            const result = await window.wifiAPI.addReferencePoint(locationId, this.currentData.scan.networks);
            
            if (result.success) {
                window.wifiViz.showToast(`Reference point added for ${locationId}`, 'success');
                this.updateTrainingStatus(`Reference points: ${result.total_reference_points || 0}`);
                
                // Refresh metrics after adding reference point (which includes ground truth)
                await this.loadMetrics();
            } else {
                throw new Error(result.error || 'Failed to add reference point');
            }
        } catch (error) {
            console.error('Failed to add reference point:', error);
            window.wifiViz.showToast('Failed to add reference point: ' + error.message, 'error');
        } finally {
            this.hideLoading();
        }
    }

    async trainModel() {
        try {
            this.showLoading('Training model...');
            this.updateTrainingStatus('Training model with reference points...');
            
            const result = await window.wifiAPI.trainModel();
            
            if (result.success) {
                const trainingResult = result.training_result || {};
                const method = trainingResult.method || 'fingerprint_matching';
                const refPoints = result.reference_points_count || 0;
                
                window.wifiViz.showToast(`Model training completed! (${refPoints} reference points)`, 'success');
                this.updateTrainingStatus(`Training complete! Method: ${method}, Reference points: ${refPoints}`);
            } else {
                throw new Error(result.error || 'Training failed');
            }
        } catch (error) {
            console.error('Failed to train model:', error);
            window.wifiViz.showToast('Failed to train model: ' + error.message, 'error');
            this.updateTrainingStatus('Training failed: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    updateTrainingStatus(message) {
        const statusDiv = document.getElementById('trainingStatus');
        const statusText = document.getElementById('trainingStatusText');
        
        if (statusDiv && statusText) {
            statusDiv.style.display = 'block';
            statusText.textContent = message;
        }
    }

    async loadMetrics() {
        try {
            const metricsData = await window.wifiAPI.getMetrics();
            if (metricsData.success && metricsData.metrics) {
                this.updateMetricsDisplay(metricsData.metrics, metricsData.per_class);
            }
        } catch (error) {
            console.error('Failed to load metrics:', error);
        }
    }

    updateMetricsDisplay(metrics, perClass) {
        // Show info message if no ground truth data
        const metricsInfo = document.getElementById('metricsInfo');
        if (metricsInfo) {
            if (metrics.predictions_with_ground_truth === 0) {
                metricsInfo.style.display = 'block';
            } else {
                metricsInfo.style.display = 'none';
            }
        }

        // Update main metrics
        const accuracyEl = document.getElementById('metricAccuracy');
        const precisionEl = document.getElementById('metricPrecision');
        const recallEl = document.getElementById('metricRecall');
        const f1El = document.getElementById('metricF1');
        const mapEl = document.getElementById('metricMAP');
        const totalEl = document.getElementById('metricTotal');

        if (accuracyEl) accuracyEl.textContent = (metrics.accuracy * 100).toFixed(1) + '%';
        if (precisionEl) precisionEl.textContent = (metrics.precision * 100).toFixed(1) + '%';
        if (recallEl) recallEl.textContent = (metrics.recall * 100).toFixed(1) + '%';
        if (f1El) f1El.textContent = (metrics.f1_score * 100).toFixed(1) + '%';
        if (mapEl) mapEl.textContent = (metrics.map * 100).toFixed(1) + '%';
        if (totalEl) totalEl.textContent = metrics.total_predictions || 0;

        // Update per-class metrics
        if (perClass && Object.keys(perClass).length > 0) {
            const perClassContainer = document.getElementById('perClassMetrics');
            const perClassList = document.getElementById('perClassMetricsList');
            
            if (perClassContainer) perClassContainer.style.display = 'block';
            if (perClassList) {
                perClassList.innerHTML = '';
                Object.entries(perClass).forEach(([location, metrics]) => {
                    const item = document.createElement('div');
                    item.className = 'per-class-item';
                    item.innerHTML = `
                        <div class="location-name">${location}</div>
                        <div class="metric-row">
                            <span>Precision:</span>
                            <span>${(metrics.precision * 100).toFixed(1)}%</span>
                        </div>
                        <div class="metric-row">
                            <span>Recall:</span>
                            <span>${(metrics.recall * 100).toFixed(1)}%</span>
                        </div>
                        <div class="metric-row">
                            <span>F1-Score:</span>
                            <span>${(metrics.f1_score * 100).toFixed(1)}%</span>
                        </div>
                        <div class="metric-row">
                            <span>Count:</span>
                            <span>${metrics.count}</span>
                        </div>
                    `;
                    perClassList.appendChild(item);
                });
            }
        }
    }

    async refreshMap() {
        try {
            this.showLoading('Refreshing map...');
            await window.wifiViz.refreshMap();
            window.wifiViz.showToast('Map refreshed', 'success');
        } catch (error) {
            console.error('Failed to refresh map:', error);
            window.wifiViz.showToast('Failed to refresh map', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async clearHistory() {
        try {
            // This would require a backend endpoint to clear history
            window.wifiViz.updateScanHistory([]);
            this.scanCount = 0;
            this.updateScanCount();
            window.wifiViz.showToast('History cleared', 'success');
        } catch (error) {
            console.error('Failed to clear history:', error);
            window.wifiViz.showToast('Failed to clear history', 'error');
        }
    }

    async exportHistory() {
        try {
            this.showLoading('Exporting data...');
            
            const jsonData = await window.wifiAPI.exportData('json');
            const csvData = await window.wifiAPI.exportData('csv');
            
            const timestamp = new Date().toISOString().split('T')[0];
            
            // Download JSON
            window.wifiAPI.downloadData(jsonData, `wifi-fingerprinting-${timestamp}.json`);
            
            // Download CSV
            window.wifiAPI.downloadData(csvData, `wifi-fingerprinting-${timestamp}.csv`, 'text/csv');
            
            window.wifiViz.showToast('Data exported successfully', 'success');
        } catch (error) {
            console.error('Failed to export data:', error);
            window.wifiViz.showToast('Failed to export data', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async addReferencePoint() {
        const locationIdInput = document.getElementById('newLocationId');
        if (!locationIdInput || !locationIdInput.value.trim()) {
            window.wifiViz.showToast('Please enter a location ID', 'warning');
            return;
        }

        if (!this.currentData) {
            window.wifiViz.showToast('No current scan data available', 'warning');
            return;
        }

        try {
            this.showLoading('Adding reference point...');
            
            const result = await window.wifiAPI.addReferencePoint(
                locationIdInput.value.trim(),
                this.currentData.scan.networks
            );
            
            if (result.success) {
                window.wifiViz.showToast('Reference point added successfully', 'success');
                locationIdInput.value = '';
                await this.refreshMap();
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Failed to add reference point:', error);
            window.wifiViz.showToast('Failed to add reference point: ' + error.message, 'error');
        } finally {
            this.hideLoading();
        }
    }

    async retrainModel() {
        try {
            this.showLoading('Retraining model...');
            
            const result = await window.wifiAPI.trainModel();
            
            if (result.success) {
                window.wifiViz.showToast('Model retrained successfully', 'success');
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Failed to retrain model:', error);
            window.wifiViz.showToast('Failed to retrain model: ' + error.message, 'error');
        } finally {
            this.hideLoading();
        }
    }

    async resetModel() {
        if (!confirm('Are you sure you want to reset the model? This will delete all trained data.')) {
            return;
        }

        try {
            this.showLoading('Resetting model...');
            
            // This would require a backend endpoint to reset the model
            window.wifiViz.showToast('Model reset functionality not implemented', 'warning');
        } catch (error) {
            console.error('Failed to reset model:', error);
            window.wifiViz.showToast('Failed to reset model: ' + error.message, 'error');
        } finally {
            this.hideLoading();
        }
    }

    showLoading(message = 'Loading...') {
        const loadingOverlay = document.getElementById('loadingOverlay');
        const loadingText = loadingOverlay?.querySelector('p');
        
        if (loadingOverlay) {
            loadingOverlay.classList.add('show');
        }
        
        if (loadingText) {
            loadingText.textContent = message;
        }
    }

    hideLoading() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.classList.remove('show');
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.wifiApp = new WiFiApp();
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden && window.wifiApp && window.wifiApp.isScanning) {
        // Page is hidden, could pause scanning to save resources
        console.log('Page hidden - scanning continues in background');
    } else if (!document.hidden && window.wifiApp) {
        // Page is visible again, refresh data
        console.log('Page visible - refreshing data');
        window.wifiApp.loadInitialData();
    }
});

// Handle window resize
window.addEventListener('resize', () => {
    if (window.wifiViz && window.wifiViz.map) {
        // Trigger map resize
        setTimeout(() => {
            window.wifiViz.map.invalidateSize();
        }, 100);
    }
});
