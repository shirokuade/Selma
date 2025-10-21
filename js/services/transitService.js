/**
 * Transit Service Module
 * Handles transit data, real-time vehicle tracking, and route information
 * Designed for Stockholm Tunnelbana Line 14 (Red Line)
 */

class TransitService {
    constructor(apiKey = null) {
        this.apiKey = apiKey; // Trafiklab API key (optional for demo mode)
        this.vehicles = new Map();
        this.updateInterval = null;
        this.isSimulationMode = !apiKey; // Use simulation if no API key provided
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
                id: `T14-${i + 1}`,
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
    startRealtimeUpdates(callback, interval = 5000) {
        if (this.updateInterval) {
            this.stopRealtimeUpdates();
        }

        // Initial update
        const updateVehicles = () => {
            let vehicles;

            if (this.isSimulationMode) {
                vehicles = this.simulateVehicles(4);
            } else {
                // TODO: Implement real API call to Trafiklab
                vehicles = this.fetchRealTimeData();
            }

            callback(vehicles);
        };

        updateVehicles();
        this.updateInterval = setInterval(updateVehicles, interval);
    }

    /**
     * Stop real-time updates
     */
    stopRealtimeUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    /**
     * Fetch real-time data from Trafiklab API
     * @returns {Promise<Array>} Vehicle positions
     */
    async fetchRealTimeData() {
        if (!this.apiKey) {
            console.warn('No API key provided, using simulation mode');
            return this.simulateVehicles(4);
        }

        try {
            // TODO: Implement actual Trafiklab API call
            // Example endpoint structure (needs verification):
            // const response = await fetch(
            //     `https://api.trafiklab.se/v2.1/positions?key=${this.apiKey}&line=14`
            // );
            // const data = await response.json();
            // return this.parseApiResponse(data);

            // For now, return simulated data
            return this.simulateVehicles(4);
        } catch (error) {
            console.error('Error fetching real-time data:', error);
            return this.simulateVehicles(4);
        }
    }

    /**
     * Parse API response and convert to standard format
     */
    parseApiResponse(data) {
        // TODO: Implement based on actual API response structure
        return [];
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
            stations: 19
        };
    }
}

export default TransitService;
