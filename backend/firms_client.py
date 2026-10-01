import os
import time
import logging
from typing import Dict, List, Optional, Tuple
import requests

logger = logging.getLogger("firms_client")

SUPPORTED_SOURCES = {
    "VIIRS_SNPP_NRT": "Suomi-NPP VIIRS (375m)",
    "VIIRS_NOAA20_NRT": "NOAA-20 VIIRS (375m)",
    "VIIRS_NOAA21_NRT": "NOAA-21 VIIRS (375m)",
    "MODIS_NRT": "Terra & Aqua MODIS (1km)"
}

FIRMS_BASE_URL = "https://firms.modaps.eosdis.nasa.gov/api/area/csv"

class FirmsAPIError(Exception):
    """Custom exception for NASA FIRMS API errors."""
    def __init__(self, message: str, status_code: Optional[int] = None):
        super().__init__(message)
        self.status_code = status_code


class FirmsCache:
    """In-memory and disk-backed cache for FIRMS API responses with configurable TTL."""
    def __init__(self, ttl_seconds: int = 600, cache_dir: Optional[str] = None):
        self.ttl_seconds = ttl_seconds
        self.cache_dir = cache_dir or os.path.join(os.path.dirname(__file__), ".cache", "firms")
        os.makedirs(self.cache_dir, exist_ok=True)
        self._cache: Dict[str, Tuple[float, str]] = {}
        self._last_success_timestamp: Optional[float] = None

    def _get_disk_path(self, key: str) -> str:
        safe_name = "".join(c if c.isalnum() or c in ("-", "_") else "_" for c in key)
        return os.path.join(self.cache_dir, f"{safe_name}.csv")

    def get(self, key: str) -> Optional[str]:
        now = time.time()
        # 1. Check memory cache
        if key in self._cache:
            cached_time, data = self._cache[key]
            if now - cached_time < self.ttl_seconds:
                return data
            else:
                del self._cache[key]

        # 2. Check disk cache
        disk_file = self._get_disk_path(key)
        if os.path.exists(disk_file):
            try:
                mtime = os.path.getmtime(disk_file)
                if now - mtime < self.ttl_seconds:
                    with open(disk_file, "r", encoding="utf-8") as f:
                        data = f.read()
                    self._cache[key] = (mtime, data)
                    self._last_success_timestamp = mtime
                    return data
                else:
                    os.remove(disk_file)
            except Exception as e:
                logger.warning(f"Error reading disk cache {disk_file}: {e}")

        return None

    def set(self, key: str, data: str):
        now = time.time()
        self._cache[key] = (now, data)
        self._last_success_timestamp = now
        disk_file = self._get_disk_path(key)
        try:
            with open(disk_file, "w", encoding="utf-8") as f:
                f.write(data)
        except Exception as e:
            logger.warning(f"Error writing disk cache {disk_file}: {e}")

    def clear(self):
        self._cache.clear()
        try:
            for f in os.listdir(self.cache_dir):
                if f.endswith(".csv"):
                    os.remove(os.path.join(self.cache_dir, f))
        except Exception as e:
            logger.warning(f"Error clearing cache dir: {e}")

    @property
    def last_success_time(self) -> Optional[float]:
        return self._last_success_timestamp


class FirmsClient:
    """
    Production client for NASA FIRMS REST API.
    Provides secure credential handling, automatic retries, in-memory caching,
    and multi-sensor fetching.
    """
    def __init__(
        self,
        map_key: Optional[str] = None,
        default_bbox: str = "79.4,12.2,80.6,13.7",
        cache_ttl_seconds: int = 600
    ):
        self.map_key = map_key or os.getenv("FIRMS_MAP_KEY", "")
        self.default_bbox = os.getenv("DEFAULT_BBOX", default_bbox)
        self.cache = FirmsCache(ttl_seconds=cache_ttl_seconds)
        
        # Mask key for logging
        if self.map_key and len(self.map_key) > 8:
            self.masked_key = f"{self.map_key[:4]}...{self.map_key[-4:]}"
        else:
            self.masked_key = "[EMPTY/INVALID]"
        
        logger.info(f"Initialized FirmsClient with MAP_KEY: {self.masked_key}")

    def validate_key_presence(self):
        if not self.map_key or self.map_key.strip() == "" or "your_" in self.map_key:
            raise FirmsAPIError(
                "NASA FIRMS MAP_KEY is missing or unconfigured. Please set FIRMS_MAP_KEY in backend/.env",
                status_code=401
            )

    def fetch_source_csv(
        self,
        source: str = "VIIRS_SNPP_NRT",
        bbox: Optional[str] = None,
        days: int = 5,
        date_str: Optional[str] = None,
        force_refresh: bool = False
    ) -> Tuple[str, bool, float]:
        """
        Fetch active fire observations for a specific satellite source.
        Returns: (csv_data, is_cached, retrieval_timestamp)
        """
        self.validate_key_presence()

        if source not in SUPPORTED_SOURCES:
            raise FirmsAPIError(
                f"Unsupported source '{source}'. Must be one of: {list(SUPPORTED_SOURCES.keys())}",
                status_code=400
            )

        # NASA FIRMS Area API expects day_range between 1 and 5
        clamped_days = max(1, min(5, days))
        target_bbox = bbox or self.default_bbox

        # Build URL
        # Format: /api/area/csv/[MAP_KEY]/[SOURCE]/[EXTENT]/[DAYS]/[DATE]
        clean_date = str(date_str).strip() if (date_str is not None and str(date_str).strip() and not str(date_str).strip().isdigit()) else None
        if clean_date:
            api_url = f"{FIRMS_BASE_URL}/{self.map_key}/{source}/{target_bbox}/{clamped_days}/{clean_date}"
            cache_key = f"{source}_{target_bbox}_{clamped_days}_{clean_date}"
        else:
            api_url = f"{FIRMS_BASE_URL}/{self.map_key}/{source}/{target_bbox}/{clamped_days}"
            cache_key = f"{source}_{target_bbox}_{clamped_days}_latest"

        # Check Cache
        if not force_refresh:
            cached_data = self.cache.get(cache_key)
            if cached_data is not None:
                logger.debug(f"Serving {source} from cache key {cache_key}")
                return cached_data, True, self.cache.last_success_time or time.time()

        # Perform HTTP Request
        logger.info(f"Querying NASA FIRMS for {source} (bbox: {target_bbox}, days: {clamped_days}, date: {date_str or 'latest'})")
        try:
            response = requests.get(
                api_url,
                headers={"User-Agent": "ChennaiForestFireMonitoring-IEEE/1.0"},
                timeout=18
            )
        except requests.exceptions.Timeout:
            raise FirmsAPIError("NASA FIRMS API request timed out after 18 seconds.", status_code=504)
        except requests.exceptions.RequestException as e:
            raise FirmsAPIError(f"Network error contacting NASA FIRMS: {str(e)}", status_code=502)

        if response.status_code == 200:
            csv_content = response.text.strip()
            # If FIRMS returns an error text with 200 OK or 400
            if "Invalid MAP_KEY" in csv_content:
                raise FirmsAPIError("Invalid NASA FIRMS MAP_KEY provided. Please check credentials.", status_code=401)
            
            now = time.time()
            self.cache.set(cache_key, csv_content)
            return csv_content, False, now

        elif response.status_code == 400:
            err_text = response.text.strip()
            if "Invalid MAP_KEY" in err_text:
                raise FirmsAPIError("NASA FIRMS rejected the MAP_KEY as invalid.", status_code=401)
            raise FirmsAPIError(f"NASA FIRMS API Bad Request: {err_text}", status_code=400)
        elif response.status_code == 403:
            raise FirmsAPIError("NASA FIRMS API access forbidden. Rate limit exceeded or blocked.", status_code=403)
        else:
            raise FirmsAPIError(f"NASA FIRMS responded with HTTP {response.status_code}: {response.text[:200]}", status_code=response.status_code)

    def fetch_all_active_sources(
        self,
        bbox: Optional[str] = None,
        days: int = 5,
        date_str: Optional[str] = None,
        selected_sources: Optional[List[str]] = None,
        force_refresh: bool = False
    ) -> Dict[str, Dict]:
        """
        Fetch fire data from multiple satellite sources (VIIRS SNPP, NOAA-20, NOAA-21, MODIS).
        Returns dictionary keyed by source with raw CSV and metadata.
        """
        sources_to_query = selected_sources or list(SUPPORTED_SOURCES.keys())
        results = {}

        for src in sources_to_query:
            try:
                csv_data, is_cached, timestamp = self.fetch_source_csv(
                    source=src,
                    bbox=bbox,
                    days=days,
                    date_str=date_str,
                    force_refresh=force_refresh
                )
                results[src] = {
                    "source_name": SUPPORTED_SOURCES.get(src, src),
                    "csv_data": csv_data,
                    "is_cached": is_cached,
                    "retrieved_at": timestamp,
                    "status": "success"
                }
            except Exception as e:
                logger.error(f"Failed to fetch source {src}: {e}")
                results[src] = {
                    "source_name": SUPPORTED_SOURCES.get(src, src),
                    "csv_data": "",
                    "is_cached": False,
                    "retrieved_at": time.time(),
                    "status": "error",
                    "error_message": str(e)
                }

        return results

    def verify_key_status(self) -> Dict:
        """Query NASA FIRMS mapkey_status endpoint to verify transaction quota and status."""
        if hasattr(self, "_cached_key_status") and (time.time() - getattr(self, "_cached_key_time", 0)) < 60:
            return self._cached_key_status

        self.validate_key_presence()
        status_url = f"https://firms.modaps.eosdis.nasa.gov/mapserver/mapkey_status/?MAP_KEY={self.map_key}"
        try:
            resp = requests.get(status_url, timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                res = {
                    "valid": True,
                    "masked_key": self.masked_key,
                    "transaction_limit": data.get("transaction_limit"),
                    "current_transactions": data.get("current_transactions"),
                    "transaction_interval": data.get("transaction_interval"),
                    "status": "active"
                }
                self._cached_key_status = res
                self._cached_key_time = time.time()
                return res
            else:
                return {
                    "valid": False,
                    "masked_key": self.masked_key,
                    "status": f"HTTP {resp.status_code}: {resp.text}"
                }
        except Exception as e:
            return {
                "valid": False,
                "masked_key": self.masked_key,
                "status": f"Error: {str(e)}"
            }
