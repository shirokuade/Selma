/**
 * Map Service Module
 * Handles map initialization and interactions using Leaflet.js
 */

class MapService {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.map = null;
        this.markers = [];
        this.userMarker = null;
        this.accuracyCircle = null;

        // Default options
        this.defaultOptions = {
            center: [0, 0],
            zoom: 2,
            maxZoom: 18,
            minZoom: 2,
            zoomControl: true,
            ...options
        };
    }

    /**
     * Initialize the map
     * @returns {Object} The map instance
     */
    initialize() {
        if (this.map) {
            console.warn('Map already initialized');
            return this.map;
        }

        try {
            this.map = L.map(this.containerId, {
                center: this.defaultOptions.center,
                zoom: this.defaultOptions.zoom,
                maxZoom: this.defaultOptions.maxZoom,
                minZoom: this.defaultOptions.minZoom,
                zoomControl: this.defaultOptions.zoomControl
            });

            // Add tile layer (OpenStreetMap)
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                maxZoom: 19
            }).addTo(this.map);

            return this.map;
        } catch (error) {
            console.error('Failed to initialize map:', error);
            throw new Error('Failed to initialize map. Please refresh the page.');
        }
    }

    /**
     * Set the map view to specific coordinates
     * @param {number} lat - Latitude
     * @param {number} lng - Longitude
     * @param {number} zoom - Zoom level
     */
    setView(lat, lng, zoom = 15) {
        if (!this.map) {
            throw new Error('Map not initialized');
        }
        this.map.setView([lat, lng], zoom);
    }

    /**
     * Add or update the user location marker
     * @param {number} lat - Latitude
     * @param {number} lng - Longitude
     * @param {number} accuracy - Accuracy in meters
     * @param {Object} options - Marker options
     */
    setUserLocation(lat, lng, accuracy = null, options = {}) {
        if (!this.map) {
            throw new Error('Map not initialized');
        }

        // Remove existing user marker and accuracy circle
        if (this.userMarker) {
            this.map.removeLayer(this.userMarker);
        }
        if (this.accuracyCircle) {
            this.map.removeLayer(this.accuracyCircle);
        }

        // Create custom icon for user location
        const userIcon = L.divIcon({
            className: 'user-location-marker',
            html: `
                <div style="
                    width: 20px;
                    height: 20px;
                    background: #3b82f6;
                    border: 3px solid white;
                    border-radius: 50%;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                "></div>
            `,
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        });

        // Add user marker
        this.userMarker = L.marker([lat, lng], {
            icon: userIcon,
            title: 'Your Location',
            ...options
        }).addTo(this.map);

        // Add popup
        const popupContent = `
            <div style="text-align: center; padding: 5px;">
                <strong>You are here</strong><br>
                <small>${lat.toFixed(6)}, ${lng.toFixed(6)}</small>
                ${accuracy ? `<br><small>Accuracy: ±${Math.round(accuracy)}m</small>` : ''}
            </div>
        `;
        this.userMarker.bindPopup(popupContent).openPopup();

        // Add accuracy circle if accuracy is provided
        if (accuracy) {
            this.accuracyCircle = L.circle([lat, lng], {
                radius: accuracy,
                color: '#3b82f6',
                fillColor: '#3b82f6',
                fillOpacity: 0.1,
                weight: 1
            }).addTo(this.map);
        }

        // Center map on user location
        this.setView(lat, lng, 15);
    }

    /**
     * Add a marker to the map
     * @param {number} lat - Latitude
     * @param {number} lng - Longitude
     * @param {Object} options - Marker options
     * @returns {Object} The marker instance
     */
    addMarker(lat, lng, options = {}) {
        if (!this.map) {
            throw new Error('Map not initialized');
        }

        const marker = L.marker([lat, lng], options).addTo(this.map);
        this.markers.push(marker);
        return marker;
    }

    /**
     * Remove a marker from the map
     * @param {Object} marker - The marker to remove
     */
    removeMarker(marker) {
        if (!this.map) {
            throw new Error('Map not initialized');
        }

        this.map.removeLayer(marker);
        this.markers = this.markers.filter(m => m !== marker);
    }

    /**
     * Clear all markers from the map
     */
    clearMarkers() {
        this.markers.forEach(marker => {
            this.map.removeLayer(marker);
        });
        this.markers = [];
    }

    /**
     * Add a circle to the map
     * @param {number} lat - Latitude
     * @param {number} lng - Longitude
     * @param {number} radius - Radius in meters
     * @param {Object} options - Circle options
     * @returns {Object} The circle instance
     */
    addCircle(lat, lng, radius, options = {}) {
        if (!this.map) {
            throw new Error('Map not initialized');
        }

        return L.circle([lat, lng], { radius, ...options }).addTo(this.map);
    }

    /**
     * Fit the map to show all markers
     */
    fitBounds() {
        if (!this.map || this.markers.length === 0) {
            return;
        }

        const group = L.featureGroup(this.markers);
        this.map.fitBounds(group.getBounds().pad(0.1));
    }

    /**
     * Destroy the map instance
     */
    destroy() {
        if (this.map) {
            this.map.remove();
            this.map = null;
            this.markers = [];
            this.userMarker = null;
            this.accuracyCircle = null;
        }
    }

    /**
     * Get the map instance
     * @returns {Object} The Leaflet map instance
     */
    getMap() {
        return this.map;
    }

    /**
     * Invalidate map size (useful after container resize)
     */
    invalidateSize() {
        if (this.map) {
            this.map.invalidateSize();
        }
    }
}

export default MapService;
