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

        // Transit-specific properties
        this.routePolyline = null;
        this.stationMarkers = [];
        this.vehicleMarkers = new Map();

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

    // ==================== Transit Visualization Methods ====================

    /**
     * Draw transit route on the map
     * @param {Array} routePath - Array of [lat, lng] coordinates
     * @param {Object} options - Polyline options
     */
    drawRoute(routePath, options = {}) {
        if (!this.map) {
            throw new Error('Map not initialized');
        }

        // Remove existing route if any
        if (this.routePolyline) {
            this.map.removeLayer(this.routePolyline);
        }

        const defaultOptions = {
            color: '#ED1C24', // Red line color
            weight: 4,
            opacity: 0.7,
            ...options
        };

        this.routePolyline = L.polyline(routePath, defaultOptions).addTo(this.map);
        return this.routePolyline;
    }

    /**
     * Add station markers to the map
     * @param {Array} stations - Array of station objects
     * @param {Object} options - Marker options
     */
    addStations(stations, options = {}) {
        if (!this.map) {
            throw new Error('Map not initialized');
        }

        // Clear existing station markers
        this.clearStations();

        stations.forEach(station => {
            const stationIcon = L.divIcon({
                className: 'station-marker',
                html: `
                    <div style="
                        width: 12px;
                        height: 12px;
                        background: white;
                        border: 3px solid #ED1C24;
                        border-radius: 50%;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                    "></div>
                `,
                iconSize: [12, 12],
                iconAnchor: [6, 6]
            });

            const marker = L.marker([station.lat, station.lng], {
                icon: stationIcon,
                title: station.name,
                ...options
            }).addTo(this.map);

            // Add popup with station info
            marker.bindPopup(`
                <div style="text-align: center; padding: 5px;">
                    <strong>${station.name}</strong><br>
                    <small>Line 14</small><br>
                    <small style="color: #666;">${station.lat.toFixed(4)}, ${station.lng.toFixed(4)}</small>
                </div>
            `);

            this.stationMarkers.push(marker);
        });

        return this.stationMarkers;
    }

    /**
     * Clear all station markers
     */
    clearStations() {
        this.stationMarkers.forEach(marker => {
            this.map.removeLayer(marker);
        });
        this.stationMarkers = [];
    }

    /**
     * Update vehicle positions on the map
     * @param {Array} vehicles - Array of vehicle objects with positions
     */
    updateVehicles(vehicles) {
        if (!this.map) {
            throw new Error('Map not initialized');
        }

        const currentVehicleIds = new Set();

        vehicles.forEach(vehicle => {
            currentVehicleIds.add(vehicle.id);

            if (this.vehicleMarkers.has(vehicle.id)) {
                // Update existing vehicle
                const marker = this.vehicleMarkers.get(vehicle.id);
                marker.setLatLng([vehicle.lat, vehicle.lng]);

                // Update popup content
                const popupContent = this.createVehiclePopup(vehicle);
                marker.getPopup().setContent(popupContent);
            } else {
                // Add new vehicle
                this.addVehicle(vehicle);
            }
        });

        // Remove vehicles that are no longer present
        this.vehicleMarkers.forEach((marker, id) => {
            if (!currentVehicleIds.has(id)) {
                this.map.removeLayer(marker);
                this.vehicleMarkers.delete(id);
            }
        });
    }

    /**
     * Add a single vehicle marker
     * @param {Object} vehicle - Vehicle object
     */
    addVehicle(vehicle) {
        const vehicleIcon = L.divIcon({
            className: 'vehicle-marker',
            html: `
                <div style="
                    width: 24px;
                    height: 24px;
                    background: #ED1C24;
                    border: 3px solid white;
                    border-radius: 50%;
                    box-shadow: 0 3px 6px rgba(0,0,0,0.4);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 10px;
                    font-weight: bold;
                    transform: rotate(${vehicle.bearing || 0}deg);
                ">
                    <div style="transform: rotate(-${vehicle.bearing || 0}deg);">🚇</div>
                </div>
            `,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        });

        const marker = L.marker([vehicle.lat, vehicle.lng], {
            icon: vehicleIcon,
            title: vehicle.id
        }).addTo(this.map);

        const popupContent = this.createVehiclePopup(vehicle);
        marker.bindPopup(popupContent);

        this.vehicleMarkers.set(vehicle.id, marker);
        return marker;
    }

    /**
     * Create popup content for vehicle
     * @param {Object} vehicle - Vehicle object
     * @returns {string} HTML content
     */
    createVehiclePopup(vehicle) {
        return `
            <div style="text-align: center; padding: 5px; min-width: 150px;">
                <strong>🚇 ${vehicle.id}</strong><br>
                <div style="margin: 8px 0; padding: 4px; background: #f0f0f0; border-radius: 4px;">
                    <small><strong>Line 14</strong></small>
                </div>
                <div style="text-align: left; font-size: 12px;">
                    <div style="margin: 4px 0;">
                        <strong>Direction:</strong> ${vehicle.direction === 'north' ? '⬆️ North' : '⬇️ South'}
                    </div>
                    <div style="margin: 4px 0;">
                        <strong>To:</strong> ${vehicle.destination}
                    </div>
                    <div style="margin: 4px 0;">
                        <strong>Next:</strong> ${vehicle.nextStation}
                    </div>
                    <div style="margin: 4px 0;">
                        <strong>Speed:</strong> ${Math.round(vehicle.speed)} km/h
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Clear all vehicle markers
     */
    clearVehicles() {
        this.vehicleMarkers.forEach(marker => {
            this.map.removeLayer(marker);
        });
        this.vehicleMarkers.clear();
    }

    /**
     * Fit map to show the entire route
     */
    fitRoute() {
        if (!this.map || !this.routePolyline) {
            return;
        }

        this.map.fitBounds(this.routePolyline.getBounds().pad(0.1));
    }
}

export default MapService;
