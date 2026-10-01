import React, { useState } from 'react';
import { Calendar, Trees, Satellite, Layers, RefreshCw, Eye, EyeOff, Sliders, ChevronDown, Flame, BarChart3 } from 'lucide-react';

export default function MapFloatingControls({
  filters,
  onFilterChange,
  onRefresh,
  loading,
  layerVisibility,
  onToggleLayer,
  totalCount,
  nearForestCount,
  maxFrp,
  onSwitchToAnalytics
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [showLayersMenu, setShowLayersMenu] = useState(false);

  return (
    <>
      {/* 1. Top-Left Floating Controls Pill */}
      <div className="absolute top-3 left-3 z-[800] flex flex-col gap-2">
        
        {/* Main Floating Bar */}
        <div className="bg-[#0f172a]/90 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-2xl p-1.5 flex flex-wrap items-center gap-2 text-xs">
          
          {/* Collapse/Expand button */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title={collapsed ? 'Show map controls' : 'Hide map controls for full map view'}
          >
            {collapsed ? <Eye className="w-4 h-4 text-blue-400" /> : <EyeOff className="w-4 h-4" />}
          </button>

          {!collapsed && (
            <>
              {/* Day Range */}
              <div className="flex items-center gap-1 bg-[#090d16] border border-slate-800 rounded-xl px-2 py-1">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                {[1, 2, 3, 5].map((d) => (
                  <button
                    key={d}
                    onClick={() => onFilterChange({ days: d, date: '' })}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-mono transition ${
                      filters.days === d && !filters.date
                        ? 'bg-blue-600 text-white font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {d}d
                  </button>
                ))}
              </div>

              {/* Forest Proximity Filter (Direct solution to user feedback!) */}
              <div className="flex items-center gap-1.5 bg-[#090d16] border border-slate-800 rounded-xl px-2.5 py-1">
                <Trees className="w-3.5 h-3.5 text-emerald-400" />
                <select
                  value={filters.forestFilter || 'ALL'}
                  onChange={(e) => onFilterChange({ forestFilter: e.target.value })}
                  className="bg-transparent text-slate-200 border-none outline-none text-xs cursor-pointer font-semibold"
                >
                  <option value="ALL" className="bg-slate-900">All Detections (Plains & Forest)</option>
                  <option value="FOREST_5KM" className="bg-slate-900">🌲 Forest Buffer (≤ 5km)</option>
                  <option value="FOREST_10KM" className="bg-slate-900">🌲 Forest Buffer (≤ 10km)</option>
                  <option value="PLAINS" className="bg-slate-900">🚜 Plains / Non-Forest Only</option>
                </select>
              </div>

              {/* Satellite Instrument Filter */}
              <div className="hidden sm:flex items-center gap-1.5 bg-[#090d16] border border-slate-800 rounded-xl px-2.5 py-1">
                <Satellite className="w-3.5 h-3.5 text-cyan-400" />
                <select
                  value={filters.satellite}
                  onChange={(e) => onFilterChange({ satellite: e.target.value })}
                  className="bg-transparent text-slate-200 border-none outline-none text-xs cursor-pointer font-medium"
                >
                  <option value="ALL" className="bg-slate-900">All Satellites</option>
                  <option value="VIIRS_SNPP_NRT" className="bg-slate-900">Suomi-NPP VIIRS</option>
                  <option value="VIIRS_NOAA20_NRT" className="bg-slate-900">NOAA-20 VIIRS</option>
                  <option value="VIIRS_NOAA21_NRT" className="bg-slate-900">NOAA-21 VIIRS</option>
                  <option value="MODIS_NRT" className="bg-slate-900">Terra/Aqua MODIS</option>
                </select>
              </div>

              {/* Layer Toggles Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowLayersMenu(!showLayersMenu)}
                  className="px-2.5 py-1 rounded-xl bg-[#090d16] border border-slate-800 hover:bg-slate-800 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Layers</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {showLayersMenu && (
                  <div className="absolute left-0 top-9 bg-[#111827]/95 backdrop-blur-md border border-slate-700 rounded-xl shadow-2xl p-2 w-48 space-y-1 z-50 text-xs">
                    <div className="text-[10px] uppercase font-bold text-slate-400 px-2 py-0.5">
                      Toggle Map Overlays
                    </div>
                    {[
                      { id: 'fires', label: 'Active Fire Hotspots', color: 'bg-red-500' },
                      { id: 'forests', label: 'Forest & Vegetation Reserves', color: 'bg-emerald-500' },
                      { id: 'districts', label: 'District Boundaries', color: 'bg-cyan-500' },
                      { id: 'cma', label: 'CMA Boundary', color: 'bg-amber-500' },
                      { id: 'sensors', label: 'IEEE Ground Sensors', color: 'bg-indigo-500' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => onToggleLayer(item.id)}
                        className="w-full px-2 py-1.5 rounded-lg flex items-center justify-between text-left hover:bg-slate-800 transition"
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                          <span className={layerVisibility[item.id] ? 'text-white font-medium' : 'text-slate-500 line-through'}>
                            {item.label}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">
                          {layerVisibility[item.id] ? 'ON' : 'OFF'}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Refresh Button */}
              <button
                onClick={onRefresh}
                disabled={loading}
                className="p-1.5 rounded-xl bg-blue-600/30 hover:bg-blue-600 text-blue-300 hover:text-white transition disabled:opacity-50"
                title="Refresh FIRMS data"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </>
          )}

        </div>

      </div>

      {/* 2. Top-Center Floating Mini-Stats Banner (Clickable to switch to Analytics) */}
      <button
        onClick={onSwitchToAnalytics}
        className="hidden md:flex items-center gap-3 absolute top-3 left-1/2 -translate-x-1/2 z-[790] bg-[#0f172a]/90 backdrop-blur-md border border-slate-700/80 rounded-full px-4 py-1.5 text-xs text-slate-200 shadow-xl hover:border-blue-500 transition cursor-pointer"
        title="Click to open full Analytics Dashboard"
      >
        <span className="flex items-center gap-1.5 font-bold text-white">
          <Flame className="w-3.5 h-3.5 text-orange-400" />
          {totalCount} Hotspots
        </span>
        <span className="text-slate-600">•</span>
        <span className="flex items-center gap-1 text-emerald-400 font-medium">
          <Trees className="w-3.5 h-3.5" />
          {nearForestCount} near forest
        </span>
        <span className="text-slate-600">•</span>
        <span className="text-amber-400 font-mono">
          Max: {maxFrp} MW
        </span>
        <span className="text-slate-600">•</span>
        <span className="text-blue-400 font-semibold flex items-center gap-1 text-[11px]">
          <BarChart3 className="w-3 h-3" />
          Analytics
        </span>
      </button>
    </>
  );
}
