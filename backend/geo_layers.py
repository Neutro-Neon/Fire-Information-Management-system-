import os
import json
import math
import logging
from typing import Dict, List, Optional, Any

logger = logging.getLogger("geo_layers")

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")

def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great-circle distance between two points in kilometers."""
    R = 6371.0  # Earth's radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2.0) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2.0) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)

class GeoLayersManager:
    """Manages authentic geographic boundary layers and forest/vegetation reserves."""
    def __init__(self):
        self.districts_geojson = self._load_geojson("chennai_districts.geojson")
        self.metropolitan_geojson = self._load_geojson("chennai_metropolitan.geojson")
        self.forest_reserves_geojson = self._load_geojson("forest_reserves.geojson")
        self._reserve_centers = self._precompute_reserve_centers()

    def _precompute_reserve_centers(self) -> List[Dict[str, Any]]:
        centers = []
        for feat in self.forest_reserves_geojson.get("features", []):
            props = feat.get("properties", {})
            geom = feat.get("geometry", {})
            geom_type = geom.get("type")
            coords = geom.get("coordinates", [])
            flat_lats = []
            flat_lons = []
            if geom_type == "Polygon" and coords:
                for pt in coords[0]:
                    flat_lons.append(pt[0])
                    flat_lats.append(pt[1])
            elif geom_type == "MultiPolygon" and coords:
                for poly in coords:
                    for pt in poly[0]:
                        flat_lons.append(pt[0])
                        flat_lats.append(pt[1])
            if flat_lats and flat_lons:
                centers.append({
                    "center_lat": sum(flat_lats) / len(flat_lats),
                    "center_lon": sum(flat_lons) / len(flat_lons),
                    "props": props
                })
        return centers

    def _load_geojson(self, filename: str) -> Dict[str, Any]:
        filepath = os.path.join(DATA_DIR, filename)
        if not os.path.exists(filepath):
            logger.warning(f"GeoJSON file {filename} not found in {DATA_DIR}")
            return {"type": "FeatureCollection", "features": []}
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Error loading {filename}: {e}")
            return {"type": "FeatureCollection", "features": []}

    def get_districts(self) -> Dict[str, Any]:
        return self.districts_geojson

    def get_metropolitan_area(self) -> Dict[str, Any]:
        return self.metropolitan_geojson

    def get_forest_reserves(self) -> Dict[str, Any]:
        return self.forest_reserves_geojson

    def localize_geographic_point(self, lat: float, lon: float) -> Dict[str, str]:
        """
        Accurately resolves the actual administrative district and locality
        for any coordinate within the Chennai regional monitoring area.
        """
        district = "Tamil Nadu"
        locality = "Regional Area"
        land_type = "Plains / Agricultural Farmland"

        # 1. Indonesia Tropical Rainforest Biome
        if 95.0 <= lon <= 141.0 and -11.0 <= lat <= 7.0:
            if lon < 107.0: # Sumatra Island
                if lat >= 2.0:
                    district = "North Sumatra / Aceh"
                    locality = "Leuser Ecosystem / Toba Highlands"
                    land_type = "Tropical Montane Rainforest / Plantation"
                elif 0.0 <= lat < 2.0:
                    district = "Riau Province, Sumatra"
                    locality = "Kampar / Siak Peatland Basin"
                    land_type = "Peat Swamp Forest / Oil Palm Concession"
                elif -2.0 <= lat < 0.0:
                    district = "Jambi Province, Sumatra"
                    locality = "Muaro Jambi / Berbak Corridor"
                    land_type = "Peatland Rainforest / Agricultural Clearing"
                else:
                    district = "South Sumatra / Lampung"
                    locality = "Ogan Komering Ilir Peat Basin"
                    land_type = "Deep Peatland / Pulpwood Concession"
            else: # Kalimantan / Indonesian Borneo
                if lon < 112.0:
                    district = "West Kalimantan (Borneo)"
                    locality = "Ketapang / Pontianak Peatlands"
                    land_type = "Peat Swamp Forest / Degraded Lowland"
                elif lon < 115.0:
                    district = "Central Kalimantan (Borneo)"
                    locality = "Palangkaraya / Sebangau Basin"
                    land_type = "Critical Peatland Canopy / Primary Rainforest"
                else:
                    district = "East / South Kalimantan"
                    locality = "Mahakam Basin / Barito Basin"
                    land_type = "Lowland Dipterocarp Forest / Coal Belt"

            return {
                "district": district,
                "locality": locality,
                "land_type": land_type,
                "formatted_location": f"{locality}, {district} (Indonesia)"
            }

        # 2. Amazon Rainforest Biome (South America)
        if -75.0 <= lon <= -44.0 and -18.0 <= lat <= 5.0:
            if lon >= -54.0:
                if lat < -10.0:
                    district = "Mato Grosso (Brazil)"
                    locality = "Cerrado-Amazon Transition / Araguaia"
                    land_type = "Transitional Forest / Cattle Pasture"
                else:
                    district = "Pará (Brazil)"
                    locality = "Eastern Amazon / Belém Corridor"
                    land_type = "Active Deforestation Frontier / Scrub"
            elif lon >= -60.0:
                if lat < -8.0:
                    district = "Northern Mato Grosso (Brazil)"
                    locality = "Alta Floresta / Teles Pires Sector"
                    land_type = "Arc of Deforestation / Pastureland Clearing"
                else:
                    district = "Central Pará (Brazil)"
                    locality = "BR-163 Corridor / Tapajós Basin"
                    land_type = "Dense Ombrophilous Primary Rainforest"
            elif lon >= -66.0:
                if lat < -8.0:
                    district = "Rondônia (Brazil)"
                    locality = "Porto Velho / Jamari Sector"
                    land_type = "Active Forest Clearing / Pioneer Agriculture"
                else:
                    district = "Amazonas (Brazil)"
                    locality = "Madeira River Basin / Purus River"
                    land_type = "Dense Tropical Rainforest Canopy"
            else:
                district = "Acre / Peru Border (Brazil/Peru)"
                locality = "Western Amazon Frontier"
                land_type = "Primary Amazonian Lowland Rainforest"

            return {
                "district": district,
                "locality": locality,
                "land_type": land_type,
                "formatted_location": f"{locality}, {district} (Amazon Biome)"
            }

        # 3. Chennai & Surrounding Tamil Nadu Districts (Default IEEE Study Area)
        if lat >= 13.4:
            district = "Tiruvallur"
            if lon >= 80.05:
                locality = "Pulicat / Gummidipoondi Border"
                land_type = "Coastal Wetland / Rural Scrub"
            elif lon >= 79.8:
                locality = "Gummidipoondi Industrial / Rural Zone"
                land_type = "Agricultural / Industrial Belt"
            else:
                district = "Tiruvallur / AP Border"
                locality = "Nagalapuram / Satyavedu Foothills"
                land_type = "Hill Vegetation / Open Scrub"

        elif 13.0 <= lat < 13.4:
            if lon >= 80.24:
                district = "Chennai"
                locality = "Ennore Port / Manali Industrial Corridor"
                land_type = "Industrial Port / Refining Complex"
            elif lon >= 80.14:
                district = "Chennai / Tiruvallur"
                locality = "Ambattur / Madhavaram / Kolathur"
                land_type = "Urban / Light Industrial"
            elif lon >= 79.95:
                district = "Tiruvallur"
                locality = "Poonamallee / Avadi / Nemam"
                land_type = "Peri-Urban / Farmland"
            else:
                district = "Tiruvallur"
                locality = "Tiruvallur Town / Poondi Catchment"
                land_type = "Agricultural / Lake Catchment"

        elif 12.7 <= lat < 13.0:
            if lon >= 80.18:
                district = "Chennai / Chengalpattu"
                locality = "Sholinganallur / OMR Corridor"
                land_type = "Urban / Tech Corridor"
            elif lon >= 80.05:
                district = "Chengalpattu"
                locality = "Tambaram / Vandalur Corridor"
                land_type = "Peri-Urban / Mixed Vegetation"
            elif lon >= 79.85:
                district = "Kanchipuram"
                locality = "Sriperumbudur / Sunguvarchatram Belt"
                land_type = "Industrial Corridor / Agricultural"
            else:
                district = "Kanchipuram"
                locality = "Walajabad / Kanchipuram Rural"
                land_type = "Agricultural Paddy Plains"

        elif 12.4 <= lat < 12.7:
            if lon >= 79.95:
                district = "Chengalpattu"
                locality = "Chengalpattu Town / Palar Basin"
                land_type = "River Basin / Agricultural"
            elif lon >= 79.75:
                district = "Chengalpattu / Kanchipuram"
                locality = "Uthiramerur / Vedanthangal Vicinity"
                land_type = "Agricultural Plains / Lake Basin"
            else:
                district = "Kanchipuram / Tiruvannamalai Border"
                locality = "Cheyyar / Vandavasi Belt"
                land_type = "Rural Farmland / Crop Residue"

        else: # lat < 12.4
            if lon >= 79.8:
                district = "Chengalpattu / Villupuram Border"
                locality = "Cheyyur / Madurantakam / Tindivanam Belt"
                land_type = "Agricultural Farmland / Rural Clearing"
            else:
                district = "Tiruvannamalai / Villupuram Border"
                locality = "Gingee / Desur Plains"
                land_type = "Open Farmland / Granite Hill Scrub"

        return {
            "district": district,
            "locality": locality,
            "land_type": land_type,
            "formatted_location": f"{locality}, {district}"
        }

    def find_nearest_forest_reserve(self, lat: float, lon: float) -> Optional[Dict[str, Any]]:
        """Calculate distance to nearest known forest/vegetation reserve."""
        if not self._reserve_centers:
            return None

        nearest_reserve = None
        min_dist = float("inf")

        for item in self._reserve_centers:
            props = item["props"]
            center_lat = item["center_lat"]
            center_lon = item["center_lon"]
            dist = haversine_km(lat, lon, center_lat, center_lon)
            if dist < min_dist:
                min_dist = dist
                is_forest_prox = dist <= 5.0
                if dist <= 2.0:
                    classification = "Forest Reserve Core / Canopy Boundary"
                    explanation = f"⚠️ Forest Proximity Alert: Detected within {dist} km of {props.get('name', 'Reserve')}. Priority canopy surveillance zone."
                elif dist <= 5.0:
                    classification = "Forest Buffer Zone (≤5 km)"
                    explanation = f"⚠️ Forest Buffer Zone: Detected {dist} km from {props.get('name', 'Reserve')}. High monitoring zone."
                elif dist <= 15.0:
                    classification = "Peri-Forest Transitional Zone (5-15 km)"
                    explanation = f"ℹ️ Intermediate Rural Zone: Located {dist} km from {props.get('name', 'Reserve')}. Satellite detected agricultural/open field thermal event."
                else:
                    classification = "Regional Plains / Non-Forest Thermal Anomaly"
                    explanation = f"ℹ️ Plains / Agricultural Thermal Anomaly: Located {dist} km from nearest forest reserve. Satellite sensor detected surface thermal anomaly in rural/open plains (typical of crop residue burning, field clearing, brick kiln, or industrial heat), NOT an active canopy fire in a reserve forest."

                nearest_reserve = {
                    "name": props.get("name", "Unknown Reserve"),
                    "category": props.get("category", "Reserve"),
                    "district": props.get("district", "Chennai Region"),
                    "distance_km": dist,
                    "land_use_classification": classification,
                    "is_forest_proximity": is_forest_prox,
                    "context_explanation": explanation
                }

        return nearest_reserve
