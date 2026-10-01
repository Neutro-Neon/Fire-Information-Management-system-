import os
import sys
import time
import logging
from datetime import datetime
from typing import Optional, List, Dict, Any

# Ensure local .env is loaded
env_path = os.path.join(os.path.dirname(__file__), ".env")
if os.path.exists(env_path):
    try:
        from dotenv import load_dotenv
        load_dotenv(env_path)
    except ImportError:
        # Fallback simple .env parser
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    os.environ.setdefault(k.strip(), v.strip())

from fastapi import FastAPI, Query, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from firms_client import FirmsClient, FirmsAPIError, SUPPORTED_SOURCES
from fire_processor import FireDataProcessor
from geo_layers import GeoLayersManager
from sensor_interface import GroundSensorManager, GroundSensorReading

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("fams_api")

app = FastAPI(
    title="NASA FIRMS Forest Fire Monitoring API — Chennai Region",
    description="IEEE Forest-Fire Early Detection Project Backend. Integrates NASA FIRMS active fire satellite data with authentic GIS boundaries and IoT ground sensor network interfaces.",
    version="1.0.0"
)

# Enable CORS for local Vite and production frontends
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize core services
firms_client = FirmsClient()
fire_processor = FireDataProcessor()
geo_layers = GeoLayersManager()
sensor_manager = GroundSensorManager()

_ENRICHED_CACHE: Dict[str, Dict[str, Any]] = {}

SCIENTIFIC_DISCLAIMER = (
    "Satellite active-fire observations: NASA FIRMS. "
    "Satellite detections are not automatically confirmed ground fires. "
    "A satellite hotspot represents a thermal anomaly and spatial pixel observation "
    "which may correspond to agricultural burning, clearing, industrial heat, or forest fires."
)

@app.get("/api/health")
def get_health():
    """Health check endpoint validating API configuration and NASA FIRMS connectivity."""
    key_status = firms_client.verify_key_status()
    return {
        "status": "healthy",
        "service": "NASA FIRMS Forest Fire Monitoring — Chennai Region",
        "project": "IEEE Forest-Fire Early Detection System",
        "firms_key_status": key_status,
        "default_bbox": firms_client.default_bbox,
        "supported_satellites": SUPPORTED_SOURCES,
        "server_time_utc": datetime.utcnow().isoformat() + "Z"
    }

REGIONS = {
    "all": {
        "id": "all",
        "name": "Global Multi-Biome Surveillance (All Regions)",
        "short_name": "All Surveillance Biomes",
        "country": "India / Indonesia / Brazil",
        "biome": "Integrated Tropical Rainforests, Peatlands & Reserves",
        "bbox": "global",
        "center": [5.0, 30.0],
        "default_zoom": 2,
        "description": "Full simultaneous surveillance across Chennai, Indonesia Rainforests, and the Amazon Basin."
    },
    "chennai": {
        "id": "chennai",
        "name": "Chennai & Surrounding Districts",
        "short_name": "Chennai Region",
        "country": "India",
        "biome": "Tropical Dry Evergreen / Agricultural Plains",
        "bbox": "79.4,12.2,80.6,13.7",
        "center": [13.04, 80.12],
        "default_zoom": 9,
        "description": "IEEE Target Study Area: Chennai, Chengalpattu, Tiruvallur, and Kanchipuram."
    },
    "indonesia": {
        "id": "indonesia",
        "name": "Indonesia Tropical Rainforests",
        "short_name": "Indonesia Rainforests",
        "country": "Indonesia",
        "biome": "Equatorial Peat Swamp & Lowland Dipterocarp Rainforest",
        "bbox": "98.0,-5.0,118.0,5.0",
        "center": [-0.5, 108.0],
        "default_zoom": 6,
        "description": "Global forest fire & peatland hotspot: Sumatra, Riau, Jambi, and Kalimantan (Borneo)."
    },
    "amazon": {
        "id": "amazon",
        "name": "Amazon Rainforest Biome",
        "short_name": "Amazon Rainforest",
        "country": "Brazil / Bolivia / Peru",
        "biome": "Amazonian Tropical Moist Broadleaf Forest",
        "bbox": "-65.0,-12.0,-50.0,-2.0",
        "center": [-7.0, -57.5],
        "default_zoom": 6,
        "description": "The world's largest tropical rainforest: Arc of Deforestation across Pará, Mato Grosso, Rondônia, and Amazonas."
    }
}

@app.get("/api/regions")
def get_regions():
    """Returns list of supported forest monitoring regions."""
    return {
        "count": len(REGIONS),
        "regions": REGIONS,
        "default_region": "all"
    }

@app.get("/api/fires")
def get_fires(
    days: int = 5,
    date: Optional[str] = None,
    satellite: Optional[str] = "ALL",
    min_confidence: Optional[str] = "ALL",
    min_frp: Optional[float] = 0.0,
    daynight: Optional[str] = "ALL",
    forest_filter: Optional[str] = "ALL",
    bbox: Optional[str] = None,
    region: Optional[str] = "chennai",
    force_refresh: bool = False
):
    """
    Retrieve real NASA FIRMS active-fire satellite detections over the selected region.
    Supports Chennai Region, Indonesia Tropical Rainforests, and the Amazon Rainforest.
    Never fabricates observations or coordinates.
    """
    # Safe resolution if called with Query objects in direct Python invocations
    sat_val = satellite.default if hasattr(satellite, "default") else (satellite or "ALL")
    conf_val = min_confidence.default if hasattr(min_confidence, "default") else (min_confidence or "ALL")
    dn_val = daynight.default if hasattr(daynight, "default") else (daynight or "ALL")
    frp_val = min_frp.default if hasattr(min_frp, "default") else (min_frp or 0.0)
    days_val = days.default if hasattr(days, "default") else (days or 5)
    forest_val = forest_filter.default if hasattr(forest_filter, "default") else (forest_filter or "ALL")
    
    try:
        days_int = int(days_val)
    except (ValueError, TypeError):
        days_int = 5
    days_int = max(1, min(5, days_int))

    try:
        # Determine satellite sources to query
        sources_to_query = []
        if sat_val and str(sat_val).upper() != "ALL" and str(sat_val) in SUPPORTED_SOURCES:
            sources_to_query = [str(sat_val)]
        else:
            sources_to_query = list(SUPPORTED_SOURCES.keys())

        # Determine target region and bounding box
        reg_id = str(region).lower() if region else "all"
        current_region = REGIONS.get(reg_id, REGIONS["all"])
        effective_bbox = bbox or current_region.get("bbox", "global")

        all_records: List[Dict[str, Any]] = []
        all_cached = True
        latest_timestamp = 0.0
        now = time.time()

        if reg_id in ["all", "global"]:
            cache_key = f"all_{days_int}_{date}_{','.join(sorted(sources_to_query))}"
            if not force_refresh and cache_key in _ENRICHED_CACHE:
                cached_entry = _ENRICHED_CACHE[cache_key]
                if now - cached_entry["cached_at"] < 300:
                    all_records = cached_entry["records"]
                    latest_timestamp = cached_entry["latest_timestamp"]

            if not all_records:
                for sub_id in ["chennai", "indonesia", "amazon"]:
                    sub_reg = REGIONS[sub_id]
                    sub_days = 2 if sub_id == "chennai" else 1
                    sub_cache_key = f"{sub_reg['bbox']}_{sub_days}_{date}_{','.join(sorted(sources_to_query))}"

                    sub_records: List[Dict[str, Any]] = []
                    if not force_refresh and sub_cache_key in _ENRICHED_CACHE:
                        s_entry = _ENRICHED_CACHE[sub_cache_key]
                        if now - s_entry["cached_at"] < 300:
                            sub_records = s_entry["records"]
                            if s_entry["latest_timestamp"] > latest_timestamp:
                                latest_timestamp = s_entry["latest_timestamp"]

                    if not sub_records:
                        multi_source_data = firms_client.fetch_all_active_sources(
                            bbox=sub_reg["bbox"],
                            days=sub_days,
                            date_str=date,
                            selected_sources=sources_to_query,
                            force_refresh=force_refresh
                        )
                        for src_id, src_info in multi_source_data.items():
                            if src_info["status"] == "success" and src_info["csv_data"]:
                                parsed = fire_processor.process_firms_csv(src_info["csv_data"], src_id)
                                sub_records.extend(parsed)
                                if not src_info["is_cached"]:
                                    all_cached = False
                                if src_info["retrieved_at"] > latest_timestamp:
                                    latest_timestamp = src_info["retrieved_at"]

                        for r in sub_records:
                            geo_info = geo_layers.localize_geographic_point(r["latitude"], r["longitude"])
                            r["district"] = geo_info["district"]
                            r["locality"] = geo_info["locality"]
                            r["land_type"] = geo_info["land_type"]
                            r["formatted_location"] = geo_info["formatted_location"]
                            r["nearest_forest_reserve"] = geo_layers.find_nearest_forest_reserve(r["latitude"], r["longitude"])

                        _ENRICHED_CACHE[sub_cache_key] = {
                            "cached_at": now,
                            "records": sub_records,
                            "latest_timestamp": latest_timestamp
                        }

                    all_records.extend(sub_records)

                if latest_timestamp == 0.0:
                    latest_timestamp = time.time()
                _ENRICHED_CACHE[cache_key] = {
                    "cached_at": now,
                    "records": all_records,
                    "latest_timestamp": latest_timestamp
                }
        else:
            effective_bbox = bbox or current_region["bbox"]
            cache_key = f"{effective_bbox}_{days_int}_{date}_{','.join(sorted(sources_to_query))}"

            if not force_refresh and cache_key in _ENRICHED_CACHE:
                cached_entry = _ENRICHED_CACHE[cache_key]
                if now - cached_entry["cached_at"] < 300:  # 5 min TTL
                    all_records = cached_entry["records"]
                    all_cached = True
                    latest_timestamp = cached_entry["latest_timestamp"]
                else:
                    del _ENRICHED_CACHE[cache_key]

            if not all_records:
                # Fetch CSV from NASA FIRMS
                multi_source_data = firms_client.fetch_all_active_sources(
                    bbox=effective_bbox,
                    days=days_int,
                    date_str=date,
                    selected_sources=sources_to_query,
                    force_refresh=force_refresh
                )

                all_records = []
                all_cached = True
                latest_timestamp = 0.0

                for src_id, src_info in multi_source_data.items():
                    if src_info["status"] == "success" and src_info["csv_data"]:
                        parsed = fire_processor.process_firms_csv(src_info["csv_data"], src_id)
                        all_records.extend(parsed)
                        if not src_info["is_cached"]:
                            all_cached = False
                        if src_info["retrieved_at"] > latest_timestamp:
                            latest_timestamp = src_info["retrieved_at"]

                if latest_timestamp == 0.0:
                    latest_timestamp = time.time()

                # Attach true geographic location, district, locality, and forest reserve context to each record
                for r in all_records:
                    geo_info = geo_layers.localize_geographic_point(r["latitude"], r["longitude"])
                    r["district"] = geo_info["district"]
                    r["locality"] = geo_info["locality"]
                    r["land_type"] = geo_info["land_type"]
                    r["formatted_location"] = geo_info["formatted_location"]
                    r["nearest_forest_reserve"] = geo_layers.find_nearest_forest_reserve(r["latitude"], r["longitude"])

                # Store in cache
                _ENRICHED_CACHE[cache_key] = {
                    "cached_at": now,
                    "records": all_records,
                    "latest_timestamp": latest_timestamp
                }

        # Apply filtering
        filtered_records = all_records

        # Filter by confidence
        if conf_val and str(conf_val).upper() != "ALL":
            mc = str(conf_val).upper()
            if mc in ["HIGH", "H"]:
                filtered_records = [r for r in filtered_records if r["confidence_level"] == "High"]
            elif mc in ["NOMINAL_PLUS", "NOMINAL", "N"]:
                filtered_records = [r for r in filtered_records if r["confidence_level"] in ["Nominal", "High"]]

        # Filter by FRP
        try:
            min_frp_flt = float(frp_val)
        except (ValueError, TypeError):
            min_frp_flt = 0.0

        if min_frp_flt > 0.0:
            filtered_records = [r for r in filtered_records if (r.get("frp") or 0.0) >= min_frp_flt]

        # Filter by Day / Night
        if dn_val and str(dn_val).upper() != "ALL":
            dn = str(dn_val).upper()
            filtered_records = [r for r in filtered_records if r["daynight"].upper() == dn]

        # Filter by Forest Proximity
        if forest_val and str(forest_val).upper() != "ALL":
            ff = str(forest_val).upper()
            if ff in ["FOREST_5KM", "FOREST_BUFFER_5KM", "FOREST_ONLY"]:
                filtered_records = [
                    r for r in filtered_records
                    if r.get("nearest_forest_reserve", {}).get("distance_km", 999) <= 5.0
                ]
            elif ff in ["FOREST_10KM", "FOREST_BUFFER_10KM"]:
                filtered_records = [
                    r for r in filtered_records
                    if r.get("nearest_forest_reserve", {}).get("distance_km", 999) <= 10.0
                ]
            elif ff in ["FOREST_CORE", "INSIDE_FOREST"]:
                filtered_records = [
                    r for r in filtered_records
                    if r.get("nearest_forest_reserve", {}).get("distance_km", 999) <= 2.0
                ]
            elif ff in ["NON_FOREST", "PLAINS"]:
                filtered_records = [
                    r for r in filtered_records
                    if r.get("nearest_forest_reserve", {}).get("distance_km", 999) > 5.0
                ]

        # Calculate statistics
        statistics = fire_processor.calculate_statistics(filtered_records)
        forest_near_count = sum(1 for r in filtered_records if r.get("nearest_forest_reserve", {}).get("distance_km", 999) <= 5.0)
        plains_count = len(filtered_records) - forest_near_count
        statistics["forest_proximity_count"] = forest_near_count
        statistics["plains_anomaly_count"] = plains_count

        return {
            "success": True,
            "region": current_region["name"],
            "region_id": current_region["id"],
            "region_info": current_region,
            "bbox_used": effective_bbox,
            "count": len(filtered_records),
            "unfiltered_total": len(all_records),
            "records": filtered_records,
            "statistics": statistics,
            "sources_queried": sources_to_query,
            "cached": all_cached if all_records else False,
            "last_retrieved_at": latest_timestamp,
            "last_retrieved_iso": datetime.utcfromtimestamp(latest_timestamp).strftime("%Y-%m-%d %H:%M:%S UTC"),
            "disclaimer": SCIENTIFIC_DISCLAIMER,
            "empty_state_message": f"No FIRMS active-fire detections found in {current_region['name']} for this period." if len(filtered_records) == 0 else None
        }

    except FirmsAPIError as e:
        logger.error(f"FirmsAPIError in get_fires: {e}")
        return {
            "success": False,
            "error": str(e),
            "count": 0,
            "records": [],
            "statistics": fire_processor.calculate_statistics([]),
            "empty_state_message": f"NASA FIRMS API Error: {str(e)}",
            "disclaimer": SCIENTIFIC_DISCLAIMER
        }
    except Exception as e:
        logger.exception(f"Unexpected error in get_fires: {e}")
        return {
            "success": False,
            "error": f"Server processing error: {str(e)}",
            "count": 0,
            "records": [],
            "statistics": fire_processor.calculate_statistics([]),
            "empty_state_message": "An unexpected error occurred while processing satellite observations.",
            "disclaimer": SCIENTIFIC_DISCLAIMER
        }

@app.get("/api/statistics")
def get_statistics(
    days: int = 5,
    date: Optional[str] = None,
    satellite: Optional[str] = "ALL",
    min_confidence: Optional[str] = "ALL",
    min_frp: Optional[float] = 0.0,
    daynight: Optional[str] = "ALL"
):
    """Retrieve summary metrics calculated directly from the active FIRMS dataset."""
    fires_response = get_fires(
        days=days,
        date=date,
        satellite=satellite,
        min_confidence=min_confidence,
        min_frp=min_frp,
        daynight=daynight,
        force_refresh=False
    )
    return {
        "success": fires_response.get("success", False),
        "statistics": fires_response.get("statistics", {}),
        "count": fires_response.get("count", 0),
        "last_retrieved_iso": fires_response.get("last_retrieved_iso"),
        "disclaimer": SCIENTIFIC_DISCLAIMER
    }

@app.get("/api/layers/districts")
def get_districts_layer():
    """Returns verified administrative boundaries for Chennai, Tiruvallur, Kanchipuram & Chengalpattu."""
    return geo_layers.get_districts()

@app.get("/api/layers/metropolitan")
def get_metropolitan_layer():
    """Returns official Chennai Metropolitan Area (CMA) boundary."""
    return geo_layers.get_metropolitan_area()

@app.get("/api/layers/forests")
def get_forests_layer():
    """Returns verified public geographic boundaries for forest & protected vegetation reserves."""
    return geo_layers.get_forest_reserves()

@app.get("/api/sensors")
def get_sensors():
    """
    IEEE Ground Sensor Network Telemetry.
    Returns currently registered field sensor nodes.
    """
    sensors = sensor_manager.get_all_sensors()
    return {
        "count": len(sensors),
        "sensors": sensors,
        "network_status": "Ready for field sensor integration",
        "project": "IEEE Forest-Fire Early Detection System"
    }

@app.post("/api/sensors/reading")
def post_sensor_reading(reading: GroundSensorReading):
    """Ingest a live telemetry reading from an IEEE ground IoT node."""
    saved = sensor_manager.register_reading(reading)
    return {
        "status": "success",
        "sensor_id": saved.sensor_id,
        "timestamp": saved.timestamp
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "127.0.0.1")
    uvicorn.run("main:app", host=host, port=port, reload=True)
