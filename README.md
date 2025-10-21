# Selma - Location Map App

A clean, modular web application that gets the user's current location and displays it on an interactive map.

## Features

- Get user's current location using Geolocation API
- Display location on an interactive map using Leaflet.js
- Show location coordinates and accuracy
- Clean, responsive UI design
- Modular architecture for easy extension

## Project Structure

```
Selma/
├── index.html              # Main HTML file
├── css/
│   └── styles.css         # Application styling
├── js/
│   ├── app.js            # Main application controller
│   └── services/
│       ├── locationService.js  # Geolocation service module
│       └── mapService.js       # Map service module
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
- Built on Leaflet.js for lightweight mapping

### App Controller (`js/app.js`)
- Coordinates between services
- Manages application state
- Handles user interactions
- Updates UI based on location data

## Usage

### Running the App

1. Clone the repository
2. Open `index.html` in a modern web browser
3. Click "Get My Location" button
4. Allow location access when prompted
5. Your location will be displayed on the map

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

## Future Enhancement Ideas

- Add search functionality to find locations
- Implement route planning between points
- Save favorite locations
- Add multiple map layers (satellite, terrain)
- Integrate with geocoding services for address lookup
- Add offline map caching
- Implement location history tracking
- Add custom marker icons and clustering

## Technologies Used

- **Leaflet.js** - Interactive map library
- **OpenStreetMap** - Map tile provider
- **Geolocation API** - Browser location access
- **ES6 Modules** - Code organization
- **CSS Grid/Flexbox** - Responsive layout

## License

MIT

## Contributing

Feel free to submit issues and enhancement requests!