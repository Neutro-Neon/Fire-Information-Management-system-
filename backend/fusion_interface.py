"""
IEEE Forest Fire Early Detection Project: Multi-Source Satellite & Ground-Sensor Fusion Architecture.

This module defines the architectural interfaces and data structures for future integration of:
1. Multi-Satellite Observations (NASA FIRMS, Sentinel-2 MSI, Landsat-8/9 OLI/TIRS)
2. Ground Sensor Telemetry (IoT environmental sensor nodes in forest reserves)
3. Weather & Environmental Data (IMD / ECMWF temperature, wind speed, relative humidity)
4. Soil Moisture / Fuel Moisture Index

NOTE: As per project scientific principles, no artificial fusion values or fake data
are generated. This module specifies the contracts for upcoming implementation phases.
"""

from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Any
from datetime import datetime
from pydantic import BaseModel, Field

class WeatherEnvironmentalContext(BaseModel):
    """Environmental parameters influencing fire ignition and propagation."""
    latitude: float
    longitude: float
    timestamp: datetime
    air_temperature_c: Optional[float] = None
    relative_humidity_percent: Optional[float] = None
    wind_speed_ms: Optional[float] = None
    wind_direction_deg: Optional[float] = None
    soil_moisture_m3m3: Optional[float] = None
    fine_fuel_moisture_code: Optional[float] = None
    source: str = "Unconfigured (IMD / ECMWF API)"

class FusionEvaluationResult(BaseModel):
    """Result of combining satellite thermal detection with ground telemetry."""
    detection_id: str
    latitude: float
    longitude: float
    timestamp: datetime
    satellite_confidence: str
    satellite_frp: float
    ground_sensor_correlated: bool = False
    correlated_sensor_id: Optional[str] = None
    ground_temperature_c: Optional[float] = None
    ground_smoke_ppm: Optional[float] = None
    fused_fire_confidence_score: Optional[float] = Field(
        None,
        description="Fused probability [0.0 - 1.0] combining satellite thermal anomaly with ground smoke/heat"
    )
    status_summary: str = "Pending full sensor-satellite calibration"

class MultiSatelliteProvider(ABC):
    """Abstract interface for satellite data sources."""
    @abstractmethod
    def get_source_identifier(self) -> str:
        """e.g. 'NASA_FIRMS', 'SENTINEL_2', 'LANDSAT_8_9'"""
        pass

    @abstractmethod
    def fetch_observations(self, bbox: str, start_date: str, end_date: str) -> List[Dict[str, Any]]:
        pass

class BaseFusionEngine(ABC):
    """
    Abstract interface for IEEE Satellite + Sensor Fusion Algorithm.
    Formula prototype:
    P(Fire) = w_sat * Confidence_sat + w_ground * f(Smoke, Temp) + w_weather * f(Wind, Moisture)
    """
    @abstractmethod
    def evaluate_hotspot(
        self,
        satellite_detection: Dict[str, Any],
        ground_sensors: List[Dict[str, Any]],
        weather: Optional[WeatherEnvironmentalContext] = None
    ) -> FusionEvaluationResult:
        """Evaluate a satellite hotspot against nearby ground sensor readings and weather."""
        pass
