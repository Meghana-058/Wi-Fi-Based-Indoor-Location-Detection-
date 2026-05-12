// Enhanced Visualization Module with Google Maps-like Interface
// Real-time Wi-Fi Signal Visualization with Range Indicators
class WiFiVisualization {
    constructor() {
        this.map = null;
        this.signalChart = null;
        this.heatmapLayer = null;
        this.wifiRangeLayers = [];
        this.markers = [];
        this.currentLocationMarker = null;
        this.isHeatmapVisible = false;
        this.isSignalsVisible = true;
        this.scale = 1; // Scale factor for map (1 unit = 1 meter)
        this.navigationLines = []; // Store navigation paths
        this.bestSignalMarker = null; // Marker for best signal location
        this.init();
    }

    init() {
        this.initMap();
        this.initSignalChart();
        this.initMapControls();
    }

    // Initialize Google Maps-like interface
    initMap() {
        const mapContainer = document.getElementById('map');
        if (!mapContainer) return;

        // Initialize map with better view
        this.map = L.map('map', {
            center: [50, 50],
            zoom: 18,
            zoomControl: true,
            attributionControl: true,
            minZoom: 15,
            maxZoom: 22
        });

        // Add Google Maps-like tile layer (using CartoDB Positron for clean look)
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '© OpenStreetMap contributors © CARTO',
            subdomains: 'abcd',
            maxZoom: 22
        }).addTo(this.map);

        // Create custom floor plan layer
        this.createFloorPlanLayer();
        
        // Add scale control
        L.control.scale({
            metric: true,
            imperial: false,
            maxWidth: 200
        }).addTo(this.map);
    }

    // Create custom floor plan layer
    createFloorPlanLayer() {
        // Create a detailed floor plan using SVG
        const floorPlanSVG = `
            <svg width="100%" height="100%" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <!-- Floor outline -->
                <rect x="0" y="0" width="100" height="100" fill="#f8f9fa" stroke="#dee2e6" stroke-width="0.5"/>
                
                <!-- Grid lines for scale reference (10 meter intervals) -->
                <defs>
                    <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                        <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#e9ecef" stroke-width="0.2"/>
                    </pattern>
                </defs>
                <rect width="100" height="100" fill="url(#grid)"/>
                
                <!-- Rooms with labels -->
                <rect x="10" y="10" width="30" height="25" fill="#ffffff" stroke="#4285f4" stroke-width="0.5" opacity="0.8"/>
                <text x="25" y="22" text-anchor="middle" font-size="4" fill="#333" font-weight="bold">Area 1</text>
                
                <rect x="45" y="10" width="30" height="25" fill="#ffffff" stroke="#4285f4" stroke-width="0.5" opacity="0.8"/>
                <text x="60" y="22" text-anchor="middle" font-size="4" fill="#333" font-weight="bold">Area 2</text>
                
                <rect x="10" y="40" width="30" height="25" fill="#ffffff" stroke="#4285f4" stroke-width="0.5" opacity="0.8"/>
                <text x="25" y="52" text-anchor="middle" font-size="4" fill="#333" font-weight="bold">Area 3</text>
                
                <rect x="45" y="40" width="30" height="25" fill="#ffffff" stroke="#4285f4" stroke-width="0.5" opacity="0.8"/>
                <text x="60" y="52" text-anchor="middle" font-size="4" fill="#333" font-weight="bold">Area 4</text>
                
                <rect x="10" y="70" width="30" height="20" fill="#ffffff" stroke="#4285f4" stroke-width="0.5" opacity="0.8"/>
                <text x="25" y="80" text-anchor="middle" font-size="4" fill="#333" font-weight="bold">Area 5</text>
                
                <rect x="45" y="70" width="30" height="20" fill="#ffffff" stroke="#4285f4" stroke-width="0.5" opacity="0.8"/>
                <text x="60" y="80" text-anchor="middle" font-size="4" fill="#333" font-weight="bold">Area 6</text>
            </svg>
        `;

        // Create image overlay for floor plan
        const floorPlanBounds = [[0, 0], [100, 100]];
        const floorPlanOverlay = L.imageOverlay('data:image/svg+xml;base64,' + btoa(floorPlanSVG), floorPlanBounds, {
            opacity: 0.9,
            interactive: true
        }).addTo(this.map);

        // Fit map to floor plan
        this.map.fitBounds(floorPlanBounds);
    }

    // Initialize map controls
    initMapControls() {
        // Add custom zoom controls
        const zoomControl = L.control.zoom({
            position: 'topright'
        });
        this.map.addControl(zoomControl);

        // Add fullscreen control (if available)
        if (this.map.requestFullscreen) {
            const fullscreenControl = L.control({
                position: 'topright'
            });
            fullscreenControl.onAdd = function(map) {
                const div = L.DomUtil.create('div', 'leaflet-control-fullscreen');
                div.innerHTML = '<button class="btn btn-sm" onclick="document.getElementById(\'map\').requestFullscreen()"><i class="fas fa-expand"></i></button>';
                return div;
            };
            this.map.addControl(fullscreenControl);
        }
    }

    // Initialize signal strength chart
    initSignalChart() {
        const ctx = document.getElementById('signalChart');
        if (!ctx) return;

        this.signalChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Average RSSI (dBm)',
                    data: [],
                    borderColor: '#4285f4',
                    backgroundColor: 'rgba(66, 133, 244, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointRadius: 3,
                    pointHoverRadius: 5
                }, {
                    label: 'Strongest Signal (dBm)',
                    data: [],
                    borderColor: '#34a853',
                    backgroundColor: 'rgba(52, 168, 83, 0.1)',
                    tension: 0.4,
                    fill: false,
                    pointRadius: 3,
                    pointHoverRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: false,
                        max: 0,
                        min: -100,
                        title: {
                            display: true,
                            text: 'Signal Strength (dBm)'
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Time'
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 10,
                        titleFont: { size: 14 },
                        bodyFont: { size: 12 }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });
    }

    // Update map with current location and Wi-Fi signals
    updateMap(locationData, networks = []) {
        if (!this.map) return;

        // Clear existing location marker
        if (this.currentLocationMarker) {
            this.map.removeLayer(this.currentLocationMarker);
        }

        // Add current location marker with high accuracy
        if (locationData && locationData.coordinates) {
            const coords = [locationData.coordinates.y, locationData.coordinates.x]; // Note: Leaflet uses [lat, lng]
            
            // Create accurate location marker
            this.currentLocationMarker = L.marker(coords, {
                icon: L.divIcon({
                    className: 'current-location-marker',
                    html: `
                        <div class="location-pin-accurate">
                            <div class="location-pin-inner">
                                <i class="fas fa-map-marker-alt"></i>
                            </div>
                            <div class="location-accuracy-circle"></div>
                        </div>
                    `,
                    iconSize: [40, 40],
                    iconAnchor: [20, 40]
                }),
                zIndexOffset: 1000
            }).addTo(this.map);

            // Create accuracy circle (confidence-based radius)
            const accuracyRadius = (1 - locationData.confidence) * 5; // 0-5 meters based on confidence
            const accuracyCircle = L.circle(coords, {
                radius: accuracyRadius * this.scale,
                fillColor: '#4285f4',
                fillOpacity: 0.2,
                color: '#4285f4',
                weight: 2,
                dashArray: '5, 5'
            }).addTo(this.map);

            this.markers.push(accuracyCircle);

            // Enhanced popup with detailed information
            this.currentLocationMarker.bindPopup(`
                <div class="location-popup-enhanced">
                    <h4><i class="fas fa-map-marker-alt"></i> ${locationData.location || 'Unknown'}</h4>
                    <div class="popup-details">
                        <div class="popup-item">
                            <span class="popup-label">Confidence:</span>
                            <span class="popup-value confidence-${this.getConfidenceClass(locationData.confidence)}">
                                ${(locationData.confidence * 100).toFixed(1)}%
                            </span>
                        </div>
                        <div class="popup-item">
                            <span class="popup-label">Coordinates:</span>
                            <span class="popup-value">(${locationData.coordinates.x}, ${locationData.coordinates.y})</span>
                        </div>
                        <div class="popup-item">
                            <span class="popup-label">Floor:</span>
                            <span class="popup-value">${locationData.coordinates.floor}</span>
                        </div>
                        <div class="popup-item">
                            <span class="popup-label">Accuracy:</span>
                            <span class="popup-value">±${accuracyRadius.toFixed(1)}m</span>
                        </div>
                    </div>
                </div>
            `).openPopup();

            // Center and zoom to location with smooth animation
            this.map.setView(coords, 19, {
                animate: true,
                duration: 0.5
            });
        }

        // Update Wi-Fi signal visualization
        if (this.isSignalsVisible && networks && networks.length > 0) {
            this.updateWiFiSignals(networks, locationData);
        }
        
        // Show notification about navigation
        if (networks && networks.length > 0) {
            setTimeout(() => {
                this.showToast('Navigation directions shown on map! Look for the green arrow.', 'info');
            }, 1000);
        }
    }

    // Update Wi-Fi signals with range circles (10 meters)
    updateWiFiSignals(networks, locationData) {
        if (!this.map || !networks || networks.length === 0) return;

        // Clear existing Wi-Fi range layers
        this.wifiRangeLayers.forEach(layer => this.map.removeLayer(layer));
        this.wifiRangeLayers = [];
        
        // Clear navigation lines
        this.navigationLines.forEach(line => this.map.removeLayer(line));
        this.navigationLines = [];
        
        // Clear best signal marker
        if (this.bestSignalMarker) {
            this.map.removeLayer(this.bestSignalMarker);
            this.bestSignalMarker = null;
        }

        // Get current location coordinates
        const currentCoords = locationData && locationData.coordinates 
            ? [locationData.coordinates.y, locationData.coordinates.x]
            : [50, 50]; // Default center
        
        // Find the strongest signal network
        const strongestNetwork = networks.reduce((best, current) => 
            (current.signal || -100) > (best.signal || -100) ? current : best
        );
        
        // Show navigation to best signal
        this.showNavigationToBestSignal(strongestNetwork, currentCoords, networks);

        // Process each network
        networks.forEach((network, index) => {
            // Calculate signal range based on RSSI (typically 10 meters for strong signals)
            const signalRange = this.calculateSignalRange(network.signal);
            
            // Create range circle (10 meters typical range)
            const rangeCircle = L.circle(currentCoords, {
                radius: signalRange * this.scale, // Convert to map units
                fillColor: this.getSignalColor(network.signal),
                fillOpacity: 0.15,
                color: this.getSignalColor(network.signal),
                weight: 2,
                opacity: 0.6,
                dashArray: '10, 5'
            }).addTo(this.map);
            
            this.wifiRangeLayers.push(rangeCircle);

            // Add network marker at edge of range
            const angle = (index * 360 / networks.length) * Math.PI / 180;
            const markerX = currentCoords[1] + (signalRange / 100) * Math.cos(angle);
            const markerY = currentCoords[0] + (signalRange / 100) * Math.sin(angle);

            const networkMarker = L.marker([markerY, markerX], {
                icon: L.divIcon({
                    className: 'wifi-signal-marker',
                    html: `
                        <div class="wifi-icon" style="color: ${this.getSignalColor(network.signal)}">
                            <i class="fas fa-wifi"></i>
                            <div class="signal-strength-indicator signal-${this.getSignalStrengthClass(network.signal)}"></div>
                        </div>
                    `,
                    iconSize: [30, 30],
                    iconAnchor: [15, 15]
                })
            }).addTo(this.map);

            // Enhanced popup with signal details
            networkMarker.bindPopup(`
                <div class="wifi-network-popup">
                    <h4><i class="fas fa-wifi"></i> ${network.ssid || 'Hidden Network'}</h4>
                    <div class="network-details">
                        <div class="detail-row">
                            <span class="detail-label">Signal Strength:</span>
                            <span class="detail-value signal-${this.getSignalStrengthClass(network.signal)}">
                                ${network.signal} dBm
                            </span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Quality:</span>
                            <span class="detail-value">${this.getSignalQuality(network.signal)}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Range:</span>
                            <span class="detail-value">~${signalRange.toFixed(1)}m</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Frequency:</span>
                            <span class="detail-value">${network.frequency} MHz</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Security:</span>
                            <span class="detail-value">${network.security || 'Unknown'}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">BSSID:</span>
                            <span class="detail-value" style="font-family: monospace; font-size: 10px;">${network.bssid}</span>
                        </div>
                    </div>
                </div>
            `);

            // Add range label
            const rangeLabel = L.marker([currentCoords[0] + (signalRange / 100) * Math.cos(angle + Math.PI / 6), 
                                         currentCoords[1] + (signalRange / 100) * Math.sin(angle + Math.PI / 6)], {
                icon: L.divIcon({
                    className: 'range-label',
                    html: `<div class="range-label-text">${signalRange.toFixed(1)}m</div>`,
                    iconSize: [50, 20],
                    iconAnchor: [25, 10]
                })
            }).addTo(this.map);

            this.wifiRangeLayers.push(rangeCircle, networkMarker, rangeLabel);
        });
    }
    
    // Show navigation directions to best signal network
    showNavigationToBestSignal(bestNetwork, currentCoords, allNetworks) {
        if (!this.map || !bestNetwork) return;
        
        const signalStrength = bestNetwork.signal || -70;
        const signalRange = this.calculateSignalRange(signalStrength);
        
        // Calculate optimal position for best signal (move towards the network)
        // For strong signals, move closer; for weak signals, move towards the source
        const moveDistance = signalRange * 0.7; // Move 70% of range towards signal
        
        // Estimate network position (in real scenario, this would use triangulation)
        // For now, we'll show direction based on signal strength gradient
        const angle = this.calculateBestDirection(allNetworks, currentCoords);
        const optimalX = currentCoords[1] + (moveDistance / 100) * Math.cos(angle);
        const optimalY = currentCoords[0] + (moveDistance / 100) * Math.sin(angle);
        const optimalCoords = [optimalY, optimalX];
        
        // Create navigation path (arrow/line from current to optimal position)
        const navigationPath = L.polyline([currentCoords, optimalCoords], {
            color: '#4CAF50',
            weight: 4,
            opacity: 0.8,
            dashArray: '15, 10',
            className: 'navigation-path'
        }).addTo(this.map);
        
        // Add arrow marker at the end
        const arrowIcon = L.divIcon({
            className: 'navigation-arrow',
            html: `
                <div class="nav-arrow-container">
                    <i class="fas fa-arrow-right nav-arrow-icon"></i>
                    <div class="nav-arrow-label">Best Signal</div>
                </div>
            `,
            iconSize: [60, 60],
            iconAnchor: [30, 30]
        });
        
        const arrowMarker = L.marker(optimalCoords, {
            icon: arrowIcon,
            zIndexOffset: 2000
        }).addTo(this.map);
        
        // Add best signal marker
        this.bestSignalMarker = L.marker(optimalCoords, {
            icon: L.divIcon({
                className: 'best-signal-marker',
                html: `
                    <div class="best-signal-pin">
                        <div class="best-signal-icon">
                            <i class="fas fa-wifi"></i>
                        </div>
                        <div class="best-signal-label">${bestNetwork.ssid || 'Best Signal'}</div>
                        <div class="best-signal-strength">${signalStrength} dBm</div>
                    </div>
                `,
                iconSize: [100, 80],
                iconAnchor: [50, 80]
            }),
            zIndexOffset: 1500
        }).addTo(this.map);
        
        // Add popup with navigation instructions
        const distance = this.calculateDistance(currentCoords, optimalCoords);
        this.bestSignalMarker.bindPopup(`
            <div class="navigation-popup">
                <h4><i class="fas fa-route"></i> Navigate to Best Signal</h4>
                <div class="nav-info">
                    <div class="nav-item">
                        <strong>Network:</strong> ${bestNetwork.ssid || 'Unknown'}
                    </div>
                    <div class="nav-item">
                        <strong>Signal:</strong> ${signalStrength} dBm (${this.getSignalQuality(signalStrength)})
                    </div>
                    <div class="nav-item">
                        <strong>Distance:</strong> ~${distance.toFixed(1)} meters
                    </div>
                    <div class="nav-item">
                        <strong>Direction:</strong> ${this.getDirectionName(angle)}
                    </div>
                    <div class="nav-instructions">
                        <p><i class="fas fa-info-circle"></i> Move in the direction of the green arrow to get better signal strength.</p>
                    </div>
                </div>
            </div>
        `);
        
        this.navigationLines.push(navigationPath);
        this.navigationLines.push(arrowMarker);
        this.navigationLines.push(this.bestSignalMarker);
        
        // Auto-open popup
        setTimeout(() => {
            this.bestSignalMarker.openPopup();
        }, 500);
    }
    
    // Calculate best direction based on signal strength gradient
    calculateBestDirection(networks, currentCoords) {
        if (!networks || networks.length === 0) return 0;
        
        // Find strongest signals and calculate weighted direction
        const strongNetworks = networks
            .filter(n => (n.signal || -100) > -80)
            .sort((a, b) => (b.signal || -100) - (a.signal || -100))
            .slice(0, 3); // Top 3 networks
        
        if (strongNetworks.length === 0) return 0;
        
        // Calculate weighted average direction
        let totalWeight = 0;
        let weightedAngle = 0;
        
        strongNetworks.forEach((network, index) => {
            const signal = network.signal || -70;
            const weight = Math.max(0, signal + 100); // Convert to positive weight
            const angle = (index * 360 / networks.length) * Math.PI / 180;
            
            weightedAngle += angle * weight;
            totalWeight += weight;
        });
        
        return totalWeight > 0 ? weightedAngle / totalWeight : 0;
    }
    
    // Calculate distance between two coordinates (in meters)
    calculateDistance(coord1, coord2) {
        const dx = (coord2[1] - coord1[1]) * 100; // Convert to meters
        const dy = (coord2[0] - coord1[0]) * 100;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    // Get direction name from angle
    getDirectionName(angle) {
        const degrees = (angle * 180 / Math.PI + 360) % 360;
        if (degrees >= 337.5 || degrees < 22.5) return 'North';
        if (degrees >= 22.5 && degrees < 67.5) return 'Northeast';
        if (degrees >= 67.5 && degrees < 112.5) return 'East';
        if (degrees >= 112.5 && degrees < 157.5) return 'Southeast';
        if (degrees >= 157.5 && degrees < 202.5) return 'South';
        if (degrees >= 202.5 && degrees < 247.5) return 'Southwest';
        if (degrees >= 247.5 && degrees < 292.5) return 'West';
        return 'Northwest';
    }

    // Calculate signal range based on RSSI (typically up to 10 meters)
    calculateSignalRange(rssi) {
        // RSSI to distance conversion (simplified model)
        // Strong signals (-30 to -50): 5-10 meters
        // Good signals (-50 to -60): 3-5 meters
        // Fair signals (-60 to -70): 1-3 meters
        // Poor signals (< -70): < 1 meter
        
        if (rssi >= -30) return 10.0; // Excellent: 10 meters
        if (rssi >= -50) return 8.0;  // Good: 8 meters
        if (rssi >= -60) return 5.0;  // Fair: 5 meters
        if (rssi >= -70) return 3.0;  // Moderate: 3 meters
        return 1.0; // Poor: 1 meter
    }

    // Get signal color based on strength
    getSignalColor(rssi) {
        if (rssi >= -50) return '#34a853'; // Green - Excellent
        if (rssi >= -60) return '#4285f4'; // Blue - Good
        if (rssi >= -70) return '#fbbc04'; // Yellow - Fair
        return '#ea4335'; // Red - Poor
    }

    // Get signal strength class
    getSignalStrengthClass(rssi) {
        if (rssi >= -50) return 'excellent';
        if (rssi >= -60) return 'good';
        if (rssi >= -70) return 'fair';
        return 'poor';
    }

    // Get signal quality text
    getSignalQuality(rssi) {
        if (rssi >= -50) return 'Excellent';
        if (rssi >= -60) return 'Good';
        if (rssi >= -70) return 'Fair';
        return 'Poor';
    }

    // Get confidence class for styling
    getConfidenceClass(confidence) {
        if (confidence >= 0.8) return 'high';
        if (confidence >= 0.6) return 'medium';
        return 'low';
    }

    // Update signal chart with new data
    updateSignalChart(signalData) {
        if (!this.signalChart || !signalData) return;

        const now = new Date().toLocaleTimeString();
        const maxDataPoints = 30; // Keep last 30 data points

        // Add new data point
        this.signalChart.data.labels.push(now);
        this.signalChart.data.datasets[0].data.push(signalData.average_rssi);
        this.signalChart.data.datasets[1].data.push(signalData.strongest_signal);

        // Remove old data points if exceeding limit
        if (this.signalChart.data.labels.length > maxDataPoints) {
            this.signalChart.data.labels.shift();
            this.signalChart.data.datasets[0].data.shift();
            this.signalChart.data.datasets[1].data.shift();
        }

        this.signalChart.update('none');
    }

    // Update network list with enhanced information
    updateNetworkList(networks) {
        const networkList = document.getElementById('networkList');
        if (!networkList) return;

        if (!networks || networks.length === 0) {
            networkList.innerHTML = '<div class="no-networks">No networks detected</div>';
            return;
        }

        // Update network count header
        const networkCountHeader = document.getElementById('networkCountHeader');
        if (networkCountHeader) {
            networkCountHeader.textContent = `${networks.length} networks`;
        }

        // Sort networks by signal strength
        const sortedNetworks = networks.sort((a, b) => b.signal - a.signal);

        networkList.innerHTML = sortedNetworks.map((network, index) => {
            const range = this.calculateSignalRange(network.signal);
            const quality = this.getSignalQuality(network.signal);
            const networkId = `network-${index}`;
            
            return `
                <div class="network-item clickable-network" data-network-id="${networkId}" data-ssid="${network.ssid || 'Hidden Network'}" data-bssid="${network.bssid}" data-security="${network.security || 'Unknown'}" data-signal="${network.signal}">
                    <div class="network-info">
                        <div class="network-name">
                            <i class="fas fa-wifi" style="color: ${this.getSignalColor(network.signal)}"></i>
                            ${network.ssid || 'Hidden Network'}
                            <i class="fas fa-info-circle network-info-icon" title="Click for connection instructions"></i>
                        </div>
                        <div class="network-bssid">${network.bssid}</div>
                        <div class="network-details-small">
                            <span>Quality: ${quality}</span>
                            <span>Range: ~${range.toFixed(1)}m</span>
                            <span>${network.frequency} MHz</span>
                        </div>
                    </div>
                    <div class="network-signal">
                        <div class="signal-bars">
                            ${this.createSignalBars(network.signal)}
                        </div>
                        <div class="signal-value signal-${this.getSignalStrengthClass(network.signal)}">
                            ${network.signal} dBm
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        // Add click event listeners to network items - use event delegation for better reliability
        // Remove old listeners first
        networkList.removeEventListener('click', this._networkClickHandler);
        
        // Create a bound handler
        this._networkClickHandler = (e) => {
            const networkItem = e.target.closest('.clickable-network');
            if (!networkItem) return;
            
            e.preventDefault();
            e.stopPropagation();
            
            const ssid = networkItem.dataset.ssid;
            const bssid = networkItem.dataset.bssid;
            const security = networkItem.dataset.security;
            const signal = networkItem.dataset.signal;
            
            console.log('Network clicked:', ssid);
            console.log('Network data:', { ssid, bssid, security, signal });
            
            // Call the method with proper context
            if (typeof this.showConnectionInstructions === 'function') {
                this.showConnectionInstructions({
                    ssid: ssid || 'Unknown Network',
                    bssid: bssid || '00:00:00:00:00:00',
                    security: security || 'Unknown',
                    signal: signal || '-70'
                });
            } else {
                console.error('showConnectionInstructions method not found!');
                alert('Error: Connection instructions feature not available. Please refresh the page.');
            }
        };
        
        // Use event delegation on the parent
        networkList.addEventListener('click', this._networkClickHandler);
        
        // Add visual feedback to all network items
        const networkItems = networkList.querySelectorAll('.clickable-network');
        networkItems.forEach(item => {
            item.style.cursor = 'pointer';
            item.style.transition = 'all 0.2s ease';
            
            // Add hover effect
            item.addEventListener('mouseenter', function() {
                this.style.backgroundColor = 'var(--surface-dark)';
                this.style.transform = 'translateX(4px)';
                this.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
            });
            
            item.addEventListener('mouseleave', function() {
                this.style.backgroundColor = '';
                this.style.transform = '';
                this.style.boxShadow = '';
            });
        });
        
        console.log(`Added click handlers to ${networkItems.length} network items`);
    }

    // Create signal strength bars
    createSignalBars(signal) {
        const bars = [];
        const strength = Math.max(0, Math.min(4, Math.floor((signal + 100) / 25)));
        
        for (let i = 0; i < 4; i++) {
            const isActive = i < strength;
            const color = this.getSignalColor(signal);
            bars.push(`<div class="signal-bar ${isActive ? 'active' : ''}" style="${isActive ? `background: ${color}` : ''}"></div>`);
        }
        
        return bars.join('');
    }

    // Update similarity scores
    updateSimilarityScores(similarityScores) {
        const similarityList = document.getElementById('similarityList');
        if (!similarityList) return;

        if (!similarityScores || Object.keys(similarityScores).length === 0) {
            similarityList.innerHTML = '<div class="no-data">No similarity data</div>';
            return;
        }

        // Sort by similarity score
        const sortedScores = Object.entries(similarityScores)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5); // Show top 5

        similarityList.innerHTML = sortedScores.map(([location, score]) => `
            <div class="similarity-item">
                <div class="similarity-info">
                    <div class="similarity-location">${location}</div>
                    <div class="similarity-bar">
                        <div class="similarity-fill" style="width: ${score * 100}%"></div>
                    </div>
                </div>
                <div class="similarity-score">${(score * 100).toFixed(1)}%</div>
            </div>
        `).join('');
    }

    // Update scan history
    updateScanHistory(history) {
        const historyList = document.getElementById('historyList');
        if (!historyList) return;

        if (!history || history.length === 0) {
            historyList.innerHTML = '<div class="no-history">No scan history available</div>';
            return;
        }

        historyList.innerHTML = history.slice(0, 10).map(item => `
            <div class="history-item">
                <div class="history-info">
                    <div class="history-location">${item.location || 'Unknown'}</div>
                    <div class="history-time">${new Date(item.timestamp).toLocaleString()}</div>
                </div>
                <div class="history-quality ${item.signal_quality ? (typeof item.signal_quality === 'string' ? item.signal_quality.toLowerCase() : item.signal_quality.overall_quality?.toLowerCase() || 'unknown') : 'unknown'}">
                    ${item.signal_quality ? (typeof item.signal_quality === 'string' ? item.signal_quality : item.signal_quality.overall_quality || 'Unknown') : 'Unknown'}
                </div>
            </div>
        `).join('');
    }

    // Toggle heatmap visibility
    toggleHeatmap(heatmapData) {
        if (!this.map) return;

        if (this.isHeatmapVisible) {
            if (this.heatmapLayer) {
                this.map.removeLayer(this.heatmapLayer);
                this.heatmapLayer = null;
            }
            this.isHeatmapVisible = false;
        } else {
            if (heatmapData && heatmapData.grid) {
                this.createHeatmapLayer(heatmapData.grid);
                this.isHeatmapVisible = true;
            }
        }
    }

    // Toggle Wi-Fi signal visualization
    toggleSignals() {
        this.isSignalsVisible = !this.isSignalsVisible;
        
        if (this.isSignalsVisible) {
            // Signals will be shown on next update
            this.showToast('Wi-Fi signals visible', 'info');
        } else {
            // Remove signal layers
            this.wifiRangeLayers.forEach(layer => this.map.removeLayer(layer));
            this.wifiRangeLayers = [];
            this.showToast('Wi-Fi signals hidden', 'info');
        }
    }

    // Create heatmap layer
    createHeatmapLayer(gridData) {
        if (!this.map) return;

        this.heatmapLayer = L.layerGroup();

        gridData.forEach(point => {
            const intensity = Math.max(0, Math.min(1, (point.signal_strength + 100) / 100));
            const color = this.getHeatmapColor(intensity);
            
            const circle = L.circle([point.y, point.x], {
                radius: 2 * this.scale,
                fillColor: color,
                color: color,
                weight: 1,
                opacity: 0.6,
                fillOpacity: 0.4
            });

            this.heatmapLayer.addLayer(circle);
        });

        this.heatmapLayer.addTo(this.map);
    }

    // Get heatmap color based on intensity
    getHeatmapColor(intensity) {
        if (intensity < 0.25) return '#ea4335'; // Red
        if (intensity < 0.5) return '#fbbc04'; // Yellow
        if (intensity < 0.75) return '#34a853'; // Green
        return '#4285f4'; // Blue
    }

    // Refresh map data
    async refreshMap() {
        try {
            const mapData = await wifiAPI.getMapData();
            this.updateMapWithReferencePoints(mapData.reference_points);
            
            if (this.isHeatmapVisible) {
                this.toggleHeatmap(mapData.heatmap_data);
                this.toggleHeatmap(mapData.heatmap_data);
            }
        } catch (error) {
            console.error('Failed to refresh map:', error);
            this.showToast('Failed to refresh map data', 'error');
        }
    }

    // Update map with reference points
    updateMapWithReferencePoints(referencePoints) {
        if (!this.map || !referencePoints) return;

        // Remove existing reference point markers
        this.markers.forEach(marker => {
            if (marker.options && marker.options.className === 'reference-point-marker') {
                this.map.removeLayer(marker);
            }
        });

        // Add reference point markers
        referencePoints.forEach(point => {
            if (point.rssi_data && point.rssi_data.length > 0) {
                const coords = [point.y || 50, point.x || 50];
                const marker = L.marker(coords, {
                    icon: L.divIcon({
                        className: 'reference-point-marker',
                        html: '<div class="reference-pin"><i class="fas fa-circle"></i></div>',
                        iconSize: [20, 20],
                        iconAnchor: [10, 10]
                    })
                }).addTo(this.map);

                marker.bindPopup(`
                    <div class="reference-popup">
                        <h4>${point.location_id}</h4>
                        <p>Reference Point</p>
                        <p>Networks: ${point.rssi_data.length}</p>
                    </div>
                `);

                this.markers.push(marker);
            }
        });
    }

    // Show toast notification
    showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i class="fas fa-${this.getToastIcon(type)}"></i>
            <div class="toast-message">${message}</div>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        toastContainer.appendChild(toast);

        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 5000);
    }

    // Get toast icon based on type
    getToastIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    // Show connection instructions for a specific network
    showConnectionInstructions(network) {
        console.log('=== showConnectionInstructions START ===');
        console.log('Network data received:', network);
        
        if (!network || !network.ssid) {
            console.error('Invalid network data:', network);
            alert('Error: Invalid network information');
            return;
        }
        
        const modal = document.getElementById('connectionModal');
        if (!modal) {
            console.error('Connection modal not found in DOM');
            alert('Connection modal not found. Please refresh the page.');
            return;
        }
        
        console.log('Modal element found:', modal);

        // Detect platform
        const platform = navigator.platform.toLowerCase();
        const isMac = platform.includes('mac');
        const isWindows = platform.includes('win');
        console.log('Platform detected:', { platform, isMac, isWindows });

        // Get signal quality
        const signalQuality = this.getSignalQuality(parseInt(network.signal));
        const signalColor = this.getSignalColor(parseInt(network.signal));

        // Update modal content
        let modalContent = modal.querySelector('.connection-modal-content');
        const modalBody = modal.querySelector('.modal-body');
        
        if (!modalContent && modalBody) {
            // Create the content div if it doesn't exist
            modalContent = document.createElement('div');
            modalContent.className = 'connection-modal-content';
            modalBody.innerHTML = '';
            modalBody.appendChild(modalContent);
        }
        
        if (!modalContent) {
            console.error('Could not find or create modal content container');
            return;
        }
        
        console.log('Updating modal content...');
        modalContent.innerHTML = `
                <div class="connection-header">
                    <div class="connection-network-info">
                        <h3>
                            <i class="fas fa-wifi" style="color: ${signalColor}"></i>
                            ${network.ssid}
                        </h3>
                        <div class="connection-network-details">
                            <span class="connection-detail-item">
                                <i class="fas fa-signal"></i>
                                Signal: ${network.signal} dBm (${signalQuality})
                            </span>
                            <span class="connection-detail-item">
                                <i class="fas fa-shield-alt"></i>
                                Security: ${network.security || 'Unknown'}
                            </span>
                            <span class="connection-detail-item">
                                <i class="fas fa-fingerprint"></i>
                                BSSID: ${network.bssid}
                            </span>
                        </div>
                    </div>
                </div>
                <div class="connection-instructions">
                    ${isMac ? this.getMacConnectionInstructions(network) : ''}
                    ${isWindows ? this.getWindowsConnectionInstructions(network) : ''}
                    ${!isMac && !isWindows ? this.getGenericConnectionInstructions(network) : ''}
                </div>
            `;

        // Show modal
        console.log('Showing modal...');
        modal.classList.add('show');
        
        // Ensure modal is visible with explicit styles
        modal.style.display = 'flex';
        modal.style.visibility = 'visible';
        modal.style.opacity = '1';
        modal.style.zIndex = '1000';
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100%';
        modal.style.height = '100%';
        modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
        
        // Add ESC key listener to close modal
        const escHandler = (e) => {
            if (e.key === 'Escape' && modal.classList.contains('show')) {
                // Call the app's hideConnectionModal method
                if (window.wifiApp && typeof window.wifiApp.hideConnectionModal === 'function') {
                    window.wifiApp.hideConnectionModal();
                } else {
                    // Fallback: hide directly
                    modal.classList.remove('show');
                    modal.style.display = 'none';
                }
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
        
        // Store handler for cleanup
        modal._escHandler = escHandler;
        
        console.log('Modal classes:', modal.className);
        console.log('Modal display:', modal.style.display);
        console.log('Modal should now be visible');
        
        // Scroll to top of modal content
        if (modalContent) {
            modalContent.scrollTop = 0;
        }
        
        // Set up close button - ensure it's always clickable
        // Use setTimeout to ensure DOM is ready
        setTimeout(() => {
            const closeButton = document.getElementById('closeConnectionModal');
            if (closeButton) {
                // Remove all existing event listeners by cloning
                const newCloseButton = closeButton.cloneNode(true);
                closeButton.parentNode.replaceChild(newCloseButton, closeButton);
                
                // Make sure button is visible and clickable
                newCloseButton.style.pointerEvents = 'auto';
                newCloseButton.style.cursor = 'pointer';
                newCloseButton.style.zIndex = '1001';
                
                // Add multiple event handlers to ensure it works
                const closeHandler = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Close button clicked - closing modal');
                    this.hideConnectionModal();
                    return false;
                };
                
                newCloseButton.addEventListener('click', closeHandler, true); // Use capture phase
                newCloseButton.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                }, true);
                
                // Also set onclick as backup
                newCloseButton.onclick = closeHandler;
                
                // Make sure button is accessible
                newCloseButton.setAttribute('aria-label', 'Close modal');
                newCloseButton.setAttribute('tabindex', '0');
                
                // Focus for accessibility
                setTimeout(() => {
                    try {
                        newCloseButton.focus();
                    } catch (e) {
                        console.log('Could not focus close button:', e);
                    }
                }, 100);
                
                console.log('Close button set up successfully');
            } else {
                console.error('Close button not found after timeout!');
            }
        }, 50);
        
        // Also make the modal content wrapper clickable to close (but not the content itself)
        const modalContentWrapper = modal.querySelector('.connection-modal-content-wrapper');
        if (modalContentWrapper) {
            modalContentWrapper.onclick = (e) => {
                // Only close if clicking the wrapper itself, not its children
                if (e.target === modalContentWrapper) {
                    console.log('Modal wrapper clicked, closing modal');
                    this.hideConnectionModal();
                }
            };
        }
        
        console.log('=== showConnectionInstructions END ===');
    }
    
    // Hide connection modal (can be called directly)
    hideConnectionModal() {
        console.log('hideConnectionModal called');
        const modal = document.getElementById('connectionModal');
        if (modal) {
            // Remove show class
            modal.classList.remove('show');
            
            // Clear all inline styles
            modal.style.display = 'none';
            modal.style.visibility = 'hidden';
            modal.style.opacity = '0';
            modal.style.zIndex = '';
            modal.style.position = '';
            modal.style.top = '';
            modal.style.left = '';
            modal.style.width = '';
            modal.style.height = '';
            modal.style.backgroundColor = '';
            modal.style.alignItems = '';
            modal.style.justifyContent = '';
            
            // Remove ESC key handler if it exists
            if (modal._escHandler) {
                document.removeEventListener('keydown', modal._escHandler);
                delete modal._escHandler;
            }
            
            console.log('Connection modal hidden');
        }
        
        // Also call app's method if available
        if (window.wifiApp && typeof window.wifiApp.hideConnectionModal === 'function') {
            window.wifiApp.hideConnectionModal();
        }
    }

    // Get macOS connection instructions
    getMacConnectionInstructions(network) {
        const hasPassword = network.security && !network.security.includes('Open');
        
        return `
            <div class="platform-instructions mac-instructions">
                <h4><i class="fab fa-apple"></i> Connect on macOS</h4>
                <div class="instruction-steps">
                    <div class="instruction-step">
                        <div class="step-number">1</div>
                        <div class="step-content">
                            <p>Click the <strong>Wi-Fi icon</strong> in the menu bar (top-right corner of your screen)</p>
                            <div class="step-visual">
                                <i class="fas fa-wifi" style="font-size: 24px; color: #4285f4;"></i>
                            </div>
                        </div>
                    </div>
                    <div class="instruction-step">
                        <div class="step-number">2</div>
                        <div class="step-content">
                            <p>Look for <strong>"${network.ssid}"</strong> in the list of available networks</p>
                            <p class="step-note">Networks are listed by signal strength (strongest first)</p>
                        </div>
                    </div>
                    <div class="instruction-step">
                        <div class="step-number">3</div>
                        <div class="step-content">
                            <p>Click on <strong>"${network.ssid}"</strong> to select it</p>
                        </div>
                    </div>
                    ${hasPassword ? `
                    <div class="instruction-step">
                        <div class="step-number">4</div>
                        <div class="step-content">
                            <p>Enter the <strong>Wi-Fi password</strong> when prompted</p>
                            <p class="step-note">The password is case-sensitive. Make sure Caps Lock is off.</p>
                        </div>
                    </div>
                    <div class="instruction-step">
                        <div class="step-number">5</div>
                        <div class="step-content">
                            <p>Click <strong>"Join"</strong> to connect</p>
                        </div>
                    </div>
                    ` : `
                    <div class="instruction-step">
                        <div class="step-number">4</div>
                        <div class="step-content">
                            <p>Click <strong>"Join"</strong> to connect (no password required)</p>
                        </div>
                    </div>
                    `}
                    <div class="instruction-step">
                        <div class="step-number">${hasPassword ? '6' : '5'}</div>
                        <div class="step-content">
                            <p>Wait for the connection to establish. The Wi-Fi icon will show connected status.</p>
                        </div>
                    </div>
                </div>
                <div class="connection-tips">
                    <h5><i class="fas fa-lightbulb"></i> Tips:</h5>
                    <ul>
                        <li>If the network doesn't appear, make sure Wi-Fi is enabled</li>
                        <li>Check that you're within range (signal strength: ${network.signal} dBm)</li>
                        <li>For better performance, connect when signal is -50 dBm or stronger</li>
                    </ul>
                </div>
            </div>
        `;
    }

    // Get Windows connection instructions
    getWindowsConnectionInstructions(network) {
        const hasPassword = network.security && !network.security.includes('Open');
        
        return `
            <div class="platform-instructions windows-instructions">
                <h4><i class="fab fa-windows"></i> Connect on Windows</h4>
                <div class="instruction-steps">
                    <div class="instruction-step">
                        <div class="step-number">1</div>
                        <div class="step-content">
                            <p>Click the <strong>Wi-Fi icon</strong> in the system tray (bottom-right corner)</p>
                            <div class="step-visual">
                                <i class="fas fa-wifi" style="font-size: 24px; color: #4285f4;"></i>
                            </div>
                        </div>
                    </div>
                    <div class="instruction-step">
                        <div class="step-number">2</div>
                        <div class="step-content">
                            <p>Alternatively, go to <strong>Settings → Network & Internet → Wi-Fi</strong></p>
                        </div>
                    </div>
                    <div class="instruction-step">
                        <div class="step-number">3</div>
                        <div class="step-content">
                            <p>Look for <strong>"${network.ssid}"</strong> in the list of available networks</p>
                            <p class="step-note">Networks are listed by signal strength</p>
                        </div>
                    </div>
                    <div class="instruction-step">
                        <div class="step-number">4</div>
                        <div class="step-content">
                            <p>Click on <strong>"${network.ssid}"</strong></p>
                        </div>
                    </div>
                    ${hasPassword ? `
                    <div class="instruction-step">
                        <div class="step-number">5</div>
                        <div class="step-content">
                            <p>Click <strong>"Connect"</strong> button</p>
                        </div>
                    </div>
                    <div class="instruction-step">
                        <div class="step-number">6</div>
                        <div class="step-content">
                            <p>Enter the <strong>Wi-Fi password</strong> when prompted</p>
                            <p class="step-note">The password is case-sensitive</p>
                        </div>
                    </div>
                    <div class="instruction-step">
                        <div class="step-number">7</div>
                        <div class="step-content">
                            <p>Click <strong>"Next"</strong> to complete the connection</p>
                        </div>
                    </div>
                    ` : `
                    <div class="instruction-step">
                        <div class="step-number">5</div>
                        <div class="step-content">
                            <p>Click <strong>"Connect"</strong> (no password required)</p>
                        </div>
                    </div>
                    `}
                    <div class="instruction-step">
                        <div class="step-number">${hasPassword ? '8' : '6'}</div>
                        <div class="step-content">
                            <p>Wait for the connection to establish. The Wi-Fi icon will show connected status.</p>
                        </div>
                    </div>
                </div>
                <div class="connection-tips">
                    <h5><i class="fas fa-lightbulb"></i> Tips:</h5>
                    <ul>
                        <li>If the network doesn't appear, refresh the network list</li>
                        <li>Check that Wi-Fi is enabled in Settings</li>
                        <li>For better performance, connect when signal is -50 dBm or stronger</li>
                    </ul>
                </div>
            </div>
        `;
    }

    // Get generic connection instructions
    getGenericConnectionInstructions(network) {
        return `
            <div class="platform-instructions generic-instructions">
                <h4><i class="fas fa-mobile-alt"></i> Connect to Network</h4>
                <div class="instruction-steps">
                    <div class="instruction-step">
                        <div class="step-number">1</div>
                        <div class="step-content">
                            <p>Open your device's Wi-Fi settings</p>
                        </div>
                    </div>
                    <div class="instruction-step">
                        <div class="step-number">2</div>
                        <div class="step-content">
                            <p>Look for <strong>"${network.ssid}"</strong> in the available networks</p>
                        </div>
                    </div>
                    <div class="instruction-step">
                        <div class="step-number">3</div>
                        <div class="step-content">
                            <p>Select <strong>"${network.ssid}"</strong> and enter the password if required</p>
                        </div>
                    </div>
                    <div class="instruction-step">
                        <div class="step-number">4</div>
                        <div class="step-content">
                            <p>Wait for the connection to establish</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Clear all visualizations
    clear() {
        if (this.signalChart) {
            this.signalChart.data.labels = [];
            this.signalChart.data.datasets.forEach(dataset => dataset.data = []);
            this.signalChart.update();
        }

        this.markers.forEach(marker => this.map.removeLayer(marker));
        this.markers = [];

        this.wifiRangeLayers.forEach(layer => this.map.removeLayer(layer));
        this.wifiRangeLayers = [];

        if (this.heatmapLayer) {
            this.map.removeLayer(this.heatmapLayer);
            this.heatmapLayer = null;
        }
        
        if (this.currentLocationMarker) {
            this.map.removeLayer(this.currentLocationMarker);
            this.currentLocationMarker = null;
        }
        
        this.isHeatmapVisible = false;
    }

    // Location Tracking Visualization Methods
    updateLocationTracking(tracking) {
        if (!tracking || !tracking.current_location) return;

        const location = tracking.current_location;
        const coords = location.coordinates || {};

        // Update current location marker with tracking info
        if (this.currentLocationMarker) {
            const popupContent = `
                <div class="location-popup">
                    <strong>${location.location}</strong><br>
                    Confidence: ${(location.confidence * 100).toFixed(1)}%<br>
                    ${tracking.movement && tracking.movement.moving ? 
                        `Moving: ${this.getDirectionText(tracking.movement.direction)}` : 
                        'Stationary'}
                </div>
            `;
            this.currentLocationMarker.setPopupContent(popupContent);
        }
    }

    updateMovementDirection(direction, distance, speed) {
        if (!this.currentLocationMarker || !direction) return;

        // Add direction arrow to current location marker
        const icon = L.divIcon({
            className: 'movement-direction-icon',
            html: `<div style="transform: rotate(${direction}deg);">→</div>`,
            iconSize: [30, 30]
        });

        // Create or update direction indicator
        if (!this.movementIndicator) {
            const coords = this.currentLocationMarker.getLatLng();
            this.movementIndicator = L.marker(coords, { icon }).addTo(this.map);
        } else {
            this.movementIndicator.setIcon(icon);
            this.movementIndicator.setLatLng(this.currentLocationMarker.getLatLng());
        }
    }

    getDirectionText(degrees) {
        if (degrees === null || degrees === undefined) return 'Unknown';
        const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
        const index = Math.round(degrees / 45) % 8;
        return directions[index];
    }

    showDestination(destination) {
        if (!destination || !destination.coordinates) return;

        const coords = destination.coordinates;
        const latlng = [coords.y || coords.lat || 50, coords.x || coords.lng || 50];

        // Create destination marker
        if (this.destinationMarker) {
            this.destinationMarker.setLatLng(latlng);
        } else {
            const icon = L.divIcon({
                className: 'destination-marker',
                html: '<div class="destination-pin">🎯</div>',
                iconSize: [40, 40]
            });
            this.destinationMarker = L.marker(latlng, { icon })
                .addTo(this.map)
                .bindPopup(`Destination: ${destination.location}`);
        }

        // Draw path to destination if current location exists
        if (this.currentLocationMarker) {
            const currentLatLng = this.currentLocationMarker.getLatLng();
            const path = [currentLatLng, latlng];
            
            if (this.destinationPath) {
                this.destinationPath.setLatLngs(path);
            } else {
                this.destinationPath = L.polyline(path, {
                    color: '#ff6b6b',
                    weight: 3,
                    dashArray: '10, 5',
                    opacity: 0.7
                }).addTo(this.map);
            }
        }
    }

    clearDestination() {
        if (this.destinationMarker) {
            this.map.removeLayer(this.destinationMarker);
            this.destinationMarker = null;
        }
        if (this.destinationPath) {
            this.map.removeLayer(this.destinationPath);
            this.destinationPath = null;
        }
    }

    updateDestinationDistance(distance) {
        if (!this.destinationMarker || distance === null) return;

        const popupContent = `
            <div class="destination-popup">
                <strong>Destination</strong><br>
                Distance: ${distance.toFixed(1)}m
            </div>
        `;
        this.destinationMarker.setPopupContent(popupContent);
    }

    updateStableLocation(location, duration) {
        // Update UI to show stable location indicator
        const stableIndicator = document.getElementById('stableLocationIndicator');
        if (stableIndicator) {
            stableIndicator.textContent = `Stable: ${location} (${Math.floor(duration / 60)} min)`;
            stableIndicator.style.display = 'block';
        }

        // Add visual indicator on map
        if (this.currentLocationMarker) {
            const coords = this.currentLocationMarker.getLatLng();
            if (!this.stableLocationCircle) {
                this.stableLocationCircle = L.circle(coords, {
                    radius: 3,
                    color: '#28a745',
                    fillColor: '#28a745',
                    fillOpacity: 0.3
                }).addTo(this.map);
            } else {
                this.stableLocationCircle.setLatLng(coords);
            }
        }
    }
}

// Create global visualization instance
window.wifiViz = new WiFiVisualization();
