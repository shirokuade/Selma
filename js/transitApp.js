/**
 * Transit App Controller
 * Real-time vehicle visualization for Stockholm Tunnelbana Line 14
 */

import MapService from './services/mapService.js';
import TransitService from './services/transitService.js';

class TransitApp {
    constructor() {
        this.mapService = null;
        this.transitService = new TransitService('cecc59ae58ee4724b460828cf88aeea8'); // No API key = demo mode

        // DOM elements
        this.elements = {
            startTrackingBtn: document.getElementById('startTrackingBtn'),
            stopTrackingBtn: document.getElementById('stopTrackingBtn'),
            fitRouteBtn: document.getElementById('fitRouteBtn'),
            toggleStationsBtn: document.getElementById('toggleStationsBtn'),
            stationsToggleText: document.getElementById('stationsToggleText'),
            statusMessage: document.getElementById('statusMessage'),
            vehicleCount: document.getElementById('vehicleCount'),
            stationList: document.getElementById('stationList')
        };

        this.isTracking = false;
        this.showStations = false;
        this.stations = [];
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
