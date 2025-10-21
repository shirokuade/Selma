/**
 * Configuration File
 *
 * IMPORTANT: Do NOT commit this file with your actual API key to public repositories!
 * Add this file to .gitignore to keep your API key secure.
 *
 * To get a Trafiklab API key:
 * 1. Visit https://www.trafiklab.se/
 * 2. Create a free account
 * 3. Register a new project
 * 4. Subscribe to "GTFS Regional" API (free tier available)
 * 5. Copy your API key here
 */

const CONFIG = {
    // Your Trafiklab API key
    // Replace 'YOUR_API_KEY_HERE' with your actual API key
    TRAFIKLAB_API_KEY: 'YOUR_API_KEY_HERE',

    // API Endpoints
    API: {
        // GTFS-RT Vehicle Positions for SL (Stockholm)
        VEHICLE_POSITIONS: 'https://opendata.samtrafiken.se/gtfs-rt/sl/VehiclePositions.pb',

        // Alternative endpoint (if primary doesn't work)
        VEHICLE_POSITIONS_ALT: 'https://opendata.samtrafiken.se/gtfs-rt-sweden/sl/VehiclePositionsSweden.pb',

        // Trip Updates endpoint
        TRIP_UPDATES: 'https://opendata.samtrafiken.se/gtfs-rt/sl/TripUpdates.pb',

        // Service Alerts endpoint
        SERVICE_ALERTS: 'https://opendata.samtrafiken.se/gtfs-rt/sl/ServiceAlerts.pb'
    },

    // Update interval in milliseconds (default: 10 seconds)
    // Note: Trafiklab updates vehicle positions every 2 seconds
    UPDATE_INTERVAL: 10000,

    // Line 14 configuration
    LINE_14: {
        // GTFS route_id for Line 14 (may need adjustment based on actual GTFS data)
        ROUTE_ID: '14',

        // Alternative route identifiers to try
        ROUTE_IDS: ['14', 'T14', 'Tunnelbana 14', 'Red 14']
    },

    // Demo mode settings
    DEMO_MODE: {
        // Enable demo mode if API key is not set or API fails
        ENABLE_FALLBACK: true,

        // Number of simulated vehicles
        VEHICLE_COUNT: 4,

        // Simulation update interval
        UPDATE_INTERVAL: 5000
    }
};

// Export for ES6 modules
export default CONFIG;
