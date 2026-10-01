# System Architecture & Technical Specifications

This document outlines the architectural blueprint, data pipeline workflows, spatial services, telemetry models, and multi-sensor fusion specifications for the **Forest Fire Monitoring System (FAMS)**.

---

## 1. High-Level Architecture Diagram

```
+-------------------------------------------------------------------------------+
|                             CLIENT TIER (React 18 + Vite)                     |
|                                                                               |
|  +-------------------+  +--------------------+  +--------------------------+  |
|  | GIS Command Map   |  | Event Telemetry    |  | IoT Sensor Network &     |  |
|  | (Leaflet + Esri)  |  | Stream & Inspector |  | Fusion Dashboard         |  |
|  +-------------------+  +--------------------+  +--------------------------+  |
+-------------------------------------------------------------------------------+
                                      |
                     REST API / JSON (/api/* proxy)
                                      v
+-------------------------------------------------------------------------------+
|                            APPLICATION TIER (FastAPI ASGI)                    |
|                                                                               |
|  +-------------------------------------------------------------------------+  |
|  |  main.py: FastAPI REST Endpoints, CORS Middleware, Error Handling       |  |
|  +-------------------------------------------------------------------------+  |
|          |                               |                        |           |
|          v                               v                        v           |
|  +-------------------+        +--------------------+    +------------------+  |
|  |  firms_client.py  |        | fire_processor.py  |    |  geo_layers.py   |  |
|  |  - NASA FIRMS NRT |        | - Pandas Pipeline  |    |  - GeoJSON BBox  |  |
|  |  - Dual Caching   |        | - Normalization    |    |  - Forest Reserves| |
|  |    (Disk+Memory)  |        | - Haversine Dist   |    |  - Admin Polygons|  |
|  +-------------------+        +--------------------+    +------------------+  |
|                                          |                                    |
|                       +----------------------------------+                    |
|                       | sensor_interface.py &            |                    |
|                       | fusion_interface.py              |                    |
|                       | - IoT Ground Sensor Telemetry    |                    |
|                       | - Multi-Modal Fusion Engine      |                    |
|                       +----------------------------------+                    |
+-------------------------------------------------------------------------------+
           |                                                 |
           v                                                 v
+-----------------------+                         +----------------------+
|   NASA FIRMS NRT API  |                         |  Local GeoJSON Data  |
| (VIIRS SNPP, NOAA-20, |                         |  & Persistent Disk   |
|  NOAA-21, MODIS CSV)  |                         |  CSV Cache           |
+-----------------------+                         +----------------------+
```

---

## 2. Component Descriptions

### A. Satellite Ingestion Engine (`firms_client.py`)
- Communicates directly with NASA EOSDIS FIRMS Area API.
- Implements two-tier caching:
  - **Memory Cache (TTL)**: Avoids duplicate requests during simultaneous user actions.
  - **Persistent Disk Cache**: Caches downloaded CSV observations partitioned by satellite, bounding box, and date to conserve NASA API transaction quota.
- Auto-fallbacks gracefully if a specific satellite instrument times out or has no current pass data.

### B. Analytical Processing Pipeline (`fire_processor.py`)
- Reads raw CSV sensor streams using Pandas.
- Normalizes disparate satellite data schemas:
  - VIIRS: High/Nominal/Low confidence strings (`h`, `n`, `l`).
  - MODIS: Percentage-based confidence integers (`0-100%`).
- Computes time conversions from UTC to Indian Standard Time (IST, `UTC + 5:30`).
- Performs spatial spatial proximity checks using Haversine geodesic algorithms to compute distance to the nearest protected reserve.
- Computes regional aggregate metrics (Total Hotspots, High Confidence Count, Peak FRP, Average FRP).

### C. Spatial & Reserve Geometry Service (`geo_layers.py`)
- Serves verified GeoJSON vector boundaries:
  - District Boundaries (Survey of India / Census data).
  - Chennai Metropolitan Area (CMDA boundary).
  - Protected Forest Reserves (Guindy National Park, Nanmangalam, Pulicat, Pallikaranai, Vandalur).
- Dynamically attaches metadata and center coordinates for spatial boundary queries.

### D. Ground Sensor & Multi-Modal Fusion Model (`sensor_interface.py` & `fusion_interface.py`)
- Ingests IoT ground sensor node telemetry (`POST /api/sensors/reading`):
  - Temperature (°C)
  - Relative Humidity (%)
  - Smoke Concentration (PPM)
  - Carbon Monoxide / Gas Index
  - Battery Percentage & Health Status
- **Mathematical Multi-Modal Fusion Formulation**:
  Correlates orbital thermal radiances with sub-canopy ground sensor readings to calculate a unified early-warning probability score:

$$\text{Score}_{\text{Fused}} = w_{\text{sat}} \cdot P(\text{FIRMS}) + w_{\text{ground}} \cdot f(\text{Smoke}, \Delta T) + w_{\text{env}} \cdot f(\text{Wind}, \text{FFMC})$$

---

## 3. Data Flow

1. **User requests fire data** with filters (e.g. 5 days, High Confidence, VIIRS NOAA-20).
2. **Frontend (`App.jsx`)** sends request to `/api/fires?days=5&satellite=VIIRS_NOAA20_NRT&min_confidence=HIGH`.
3. **FastAPI (`main.py`)** invokes `firms_client.py` to check memory/disk cache or query NASA FIRMS NRT.
4. **`fire_processor.py`** parses, validates, enriches with nearest reserve distances, and normalizes output.
5. **Frontend receives JSON response** and updates:
   - Leaflet map markers and cluster groups.
   - Real-time HUD summary cards.
   - Tabular view and chronological telemetry stream.
