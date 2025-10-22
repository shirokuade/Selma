/**
 * Transit App Controller
 * Real-time vehicle visualization for Stockholm Tunnelbana Line 14
 */

import MapService from './services/mapService.js';
import TransitService from './services/transitService.js';
import CONFIG from './config.js';

class TransitApp {
    constructor() {
        this.mapService = null;

        // Initialize TransitService with API key from config
        // If API key is not set or is placeholder, uses simulation mode
        const apiKey = CONFIG.TRAFIKLAB_API_KEY !== 'cecc59ae58ee4724b460828cf88aeea8'
            ? CONFIG.TRAFIKLAB_API_KEY
            : null;

        // Initialize with API key and optional CORS proxy config
        this.transitService = new TransitService(apiKey, {
            useCorsProxy: false, // Set to true if you encounter CORS issues
            corsProxyUrl: 'https://corsproxy.io/?'
        });

        // DOM elements
        this.elements = {
            startTrackingBtn: document.getElementById('startTrackingBtn'),
            stopTrackingBtn: document.getElementById('stopTrackingBtn'),
            fitRouteBtn: document.getElementById('fitRouteBtn'),
            toggleStationsBtn: document.getElementById('toggleStationsBtn'),
            stationsToggleText: document.getElementById('stationsToggleText'),
            statusMessage: document.getElementById('statusMessage'),
            vehicleCount: document.getElementById('vehicleCount'),
            stationList: document.getElementById('stationList'),
            // Raw data viewer elements
            toggleRawDataBtn: document.getElementById('toggleRawDataBtn'),
            rawDataToggleText: document.getElementById('rawDataToggleText'),
            rawDataContainer: document.getElementById('rawDataContainer'),
            apiStatus: document.getElementById('apiStatus'),
            parsedVehicleData: document.getElementById('parsedVehicleData'),
            rawGtfsData: document.getElementById('rawGtfsData'),
            lastUpdateTime: document.getElementById('lastUpdateTime'),
            dataSource: document.getElementById('dataSource'),
            updateCount: document.getElementById('updateCount')
        };

        this.isTracking = false;
        this.showStations = false;
        this.showRawData = false;
        this.stations = [];
        this.updateCounter = 0;
        this.rawGtfsFeed = null;
    }

    /**
     * Initialize the transit app
     */
    async init() {
        try {
            // Initialize map centered on Stockholm
            this.mapService = new MapService('map', {
                center: [59.3293, 18.0686], // Stockholm center
                zoom: 12
            });
            this.mapService.initialize();

            // Fix map rendering issue
            setTimeout(() => {
                this.mapService.invalidateSize();
            }, 100);

            // Get line 14 data
            this.stations = this.transitService.getLine14Stations();
            const routePath = this.transitService.getLine14RoutePath();

            // Draw route on map
            this.mapService.drawRoute(routePath);

            // Fit map to route
            this.mapService.fitRoute();

            // Populate station list
            this.populateStationList();

            // Set up event listeners
            this.setupEventListeners();

            this.showStatus('info', 'Transit map initialized. Click "Start Real-time Tracking" to see live vehicles.');

            console.log('Transit app initialized successfully');
        } catch (error) {
            console.error('Failed to initialize transit app:', error);
            this.showStatus('error', 'Failed to initialize the transit application');
        }
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        this.elements.startTrackingBtn.addEventListener('click', () => {
            this.startTracking();
        });

        this.elements.stopTrackingBtn.addEventListener('click', () => {
            this.stopTracking();
        });

        this.elements.fitRouteBtn.addEventListener('click', () => {
            this.mapService.fitRoute();
        });

        this.elements.toggleStationsBtn.addEventListener('click', () => {
            this.toggleStations();
        });

        this.elements.toggleRawDataBtn.addEventListener('click', () => {
            this.toggleRawData();
        });
    }

    /**
     * Start real-time vehicle tracking
     */
    startTracking() {
        if (this.isTracking) return;

        this.isTracking = true;
        this.elements.startTrackingBtn.style.display = 'none';
        this.elements.stopTrackingBtn.style.display = 'inline-flex';

        this.showStatus('info', '▶️ Real-time tracking started (Demo mode)');

        // Start real-time updates (every 5 seconds)
        this.transitService.startRealtimeUpdates((vehicles) => {
            this.updateVehicles(vehicles);
        }, 5000);
    }

    /**
     * Stop real-time vehicle tracking
     */
    stopTracking() {
        if (!this.isTracking) return;

        this.isTracking = false;
        this.elements.startTrackingBtn.style.display = 'inline-flex';
        this.elements.stopTrackingBtn.style.display = 'none';

        this.transitService.stopRealtimeUpdates();
        this.mapService.clearVehicles();
        this.elements.vehicleCount.textContent = '0';

        this.showStatus('info', '⏸️ Tracking stopped');
    }

    /**
     * Toggle station markers visibility
     */
    toggleStations() {
        this.showStations = !this.showStations;

        if (this.showStations) {
            this.mapService.addStations(this.stations);
            this.elements.stationsToggleText.textContent = 'Hide Stations';
            this.showStatus('success', 'Station markers shown');
        } else {
            this.mapService.clearStations();
            this.elements.stationsToggleText.textContent = 'Show Stations';
            this.showStatus('info', 'Station markers hidden');
        }

        // Hide status after 2 seconds
        setTimeout(() => {
            if (!this.isTracking) {
                this.hideStatus();
            }
        }, 2000);
    }

    /**
     * Update vehicle positions on map
     * @param {Array} vehicles - Array of vehicle objects
     */
    updateVehicles(vehicles) {
        this.mapService.updateVehicles(vehicles);
        this.elements.vehicleCount.textContent = vehicles.length;

        // Update raw data display
        this.updateCounter++;
        this.updateRawDataDisplay(vehicles);
    }

    /**
     * Populate the station list in the UI
     */
    populateStationList() {
        this.elements.stationList.innerHTML = '';

        this.stations.forEach((station, index) => {
            const stationItem = document.createElement('div');
            stationItem.className = 'station-item';
            stationItem.innerHTML = `
                <strong>${index + 1}.</strong> ${station.name}
                <span style="float: right; color: #999; font-size: 0.85em;">
                    ${station.lat.toFixed(4)}, ${station.lng.toFixed(4)}
                </span>
            `;

            // Add click handler to center map on station
            stationItem.style.cursor = 'pointer';
            stationItem.addEventListener('click', () => {
                this.mapService.setView(station.lat, station.lng, 15);
                this.showStatus('info', `Centered on ${station.name}`);
                setTimeout(() => this.hideStatus(), 2000);
            });

            this.elements.stationList.appendChild(stationItem);
        });
    }

    /**
     * Show status message
     * @param {string} type - Message type (success, error, info)
     * @param {string} message - Message text
     */
    showStatus(type, message) {
        this.elements.statusMessage.className = 'status-message show ' + type;
        this.elements.statusMessage.textContent = message;
    }

    /**
     * Hide status message
     */
    hideStatus() {
        this.elements.statusMessage.classList.remove('show');
    }

    /**
     * Toggle raw data viewer visibility
     */
    toggleRawData() {
        this.showRawData = !this.showRawData;

        if (this.showRawData) {
            this.elements.rawDataContainer.style.display = 'block';
            this.elements.rawDataToggleText.textContent = 'Hide Raw Data';
        } else {
            this.elements.rawDataContainer.style.display = 'none';
            this.elements.rawDataToggleText.textContent = 'Show Raw Data';
        }
    }

    /**
     * Update raw data display
     * @param {Array} vehicles - Parsed vehicle data
     */
    updateRawDataDisplay(vehicles) {
        // Update timestamp
        const now = new Date();
        this.elements.lastUpdateTime.textContent = now.toLocaleTimeString();
        this.elements.updateCount.textContent = this.updateCounter;

        // Update data source
        const status = this.transitService.getStatus();
        this.elements.dataSource.textContent = status.mode === 'simulation'
            ? '🎮 Simulation Mode'
            : '📡 Trafiklab API (Real-time)';

        // Update API status
        const apiStatusHtml = `
            <strong>Mode:</strong> ${status.mode}<br>
            <strong>API Key:</strong> ${status.apiKey}<br>
            <strong>Endpoint:</strong> ${status.endpoint}<br>
            <strong>Error Count:</strong> ${status.errorCount}<br>
            <strong>Last Fetch:</strong> ${status.lastFetch ? status.lastFetch.toLocaleTimeString() : 'Never'}
        `;
        this.elements.apiStatus.innerHTML = apiStatusHtml;

        // Update parsed vehicle data
        const parsedDataJson = JSON.stringify(vehicles, null, 2);
        this.elements.parsedVehicleData.textContent = parsedDataJson;

        // Update raw GTFS data if available
        if (this.transitService.rawGtfsFeed) {
            try {
                // Convert the GTFS feed to a readable format
                const rawDataJson = JSON.stringify(this.transitService.rawGtfsFeed, (key, value) => {
                    // Handle special protobuf types
                    if (value && typeof value === 'object') {
                        // If it's a Long number, convert to string
                        if (value.low !== undefined && value.high !== undefined) {
                            return value.toString();
                        }
                        // If it has a toJSON method, use it
                        if (typeof value.toJSON === 'function') {
                            return value.toJSON();
                        }
                    }
                    return value;
                }, 2);

                this.elements.rawGtfsData.textContent = rawDataJson;
            } catch (error) {
                this.elements.rawGtfsData.textContent = 'Error formatting raw GTFS data: ' + error.message;
            }
        } else {
            this.elements.rawGtfsData.textContent = status.mode === 'simulation'
                ? 'No raw GTFS data (simulation mode active)'
                : 'Raw GTFS data not available yet';
        }
    }

    /**
     * Clean up and destroy app instance
     */
    destroy() {
        this.stopTracking();
        if (this.mapService) {
            this.mapService.destroy();
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Wait for Leaflet to be available
    const initializeApp = () => {
        if (typeof L === 'undefined') {
            console.log('Waiting for Leaflet to load...');
            setTimeout(initializeApp, 50);
            return;
        }

        const app = new TransitApp();
        app.init();

        // Make app globally available for debugging
        window.transitApp = app;
    };

    initializeApp();
});
