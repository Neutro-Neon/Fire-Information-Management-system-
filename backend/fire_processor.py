import io
import math
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import pandas as pd

logger = logging.getLogger("fire_processor")

SEVERITY_DISCLAIMER = "Application-defined visualization category based on FRP and confidence; not an official NASA severity rating."

SATELLITE_NAMES = {
    "N": "Suomi NPP",
    "1": "NOAA-20",
    "2": "NOAA-21",
    "T": "Terra",
    "A": "Aqua"
}

def parse_acq_time_to_ist(date_str: str, time_str: str) -> Dict[str, str]:
    """Convert FIRMS date (YYYY-MM-DD) and acq_time (HHMM) to formatted UTC and IST strings."""
    try:
        time_str_clean = str(time_str).strip().zfill(4)
        hour = int(time_str_clean[:2])
        minute = int(time_str_clean[2:4])
        
        utc_dt = datetime.strptime(date_str.strip(), "%Y-%m-%d").replace(hour=hour, minute=minute)
        ist_dt = utc_dt + timedelta(hours=5, minutes=30)
        
        return {
            "utc_formatted": f"{utc_dt.strftime('%Y-%m-%d')} {utc_dt.strftime('%H:%M')} UTC",
            "ist_formatted": f"{ist_dt.strftime('%Y-%m-%d')} {ist_dt.strftime('%H:%M')} IST",
            "time_utc": f"{hour:02d}:{minute:02d}",
            "time_ist": f"{ist_dt.hour:02d}:{ist_dt.minute:02d}",
            "timestamp_iso": utc_dt.isoformat() + "Z"
        }
    except Exception:
        return {
            "utc_formatted": f"{date_str} {time_str} UTC",
            "ist_formatted": f"{date_str} {time_str} IST",
            "time_utc": str(time_str),
            "time_ist": str(time_str),
            "timestamp_iso": ""
        }

def classify_severity(frp: float, confidence_level: str) -> str:
    """
    Application-defined visualization classification:
    - LOW: FRP < 5.0 MW or Low confidence
    - MEDIUM: FRP 5.0 - 15.0 MW
    - HIGH: FRP > 15.0 MW or (High confidence and FRP >= 10.0 MW)
    """
    if frp > 15.0 or (confidence_level == "High" and frp >= 10.0):
        return "HIGH"
    elif frp >= 5.0 or confidence_level == "Nominal":
        return "MEDIUM"
    else:
        return "LOW"

class FireDataProcessor:
    """
    Validates, normalizes, and aggregates NASA FIRMS fire observations.
    Never fabricates points or alters reported coordinates.
    """

    @staticmethod
    def process_firms_csv(csv_text: str, source_id: str) -> List[Dict[str, Any]]:
        """Parse and validate raw FIRMS CSV into structured, normalized fire records."""
        if not csv_text or not csv_text.strip():
            return []

        try:
            df = pd.read_csv(io.StringIO(csv_text))
        except Exception as e:
            logger.error(f"Failed to parse CSV for {source_id}: {e}")
            return []

        if df.empty:
            return []

        records: List[Dict[str, Any]] = []

        for idx, row in df.iterrows():
            try:
                # 1. Geographic Coordinate Validation
                lat = float(row.get("latitude"))
                lon = float(row.get("longitude"))
                
                if math.isnan(lat) or math.isnan(lon) or not (-90.0 <= lat <= 90.0) or not (-180.0 <= lon <= 180.0):
                    logger.warning(f"Rejecting record with invalid coordinates: lat={lat}, lon={lon}")
                    continue

                # 2. Date & Time Validation
                acq_date = str(row.get("acq_date", "")).strip()
                acq_time = str(row.get("acq_time", "")).strip()
                if not acq_date:
                    logger.warning("Rejecting record with missing acq_date")
                    continue
                
                time_meta = parse_acq_time_to_ist(acq_date, acq_time)

                # 3. Satellite & Instrument Normalization
                sat_code = str(row.get("satellite", "")).strip()
                satellite_full = SATELLITE_NAMES.get(sat_code, sat_code if sat_code else "Satellite")
                instrument = str(row.get("instrument", "")).strip()
                if not instrument:
                    instrument = "VIIRS" if "VIIRS" in source_id else "MODIS"

                # 4. Confidence Normalization
                raw_conf = str(row.get("confidence", "")).strip()
                conf_val: Any = raw_conf
                conf_level = "Nominal"

                if raw_conf.lower() in ["l", "low"]:
                    conf_level = "Low"
                    conf_val = "Low"
                elif raw_conf.lower() in ["n", "nominal"]:
                    conf_level = "Nominal"
                    conf_val = "Nominal"
                elif raw_conf.lower() in ["h", "high"]:
                    conf_level = "High"
                    conf_val = "High"
                else:
                    # Numeric confidence (MODIS 0 - 100)
                    try:
                        num_conf = float(raw_conf)
                        conf_val = f"{int(num_conf)}%"
                        if num_conf >= 80:
                            conf_level = "High"
                        elif num_conf >= 30:
                            conf_level = "Nominal"
                        else:
                            conf_level = "Low"
                    except ValueError:
                        conf_level = "Nominal"

                # 5. Fire Radiative Power (FRP) in MW
                frp = 0.0
                if "frp" in row and not pd.isna(row["frp"]):
                    try:
                        frp = round(float(row["frp"]), 2)
                    except ValueError:
                        frp = 0.0

                # 6. Brightness Temperature
                # VIIRS: bright_ti4 (Kelvin) & bright_ti5 (Kelvin)
                # MODIS: brightness (Kelvin) & bright_t31 (Kelvin)
                bright_temp_k = None
                bright_temp_c = None
                bg_temp_k = None

                if "bright_ti4" in row and not pd.isna(row["bright_ti4"]):
                    bright_temp_k = round(float(row["bright_ti4"]), 2)
                elif "brightness" in row and not pd.isna(row["brightness"]):
                    bright_temp_k = round(float(row["brightness"]), 2)

                if bright_temp_k is not None:
                    bright_temp_c = round(bright_temp_k - 273.15, 1)

                if "bright_ti5" in row and not pd.isna(row["bright_ti5"]):
                    bg_temp_k = round(float(row["bright_ti5"]), 2)
                elif "bright_t31" in row and not pd.isna(row["bright_t31"]):
                    bg_temp_k = round(float(row["bright_t31"]), 2)

                # 7. Day / Night
                daynight_code = str(row.get("daynight", "D")).strip().upper()
                daynight_str = "Day" if daynight_code == "D" else "Night"

                # 8. Severity
                severity = classify_severity(frp, conf_level)

                # 9. Spatial Resolution / Scan / Track
                scan = round(float(row.get("scan", 0.0)), 2) if not pd.isna(row.get("scan")) else None
                track = round(float(row.get("track", 0.0)), 2) if not pd.isna(row.get("track")) else None
                version = str(row.get("version", "")).strip()

                # Generate a unique stable identifier
                unique_id = f"FIRMS_{source_id}_{lat:.5f}_{lon:.5f}_{acq_date}_{acq_time}_{idx}"

                record = {
                    "id": unique_id,
                    "latitude": lat,
                    "longitude": lon,
                    "acq_date": acq_date,
                    "acq_time": acq_time,
                    "time_utc": time_meta["time_utc"],
                    "time_ist": time_meta["time_ist"],
                    "timestamp_iso": time_meta["timestamp_iso"],
                    "formatted_utc": time_meta["utc_formatted"],
                    "formatted_ist": time_meta["ist_formatted"],
                    "satellite": satellite_full,
                    "satellite_code": sat_code,
                    "instrument": instrument,
                    "source_dataset": source_id,
                    "confidence_raw": raw_conf,
                    "confidence_display": conf_val,
                    "confidence_level": conf_level,  # Low, Nominal, High
                    "frp": frp,
                    "brightness_temp_k": bright_temp_k,
                    "brightness_temp_c": bright_temp_c,
                    "background_temp_k": bg_temp_k,
                    "daynight": daynight_str,
                    "daynight_code": daynight_code,
                    "scan_km": scan,
                    "track_km": track,
                    "version": version,
                    "severity": severity,
                    "severity_disclaimer": SEVERITY_DISCLAIMER,
                    "observation_type": "Satellite Active-Fire Detection (Thermal Anomaly)",
                    "ground_status": "Unconfirmed Ground Fire (Satellite Observation)"
                }
                records.append(record)

            except Exception as row_err:
                logger.warning(f"Error parsing row {idx} in {source_id}: {row_err}")
                continue

        return records

    @staticmethod
    def calculate_statistics(records: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Compute summary statistics for the filtered dataset."""
        if not records:
            return {
                "total_detections": 0,
                "high_confidence_count": 0,
                "nominal_confidence_count": 0,
                "low_confidence_count": 0,
                "max_frp": 0.0,
                "average_frp": 0.0,
                "min_frp": 0.0,
                "satellites_reporting": [],
                "instruments_reporting": [],
                "date_min": None,
                "date_max": None,
                "bbox_actual": None,
                "spatial_coverage_description": "Chennai Metropolitan & Surrounding Districts (Chengalpattu, Tiruvallur, Kanchipuram)"
            }

        frp_values = [r["frp"] for r in records if r.get("frp") is not None]
        high_conf_count = sum(1 for r in records if r.get("confidence_level") == "High")
        nominal_conf_count = sum(1 for r in records if r.get("confidence_level") == "Nominal")
        low_conf_count = sum(1 for r in records if r.get("confidence_level") == "Low")
        
        satellites = sorted(list({r["satellite"] for r in records if r.get("satellite")}))
        instruments = sorted(list({r["instrument"] for r in records if r.get("instrument")}))
        dates = sorted(list({r["acq_date"] for r in records if r.get("acq_date")}))

        lats = [r["latitude"] for r in records]
        lons = [r["longitude"] for r in records]

        return {
            "total_detections": len(records),
            "high_confidence_count": high_conf_count,
            "nominal_confidence_count": nominal_conf_count,
            "low_confidence_count": low_conf_count,
            "max_frp": round(max(frp_values), 2) if frp_values else 0.0,
            "average_frp": round(sum(frp_values) / len(frp_values), 2) if frp_values else 0.0,
            "min_frp": round(min(frp_values), 2) if frp_values else 0.0,
            "satellites_reporting": satellites,
            "instruments_reporting": instruments,
            "date_min": dates[0] if dates else None,
            "date_max": dates[-1] if dates else None,
            "bbox_actual": {
                "min_lat": min(lats),
                "max_lat": max(lats),
                "min_lon": min(lons),
                "max_lon": max(lons)
            } if lats and lons else None,
            "spatial_coverage_description": "Chennai Metropolitan & Surrounding Districts (Chengalpattu, Tiruvallur, Kanchipuram)"
        }
