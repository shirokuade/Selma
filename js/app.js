/**
 * Main Application Controller
 * Coordinates between LocationService and MapService
 */

import LocationService from './services/locationService.js';
import MapService from './services/mapService.js';

class App {
    constructor() {
        this.locationService = new LocationService();
        this.mapService = null;

        // DOM elements
        this.elements = {
            getLocationBtn: document.getElementById('getLocationBtn'),
            statusMessage: document.getElementById('statusMessage'),
            locationInfo: document.getElementById('locationInfo'),
            latitude: document.getElementById('latitude'),
            longitude: document.getElementById('longitude'),
            accuracy: document.getElementById('accuracy')
        };

        this.isInitialized = false;
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            // Initialize map
            this.mapService = new MapService('map', {
                center: [20, 0],
                zoom: 2
            });
            this.mapService.initialize();

            // Set up event listeners
            this.setupEventListeners();

            // Check geolocation support
            if (!this.locationService.isSupported()) {
                this.showStatus('error', 'Geolocation is not supported by your browser');
                this.elements.getLocationBtn.disabled = true;
            }

            this.isInitialized = true;
            console.log('App initialized successfully');
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showStatus('error', 'Failed to initialize the application');
        }
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        this.elements.getLocationBtn.addEventListener('click', () => {
            this.getUserLocation();
        });
    }

    /**
     * Get user's current location
     */
    async getUserLocation() {
        try {
            // Update button state
            this.elements.getLocationBtn.disabled = true;
            this.elements.getLocationBtn.classList.add('loading');
            this.showStatus('info', 'Getting your location...');

            // Get position
            const position = await this.locationService.getCurrentPosition({
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            });

            // Extract coordinates
            const coords = LocationService.getCoordinates(position);

            // Update UI
            this.updateLocationInfo(coords);
            this.mapService.setUserLocation(coords.lat, coords.lng, coords.accuracy);

            this.showStatus('success', 'Location found successfully!');

            // Hide status after 3 seconds
            setTimeout(() => {
                this.hideStatus();
            }, 3000);

        } catch (error) {
            console.error('Error getting location:', error);
            this.showStatus('error', error.message);
        } finally {
            // Reset button state
            this.elements.getLocationBtn.disabled = false;
            this.elements.getLocationBtn.classList.remove('loading');
        }
    }

    /**
     * Update location information display
     * @param {Object} coords - Coordinates object
     */
    updateLocationInfo(coords) {
        this.elements.latitude.textContent = coords.lat.toFixed(6);
        this.elements.longitude.textContent = coords.lng.toFixed(6);
        this.elements.accuracy.textContent = `±${Math.round(coords.accuracy)} meters`;

        this.elements.locationInfo.classList.remove('hidden');
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
        if (this.mapService) {
            this.mapService.destroy();
        }
        this.locationService.clearWatch();
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init();

    // Make app globally available for debugging
    window.app = app;
});
