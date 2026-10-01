import React, { useState, useEffect, useCallback } from 'react';
import GisHeader from './components/GisHeader';
import GisControlPanel from './components/GisControlPanel';
import FireMap from './components/FireMap';
import EventDetailsPanel from './components/EventDetailsPanel';
import BottomEventStream from './components/BottomEventStream';
import SensorView from './components/SensorView';
import { AlertCircle, WifiOff, RefreshCw } from 'lucide-react';

const DEFAULT_REGIONS = {
  all: {
    id: 'all',
    name: 'Global Multi-Biome Surveillance (All Regions)',
    short_name: 'All Biomes (Global)',
    country: 'India / Indonesia / Brazil',
    biome: 'Integrated Tropical Rainforests, Peatlands & Reserves',
    bbox: 'global',
    center: [5.0, 30.0],
    default_zoom: 2
  },
  chennai: {
    id: 'chennai',
    name: 'Chennai & Surrounding Districts',
    short_name: 'Chennai Region',
    country: 'India',
    biome: 'Tropical Dry Evergreen / Agricultural Plains',
    bbox: '79.4,12.2,80.6,13.7',
    center: [13.04, 80.12],
    default_zoom: 9
  },
  indonesia: {
    id: 'indonesia',
    name: 'Indonesia Tropical Rainforests',
    short_name: 'Indonesia Rainforests',
    country: 'Indonesia',
    biome: 'Equatorial Peat Swamp & Lowland Dipterocarp Rainforest',
    bbox: '98.0,-5.0,118.0,5.0',
    center: [-0.5, 108.0],
    default_zoom: 6
  },
  amazon: {
    id: 'amazon',
    name: 'Amazon Rainforest Biome',
    short_name: 'Amazon Rainforest',
    country: 'Brazil / Bolivia / Peru',
    biome: 'Amazonian Tropical Moist Broadleaf Forest',
    bbox: '-65.0,-12.0,-50.0,-2.0',
    center: [-7.0, -57.5],
    default_zoom: 6
  }
};

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-[var(--bg-primary)] text-slate-300 gap-4 p-8">
          <div className="w-16 h-16 rounded-full bg-red-950 flex items-center justify-center">
            <WifiOff className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-lg font-bold text-slate-100">Application Error</h2>
          <p className="text-sm text-slate-400 max-w-md text-center">
            An unexpected error occurred in the Forest Fire Monitoring System. This may be caused by a network issue or data processing error.
          </p>
          <pre className="text-[11px] font-mono text-red-300 bg-red-950/30 border border-red-900 rounded px-4 py-2 max-w-lg overflow-auto">
            {this.state.error?.message || 'Unknown error'}
          </pre>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--accent-primary)] text-black font-semibold rounded text-sm hover:opacity-90 transition"
          >
            <RefreshCw className="w-4 h-4" />
            Reload Application
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function AppContent() {
  // Selected Region & Biome ('all' | 'chennai' | 'indonesia' | 'amazon')
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [regions, setRegions] = useState(DEFAULT_REGIONS);

  // Selected Color Theme ('forest' | 'charcoal' | 'obsidian' | 'steel')
  const [currentTheme, setCurrentTheme] = useState('forest');

  // Backend & Satellite Data States
  const [health, setHealth] = useState(null);
  const [firesData, setFiresData] = useState({
    records: [],
    statistics: null,
    count: 0,
    cached: false,
    last_retrieved_iso: null,
    empty_state_message: null
  });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);

  // Geographic Layers States
  const [districtsGeoJson, setDistrictsGeoJson] = useState(null);
  const [cmaGeoJson, setCmaGeoJson] = useState(null);
  const [forestsGeoJson, setForestsGeoJson] = useState(null);
  const [sensors, setSensors] = useState([]);

  // Selected Detection for Inspector
  const [selectedFire, setSelectedFire] = useState(null);

  // Panel Collapsible States (for maximizing map workspace)
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false);
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);
  const [isBottomStreamCollapsed, setIsBottomStreamCollapsed] = useState(false);
  const [showSensorsView, setShowSensorsView] = useState(false);

  // Active Basemap
  const [activeBasemap, setActiveBasemap] = useState('dark');

  // Filters State
  const [filters, setFilters] = useState({
    days: 2,
    date: '',
    satellite: 'ALL',
    minConfidence: 'ALL',
    minFrp: 0,
    daynight: 'ALL',
    forestFilter: 'ALL' // 'ALL' | 'FOREST_5KM' | 'FOREST_10KM' | 'PLAINS'
  });

  // Layer Visibility Toggles
  const [layerVisibility, setLayerVisibility] = useState({
    fires: true,
    forests: true,
    districts: true,
    cma: true,
    sensors: true
  });

  const toggleLayer = (layerKey) => {
    setLayerVisibility((prev) => ({
      ...prev,
      [layerKey]: !prev[layerKey]
    }));
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger shortcuts when typing in inputs
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;

      switch (e.key.toLowerCase()) {
        case 'r':
          e.preventDefault();
          fetchFires(true);
          break;
        case '1':
          e.preventDefault();
          handleRegionChange('all');
          break;
        case '2':
          e.preventDefault();
          handleRegionChange('chennai');
          break;
        case '3':
          e.preventDefault();
          handleRegionChange('indonesia');
          break;
        case '4':
          e.preventDefault();
          handleRegionChange('amazon');
          break;
        case 'escape':
          e.preventDefault();
          setSelectedFire(null);
          setShowSensorsView(false);
          break;
        case 'f':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            setIsLeftPanelCollapsed(prev => !prev);
            setIsRightPanelCollapsed(prev => !prev);
            setIsBottomStreamCollapsed(prev => !prev);
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 1. Fetch Backend Health, Regions & GeoJSON Layers on Mount
  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => setHealth(data))
      .catch((err) => console.error('Health check error:', err));

    fetch('/api/regions')
      .then((res) => res.json())
      .then((data) => {
        if (data.regions) setRegions(data.regions);
      })
      .catch((err) => console.error('Regions error:', err));

    fetch('/api/layers/districts')
      .then((res) => res.json())
      .then((data) => setDistrictsGeoJson(data))
      .catch((err) => console.error('Districts error:', err));

    fetch('/api/layers/metropolitan')
      .then((res) => res.json())
      .then((data) => setCmaGeoJson(data))
      .catch((err) => console.error('Metropolitan error:', err));

    fetch('/api/layers/forests')
      .then((res) => res.json())
      .then((data) => setForestsGeoJson(data))
      .catch((err) => console.error('Forests error:', err));

    fetch('/api/sensors')
      .then((res) => res.json())
      .then((data) => setSensors(data.sensors || []))
      .catch((err) => console.error('Sensors error:', err));
  }, []);

  // 2. Fetch NASA FIRMS Fire Observations
  const fetchFires = useCallback((forceRefresh = false) => {
    setLoading(true);
    setErrorMessage(null);

    const queryParams = new URLSearchParams();
    queryParams.append('region', selectedRegion);

    if (filters.date) {
      queryParams.append('date', filters.date);
    } else {
      queryParams.append('days', filters.days.toString());
    }

    if (filters.satellite !== 'ALL') {
      queryParams.append('satellite', filters.satellite);
    }
    if (filters.minConfidence !== 'ALL') {
      queryParams.append('min_confidence', filters.minConfidence);
    }
    if (filters.minFrp > 0) {
      queryParams.append('min_frp', filters.minFrp.toString());
    }
    if (filters.daynight !== 'ALL') {
      queryParams.append('daynight', filters.daynight);
    }
    if (filters.forestFilter && filters.forestFilter !== 'ALL') {
      queryParams.append('forest_filter', filters.forestFilter);
    }
    if (forceRefresh) {
      queryParams.append('force_refresh', 'true');
    }

    fetch(`/api/fires?${queryParams.toString()}`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        return res.json();
      })
      .then((data) => {
        if (data.success) {
          setFiresData({
            records: data.records || [],
            statistics: data.statistics || null,
            count: data.count || 0,
            cached: data.cached || false,
            last_retrieved_iso: data.last_retrieved_iso || null,
            empty_state_message: data.empty_state_message || null
          });
        } else {
          setErrorMessage(data.error || 'Failed to retrieve NASA FIRMS active fire records.');
          setFiresData((prev) => ({
            ...prev,
            records: [],
            count: 0,
            empty_state_message: data.empty_state_message
          }));
        }
      })
      .catch((err) => {
        console.error('Error fetching fires:', err);
        const isFetchFail = err.message && err.message.toLowerCase().includes('failed to fetch');
        setErrorMessage(
          isFetchFail
            ? 'Cannot connect to backend server (Failed to fetch). Run "python run.py" to ensure backend is active.'
            : `NASA FIRMS Connection Error: ${err.message}`
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, [filters, selectedRegion]);

  useEffect(() => {
    fetchFires(false);
  }, [fetchFires]);

  const handleFilterChange = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleRegionChange = (newRegion) => {
    setSelectedRegion(newRegion);
    setSelectedFire(null); // Clear selected point on region switch
    // Immediately clear old region's fire records so they don't linger on the map while fetching
    setFiresData({
      records: [],
      statistics: null,
      count: 0,
      cached: false,
      last_retrieved_iso: null,
      empty_state_message: null
    });
    // Ensure fast 24h satellite pass default when switching to large biomes
    if (newRegion !== 'chennai' && filters.days > 1) {
      setFilters((prev) => ({ ...prev, days: 1 }));
    }
  };

  const currentRegionInfo = regions[selectedRegion] || DEFAULT_REGIONS[selectedRegion] || DEFAULT_REGIONS.chennai;

  return (
    <div
      data-theme={currentTheme}
      className="flex flex-col h-screen w-screen overflow-hidden bg-[var(--bg-primary)] text-[var(--text-primary)] select-none transition-colors duration-300"
    >
      
      {/* 1. TOP APPLICATION HEADER */}
      <GisHeader
        health={health}
        onRefresh={() => fetchFires(true)}
        loading={loading}
        statistics={firesData.statistics}
        totalCount={firesData.count}
        cached={firesData.cached}
        lastRetrievedIso={firesData.last_retrieved_iso}
        onToggleSensorsView={() => setShowSensorsView(!showSensorsView)}
        showSensorsView={showSensorsView}
        selectedRegion={selectedRegion}
        onSelectRegion={handleRegionChange}
        currentTheme={currentTheme}
        onChangeTheme={setCurrentTheme}
      />

      {/* Animated Progress Bar */}
      {loading && (
        <div className="h-[2px] w-full bg-[var(--bg-panel-sub)] overflow-hidden z-40 relative">
          <div className="h-full w-1/3 bg-gradient-to-r from-transparent via-[var(--accent-primary)] to-transparent progress-indeterminate" />
        </div>
      )}

      {/* Technical Error Notice */}
      {errorMessage && (
        <div className="h-8 bg-gradient-to-r from-[#450a0a] to-[#3b0a0a] border-b border-red-900/60 px-4 flex items-center justify-between text-[11px] font-mono text-red-200 flex-shrink-0 z-40 fade-in">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-3.5 h-3.5 text-red-400" />
            </div>
            <span className="truncate max-w-[600px]">{errorMessage}</span>
          </div>
          <button
            onClick={() => fetchFires(true)}
            className="text-[10px] uppercase font-bold text-red-300 hover:text-white px-2 py-0.5 rounded hover:bg-red-900/40 transition-all"
          >
            Retry Request
          </button>
        </div>
      )}

      {/* 2. WORKSTATION MAIN HORIZONTAL SPLIT (Left Panel | Center Map | Right Inspector) */}
      <div className="flex-1 flex min-h-0 relative overflow-hidden">
        
        {/* LEFT: NARROW GIS CONTROL PANEL */}
        <GisControlPanel
          filters={filters}
          onFilterChange={handleFilterChange}
          onRefresh={() => fetchFires(true)}
          loading={loading}
          layerVisibility={layerVisibility}
          onToggleLayer={toggleLayer}
          activeBasemap={activeBasemap}
          onChangeBasemap={setActiveBasemap}
          isCollapsed={isLeftPanelCollapsed}
          onToggleCollapse={() => setIsLeftPanelCollapsed(!isLeftPanelCollapsed)}
          selectedRegion={selectedRegion}
          onSelectRegion={handleRegionChange}
          regionInfo={currentRegionInfo}
        />

        {/* CENTER: INTERACTIVE MAP (THE PRODUCT) */}
        <div className="flex-1 flex flex-col min-w-0 h-full relative">
          <FireMap
            fires={firesData.records}
            selectedFire={selectedFire}
            onSelectFire={(fire) => {
              setSelectedFire(fire);
              if (isRightPanelCollapsed) setIsRightPanelCollapsed(false);
            }}
            layerVisibility={layerVisibility}
            districtsGeoJson={districtsGeoJson}
            cmaGeoJson={cmaGeoJson}
            forestsGeoJson={forestsGeoJson}
            sensors={sensors}
            activeBasemap={activeBasemap}
            regionInfo={currentRegionInfo}
            loading={loading}
            selectedRegion={selectedRegion}
            onSelectRegion={handleRegionChange}
          />
        </div>

        {/* RIGHT: TARGET EVENT INSPECTOR PANEL */}
        <EventDetailsPanel
          fire={selectedFire}
          onClose={() => setSelectedFire(null)}
          onZoomTo={(f) => setSelectedFire({ ...f })}
          totalCount={firesData.count}
          isCollapsed={isRightPanelCollapsed}
          onToggleCollapse={() => setIsRightPanelCollapsed(!isRightPanelCollapsed)}
          selectedRegion={selectedRegion}
          regionInfo={currentRegionInfo}
        />

      </div>

      {/* 3. BOTTOM: HIGH-DENSITY COLLAPSIBLE TABULAR OBSERVATION STREAM */}
      <BottomEventStream
        fires={firesData.records}
        selectedFire={selectedFire}
        onSelectFire={(fire) => {
          setSelectedFire(fire);
          if (isRightPanelCollapsed) setIsRightPanelCollapsed(false);
        }}
        isCollapsed={isBottomStreamCollapsed}
        onToggleCollapse={() => setIsBottomStreamCollapsed(!isBottomStreamCollapsed)}
        selectedRegion={selectedRegion}
      />

      {/* 4. MODAL: IEEE GROUND SENSOR NETWORK SPECIFICATION */}
      {showSensorsView && (
        <SensorView
          onClose={() => setShowSensorsView(false)}
          sensors={sensors}
        />
      )}

      {/* Keyboard Shortcut Hint (subtle, bottom-left) */}
      <div className="fixed bottom-1 left-1 z-50 text-[8px] font-mono text-[var(--text-dim)] opacity-40 hover:opacity-100 transition-opacity pointer-events-none select-none">
        R:Refresh • 1-4:Region • Esc:Clear • F:Focus
      </div>

    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}
