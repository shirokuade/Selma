# Trafiklab API Setup Guide

This guide will help you configure real-time transit data for Stockholm Tunnelbana Line 14.

## Quick Start

### 1. Get Your Trafiklab API Key

1. Visit [Trafiklab](https://www.trafiklab.se/)
2. Click "Skapa konto" (Create account) or "Logga in" (Log in)
3. Create a new project in your dashboard
4. Subscribe to **"GTFS Regional"** API (free tier available)
5. Copy your API key

### 2. Configure the Application

1. Open `js/config.js`
2. Replace `'YOUR_API_KEY_HERE'` with your actual API key:

```javascript
const CONFIG = {
    TRAFIKLAB_API_KEY: 'your-actual-api-key-here',
    // ... rest of config
};
```

3. Save the file

### 3. Test the Application

1. Open `index.html` in a modern web browser
2. Open browser console (F12) to see connection status
3. Click "Start Real-time Tracking"
4. Check console for messages:
   - ✅ "🚇 Transit Service initialized with API key for REAL-TIME data"
   - ✅ "📡 Fetching real-time data from Trafiklab API..."
   - ✅ "Received X total vehicles, Y on Line 14"

## Troubleshooting

### CORS Issues

If you see CORS errors in the console:

#### Option 1: Use a Local Server (Recommended)

```bash
# Python 3
python3 -m http.server 8080

# Node.js (if you have http-server installed)
npx http-server -p 8080

# PHP
php -S localhost:8080
```

Then open: `http://localhost:8080`

#### Option 2: Enable CORS Proxy

In `js/transitApp.js`, change:

```javascript
this.transitService = new TransitService(apiKey, {
    useCorsProxy: true,  // Enable CORS proxy
    corsProxyUrl: 'https://corsproxy.io/?'
});
```

**Note:** CORS proxies add latency and may have rate limits.

### No Vehicles Showing

**Possible causes:**

1. **Wrong Line ID** - The GTFS data might use a different route_id for Line 14
   - Check console logs for all vehicle route IDs
   - Update `LINE_14.ROUTE_IDS` in `js/config.js`

2. **No Active Vehicles** - There might not be any trains running
   - Try during peak hours (7-9 AM, 4-7 PM weekdays)
   - Check SL's official website for service status

3. **API Rate Limiting** - Free tier has limits
   - Reduce update frequency in config
   - Check Trafiklab dashboard for API usage

4. **Simulation Fallback** - App switched to demo mode after errors
   - Check console for error messages
   - Refresh page to retry API connection

### Checking API Connection

Open browser console (F12) and run:

```javascript
// Check service status
transitApp.transitService.getStatus()

// Manually fetch data
transitApp.transitService.fetchRealTimeData().then(vehicles => {
    console.log('Vehicles:', vehicles);
});
```

## Security Considerations

### ⚠️ IMPORTANT: API Key Visibility

**Your API key will be visible in client-side code!**

- Anyone can view the source code and extract your API key
- This is acceptable for Trafiklab's free tier
- For production apps, consider:
  1. Backend proxy server (recommended)
  2. API key rotation
  3. Rate limiting on your end

### Using a Backend Proxy (Advanced)

For production deployments, create a simple backend:

```javascript
// backend/server.js (Node.js example)
const express = require('express');
const fetch = require('node-fetch');
const app = express();

app.get('/api/vehicles', async (req, res) => {
    const apiKey = process.env.TRAFIKLAB_API_KEY; // From environment variable
    const url = `https://opendata.samtrafiken.se/gtfs-rt/sl/VehiclePositions.pb?key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.arrayBuffer();

    res.set('Content-Type', 'application/x-protobuf');
    res.send(Buffer.from(data));
});

app.listen(3000);
```

Then update `transitService.js` to use your backend endpoint instead of Trafiklab directly.

## Configuration Options

### Update Frequency

In `js/config.js`:

```javascript
UPDATE_INTERVAL: 10000,  // 10 seconds (Trafiklab updates every 2 seconds)
```

**Recommendations:**
- Development: 10-30 seconds
- Production: 5-10 seconds
- Free tier: 20-30 seconds (to stay under rate limits)

### Alternative Endpoints

If the primary endpoint doesn't work, try:

In `js/services/transitService.js`, change:

```javascript
this.endpoints = {
    primary: 'https://opendata.samtrafiken.se/gtfs-rt-sweden/sl/VehiclePositionsSweden.pb',
    // ...
};
```

### Custom Line IDs

If Line 14 vehicles aren't showing, add more route patterns:

```javascript
LINE_14: {
    ROUTE_ID: '14',
    ROUTE_IDS: ['14', 'T14', 'Tunnelbana 14', 'Red 14', 'YOUR_CUSTOM_ID']
}
```

## API Limits (Free Tier)

Trafiklab GTFS Regional API free tier:

- **Rate limit**: 10,000 requests per month
- **Per minute**: ~30 requests
- **Data updates**: Every 2 seconds

**Calculate your usage:**
- Update every 10 seconds = 360 requests/hour
- 24/7 operation = 8,640 requests/day = 259,200/month ⚠️
- Recommended: Update every 20-30 seconds for 24/7 operation

## Testing with Simulation Mode

Don't have an API key yet? The app works great in simulation mode:

```javascript
// js/config.js
TRAFIKLAB_API_KEY: 'YOUR_API_KEY_HERE',  // Leave as placeholder
```

Or pass `null` when creating TransitService:

```javascript
this.transitService = new TransitService(null);  // Force simulation mode
```

## Getting Help

1. **Check console** - Most issues show helpful error messages
2. **Trafiklab Support** - https://support.trafiklab.se/
3. **GitHub Issues** - Report bugs or ask questions
4. **SL Website** - https://sl.se/ for service status

## Advanced: Understanding GTFS Realtime

The Trafiklab API uses GTFS Realtime format (Protocol Buffers):

**Vehicle Position Fields:**
- `latitude` / `longitude` - GPS coordinates
- `bearing` - Direction (0-360 degrees)
- `speed` - Meters per second
- `trip.routeId` - Line identifier
- `trip.tripId` - Specific trip/journey
- `timestamp` - Update time

**Useful for debugging:**
```javascript
// Log raw GTFS data
const response = await fetch(apiUrl);
const buffer = await response.arrayBuffer();
const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(new Uint8Array(buffer));
console.log(feed);
```

## Next Steps

- ✅ Configure API key
- ✅ Test real-time data
- ⚠️ Monitor API usage in Trafiklab dashboard
- 🚀 Deploy to GitHub Pages
- 📊 Extend to more lines (Green, Blue)
- 🔧 Add trip planning features

Happy tracking! 🚇
