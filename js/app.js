/**
 * Selma Core Engine - Data Viewer
 * Simple app for fetching and displaying Trafiklab GTFS-RT data
 */

console.log('🚀 app.js module loaded');

import CONFIG from './config.js';

class SelmaEngine {
    constructor() {
        console.log('🏗️ SelmaEngine constructor called');

        this.apiKey = CONFIG.TRAFIKLAB_API_KEY;
        this.apiEndpoint = CONFIG.API.VEHICLE_POSITIONS;
        this.updateInterval = null;
        this.updateCount = 0;
        this.isRunning = false;

        console.log('📋 API Key:', this.apiKey ? 'Configured' : 'Missing');
        console.log('📡 API Endpoint:', this.apiEndpoint);

        // DOM elements
        this.elements = {
            startBtn: document.getElementById('startBtn'),
            stopBtn: document.getElementById('stopBtn'),
            clearLogBtn: document.getElementById('clearLogBtn'),
            apiStatus: document.getElementById('apiStatus'),
            totalVehicles: document.getElementById('totalVehicles'),
            line14Vehicles: document.getElementById('line14Vehicles'),
            lastUpdate: document.getElementById('lastUpdate'),
            updateCount: document.getElementById('updateCount'),
            dataSource: document.getElementById('dataSource'),
            consoleLog: document.getElementById('consoleLog'),
            rawData: document.getElementById('rawData'),
            parsedData: document.getElementById('parsedData'),
            vehicleTableBody: document.getElementById('vehicleTableBody')
        };

        this.initializeConsoleInterceptor();
        this.attachEventListeners();
    }

    /**
     * Intercept console logs and display them on the page
     */
    initializeConsoleInterceptor() {
        const originalConsole = {
            log: console.log,
            info: console.info,
            warn: console.warn,
            error: console.error
        };

        const createLogger = (level, cssClass, originalMethod) => {
            return (...args) => {
                originalMethod.apply(console, args);
                const message = args.map(arg => {
                    if (typeof arg === 'object') {
                        try {
                            return JSON.stringify(arg, null, 2);
                        } catch (e) {
                            return String(arg);
                        }
                    }
                    return String(arg);
                }).join(' ');
                this.logToPage(level, message, cssClass);
            };
        };

        console.log = createLogger('LOG', 'log-success', originalConsole.log);
        console.info = createLogger('INFO', 'log-info', originalConsole.info);
        console.warn = createLogger('WARN', 'log-warn', originalConsole.warn);
        console.error = createLogger('ERROR', 'log-error', originalConsole.error);

        console.log('Console interceptor initialized');
    }

    /**
     * Log message to the page
     */
    logToPage(level, message, cssClass) {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${cssClass}`;
        logEntry.textContent = `[${timestamp}] [${level}] ${message}`;

        this.elements.consoleLog.appendChild(logEntry);
        this.elements.consoleLog.scrollTop = this.elements.consoleLog.scrollHeight;
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        console.log('🔗 Attaching event listeners...');
        console.log('  - startBtn element:', this.elements.startBtn);

        if (!this.elements.startBtn) {
            console.error('❌ startBtn element not found!');
            return;
        }

        this.elements.startBtn.addEventListener('click', () => {
            console.log('🖱️ Start button clicked!');
            this.start();
        });
        this.elements.stopBtn.addEventListener('click', () => this.stop());
        this.elements.clearLogBtn.addEventListener('click', () => this.clearLog());

        console.log('✅ Event listeners attached successfully');
    }

    /**
     * Start fetching data
     */
    async start() {
        if (this.isRunning) {
            console.warn('Already running');
            return;
        }

        console.log('Starting Selma Core Engine...');
        this.isRunning = true;
        this.elements.startBtn.style.display = 'none';
        this.elements.stopBtn.style.display = 'inline-block';

        // Fetch immediately
        await this.fetchAndParseData();

        // Then fetch every 10 seconds
        this.updateInterval = setInterval(() => {
            this.fetchAndParseData();
        }, CONFIG.UPDATE_INTERVAL);
    }

    /**
     * Stop fetching data
     */
    stop() {
        console.log('Stopping Selma Core Engine...');
        this.isRunning = false;
        this.elements.startBtn.style.display = 'inline-block';
        this.elements.stopBtn.style.display = 'none';

        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    /**
     * Clear console log
     */
    clearLog() {
        this.elements.consoleLog.innerHTML = '<div class="log-entry">[System] Console log cleared</div>';
    }

    /**
     * Fetch and parse GTFS-RT data
     */
    async fetchAndParseData() {
        try {
            console.log('📡 Fetching data from Trafiklab API...');

            const apiUrl = `${this.apiEndpoint}?key=${this.apiKey}`;
            console.info(`API Endpoint: ${this.apiEndpoint}`);

            const startTime = performance.now();
            const response = await fetch(apiUrl);
            const fetchTime = (performance.now() - startTime).toFixed(0);

            console.log(`✅ Fetch completed in ${fetchTime}ms`);
            console.log(`Response status: ${response.status} ${response.statusText}`);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            // Update API status
            this.updateApiStatus('success', 'Connected');

            // Read as ArrayBuffer
            const arrayBuffer = await response.arrayBuffer();
            console.log(`📦 ArrayBuffer received, size: ${arrayBuffer.byteLength} bytes`);

            // Parse GTFS-RT protobuf
            const parseStartTime = performance.now();
            const parsedData = await this.parseGTFSRealtimeProtobuf(arrayBuffer);
            const parseTime = (performance.now() - parseStartTime).toFixed(0);

            console.log(`✅ Parsing completed in ${parseTime}ms`);
            console.log(`Total vehicles: ${parsedData.vehicles.length}`);

            // Filter for Line 14
            const line14Vehicles = this.filterLine14(parsedData.vehicles);
            console.log(`Line 14 vehicles: ${line14Vehicles.length}`);

            // Update UI
            this.updateUI(parsedData, line14Vehicles);

            this.updateCount++;
            this.elements.updateCount.textContent = this.updateCount;
            this.elements.lastUpdate.textContent = new Date().toLocaleTimeString();

        } catch (error) {
            console.error('❌ Error fetching/parsing data:', error.message);
            this.updateApiStatus('error', error.message);
        }
    }

    /**
     * Parse GTFS Realtime protobuf data
     */
    async parseGTFSRealtimeProtobuf(arrayBuffer) {
        console.log('🔄 Parsing GTFS Realtime protobuf...');

        // Check if library is loaded
        if (typeof window.GtfsRealtimeBindings === 'undefined') {
            throw new Error('GTFS Realtime bindings library not available');
        }

        try {
            const uint8Array = new Uint8Array(arrayBuffer);
            const feed = window.GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(uint8Array);

            console.log(`✅ Feed decoded successfully`);
            console.log(`  - Header timestamp: ${feed.header.timestamp}`);
            console.log(`  - Entities: ${feed.entity.length}`);

            // Extract vehicles
            const vehicles = [];
            feed.entity.forEach((entity, index) => {
                if (entity.vehicle) {
                    const v = entity.vehicle;
                    const vehicle = {
                        id: v.vehicle?.id || entity.id,
                        routeId: v.trip?.routeId || 'unknown',
                        tripId: v.trip?.tripId || null,
                        lat: v.position?.latitude || 0,
                        lng: v.position?.longitude || 0,
                        bearing: v.position?.bearing || 0,
                        speed: v.position?.speed || 0,
                        timestamp: v.timestamp || feed.header.timestamp,
                        stopId: v.stopId || null
                    };
                    vehicles.push(vehicle);
                }
            });

            return {
                header: {
                    timestamp: feed.header.timestamp,
                    gtfsRealtimeVersion: feed.header.gtfsRealtimeVersion,
                    incrementality: feed.header.incrementality
                },
                vehicles: vehicles,
                rawFeed: feed
            };

        } catch (error) {
            console.error('Error parsing protobuf:', error);
            throw error;
        }
    }

    /**
     * Filter vehicles for Line 14
     */
    filterLine14(vehicles) {
        const routePatterns = ['14', 'T14', 'Red14', 'Röda linjen 14'];

        return vehicles.filter(vehicle => {
            return routePatterns.some(pattern =>
                vehicle.routeId?.toLowerCase().includes(pattern.toLowerCase())
            );
        });
    }

    /**
     * Update UI with data
     */
    updateUI(parsedData, line14Vehicles) {
        // Update status
        this.elements.totalVehicles.textContent = parsedData.vehicles.length;
        this.elements.line14Vehicles.textContent = line14Vehicles.length;
        this.elements.dataSource.textContent = '📡 Trafiklab API (Real-time)';

        // Update raw data
        this.elements.rawData.textContent = JSON.stringify(parsedData.rawFeed, null, 2);

        // Update parsed data
        this.elements.parsedData.textContent = JSON.stringify({
            header: parsedData.header,
            totalVehicles: parsedData.vehicles.length,
            line14Vehicles: line14Vehicles.length,
            vehicles: parsedData.vehicles
        }, null, 2);

        // Update vehicle table
        this.updateVehicleTable(line14Vehicles);
    }

    /**
     * Update vehicle table
     */
    updateVehicleTable(vehicles) {
        if (vehicles.length === 0) {
            this.elements.vehicleTableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; color: #666;">No Line 14 vehicles found</td>
                </tr>
            `;
            return;
        }

        this.elements.vehicleTableBody.innerHTML = vehicles.map(v => `
            <tr>
                <td>${v.id}</td>
                <td>${v.routeId}</td>
                <td>${v.lat.toFixed(6)}</td>
                <td>${v.lng.toFixed(6)}</td>
                <td>${v.speed.toFixed(2)}</td>
                <td>${v.bearing}°</td>
                <td>${new Date(v.timestamp * 1000).toLocaleTimeString()}</td>
            </tr>
        `).join('');
    }

    /**
     * Update API status badge
     */
    updateApiStatus(status, message) {
        let badgeClass = 'badge-warning';
        let text = message;

        if (status === 'success') {
            badgeClass = 'badge-success';
        } else if (status === 'error') {
            badgeClass = 'badge-danger';
        }

        this.elements.apiStatus.innerHTML = `<span class="badge ${badgeClass}">${text}</span>`;
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM Content Loaded - Starting initialization...');

    let waitCount = 0;

    // Wait for GTFS library to be available
    const initializeApp = () => {
        if (typeof window.GtfsRealtimeBindings === 'undefined') {
            waitCount++;
            console.log(`⏳ Waiting for GTFS Realtime library to load... (attempt ${waitCount})`);

            if (waitCount > 100) { // 5 seconds timeout
                console.error('❌ GTFS Realtime library failed to load after 5 seconds');
                console.error('Please check if the CDN is accessible');
                return;
            }

            setTimeout(initializeApp, 50);
            return;
        }

        console.log('✅ GTFS Realtime library loaded successfully');
        console.log('  - GtfsRealtimeBindings:', typeof window.GtfsRealtimeBindings);
        console.log('  - Waited:', waitCount * 50, 'ms');

        try {
            const app = new SelmaEngine();
            window.selmaEngine = app; // Make globally available for debugging

            console.log('✅ Selma Core Engine initialized and ready');
            console.log('👉 Click "Start Fetching Data" button to begin');
        } catch (error) {
            console.error('❌ Error initializing Selma Engine:', error);
        }
    };

    initializeApp();
});
