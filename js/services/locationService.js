/**
 * Location Service Module
 * Handles geolocation API interactions
 */

class LocationService {
    constructor() {
        this.currentPosition = null;
        this.watchId = null;
    }

    /**
     * Check if geolocation is supported by the browser
     * @returns {boolean} True if geolocation is supported
     */
    isSupported() {
        return 'geolocation' in navigator;
    }

    /**
     * Get the current position
     * @param {Object} options - Geolocation options
     * @returns {Promise<GeolocationPosition>} Promise that resolves with position
     */
    getCurrentPosition(options = {}) {
        return new Promise((resolve, reject) => {
            if (!this.isSupported()) {
                reject(new Error('Geolocation is not supported by your browser'));
                return;
            }

            const defaultOptions = {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
                ...options
            };

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    this.currentPosition = position;
                    resolve(position);
                },
                (error) => {
                    reject(this.handleError(error));
                },
                defaultOptions
            );
        });
    }

    /**
     * Watch position changes
     * @param {Function} successCallback - Called on successful position update
     * @param {Function} errorCallback - Called on error
     * @param {Object} options - Geolocation options
     * @returns {number} Watch ID
     */
    watchPosition(successCallback, errorCallback, options = {}) {
        if (!this.isSupported()) {
            errorCallback(new Error('Geolocation is not supported by your browser'));
            return null;
        }

        const defaultOptions = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
            ...options
        };

        this.watchId = navigator.geolocation.watchPosition(
            (position) => {
                this.currentPosition = position;
                successCallback(position);
            },
            (error) => {
                errorCallback(this.handleError(error));
            },
            defaultOptions
        );

        return this.watchId;
    }

    /**
     * Clear position watch
     */
    clearWatch() {
        if (this.watchId !== null) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
        }
    }

    /**
     * Handle geolocation errors
     * @param {GeolocationPositionError} error - The error object
     * @returns {Error} Formatted error
     */
    handleError(error) {
        let message = 'An unknown error occurred';

        switch (error.code) {
            case error.PERMISSION_DENIED:
                message = 'Location permission denied. Please allow location access in your browser settings.';
                break;
            case error.POSITION_UNAVAILABLE:
                message = 'Location information is unavailable. Please check your device settings.';
                break;
            case error.TIMEOUT:
                message = 'The request to get your location timed out. Please try again.';
                break;
        }

        return new Error(message);
    }

    /**
     * Get coordinates from position
     * @param {GeolocationPosition} position - Position object
     * @returns {Object} Coordinates object with lat, lng, accuracy
     */
    static getCoordinates(position) {
        return {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
        };
    }

    /**
     * Calculate distance between two points using Haversine formula
     * @param {Object} point1 - First point {lat, lng}
     * @param {Object} point2 - Second point {lat, lng}
     * @returns {number} Distance in kilometers
     */
    static calculateDistance(point1, point2) {
        const R = 6371; // Earth's radius in kilometers
        const dLat = this.toRadians(point2.lat - point1.lat);
        const dLng = this.toRadians(point2.lng - point1.lng);

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(this.toRadians(point1.lat)) *
                  Math.cos(this.toRadians(point2.lat)) *
                  Math.sin(dLng / 2) * Math.sin(dLng / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    /**
     * Convert degrees to radians
     * @param {number} degrees - Degrees value
     * @returns {number} Radians value
     */
    static toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }
}

export default LocationService;
