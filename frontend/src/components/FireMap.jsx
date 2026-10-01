import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

// Fix Leaflet default icon path issues in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Authentic, Open Basemap Tile Providers
const BASEMAPS = {
  dark: {
    name: 'Esri Dark Canvas',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    referenceUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
    maxZoom: 19,
    maxNativeZoom: 16
  },
  satellite: {
    name: 'Esri World Imagery',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    referenceUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics',
    maxZoom: 19,
    maxNativeZoom: 18
  },
  osm: {
    name: 'OpenStreetMap Standard',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    subdomains: 'abc',
    maxZoom: 19,
    maxNativeZoom: 19
  }
};

/**
 * Creates a premium GIS fire marker with glow effects and severity-coded colors.
 * FRP determines symbol diameter. Selected points show animated reticle.
 */
function createGisFireMarkerIcon(fire, isSelected = false) {
  const frp = fire.frp || 0;
  const severity = fire.severity || 'LOW';

  // Sizing by FRP: 8px to 16px
  const diameter = Math.max(8, Math.min(16, 7 + Math.sqrt(frp) * 2));
  const containerSize = isSelected ? 30 : diameter + 6;

  let fillColor = '#10b981'; // LOW
  let glowColor = 'rgba(16, 185, 129, 0.4)';
  let strokeColor = '#064e3b';

  if (severity === 'HIGH') {
    fillColor = '#ef4444';
    glowColor = 'rgba(239, 68, 68, 0.5)';
    strokeColor = '#ffffff';
  } else if (severity === 'MEDIUM') {
    fillColor = '#f59e0b';
    glowColor = 'rgba(245, 158, 11, 0.4)';
    strokeColor = '#78350f';
  }

  const svgHtml = `
    <div style="width: ${containerSize}px; height: ${containerSize}px; display: flex; align-items: center; justify-content: center; position: relative; filter: drop-shadow(0 0 ${severity === 'HIGH' ? '6' : '3'}px ${glowColor});">
      ${isSelected ? `
        <!-- Animated outer target reticle ring -->
        <svg viewBox="0 0 32 32" width="30" height="30" style="position: absolute; animation: spin 8s linear infinite;">
          <circle cx="16" cy="16" r="13" fill="none" stroke="#38bdf8" stroke-width="1.2" stroke-dasharray="4, 3" opacity="0.8"/>
          <line x1="16" y1="0" x2="16" y2="5" stroke="#38bdf8" stroke-width="1.2" opacity="0.9"/>
          <line x1="16" y1="27" x2="16" y2="32" stroke="#38bdf8" stroke-width="1.2" opacity="0.9"/>
          <line x1="0" y1="16" x2="5" y2="16" stroke="#38bdf8" stroke-width="1.2" opacity="0.9"/>
          <line x1="27" y1="16" x2="32" y2="16" stroke="#38bdf8" stroke-width="1.2" opacity="0.9"/>
        </svg>
        <style>@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}</style>
      ` : ''}
      <!-- Primary GIS point symbol -->
      <svg viewBox="0 0 16 16" width="${diameter}" height="${diameter}">
        <circle cx="8" cy="8" r="6.5" fill="${fillColor}" stroke="${strokeColor}" stroke-width="1.2" />
        <circle cx="8" cy="8" r="2.5" fill="#ffffff" opacity="0.7" />
        <circle cx="8" cy="8" r="1" fill="${fillColor}" opacity="0.8" />
      </svg>
    </div>
  `;

  return L.divIcon({
    html: svgHtml,
    className: 'gis-fire-marker',
    iconSize: [containerSize, containerSize],
    iconAnchor: [containerSize / 2, containerSize / 2],
    popupAnchor: [0, -containerSize / 2]
  });
}

/**
 * Creates a premium IoT sensor node symbol.
 */
function createSensorNodeIcon() {
  const svgHtml = `
    <div style="width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; filter: drop-shadow(0 0 4px rgba(129, 140, 248, 0.3));">
      <svg viewBox="0 0 20 20" width="17" height="17">
        <rect x="3" y="3" width="14" height="14" rx="3" fill="#1e1b4b" stroke="#818cf8" stroke-width="1.2"/>
        <circle cx="10" cy="10" r="3.5" fill="#a5b4fc" />
        <circle cx="10" cy="10" r="1.5" fill="#1e1b4b" />
      </svg>
    </div>
  `;
  return L.divIcon({
    html: svgHtml,
    className: 'gis-sensor-marker',
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
}

export default function FireMap({
  fires,
  selectedFire,
  onSelectFire,
  layerVisibility,
  districtsGeoJson,
  cmaGeoJson,
  forestsGeoJson,
  sensors,
  activeBasemap = 'dark',
  regionInfo,
  loading = false,
  selectedRegion = 'chennai',
  onSelectRegion
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const referenceLayerRef = useRef(null);
  const clusterGroupRef = useRef(null);
  const districtsLayerRef = useRef(null);
  const cmaLayerRef = useRef(null);
  const forestsLayerRef = useRef(null);
  const sensorsLayerRef = useRef(null);
  const selectionBufferRef = useRef(null);

  const [mouseCoords, setMouseCoords] = useState(null);
  const [currentZoom, setCurrentZoom] = useState(9);

  // 1. Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (!mapInstanceRef.current) {
      const initCenter = regionInfo?.center || [5.0, 30.0];
      const initZoom = regionInfo?.default_zoom || 2;
      const map = L.map(mapContainerRef.current, {
        center: initCenter,
        zoom: initZoom,
        zoomControl: true,
        attributionControl: true
      });

      // Add Official Scale Control (Metric only)
      L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(map);

      // Track cursor coordinates
      map.on('mousemove', (e) => {
        setMouseCoords({ lat: e.latlng.lat, lon: e.latlng.lng });
      });
      map.on('mouseout', () => {
        setMouseCoords(null);
      });
      map.on('zoomend', () => {
        setCurrentZoom(map.getZoom());
      });

      // Initial Basemap
      const config = BASEMAPS[activeBasemap] || BASEMAPS.dark;
      tileLayerRef.current = L.tileLayer(config.url, {
        attribution: config.attribution,
        maxZoom: config.maxZoom,
        maxNativeZoom: config.maxNativeZoom || config.maxZoom,
        subdomains: config.subdomains || ''
      }).addTo(map);

      if (config.referenceUrl) {
        referenceLayerRef.current = L.tileLayer(config.referenceUrl, {
          maxZoom: config.maxZoom,
          maxNativeZoom: config.maxNativeZoom || config.maxZoom,
          subdomains: config.subdomains || '',
          zIndex: 5
        }).addTo(map);
      }

      // Marker Cluster Group
      clusterGroupRef.current = L.markerClusterGroup({
        chunkedLoading: true,
        showCoverageOnHover: false,
        maxClusterRadius: 35,
        spiderfyOnMaxZoom: true
      }).addTo(map);

      // Layer groups
      districtsLayerRef.current = L.layerGroup().addTo(map);
      cmaLayerRef.current = L.layerGroup().addTo(map);
      forestsLayerRef.current = L.layerGroup().addTo(map);
      sensorsLayerRef.current = L.layerGroup().addTo(map);
      selectionBufferRef.current = L.layerGroup().addTo(map);

      mapInstanceRef.current = map;
    }
  }, []);

  // 2. Basemap Switcher
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const config = BASEMAPS[activeBasemap] || BASEMAPS.dark;

    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
      tileLayerRef.current = null;
    }
    if (referenceLayerRef.current) {
      mapInstanceRef.current.removeLayer(referenceLayerRef.current);
      referenceLayerRef.current = null;
    }

    tileLayerRef.current = L.tileLayer(config.url, {
      attribution: config.attribution,
      maxZoom: config.maxZoom,
      maxNativeZoom: config.maxNativeZoom || config.maxZoom,
      subdomains: config.subdomains || ''
    }).addTo(mapInstanceRef.current);

    if (config.referenceUrl) {
      referenceLayerRef.current = L.tileLayer(config.referenceUrl, {
        maxZoom: config.maxZoom,
        maxNativeZoom: config.maxNativeZoom || config.maxZoom,
        subdomains: config.subdomains || '',
        zIndex: 5
      }).addTo(mapInstanceRef.current);
    }
  }, [activeBasemap]);

  // 3. Forest & Vegetation Reserves Layer
  useEffect(() => {
    if (!forestsLayerRef.current) return;
    forestsLayerRef.current.clearLayers();

    if (layerVisibility.forests && forestsGeoJson) {
      const geoLayer = L.geoJSON(forestsGeoJson, {
        style: {
          color: '#059669',
          weight: 1.5,
          opacity: 0.9,
          fillColor: '#10b981',
          fillOpacity: 0.15,
          dashArray: '4, 3'
        },
        onEachFeature: (feature, layer) => {
          const props = feature.properties || {};
          layer.bindTooltip(`
            <div class="font-mono text-[11px]">
              <strong class="text-emerald-400 font-bold">${props.name || 'Forest Reserve'}</strong><br/>
              <span class="text-slate-400">${props.category || 'Reserve'} • ${props.district || 'Chennai Region'}</span>
            </div>
          `, { sticky: true, className: 'leaflet-tooltip-dark' });
        }
      });
      forestsLayerRef.current.addLayer(geoLayer);
    }
  }, [forestsGeoJson, layerVisibility.forests]);

  // 4. Regional District Boundaries Layer
  useEffect(() => {
    if (!districtsLayerRef.current) return;
    districtsLayerRef.current.clearLayers();

    if (layerVisibility.districts && districtsGeoJson) {
      const geoLayer = L.geoJSON(districtsGeoJson, {
        style: {
          color: '#0284c7',
          weight: 1.2,
          opacity: 0.8,
          fillColor: '#0369a1',
          fillOpacity: 0.03,
          dashArray: '6, 3'
        },
        onEachFeature: (feature, layer) => {
          const props = feature.properties || {};
          layer.bindTooltip(`
            <div class="font-mono text-[11px] text-cyan-300">
              ${props.district || 'District Boundary'} (${props.state || 'TN'})
            </div>
          `, { sticky: true, className: 'leaflet-tooltip-dark' });
        }
      });
      districtsLayerRef.current.addLayer(geoLayer);
    }
  }, [districtsGeoJson, layerVisibility.districts]);

  // 5. Chennai Metropolitan Area (CMA) Boundary Layer
  useEffect(() => {
    if (!cmaLayerRef.current) return;
    cmaLayerRef.current.clearLayers();

    if (layerVisibility.cma && cmaGeoJson) {
      const geoLayer = L.geoJSON(cmaGeoJson, {
        style: {
          color: '#d97706',
          weight: 1.4,
          opacity: 0.8,
          fillColor: '#b45309',
          fillOpacity: 0.02,
          dashArray: '8, 4'
        },
        onEachFeature: (feature, layer) => {
          layer.bindTooltip(`
            <div class="font-mono text-[11px] text-amber-300">
              Chennai Metropolitan Area (CMA Boundary)
            </div>
          `, { sticky: true, className: 'leaflet-tooltip-dark' });
        }
      });
      cmaLayerRef.current.addLayer(geoLayer);
    }
  }, [cmaGeoJson, layerVisibility.cma]);

  // 6. IEEE Ground Sensors Layer
  useEffect(() => {
    if (!sensorsLayerRef.current) return;
    sensorsLayerRef.current.clearLayers();

    if (layerVisibility.sensors && sensors && sensors.length > 0) {
      sensors.forEach((sensor) => {
        const marker = L.marker([sensor.latitude, sensor.longitude], {
          icon: createSensorNodeIcon()
        });
        marker.bindTooltip(`
          <div class="font-mono text-[11px]">
            <span class="text-indigo-400 font-bold">Node ${sensor.sensor_id}</span><br/>
            <span class="text-slate-300">${sensor.forest_location}</span><br/>
            <span class="text-slate-400">Temp: ${sensor.temperature}°C | Smoke: ${sensor.smoke_level} ppm</span>
          </div>
        `, { sticky: true, className: 'leaflet-tooltip-dark' });
        sensorsLayerRef.current.addLayer(marker);
      });
    }
  }, [sensors, layerVisibility.sensors]);

  // 7. Active Fire Detections Layer (FIRMS)
  useEffect(() => {
    if (!clusterGroupRef.current) return;
    clusterGroupRef.current.clearLayers();

    if (!layerVisibility.fires || !fires || fires.length === 0) return;

    const markers = [];
    fires.forEach((fire) => {
      const isSelected = selectedFire?.id === fire.id;
      const marker = L.marker([fire.latitude, fire.longitude], {
        icon: createGisFireMarkerIcon(fire, isSelected),
        zIndexOffset: isSelected ? 1000 : 100
      });

      // Hover Tooltip: High-density, professional technical readout
      const dist = fire.nearest_forest_reserve?.distance_km;
      const isNearForest = dist !== undefined && dist <= 5.0;

      marker.bindTooltip(`
        <div class="font-mono text-[11px] min-w-[220px] space-y-1">
          <div class="flex items-center justify-between pb-1 border-b border-[#334155]">
            <span class="${fire.severity === 'HIGH' ? 'text-red-400 font-bold' : fire.severity === 'MEDIUM' ? 'text-orange-400 font-semibold' : 'text-emerald-400'}">
              ${fire.severity} SEVERITY
            </span>
            <span class="text-amber-400 font-bold">${fire.frp} MW</span>
          </div>
          <div class="text-white font-sans text-xs font-semibold leading-tight">
            ${fire.locality || fire.formatted_location || 'Regional Observation Area'}
          </div>
          <div class="text-slate-400 text-[10px] flex justify-between">
            <span>${fire.district || 'Tamil Nadu'}</span>
            <span class="text-slate-300">${fire.latitude.toFixed(4)}°, ${fire.longitude.toFixed(4)}°</span>
          </div>
          <div class="text-slate-400 text-[10px] pt-0.5 border-t border-[#1e293b] flex justify-between">
            <span>${fire.time_ist} IST</span>
            <span>${fire.satellite} (${fire.confidence_display})</span>
          </div>
          <div class="text-[10px] pt-0.5 ${isNearForest ? 'text-amber-400 font-semibold' : 'text-slate-500'}">
            ${isNearForest ? `⚠ BUFFER ALERT: ${dist} km to ${fire.nearest_forest_reserve?.name}` : `PLAINS: ${dist !== undefined ? dist + ' km to forest' : 'N/A'}`}
          </div>
        </div>
      `, { sticky: true, className: 'leaflet-tooltip-dark' });

      // Marker click
      marker.on('click', () => {
        onSelectFire(fire);
      });

      markers.push(marker);
    });

    clusterGroupRef.current.addLayers(markers);
  }, [fires, selectedFire, layerVisibility.fires, onSelectFire]);

  // 8. Visual Selection Buffer & Pan when selectedFire changes
  useEffect(() => {
    if (!selectionBufferRef.current) return;
    selectionBufferRef.current.clearLayers();

    if (!selectedFire) return;

    // Draw a subtle 5 km spatial buffer ring around the selected hotspot
    const bufferCircle = L.circle([selectedFire.latitude, selectedFire.longitude], {
      radius: 5000,
      color: '#38bdf8',
      weight: 1.2,
      dashArray: '4, 4',
      fillColor: '#38bdf8',
      fillOpacity: 0.04
    });
    selectionBufferRef.current.addLayer(bufferCircle);
  }, [selectedFire]);

  // 9. Fly to Region when regionInfo changes
  useEffect(() => {
    if (!mapInstanceRef.current || !regionInfo) return;
    const center = regionInfo.center || [13.04, 80.12];
    const zoom = regionInfo.default_zoom || 9;
    mapInstanceRef.current.flyTo(center, zoom, {
      animate: true,
      duration: 1.4
    });
  }, [regionInfo?.id]);

  const defaultCenterText = regionInfo
    ? `${regionInfo.short_name || regionInfo.name} (${regionInfo.center ? `${regionInfo.center[0]}°, ${regionInfo.center[1]}°` : ''})`
    : 'Center: 13.0400°N, 80.1200°E';

  return (
    <div className="relative w-full h-full flex-1 min-h-[300px] overflow-hidden bg-[#050810]">
      
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Biome Quick-Switcher */}
      <div className="absolute top-3 right-3 z-[400] flex flex-col items-end gap-1.5 pointer-events-auto">
        <div className="glass-strong rounded-md p-1 shadow-xl flex items-center gap-0.5 font-mono text-[10px]">
          <span className="text-[var(--text-dim)] px-1.5 uppercase font-semibold text-[9px] tracking-wider">Biome:</span>
          {[
            { id: 'all', label: 'Global', icon: '🌍' },
            { id: 'chennai', label: 'Chennai', icon: '🇮🇳' },
            { id: 'indonesia', label: 'Indonesia', icon: '🇮🇩' },
            { id: 'amazon', label: 'Amazon', icon: '🇧🇷' }
          ].map((b) => (
            <button
              key={b.id}
              onClick={() => onSelectRegion && onSelectRegion(b.id)}
              className={`px-2 py-1 rounded-[3px] transition-all duration-200 flex items-center gap-1 uppercase font-bold tracking-tight cursor-pointer text-[10px] ${
                selectedRegion === b.id
                  ? 'bg-[var(--accent-primary)] text-black shadow-md shadow-[var(--accent-glow)]'
                  : 'text-slate-300 hover:text-white hover:bg-[rgba(255,255,255,0.06)]'
              }`}
            >
              <span className="text-[11px]">{b.icon}</span>
              <span>{b.label}</span>
            </button>
          ))}
        </div>

        {/* Live Satellite Observation Status Pill */}
        <div className="glass-strong rounded-md px-3 py-1.5 text-[10px] font-mono text-slate-300 flex items-center gap-2 shadow-lg select-none">
          {loading ? (
            <div className="flex items-center gap-2 text-amber-400 font-semibold">
              <span className="relative w-2 h-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 absolute live-ping" />
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 absolute top-[1px] left-[1px]" />
              </span>
              <span>ACQUIRING FIRMS OBSERVATIONS...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="relative w-2 h-2 flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="absolute w-2 h-2 rounded-full bg-emerald-400 live-ping" />
              </span>
              <span className="text-[var(--text-dim)] uppercase text-[9px]">{regionInfo?.short_name || 'Biome'}:</span>
              <span className="font-bold text-amber-400">{fires ? fires.length : 0} <span className="text-[var(--text-dim)] font-normal">Hotspots</span></span>
            </div>
          )}
        </div>
      </div>

      {/* Coordinate & Projection HUD (Bottom Right) */}
      <div className="absolute bottom-2 right-2 z-[400] glass-strong px-2.5 py-1 rounded text-[10px] font-mono text-slate-300 flex items-center gap-2 select-none pointer-events-none transition-all duration-200">
        {mouseCoords ? (
          <span className="tabular-nums">
            {mouseCoords.lat.toFixed(4)}°N, {mouseCoords.lon.toFixed(4)}°E
          </span>
        ) : (
          <span className="text-[var(--text-dim)]">{defaultCenterText}</span>
        )}
        <span className="text-[var(--border-strong)]">│</span>
        <span className="text-[var(--text-muted)]">Z{currentZoom}</span>
        <span className="text-[var(--border-strong)]">│</span>
        <span className="text-[var(--text-dim)]">WGS84</span>
      </div>

    </div>
  );
}
