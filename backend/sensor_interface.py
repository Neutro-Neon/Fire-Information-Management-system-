from typing import Dict, List, Optional
from datetime import datetime
from pydantic import BaseModel, Field

class GroundSensorReading(BaseModel):
    """
    IEEE Ground Sensor Network Telemetry Model.
    Designed for field deployed IoT nodes across forest reserves.
    """
    sensor_id: str = Field(..., description="Unique identifier for the sensor node, e.g. IEEE-NODE-GNP-01")
    latitude: float = Field(..., ge=-90.0, le=90.0, description="Node geographic latitude")
    longitude: float = Field(..., ge=-180.0, le=180.0, description="Node geographic longitude")
    temperature: Optional[float] = Field(None, description="Ambient temperature in degrees Celsius")
    humidity: Optional[float] = Field(None, ge=0.0, le=100.0, description="Relative humidity in percentage")
    smoke_level: Optional[float] = Field(None, description="Smoke detector reading / optical extinction coefficient (ppm)")
    gas_level: Optional[float] = Field(None, description="Combustible gas concentration (CO/VOC ppm)")
    battery: Optional[float] = Field(None, ge=0.0, le=100.0, description="Battery charge level percentage")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="UTC timestamp of the sensor measurement")
    fire_probability: Optional[float] = Field(None, ge=0.0, le=1.0, description="On-node ML or threshold fire likelihood [0.0 - 1.0]")
    status: str = Field("ACTIVE", description="Node status: ACTIVE, OFFLINE, MAINTENANCE")
    forest_location: Optional[str] = Field(None, description="Associated forest area e.g. Guindy National Park, Nanmangalam")

class GroundSensorManager:
    """
    In-memory registry and intake for IEEE ground sensor nodes.
    Maintains clean interface for real IoT devices without generating fake readings.
    """
    def __init__(self):
        # We start with empty or defined registered node positions without fabricated sensor telemetry
        # In a deployment, sensors push data to POST /api/sensors/reading
        self._sensors: Dict[str, GroundSensorReading] = {}

    def get_all_sensors(self) -> List[GroundSensorReading]:
        return list(self._sensors.values())

    def get_sensor(self, sensor_id: str) -> Optional[GroundSensorReading]:
        return self._sensors.get(sensor_id)

    def register_reading(self, reading: GroundSensorReading) -> GroundSensorReading:
        self._sensors[reading.sensor_id] = reading
        return reading
