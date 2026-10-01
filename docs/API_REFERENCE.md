# REST API Reference Specification

This document provides complete documentation for the FastAPI backend REST API endpoints of the **Forest Fire Monitoring System (FAMS)**.

Base URL: `http://127.0.0.1:8000` (Direct) or `http://localhost:5173/api` (via Vite proxy)

---

## 1. System & Health

### `GET /api/health`
Checks backend operational status, verifies NASA FIRMS API key validity, and reports server uptime.

**Response (200 OK):**
```json
{
  "status": "healthy",
  "firms_key_configured": true,
  "firms_key_preview": "bf4a...dad",
  "default_bbox": "79.4,12.2,80.6,13.7",
  "cache_ttl_seconds": 600,
  "system_time_utc": "2026-10-01T14:35:10Z"
}
```

---

## 2. Satellite Active Fire Detections

### `GET /api/fires`
Fetches normalized active-fire thermal anomaly records for the specified geographic bounding box and lookback window.

**Query Parameters:**
| Parameter | Type | Default | Description |
|---|---|---|---|
| `bbox` | `string` | `79.4,12.2,80.6,13.7` | Coordinates `West,South,East,North` |
| `days` | `integer` | `5` | Lookback period in days (1 to 5) |
| `date` | `string` | `null` | Query specific date (`YYYY-MM-DD`) |
| `satellite` | `string` | `ALL` | `ALL`, `VIIRS_SNPP_NRT`, `VIIRS_NOAA20_NRT`, `VIIRS_NOAA21_NRT`, `MODIS_NRT` |
| `min_confidence` | `string` | `ALL` | `ALL`, `NOMINAL_PLUS`, `HIGH` |
| `min_frp` | `float` | `0.0` | Minimum Fire Radiative Power (MW) |
| `daynight` | `string` | `ALL` | `ALL`, `DAY`, `NIGHT` |
| `force_refresh` | `boolean`| `false` | Bypass disk/memory cache |

**Response (200 OK):**
```json
{
  "success": true,
  "count": 12,
  "retrieved_at_utc": "2026-10-01T14:35:10Z",
  "retrieved_at_ist": "2026-10-01 20:05:10 IST",
  "bbox": "79.4,12.2,80.6,13.7",
  "fires": [
    {
      "latitude": 13.0827,
      "longitude": 80.2000,
      "acq_date": "2026-10-01",
      "acq_time": "0830",
      "time_utc": "08:30",
      "time_ist": "14:00 IST",
      "formatted_utc": "2026-10-01 08:30 UTC",
      "formatted_ist": "2026-10-01 14:00 IST",
      "satellite": "Suomi NPP",
      "instrument": "VIIRS",
      "confidence_raw": "h",
      "confidence_display": "High (h)",
      "confidence_level": "High",
      "frp": 14.8,
      "brightness_temp_k": 332.5,
      "brightness_temp_c": 59.35,
      "background_temp_k": 298.1,
      "daynight": "Day",
      "scan_km": 0.375,
      "track_km": 0.375,
      "nearest_forest_reserve": "Guindy National Park (3.2 km)",
      "severity": "HIGH",
      "severity_disclaimer": "Application-defined visualization category based on FRP & confidence, not official NASA classification",
      "ground_status": "Unconfirmed Ground Fire (Satellite Observation)"
    }
  ]
}
```

---

## 3. Statistical Summaries

### `GET /api/statistics`
Returns computed aggregate metrics for active thermal detections across the monitored region.

**Response (200 OK):**
```json
{
  "total_fires": 12,
  "high_confidence_count": 8,
  "high_confidence_percentage": 66.7,
  "max_frp": 38.5,
  "avg_frp": 12.4,
  "satellite_breakdown": {
    "Suomi NPP": 5,
    "NOAA-20": 4,
    "NOAA-21": 2,
    "MODIS": 1
  }
}
```

---

## 4. Spatial GeoJSON Boundaries

### `GET /api/layers/districts`
Returns official district boundary polygon features for Chennai, Tiruvallur, Kanchipuram, and Chengalpattu.

### `GET /api/layers/metropolitan`
Returns the Chennai Metropolitan Development Authority (CMDA) boundary polygon.

### `GET /api/layers/forests`
Returns verified boundary polygons and attribute metadata for key protected forest reserves (Guindy National Park, Nanmangalam, Pulicat, Pallikaranai, Vandalur).

---

## 5. IoT Ground Sensor Network

### `GET /api/sensors`
Returns telemetry for all registered IoT field sensor nodes.

### `POST /api/sensors/reading`
Ingests a telemetry packet from a field sensor node.

**Request Body:**
```json
{
  "sensor_id": "NODE_GUINDY_01",
  "latitude": 13.0067,
  "longitude": 80.2206,
  "temperature_c": 36.2,
  "humidity_pct": 52.0,
  "smoke_ppm": 145.0,
  "gas_index": 22.0,
  "battery_pct": 94.0,
  "timestamp": "2026-10-01T14:30:00Z"
}
```

**Response (201 Created):**
```json
{
  "status": "success",
  "sensor_id": "NODE_GUINDY_01",
  "calculated_fire_probability": 0.42
}
```
