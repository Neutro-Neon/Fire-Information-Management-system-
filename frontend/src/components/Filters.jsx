import React from 'react';
import { Filter, Calendar, Satellite, Sliders, SunMoon, Layers, RefreshCw, Eye, EyeOff } from 'lucide-react';

export default function Filters({
  filters,
  onFilterChange,
  onRefresh,
  loading,
  layerVisibility,
  onToggleLayer
}) {
  return (
    <div className="bg-[#111827]/95 border-y border-slate-800 px-4 sm:px-6 py-2.5 max-w-[1920px] mx-auto">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        
        {/* Main Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          
          {/* Day Range Selector */}
          <div className="flex items-center gap-1.5 bg-[#090d16] border border-slate-700/80 rounded-lg px-2.5 py-1.5 shadow-inner">
            <Calendar className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-slate-400 font-medium">Days:</span>
            <div className="flex items-center gap-1 ml-1">
              {[1, 2, 3, 5].map((d) => (
                <button
                  key={d}
                  onClick={() => onFilterChange({ days: d, date: '' })}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono transition ${
                    filters.days === d && !filters.date
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>

          {/* Specific Date Picker */}
          <div className="flex items-center gap-1.5 bg-[#090d16] border border-slate-700/80 rounded-lg px-2.5 py-1.5 shadow-inner">
            <span className="text-slate-400 font-medium">Date:</span>
            <input
              type="date"
              value={filters.date || ''}
              onChange={(e) => onFilterChange({ date: e.target.value })}
              className="bg-transparent text-slate-200 border-none outline-none text-xs font-mono cursor-pointer"
            />
            {filters.date && (
              <button
                onClick={() => onFilterChange({ date: '' })}
                className="text-[10px] text-slate-500 hover:text-red-400 ml-1"
                title="Clear date filter"
              >
                ✕
              </button>
            )}
          </div>

          {/* Satellite Instrument Filter */}
          <div className="flex items-center gap-1.5 bg-[#090d16] border border-slate-700/80 rounded-lg px-2.5 py-1.5 shadow-inner">
            <Satellite className="w-3.5 h-3.5 text-cyan-400" />
            <select
              value={filters.satellite}
              onChange={(e) => onFilterChange({ satellite: e.target.value })}
              className="bg-transparent text-slate-200 border-none outline-none text-xs cursor-pointer font-medium"
            >
              <option value="ALL" className="bg-slate-900">All Satellites (VIIRS + MODIS)</option>
              <option value="VIIRS_SNPP_NRT" className="bg-slate-900">Suomi-NPP VIIRS (375m)</option>
              <option value="VIIRS_NOAA20_NRT" className="bg-slate-900">NOAA-20 VIIRS (375m)</option>
              <option value="VIIRS_NOAA21_NRT" className="bg-slate-900">NOAA-21 VIIRS (375m)</option>
              <option value="MODIS_NRT" className="bg-slate-900">Terra/Aqua MODIS (1km)</option>
            </select>
          </div>

          {/* Confidence Filter */}
          <div className="flex items-center gap-1.5 bg-[#090d16] border border-slate-700/80 rounded-lg px-2.5 py-1.5 shadow-inner">
            <Filter className="w-3.5 h-3.5 text-amber-400" />
            <select
              value={filters.minConfidence}
              onChange={(e) => onFilterChange({ minConfidence: e.target.value })}
              className="bg-transparent text-slate-200 border-none outline-none text-xs cursor-pointer font-medium"
            >
              <option value="ALL" className="bg-slate-900">All Confidence Levels</option>
              <option value="NOMINAL_PLUS" className="bg-slate-900">Nominal & High</option>
              <option value="HIGH" className="bg-slate-900">High Confidence Only</option>
            </select>
          </div>

          {/* Min FRP Threshold Slider */}
          <div className="flex items-center gap-2 bg-[#090d16] border border-slate-700/80 rounded-lg px-2.5 py-1.5 shadow-inner">
            <Sliders className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-slate-400 font-medium">Min FRP:</span>
            <input
              type="range"
              min="0"
              max="20"
              step="0.5"
              value={filters.minFrp}
              onChange={(e) => onFilterChange({ minFrp: parseFloat(e.target.value) })}
              className="w-16 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
            />
            <span className="text-orange-400 font-mono font-semibold min-w-[32px]">
              {filters.minFrp > 0 ? `${filters.minFrp}MW` : 'Off'}
            </span>
          </div>

          {/* Day / Night Filter */}
          <div className="flex items-center gap-1.5 bg-[#090d16] border border-slate-700/80 rounded-lg px-2.5 py-1.5 shadow-inner">
            <SunMoon className="w-3.5 h-3.5 text-purple-400" />
            <select
              value={filters.daynight}
              onChange={(e) => onFilterChange({ daynight: e.target.value })}
              className="bg-transparent text-slate-200 border-none outline-none text-xs cursor-pointer font-medium"
            >
              <option value="ALL" className="bg-slate-900">Day & Night</option>
              <option value="DAY" className="bg-slate-900">Day Detections</option>
              <option value="NIGHT" className="bg-slate-900">Night Detections</option>
            </select>
          </div>

        </div>

        {/* GIS Layer Visibility Toggles & Refresh */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          
          <div className="flex items-center gap-1 bg-[#090d16] border border-slate-700/80 rounded-lg p-1">
            
            {/* Fires Layer */}
            <button
              onClick={() => onToggleLayer('fires')}
              className={`px-2 py-1 rounded text-[11px] font-medium flex items-center gap-1 transition ${
                layerVisibility.fires ? 'bg-red-950/70 text-red-300 border border-red-800/60' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Toggle Active Fires Layer"
            >
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span>Fires</span>
            </button>

            {/* Forest Reserves Layer */}
            <button
              onClick={() => onToggleLayer('forests')}
              className={`px-2 py-1 rounded text-[11px] font-medium flex items-center gap-1 transition ${
                layerVisibility.forests ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800/60' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Toggle Forest & Protected Vegetation Reserves"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Forests</span>
            </button>

            {/* District Boundaries Layer */}
            <button
              onClick={() => onToggleLayer('districts')}
              className={`px-2 py-1 rounded text-[11px] font-medium flex items-center gap-1 transition ${
                layerVisibility.districts ? 'bg-cyan-950/70 text-cyan-300 border border-cyan-800/60' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Toggle District Administrative Boundaries"
            >
              <span className="w-2 h-2 rounded-full bg-cyan-500" />
              <span>Districts</span>
            </button>

            {/* CMA Boundary Layer */}
            <button
              onClick={() => onToggleLayer('cma')}
              className={`px-2 py-1 rounded text-[11px] font-medium flex items-center gap-1 transition ${
                layerVisibility.cma ? 'bg-amber-950/70 text-amber-300 border border-amber-800/60' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Toggle Chennai Metropolitan Area (CMA) Boundary"
            >
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>CMA</span>
            </button>

            {/* Ground Sensors Layer */}
            <button
              onClick={() => onToggleLayer('sensors')}
              className={`px-2 py-1 rounded text-[11px] font-medium flex items-center gap-1 transition ${
                layerVisibility.sensors ? 'bg-indigo-950/70 text-indigo-300 border border-indigo-800/60' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Toggle IEEE Ground Sensor Network Layer"
            >
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              <span>Sensors</span>
            </button>

          </div>

          {/* Refresh Satellite Data Button */}
          <button
            onClick={onRefresh}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium flex items-center gap-1.5 transition shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Satellite Data</span>
          </button>

        </div>

      </div>
    </div>
  );
}
