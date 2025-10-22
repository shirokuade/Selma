# Selma Transit App - Docker Deployment

This guide explains how to run the Stockholm Tunnelbana Line 14 real-time tracker using Docker.

## Prerequisites

- Docker installed ([Get Docker](https://docs.docker.com/get-docker/))
- Docker Compose installed (included with Docker Desktop)

## Quick Start

### Option 1: Using Docker Compose (Recommended)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/shirokuade/Selma.git
   cd Selma
   git checkout selma-core-local
   ```

2. **Configure API Key:**
   Edit `js/config.js` and replace `YOUR_API_KEY_HERE` with your Trafiklab API key:
   ```javascript
   TRAFIKLAB_API_KEY: 'your_actual_api_key_here',
   ```

3. **Start the application:**
   ```bash
   docker-compose up -d
   ```

4. **Access the app:**
   Open your browser and navigate to:
   ```
   http://localhost:8080
   ```

5. **Stop the application:**
   ```bash
   docker-compose down
   ```

### Option 2: Using Docker CLI

1. **Build the image:**
   ```bash
   docker build -t selma-transit-app .
   ```

2. **Run the container:**
   ```bash
   docker run -d -p 8080:80 --name selma-app selma-transit-app
   ```

3. **Access the app:**
   ```
   http://localhost:8080
   ```

4. **Stop the container:**
   ```bash
   docker stop selma-app
   docker rm selma-app
   ```

## Troubleshooting

### Port 8080 Already in Use

If port 8080 is already in use, modify `docker-compose.yml`:
```yaml
ports:
  - "3000:80"  # Change 8080 to any available port
```

Then access the app at `http://localhost:3000`

### View Container Logs

```bash
docker-compose logs -f selma-app
```

Or with Docker CLI:
```bash
docker logs -f selma-app
```

### Rebuild After Changes

If you modify the code:
```bash
docker-compose down
docker-compose up -d --build
```

## API Configuration

The app uses the Trafiklab GTFS Realtime API. To get an API key:

1. Visit [Trafiklab](https://www.trafiklab.se/)
2. Create a free account
3. Register a new project
4. Subscribe to "GTFS Regional" API
5. Copy your API key to `js/config.js`

## Features

- Real-time vehicle tracking for Stockholm Tunnelbana Line 14
- Interactive map with Leaflet.js
- GTFS Realtime data parsing
- Verbose debugging console
- Raw API data viewer

## Browser Compatibility

Works best with modern browsers:
- Chrome/Edge (recommended)
- Firefox
- Safari

## Support

For issues or questions, please open an issue on GitHub.

## License

See LICENSE file in the repository.
