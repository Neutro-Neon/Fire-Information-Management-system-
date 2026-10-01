# Forest Fire Monitoring System (FAMS) — Setup & User Manual

Welcome to the comprehensive setup and operational manual for the **Forest Fire Monitoring System (FAMS)**. This manual provides end-to-end instructions for installing, configuring, running, and navigating the application.

---

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Obtaining NASA FIRMS API Key](#obtaining-nasa-firms-api-key)
3. [Installation Guide](#installation-guide)
   - [Automated 1-Click Launch (Recommended)](#1-automated-1-click-launch-recommended)
   - [Manual Backend Setup](#2-manual-backend-setup)
   - [Manual Frontend Setup](#3-manual-frontend-setup)
4. [Environment Configuration (.env)](#environment-configuration-env)
5. [User Interface & Operation Guide](#user-interface--operation-guide)
   - [Biome & Region Selection](#1-biome--region-selection)
   - [GIS Command Center Map](#2-gis-command-center-map)
   - [Filter & Control Panel](#3-filter--control-panel)
   - [Metrics HUD Dashboard](#4-metrics-hud-dashboard)
   - [Hotspot Inspector](#5-hotspot-inspector)
   - [Tabular Data Explorer](#6-tabular-data-explorer)
   - [Analytics & Sensor Fusion View](#7-analytics--sensor-fusion-view)
   - [Bottom Real-Time Event Stream](#8-bottom-real-time-event-stream)
6. [CLI Diagnostics & Management](#cli-diagnostics--management)
7. [Troubleshooting & FAQ](#troubleshooting--faq)

---

## System Requirements

### Hardware
- **Processor**: Intel Core i3 / AMD Ryzen 3 or higher (Quad-core recommended)
- **RAM**: Minimum 4 GB (8 GB recommended)
- **Disk Space**: ~500 MB free space
- **Network**: Active broadband connection for live NASA FIRMS API and GIS tile fetching

### Software
- **Operating System**: Windows 10/11, macOS 11+, or Linux (Ubuntu 20.04+, Debian, Fedora)
- **Python**: Version `3.10` or higher (3.11 / 3.12 / 3.13 / 3.14 fully supported)
- **Node.js**: Version `18.x` or higher (LTS recommended)
- **Web Browser**: Modern Chromium-based browser (Chrome, Edge, Brave) or Firefox

---

## Obtaining NASA FIRMS API Key

The system uses live NASA FIRMS (Fire Information for Resource Management System) NRT satellite feeds. A free MAP_KEY is required:

1. Visit the NASA EOSDIS FIRMS Key Portal: **[https://firms.modaps.eosdis.nasa.gov/api/map_key/](https://firms.modaps.eosdis.nasa.gov/api/map_key/)**
2. Enter your email address and agree to the terms.
3. NASA will instantly email you a unique 32-character hexadecimal key (e.g. `bf4a709b7d38a72c1af0eb420cbe3dad`).
4. Save this key for the environment configuration step.

---

## Installation Guide

### 1. Automated 1-Click Launch (Recommended)

The repository includes a comprehensive unified launcher (`run.py`) and an interactive menu (`app.py`):

```bash
# Clone or navigate to the repository folder:
cd fams

# Launch backend + frontend with automated diagnostics:
python run.py
```

This single command will:
1. Verify Python and Node environments.
2. Initialize and validate the FastAPI backend server on port `8000`.
3. Start the Vite React development server on port `5173`.
4. Perform a 6-point self-diagnostic test verifying API health, GeoJSON boundaries, and FIRMS connectivity.
5. Automatically open the GIS dashboard in your default browser at `http://localhost:5173`.

---

### 2. Manual Backend Setup

If you prefer running services independently in separate terminal windows:

```bash
# Navigate to the backend directory:
cd backend

# (Recommended) Create and activate a Python virtual environment:
# Windows:
python -m venv venv
venv\Scripts\activate

# Linux / macOS:
python3 -m venv venv
source venv/bin/activate

# Install required Python packages:
pip install -r requirements.txt

# Create your .env file from the template:
# Windows:
copy .env.example .env
# Linux/macOS:
cp .env.example .env

# Edit backend/.env and insert your FIRMS_MAP_KEY

# Start the FastAPI ASGI server:
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

The backend server is accessible at `http://127.0.0.1:8000`.
Interactive Swagger API documentation is available at `http://127.0.0.1:8000/docs`.

---

### 3. Manual Frontend Setup

In a new terminal window:

```bash
# Navigate to the frontend directory:
cd frontend

# Install Node.js dependencies:
npm install

# Start the Vite development server:
npm run dev
```

Navigate to `http://localhost:5173` in your browser.

---

## Environment Configuration (.env)

The backend configuration is managed via `backend/.env`. A template is provided at `backend/.env.example`:

| Variable | Default Value | Description |
|---|---|---|
| `FIRMS_MAP_KEY` | *(Required)* | 32-character NASA FIRMS MAP_KEY |
| `DEFAULT_BBOX` | `79.4,12.2,80.6,13.7` | Default geographic bounding box (West, South, East, North) |
| `DEFAULT_DAYS` | `5` | Historical lookback window in days (1 to 5) |
| `CACHE_TTL_SECONDS` | `600` | Disk and memory cache TTL (10 minutes) |
| `HOST` | `127.0.0.1` | Host address for FastAPI server |
| `PORT` | `8000` | Port for FastAPI server |
| `DEBUG` | `False` | Enable verbose debug logging |

---

## User Interface & Operation Guide

### 1. Biome & Region Selection
In the top navigation bar, select from 4 monitored biomes:
- **All Biomes (Global)**: Integrated global multi-biome surveillance across Chennai, Indonesia, and the Amazon.
- **Chennai Region (India)**: Bounding box `79.4, 12.2, 80.6, 13.7` covering Chennai, Tiruvallur, Kanchipuram, and Chengalpattu districts.
- **Indonesia Rainforests (Indonesia)**: Equatorial Peat Swamp & Lowland Dipterocarp Rainforest (`98.0, -5.0, 118.0, 5.0`).
- **Amazon Rainforest (Brazil / Peru)**: Amazonian Tropical Moist Broadleaf Forest (`-65.0, -12.0, -50.0, -2.0`).

### 2. GIS Command Center Map
- **Basemap Switcher**:
  - *Esri Dark Canvas*: Tactical command center dark GIS canvas.
  - *OpenStreetMap*: Standard high-detail geographic cartography.
  - *Esri World Imagery*: High-resolution satellite imagery for ground verification.
- **Boundary Vector Layers**:
  - *District Boundaries*: Official administrative boundaries.
  - *Metropolitan Polygon*: Chennai CMA boundary.
  - *Protected Forest Reserves*: Exact boundary overlays for Guindy National Park, Nanmangalam Reserve Forest, Pulicat Wetland, Pallikaranai Marsh, and Vandalur Reserve Forest.
- **Clustering & Markers**:
  - Proportional flame icons sized and colored by Fire Radiative Power (FRP in MW).
  - Pulsing amber/red halo on high-confidence detections.
  - Interactive clustering reduces visual clutter while maintaining spatial fidelity.

### 3. Filter & Control Panel
- **Time Range**: Choose between 1, 2, 3, 4, or 5 days of satellite lookback.
- **Calendar Date**: Query specific dates in `YYYY-MM-DD` format.
- **Satellite Instruments**: Toggle between *All Instruments*, *VIIRS SNPP (375m)*, *VIIRS NOAA-20 (375m)*, *VIIRS NOAA-21 (375m)*, or *MODIS (1km)*.
- **Confidence Threshold**: Filter by *All Detections*, *Nominal & High*, or *High Confidence Only*.
- **Minimum FRP Slider**: Filter out low-energy hotspots (0 to 25+ MW).
- **Day/Night Filter**: Separate solar day passes from night passes.
- **Refresh Satellite Data**: Real-time bypass button to fetch the latest observations from NASA without waiting for cache expiration.

### 4. Metrics HUD Dashboard
- **Total Hotspots**: Number of active thermal anomalies detected in the current filter window.
- **High Confidence**: Total count and percentage of high-certainty detections.
- **Peak FRP (MW)**: Maximum Fire Radiative Power detected in the region.
- **Average FRP (MW)**: Regional thermal energy intensity benchmark.
- **Satellite Sync**: UTC and IST timestamps of the latest successful satellite query.

### 5. Hotspot Inspector
Clicking any hotspot on the map or in the table opens the Hotspot Inspector:
- Precise Coordinates (Latitude, Longitude in WGS84 decimal format).
- Acquisition Date & Exact Timestamp in IST (`UTC + 5:30`) and UTC.
- Satellite & Sensor Instrument specifications.
- Pixel Footprint Resolution (e.g. `0.375 km x 0.375 km`).
- Channel Brightness Temperature in Kelvin (K) and Celsius (°C).
- Fire Radiative Power (FRP in MW).
- **Proximity Analysis**: Calculated distance (in km) to the nearest protected forest reserve.

### 6. Tabular Data Explorer
- Sortable columns: Acquisition Time, Satellite, FRP, Brightness Temp, Confidence, Distance to Reserve.
- Instant search filter by satellite name, time, or severity.
- Click any row to automatically pan and zoom the GIS map to that specific detection.

### 7. Analytics & Sensor Fusion View
- Switch between **GIS Map View**, **Table View**, **Analytics View**, and **IoT Sensor Network**.
- The IoT Sensor Network displays ground nodes reporting temperature, relative humidity, smoke ppm, air quality, and battery health.
- Mathematical multi-sensor fusion model correlates satellite observations with ground telemetry.

### 8. Bottom Real-Time Event Stream
- Live chronological telemetry ticker displaying incoming satellite detections with quick jump buttons.

---

## CLI Diagnostics & Management

The `run.py` management utility supports several operational commands:

```bash
# Start both servers and open browser:
python run.py

# Run backend/frontend endpoint diagnostic suite:
python run.py test

# Stop all background servers and release ports 8000 and 5173:
python run.py stop

# Gracefully restart all services:
python run.py restart

# View usage help:
python run.py --help
```

---

## Troubleshooting & FAQ

### Q1: "Failed to Fetch" or CORS Error on Frontend
- Ensure the FastAPI backend is running on `http://127.0.0.1:8000`.
- Run `python run.py test` to verify that the `/api/health` and `/api/fires` endpoints respond with status code `200`.
- Ensure Vite's proxy in `frontend/vite.config.js` is forwarding `/api` to `http://127.0.0.1:8000`.

### Q2: NASA FIRMS 403 or Invalid Key Error
- Verify that your 32-character MAP_KEY is correctly set in `backend/.env` under `FIRMS_MAP_KEY=...`.
- Ensure there are no surrounding quotes or leading/trailing spaces in the `.env` file.
- Verify your key by opening `https://firms.modaps.eosdis.nasa.gov/api/area/csv/<YOUR_KEY>/VIIRS_SNPP_NRT/79.4,12.2,80.6,13.7/1` in your browser.

### Q3: Ports 8000 or 5173 Already in Use
- Run `python run.py stop` or `python run.py restart` to automatically identify and terminate stale processes bound to these ports.

### Q4: Zero Fire Points Displayed
- This is normal and expected if there are currently no active thermal anomalies detected by polar satellites over the selected bounding box in the chosen time window.
- The system enforces a strict **Zero Fabrication Policy** and will never generate fake fire points.
- Switch the region to *Global Multi-Biome*, *Amazon Rainforest*, or *Indonesia Rainforests* to view active biomes with real-time detections.
