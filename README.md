# NASA FIRMS Multi-Biome Forest Fire Early Detection & Monitoring System (FAMS)

[![IEEE Project](https://img.shields.io/badge/IEEE-Forest--Fire%20Early%20Detection-blue.svg)](https://ieee.org)
[![NASA FIRMS](https://img.shields.io/badge/Data%20Source-NASA%20FIRMS%20NRT-red.svg)](https://firms.modaps.eosdis.nasa.gov/)
[![Backend](https://img.shields.io/badge/Backend-FastAPI%20%7C%20Pandas-green.svg)](https://fastapi.tiangolo.com)
[![Frontend](https://img.shields.io/badge/Frontend-React%2018%20%7C%20Leaflet%20%7C%20Tailwind-teal.svg)](https://leafletjs.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A production-grade, scientific GIS web platform engineered for an **IEEE forest-fire early detection research project**. The application visualizes real-time **NASA FIRMS (Fire Information for Resource Management System)** active-fire satellite telemetry and IoT ground sensor data across critical global biomes, including **Chennai & Tamil Nadu districts (India)**, **Indonesia Tropical Rainforests & Peatlands**, and the **Amazon Rainforest Biome (South America)**.

---

## 📚 Instruction Manuals & Documentation

For detailed technical references, please consult the dedicated documentation guides in [`docs/`](docs/):

- **[📖 Complete Setup & User Manual](docs/SETUP_AND_USER_MANUAL.md)**: Step-by-step installation (Windows / macOS / Linux), NASA API key setup, UI feature walkthrough, and troubleshooting.
- **[🏛️ System Architecture Guide](docs/ARCHITECTURE.md)**: Deep dive into the data pipeline, caching tiers, GeoJSON spatial boundary engine, and mathematical sensor fusion model.
- **[🔌 REST API Reference](docs/API_REFERENCE.md)**: Complete endpoint documentation with request/response schemas, query parameters, and examples.
- **[🤝 Contributing Guidelines](CONTRIBUTING.md)**: Code standards, testing protocols, and pull request workflows.
- **[⚖️ MIT License](LICENSE)**: Open-source terms and usage permissions.

---

## 🔬 Scientific Principles & Data Integrity

1. **Zero Fabrication Policy**: The application **never** fabricates fire points, coordinates, or statistics. If zero thermal anomalies are observed within the selected time window, the system displays an informative empty state while preserving real district and forest reserve boundary layers.
2. **Satellite Detection vs. Ground Fire**: Satellite active-fire observations are remote-sensing thermal anomaly detections derived from sensor radiances. **They are not automatically confirmed ground forest fires.** A hotspot can represent agricultural crop residue burning, controlled clearing, industrial heat sources, or genuine forest fires.
3. **Application-Defined Severity**: The visual classification categories (**LOW**, **MEDIUM**, **HIGH**) are clearly documented and labeled as application-defined visualization ratings based on Fire Radiative Power (FRP) and confidence flags—**not** an official NASA rating.
4. **Credential Security**: The NASA FIRMS `MAP_KEY` is loaded exclusively on the backend via environment variables. The API key is masked in all server logs and **is never exposed to the browser client**.

---

## 🌍 Monitored Biomes & Global Surveillance

| Region / Biome | Country / Coverage | Bounding Box (`W, S, E, N`) | Primary Ecosystem |
|---|---|---|---|
| **Chennai & Surrounding Districts** | India (Tamil Nadu) | `79.4, 12.2, 80.6, 13.7` | Tropical Dry Evergreen & Agricultural Plains |
| **Indonesia Rainforests** | Indonesia (Sumatra / Borneo) | `98.0, -5.0, 118.0, 5.0` | Equatorial Peat Swamp & Lowland Dipterocarp |
| **Amazon Rainforest Biome** | Brazil / Bolivia / Peru | `-65.0, -12.0, -50.0, -2.0` | Amazonian Tropical Moist Broadleaf Forest |
| **Global Multi-Biome** | International | `Global Multi-BBox` | Unified multi-continent surveillance |

---

## ✨ Key Features

- **Multi-Sensor Satellite Constellation**:
  - **Suomi-NPP VIIRS** (375m high-resolution active fire product)
  - **NOAA-20 VIIRS** (375m active fire product)
  - **NOAA-21 VIIRS** (375m active fire product)
  - **Terra & Aqua MODIS** (1km standard thermal anomaly product)
- **Authentic GIS Geographic Boundaries & Forest Reserves**:
  - **District Boundaries**: Chennai, Tiruvallur, Kanchipuram, and Chengalpattu.
  - **Chennai Metropolitan Area (CMA)**: Official CMDA boundary polygon.
  - **Protected Forest Reserves**: Verified polygons for Guindy National Park, Nanmangalam Reserve Forest, Pulicat Bird Sanctuary & Wetland Reserve, Pallikaranai Marsh Wetland Reserve, and Vandalur Reserve Forest.
- **Dynamic Metric HUD Dashboard**:
  - Total Active Fire Detections
  - High-Confidence Detections (count & percentage)
  - Maximum & Average Fire Radiative Power (FRP in MW)
  - Last Satellite Retrieval Timestamps (UTC & IST)
- **Interactive Leaflet GIS Command Center**:
  - Basemap Switcher: **Esri Dark Canvas** (Tactical Command Center), **OpenStreetMap Standard**, and **Esri World Imagery** (Satellite ground verification).
  - FRP-proportional flame markers with severity color coding and high-confidence pulsing halos.
  - Marker clustering via Leaflet MarkerCluster.
  - Real-time geodesic proximity calculation to nearest protected forest reserve.
- **Interactive Filter Controls**:
  - Day Range lookback selector (1 to 5 days, conforming to NASA FIRMS specs).
  - Calendar date picker for specific historical date inspection.
  - Satellite instrument selector (SNPP, NOAA-20, NOAA-21, MODIS).
  - Confidence threshold & Minimum FRP energy slider (0 to 25+ MW).
  - Solar Day / Night observation filter.
  - One-click cache-bypassing satellite sync button.
- **Multiple Operational Views**:
  - **GIS Map View**: Full spatial command console with floating controls.
  - **Table View**: Sortable tabular detections with instant search and 1-click zoom to hotspot.
  - **Analytics View**: Visual charts and distribution metrics across instruments.
  - **IoT Sensor Network View**: Simulated & real-time ground sensor node telemetry with multi-sensor fusion scoring.
- **Chronological Telemetry Event Stream**:
  - Real-time ticker displaying incoming detections with quick navigation.

---

## 🚀 Quick Start (1-Click Run & Diagnostics)

To launch the full stack (FastAPI backend + Vite React frontend) with automated 6-point self-diagnostics:

```bash
# Start backend + frontend and automatically open browser:
python run.py

# Or use the interactive console menu:
python app.py
```

### CLI Command Options:
- `python run.py` : Starts both servers, validates all endpoints, and opens the dashboard.
- `python run.py test` : Runs full diagnostic self-test suite.
- `python run.py stop` : Shuts down all running servers and releases ports `8000` and `5173`.
- `python run.py restart` : Performs clean restart with port clearing.

---

## 🛠️ Manual Installation & Setup

### Prerequisites
- **Python**: 3.10+ (tested up to Python 3.14)
- **Node.js**: 18+ (tested on Node v24.x)
- **NASA FIRMS MAP_KEY**: Free from [NASA FIRMS MAP Key Portal](https://firms.modaps.eosdis.nasa.gov/api/map_key/)

### 1. Backend Setup

```bash
cd backend

# Create and activate virtual environment (optional but recommended)
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env from template
copy .env.example .env   # On Linux/macOS use: cp .env.example .env

# Start FastAPI server
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

Backend runs at `http://127.0.0.1:8000` (Interactive Swagger docs: `http://127.0.0.1:8000/docs`).

### 2. Frontend Setup

```bash
cd frontend

# Install Node dependencies
npm install

# Start Vite development server
npm run dev
```

Frontend runs at `http://localhost:5173`.

---

## 📁 Repository Structure

```
fams/
├── docs/                             # Dedicated Technical Documentation
│   ├── SETUP_AND_USER_MANUAL.md      # Step-by-step setup & user guide
│   ├── ARCHITECTURE.md               # Technical architecture & fusion math
│   └── API_REFERENCE.md              # REST API endpoint specification
│
├── backend/                          # FastAPI Backend
│   ├── .env.example                  # Environment configuration template
│   ├── main.py                       # REST API router & application entry
│   ├── firms_client.py               # NASA FIRMS API client with dual cache
│   ├── fire_processor.py             # Pandas normalization & proximity engine
│   ├── geo_layers.py                 # GeoJSON boundary & reserve service
│   ├── sensor_interface.py           # IoT telemetry models & registry
│   ├── fusion_interface.py           # Multi-sensor fusion engine interface
│   ├── requirements.txt              # Python package dependencies
│   └── data/                         # Verified GIS GeoJSON boundary datasets
│       ├── chennai_districts.geojson
│       ├── chennai_metropolitan.geojson
│       └── forest_reserves.geojson
│
├── frontend/                         # React 18 + Vite Frontend
│   ├── index.html                    # HTML entry with Leaflet CSS
│   ├── vite.config.js                # Vite build config with /api reverse proxy
│   ├── package.json                  # Dependencies & scripts
│   └── src/
│       ├── App.jsx                   # Master state orchestrator & view router
│       ├── main.jsx                  # React DOM root
│       ├── index.css                 # Dark theme styling & animations
│       └── components/               # Modular UI components
│           ├── GisHeader.jsx         # Command header with biome & theme switcher
│           ├── GisControlPanel.jsx   # Filter panel & layer toggles
│           ├── FireMap.jsx           # Leaflet interactive map & clustering
│           ├── EventDetailsPanel.jsx # Hotspot inspector drawer
│           ├── BottomEventStream.jsx # Chronological telemetry stream
│           ├── TableView.jsx         # Tabular data grid
│           ├── AnalyticsView.jsx     # Charts & distribution metrics
│           ├── SensorView.jsx        # IoT sensor network monitor
│           └── GroundSensorModal.jsx # Fusion architecture modal
│
├── run.py                            # Unified 1-click launcher & diagnostics
├── app.py                            # Interactive console menu
├── CONTRIBUTING.md                   # Contributor guidelines
├── LICENSE                           # MIT License
├── README.md                         # Main documentation
└── .gitignore                        # Git exclusion rules
```

---

## 🛰️ Multi-Sensor Ground + Satellite Fusion Formulation

The system specifies a multi-tier fusion model combining orbital satellite observations, sub-canopy IoT sensors, and environmental fire weather metrics:

$$\text{Confidence}_{\text{Fused}} = w_{\text{sat}} \cdot P(\text{FIRMS}) + w_{\text{ground}} \cdot f(\text{Smoke}, \Delta T) + w_{\text{env}} \cdot f(\text{Wind}, \text{FFMC})$$

---

## 📄 License & Attribution

- **Satellite Active-Fire Observations**: NASA FIRMS (Fire Information for Resource Management System) / NASA ESDIS.
- **Administrative & Boundary Data**: Survey of India / Census of India / CMDA / OpenStreetMap contributors.
- **Project**: IEEE Forest-Fire Early Detection Research Project.
- **License**: [MIT License](LICENSE)
