# Selma - Location Map App

A clean, modular web application that gets the user's current location and displays it on an interactive map. Now featuring real-time transit visualization for Stockholm's Tunnelbana Line 14!

## Features

### Location Tracking
- Get user's current location using Geolocation API
- Display location on an interactive map using Leaflet.js
- Show location coordinates and accuracy
- Clean, responsive UI design

### Transit Visualization (NEW!)
- Real-time vehicle tracking for Stockholm Tunnelbana Line 14
- Interactive route visualization with 19 stations
- Live vehicle positions with speed and direction
- Station markers with detailed information
- Demo mode with simulated vehicles (ready for Trafiklab API integration)

### Architecture
- Modular architecture for easy extension
- Separate services for location, mapping, and transit data

## Project Structure

```
Selma/
├── index.html              # Main location tracking page
├── transit.html            # Transit visualization page (NEW!)
├── css/
│   └── styles.css         # Application styling
├── js/
│   ├── app.js             # Main application controller
│   ├── transitApp.js      # Transit app controller (NEW!)
│   └── services/
│       ├── locationService.js  # Geolocation service module
│       ├── mapService.js       # Map service module (enhanced)
│       └── transitService.js   # Transit data service (NEW!)
└── README.md
```

## Architecture

The app follows a modular architecture with clear separation of concerns:

### LocationService (`js/services/locationService.js`)
- Handles all geolocation API interactions
- Provides methods for getting current position
- Includes position watching capabilities
- Error handling for geolocation failures
- Utility methods for distance calculations

### MapService (`js/services/mapService.js`)
- Manages map initialization and rendering
- Handles marker placement and updates
- Provides methods for adding/removing markers
- Manages user location display with accuracy circle
- Transit visualization methods (route polylines, station markers, vehicle markers)
- Built on Leaflet.js for lightweight mapping

### TransitService (`js/services/transitService.js`) - NEW!
- Manages transit data for Stockholm Tunnelbana Line 14
- Provides station and route information
- Handles real-time vehicle position updates
- Simulation mode for demo purposes
- Ready for Trafiklab API integration
- Vehicle interpolation and movement calculations

### App Controller (`js/app.js`)
- Coordinates between services
- Manages application state
- Handles user interactions
- Updates UI based on location data

## Usage

### Running the Location Map

1. Clone the repository
2. Open `index.html` in a modern web browser
3. Click "Get My Location" button
4. Allow location access when prompted
5. Your location will be displayed on the map

### Running the Transit Visualization

1. Open `transit.html` in a modern web browser (or use local server)
2. The map will display Stockholm Tunnelbana Line 14 route
3. Click "Start Real-time Tracking" to see simulated vehicles
4. Click "Show Stations" to display all 19 station markers
5. Click on vehicles or stations for detailed information
6. Use "Fit to Route" to center the map on the entire line

**Note:** Currently runs in demo mode with simulated vehicles. To use real-time data:
- Get a free API key from [Trafiklab](https://www.trafiklab.se/)
- Pass the API key when initializing TransitService in `transitApp.js`

### Browser Compatibility

Requires a browser that supports:
- ES6 Modules
- Geolocation API
- Modern JavaScript (Promises, async/await)

Recommended browsers:
- Chrome 61+
- Firefox 60+
- Safari 11+
- Edge 79+

### HTTPS Requirement

For production deployment, the app must be served over HTTPS as most browsers restrict geolocation API access to secure contexts only.

## Extending the App

The modular architecture makes it easy to add new features:

### Adding Multiple Markers
```javascript
const coords = { lat: 40.7128, lng: -74.0060 };
app.mapService.addMarker(coords.lat, coords.lng, {
    title: 'New York City'
});
```

### Watching Position Changes
```javascript
app.locationService.watchPosition(
    (position) => {
        const coords = LocationService.getCoordinates(position);
        app.mapService.setUserLocation(coords.lat, coords.lng);
    },
    (error) => console.error(error)
);
```

### Calculating Distance
```javascript
const point1 = { lat: 40.7128, lng: -74.0060 };
const point2 = { lat: 34.0522, lng: -118.2437 };
const distance = LocationService.calculateDistance(point1, point2);
console.log(`Distance: ${distance.toFixed(2)} km`);
```

### Using Transit Visualization with Real API
```javascript
// In transitApp.js, replace:
this.transitService = new TransitService(); // Demo mode

// With:
this.transitService = new TransitService('YOUR_TRAFIKLAB_API_KEY');

// The service will automatically use real-time data instead of simulation
```

### Customizing Transit Route Display
```javascript
// Change route color
transitApp.mapService.drawRoute(routePath, {
    color: '#0000FF',
    weight: 6
});

// Add custom vehicle icon
transitApp.mapService.addVehicle({
    id: 'Custom-1',
    lat: 59.3293,
    lng: 18.0686,
    direction: 'north',
    destination: 'Mörby centrum'
});
```

## Future Enhancement Ideas

### Location Map
- Add search functionality to find locations
- Implement route planning between points
- Save favorite locations
- Add multiple map layers (satellite, terrain)
- Integrate with geocoding services for address lookup
- Add offline map caching
- Implement location history tracking
- Add custom marker icons and clustering

### Transit Visualization
- Add more tunnelbana lines (Green, Blue)
- Display real-time delays and disruptions
- Show estimated arrival times at stations
- Add bus and tram routes
- Implement trip planning functionality
- Historical data visualization
- Crowding predictions
- Integration with other Swedish cities (Gothenburg, Malmö)

## Technologies Used

- **Leaflet.js** - Interactive map library
- **OpenStreetMap** - Map tile provider
- **Geolocation API** - Browser location access
- **Trafiklab API** - Stockholm public transit data (ready for integration)
- **ES6 Modules** - Code organization
- **CSS Grid/Flexbox** - Responsive layout

## API Integration

### Trafiklab API Setup

To use real-time transit data instead of simulation:

1. Visit [Trafiklab](https://www.trafiklab.se/) and create a free account
2. Register for API access to SL real-time data
3. Get your API key from the dashboard
4. Update `js/transitApp.js`:
```javascript
this.transitService = new TransitService('YOUR_API_KEY_HERE');
```

The TransitService is designed to seamlessly switch between simulation mode and real API data.

## License

MIT

## Contributing

Feel free to submit issues and enhancement requests!