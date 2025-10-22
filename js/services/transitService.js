/**
 * Transit Service Module
 * Handles transit data, real-time vehicle tracking, and route information
 * Designed for Stockholm Tunnelbana Line 14 (Red Line)
 * Supports both real Trafiklab GTFS-RT API and simulation mode
 */

class TransitService {
    constructor(apiKey = null, options = {}) {
        this.apiKey = apiKey; // Trafiklab API key (optional for demo mode)
        this.vehicles = new Map();
        this.updateInterval = null;
        this.isSimulationMode = !apiKey || apiKey === 'cecc59ae58ee4724b460828cf88aeea8';
        this.lastFetchTime = null;
        this.errorCount = 0;
        this.maxErrors = 3; // Switch to simulation after 3 consecutive errors
        this.rawGtfsFeed = null; // Store raw GTFS feed for debugging

        // API endpoints
        this.endpoints = {
            primary: 'https://opendata.samtrafiken.se/gtfs-rt/sl/VehiclePositions.pb',
            alternative: 'https://opendata.samtrafiken.se/gtfs-rt-sweden/sl/VehiclePositionsSweden.pb'
        };

        // Configuration
        this.config = {
            lineId: '14',
            routePatterns: ['14', 'T14', 'Red14', 'Röda linjen 14'],
            useCorsProxy: options.useCorsProxy || false,
            corsProxyUrl: options.corsProxyUrl || 'https://corsproxy.io/?',
            enableFallback: options.enableFallback !== false,
            ...options
        };

        if (this.isSimulationMode) {
            console.log('🎮 Transit Service initialized in SIMULATION mode');
        } else {
            console.log('🚇 Transit Service initialized with API key for REAL-TIME data');
        }
    }

    /**
     * Get Line 14 (Röda linjen) station data
     * Stations from Fruängen to Mörby centrum
     */
    getLine14Stations() {
        return [
            { id: 1, name: 'Fruängen', lat: 59.2852, lng: 17.9644, order: 1 },
            { id: 2, name: 'Västertorp', lat: 59.2978, lng: 17.9886, order: 2 },
            { id: 3, name: 'Hägerstensåsen', lat: 59.3025, lng: 18.0064, order: 3 },
            { id: 4, name: 'Telefonplan', lat: 59.3031, lng: 18.0225, order: 4 },
            { id: 5, name: 'Midsommarkransen', lat: 59.3017, lng: 18.0317, order: 5 },
            { id: 6, name: 'Liljeholmen', lat: 59.3106, lng: 18.0233, order: 6 },
            { id: 7, name: 'Hornstull', lat: 59.3164, lng: 18.0339, order: 7 },
            { id: 8, name: 'Zinkensdamm', lat: 59.3181, lng: 18.0478, order: 8 },
            { id: 9, name: 'Mariatorget', lat: 59.3167, lng: 18.0578, order: 9 },
            { id: 10, name: 'Slussen', lat: 59.3200, lng: 18.0719, order: 10 },
            { id: 11, name: 'Gamla stan', lat: 59.3256, lng: 18.0686, order: 11 },
            { id: 12, name: 'T-Centralen', lat: 59.3313, lng: 18.0594, order: 12 },
            { id: 13, name: 'Östermalmstorg', lat: 59.3347, lng: 18.0744, order: 13 },
            { id: 14, name: 'Karlaplan', lat: 59.3365, lng: 18.0877, order: 14 },
            { id: 15, name: 'Gärdet', lat: 59.3381, lng: 18.0975, order: 15 },
            { id: 16, name: 'Ropsten', lat: 59.3544, lng: 18.1025, order: 16 },
            { id: 17, name: 'Tekniska högskolan', lat: 59.3472, lng: 18.0708, order: 17 },
            { id: 18, name: 'Universitetet', lat: 59.3653, lng: 18.0544, order: 18 },
            { id: 19, name: 'Mörby centrum', lat: 59.3950, lng: 18.0314, order: 19 }
        ];
    }

    /**
     * Get route path coordinates for Line 14
     */
    getLine14RoutePath() {
        const stations = this.getLine14Stations();
        return stations.map(station => [station.lat, station.lng]);
    }

    /**
     * Fetch real-time data from Trafiklab GTFS-RT API
     * @returns {Promise<Array>} Vehicle positions
     */
    async fetchRealTimeData() {
        if (this.isSimulationMode) {
            console.log('📡 Simulation mode active - using simulated vehicles');
            return this.simulateVehicles(4);
        }

        try {
            console.log('📡 Fetching real-time data from Trafiklab API...');

            // Construct API URL with key
            let apiUrl = `${this.endpoints.primary}?key=${this.apiKey}`;

            // Use CORS proxy if configured
            if (this.config.useCorsProxy) {
                apiUrl = this.config.corsProxyUrl + encodeURIComponent(apiUrl);
                console.log('🔄 Using CORS proxy:', this.config.corsProxyUrl);
            }

            // Fetch the protobuf data
            const response = await fetch(apiUrl);

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status} ${response.statusText}`);
            }

            // Get response as ArrayBuffer
            const arrayBuffer = await response.arrayBuffer();

            // Try to parse the protobuf data
            const vehicles = await this.parseGTFSRealtimeProtobuf(arrayBuffer);

            // Filter for Line 14 only
            const line14Vehicles = this.filterLine14Vehicles(vehicles);

            console.log(`✅ Received ${vehicles.length} total vehicles, ${line14Vehicles.length} on Line 14`);

            this.errorCount = 0; // Reset error count on success
            this.lastFetchTime = new Date();

            return line14Vehicles.length > 0 ? line14Vehicles : this.simulateVehicles(4);

        } catch (error) {
            console.error('❌ Error fetching real-time data:', error);
            this.errorCount++;

            if (this.errorCount >= this.maxErrors && this.config.enableFallback) {
                console.warn(`⚠️  Switching to simulation mode after ${this.maxErrors} consecutive errors`);
                this.isSimulationMode = true;
            }

            // Return simulated data as fallback
            return this.simulateVehicles(4);
        }
    }

    /**
     * Parse GTFS Realtime protobuf data
     * Note: This requires gtfs-realtime-bindings library or manual protobuf parsing
     * @param {ArrayBuffer} arrayBuffer - Protobuf data
     * @returns {Promise<Array>} Parsed vehicle positions
     */
    async parseGTFSRealtimeProtobuf(arrayBuffer) {
        // Check if gtfs-realtime-bindings library is loaded
        if (typeof GtfsRealtimeBindings !== 'undefined') {
            try {
                const uint8Array = new Uint8Array(arrayBuffer);
                const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(uint8Array);

                // Store raw GTFS feed for debugging purposes
                this.rawGtfsFeed = feed;

                const vehicles = [];

                feed.entity.forEach(entity => {
                    if (entity.vehicle && entity.vehicle.position) {
                        const vehicle = entity.vehicle;
                        const position = vehicle.position;
                        const trip = vehicle.trip;

                        vehicles.push({
                            id: entity.id || vehicle.vehicle?.id || 'Unknown',
                            lat: position.latitude,
                            lng: position.longitude,
                            bearing: position.bearing || 0,
                            speed: position.speed ? position.speed * 3.6 : 0, // Convert m/s to km/h
                            timestamp: vehicle.timestamp || Date.now() / 1000,
                            routeId: trip?.routeId || '',
                            tripId: trip?.tripId || '',
                            stopId: vehicle.stopId || '',
                            currentStatus: vehicle.currentStatus || 'IN_TRANSIT_TO'
                        });
                    }
                });

                return vehicles;
            } catch (error) {
                console.error('Error parsing protobuf with gtfs-realtime-bindings:', error);
                throw error;
            }
        } else {
            console.warn('⚠️  gtfs-realtime-bindings library not loaded');
            console.info('💡 To use real-time data, include the library in your HTML:');
            console.info('<script src="https://cdn.jsdelivr.net/npm/gtfs-realtime-bindings@1.1.0/dist/bundle.js"></script>');
            throw new Error('GTFS Realtime bindings library not available');
        }
    }

    /**
     * Filter vehicles for Line 14 only
     * @param {Array} vehicles - All vehicles
     * @returns {Array} Line 14 vehicles
     */
    filterLine14Vehicles(vehicles) {
        return vehicles.filter(vehicle => {
            const routeId = vehicle.routeId?.toString() || '';
            return this.config.routePatterns.some(pattern =>
                routeId.includes(pattern) || routeId === this.config.lineId
            );
        }).map(vehicle => this.convertToStandardFormat(vehicle));
    }

    /**
     * Convert GTFS-RT vehicle to our standard format
     * @param {Object} vehicle - GTFS-RT vehicle
     * @returns {Object} Standard format vehicle
     */
    convertToStandardFormat(vehicle) {
        const stations = this.getLine14Stations();

        // Determine direction based on position or bearing
        const direction = this.determineDirection(vehicle, stations);
        const destinationStation = direction === 'north'
            ? stations[stations.length - 1].name
            : stations[0].name;

        return {
            id: vehicle.id,
            line: '14',
            lat: vehicle.lat,
            lng: vehicle.lng,
            direction: direction,
            destination: destinationStation,
            speed: vehicle.speed || 0,
            nextStation: this.getNextStation(stations, vehicle, direction),
            bearing: vehicle.bearing || this.calculateBearing(stations, vehicle, direction),
            timestamp: vehicle.timestamp
        };
    }

    /**
     * Determine vehicle direction based on position
     * @param {Object} vehicle - Vehicle object
     * @param {Array} stations - Station list
     * @returns {string} Direction ('north' or 'south')
     */
    determineDirection(vehicle, stations) {
        // Simple heuristic: if bearing > 180, going south; otherwise north
        if (vehicle.bearing) {
            return vehicle.bearing > 180 ? 'south' : 'north';
        }

        // Fallback: find closest station and use position relative to middle
        const midPoint = stations[Math.floor(stations.length / 2)];
        return vehicle.lat > midPoint.lat ? 'north' : 'south';
    }

    /**
     * Simulate vehicle positions (demo mode)
     * @param {number} vehicleCount - Number of vehicles to simulate
     * @returns {Array} Array of vehicle objects with positions
     */
    simulateVehicles(vehicleCount = 4) {
        const stations = this.getLine14Stations();
        const vehicles = [];
        const totalStations = stations.length;

        for (let i = 0; i < vehicleCount; i++) {
            // Distribute vehicles evenly along the route
            const progress = (i / vehicleCount) + (Date.now() / 100000) % 1;
            const position = this.interpolatePosition(stations, progress);

            // Determine direction (alternating)
            const direction = i % 2 === 0 ? 'south' : 'north';
            const destinationStation = direction === 'north'
                ? stations[totalStations - 1].name
                : stations[0].name;

            vehicles.push({
                id: `T14-SIM-${i + 1}`,
                line: '14',
                lat: position.lat,
                lng: position.lng,
                direction: direction,
                destination: destinationStation,
                speed: 40 + Math.random() * 20, // 40-60 km/h
                nextStation: this.getNextStation(stations, position, direction),
                bearing: this.calculateBearing(stations, position, direction)
            });
        }

        return vehicles;
    }

    /**
     * Interpolate position along the route
     */
    interpolatePosition(stations, progress) {
        const totalStations = stations.length;
        const exactPosition = progress * (totalStations - 1);
        const index = Math.floor(exactPosition);
        const fraction = exactPosition - index;

        if (index >= totalStations - 1) {
            return { ...stations[totalStations - 1] };
        }

        const start = stations[index];
        const end = stations[index + 1];

        return {
            lat: start.lat + (end.lat - start.lat) * fraction,
            lng: start.lng + (end.lng - start.lng) * fraction
        };
    }

    /**
     * Get next station based on current position and direction
     */
    getNextStation(stations, position, direction) {
        // Find closest station
        let closestIndex = 0;
        let minDistance = Infinity;

        stations.forEach((station, index) => {
            const distance = Math.sqrt(
                Math.pow(station.lat - position.lat, 2) +
                Math.pow(station.lng - position.lng, 2)
            );
            if (distance < minDistance) {
                minDistance = distance;
                closestIndex = index;
            }
        });

        // Get next station based on direction
        if (direction === 'north') {
            return closestIndex < stations.length - 1
                ? stations[closestIndex + 1].name
                : stations[closestIndex].name;
        } else {
            return closestIndex > 0
                ? stations[closestIndex - 1].name
                : stations[closestIndex].name;
        }
    }

    /**
     * Calculate bearing/heading for vehicle icon rotation
     */
    calculateBearing(stations, position, direction) {
        // Simplified bearing calculation
        return direction === 'north' ? 45 : 225; // NE or SW
    }

    /**
     * Start real-time updates
     * @param {Function} callback - Called with updated vehicle data
     * @param {number} interval - Update interval in milliseconds
     */
    startRealtimeUpdates(callback, interval = 10000) {
        if (this.updateInterval) {
            this.stopRealtimeUpdates();
        }

        const updateVehicles = async () => {
            const vehicles = await this.fetchRealTimeData();
            callback(vehicles);
        };

        // Initial update
        updateVehicles();

        // Set up interval for continuous updates
        this.updateInterval = setInterval(updateVehicles, interval);

        console.log(`⏰ Real-time updates started (interval: ${interval}ms)`);
    }

    /**
     * Stop real-time updates
     */
    stopRealtimeUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
            console.log('⏸️  Real-time updates stopped');
        }
    }

    /**
     * Get line metadata
     */
    getLineInfo() {
        return {
            id: '14',
            name: 'Tunnelbana 14',
            color: '#ED1C24', // Red line color
            type: 'metro',
            operator: 'SL (Storstockholms Lokaltrafik)',
            length: '19.5 km',
            stations: 19,
            mode: this.isSimulationMode ? 'SIMULATION' : 'REAL-TIME'
        };
    }

    /**
     * Get service status
     */
    getStatus() {
        return {
            mode: this.isSimulationMode ? 'simulation' : 'real-time',
            apiKey: this.apiKey ? '✓ Configured' : '✗ Not configured',
            lastFetch: this.lastFetchTime,
            errorCount: this.errorCount,
            endpoint: this.endpoints.primary
        };
    }
}

export default TransitService;
