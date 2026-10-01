import React, { useState } from 'react';
import { Layers, ChevronLeft, ChevronRight, SlidersHorizontal, Globe, TreePine, Sun, Moon, Zap } from 'lucide-react';

export default function GisControlPanel({
  filters,
  onFilterChange,
  onRefresh,
  loading,
  layerVisibility,
  onToggleLayer,
  activeBasemap,
  onChangeBasemap,
  isCollapsed,
  onToggleCollapse,
  selectedRegion,
  onSelectRegion,
  regionInfo
}) {
  const [expandedSection, setExpandedSection] = useState(null);

  if (isCollapsed) {
    return (
      <div className="w-9 bg-[var(--bg-panel)] border-r border-[var(--border-subtle)] flex flex-col items-center py-3 z-20 select-none transition-all duration-300 slide-in-left">
        <button
          onClick={onToggleCollapse}
          className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-[rgba(255,255,255,0.06)] rounded transition-all"
          title="Expand Control Panel"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <div className="mt-6 flex flex-col items-center gap-3">
          <SlidersHorizontal className="w-3.5 h-3.5 text-[var(--text-dim)]" />
          <Layers className="w-3.5 h-3.5 text-[var(--text-dim)]" />
          <Globe className="w-3.5 h-3.5 text-[var(--text-dim)]" />
        </div>
        <div className="mt-8 [writing-mode:vertical-lr] text-[9px] uppercase font-mono tracking-[0.2em] text-[var(--text-dim)]">
          Controls
        </div>
      </div>
    );
  }

  const biomesList = [
    { id: 'all', name: 'All Surveillance Biomes', country: 'Global', desc: 'Multi-Biome', icon: '🌍' },
    { id: 'chennai', name: 'Chennai Region', country: 'Tamil Nadu, India', desc: 'IEEE Study Area', icon: '🇮🇳' },
    { id: 'indonesia', name: 'Indonesia Rainforests', country: 'Sumatra & Borneo', desc: 'Peatland Hotspot', icon: '🇮🇩' },
    { id: 'amazon', name: 'Amazon Rainforest', country: 'South America', desc: 'Deforestation Arc', icon: '🇧🇷' }
  ];

  const SectionHeader = ({ icon: Icon, title, children }) => (
    <div className="px-3 pt-3 pb-1.5 flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        {Icon && <Icon className="w-3.5 h-3.5 text-[var(--accent-primary)]" />}
        <span className="text-[10px] uppercase font-bold text-[var(--text-dim)] font-mono tracking-wider">{title}</span>
      </div>
      {children}
    </div>
  );

  return (
    <aside className="w-64 bg-[var(--bg-panel)] border-r border-[var(--border-subtle)] flex flex-col justify-between text-xs text-slate-300 z-20 flex-shrink-0 select-none overflow-y-auto transition-all duration-300 slide-in-left">
      
      <div>
        
        {/* Panel Header */}
        <div className="p-2.5 flex items-center justify-between bg-[var(--bg-panel-sub)] border-b border-[var(--border-subtle)]">
          <span className="font-bold text-[10px] uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
            Control Console
          </span>
          <button
            onClick={onToggleCollapse}
            className="p-1 text-slate-400 hover:text-slate-100 hover:bg-[rgba(255,255,255,0.06)] rounded transition-all"
            title="Collapse Panel"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* BIOME SELECTOR TILES */}
        <div className="p-2 space-y-1 bg-[var(--bg-panel-sub)] border-b border-[var(--border-subtle)]">
          <SectionHeader icon={Globe} title="Target Biome" />
          <div className="space-y-1 px-1">
            {biomesList.map((b) => {
              const isActive = selectedRegion === b.id;
              return (
                <button
                  key={b.id}
                  onClick={() => onSelectRegion(b.id)}
                  className={`w-full text-left p-2 rounded transition-all duration-200 border group ${
                    isActive
                      ? 'bg-[var(--accent-badge)] border-[var(--accent-primary)] shadow-sm shadow-[var(--accent-glow)]'
                      : 'bg-transparent border-transparent hover:bg-[rgba(255,255,255,0.03)] hover:border-[var(--border-subtle)]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px]">{b.icon}</span>
                      <span className={`font-semibold text-[11px] ${isActive ? 'text-[var(--accent-primary)]' : 'text-slate-300'}`}>
                        {b.name}
                      </span>
                    </div>
                    {isActive && <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)] animate-pulse" />}
                  </div>
                  <div className="text-[10px] text-[var(--text-dim)] font-mono flex items-center justify-between mt-0.5 pl-6">
                    <span>{b.country}</span>
                    <span className="text-[9px] opacity-60">{b.desc}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* SECTION 1: DATA RETRIEVAL */}
        <div className="border-b border-[var(--border-subtle)]">
          <SectionHeader icon={Zap} title="Data Retrieval" />
          <div className="px-3 pb-3 space-y-2.5">
            {/* Temporal Window */}
            <div className="space-y-1">
              <label className="text-[11px] text-[var(--text-muted)] flex justify-between">
                <span>Time Window</span>
                <span className="font-mono text-[var(--text-dim)]">{filters.days}d</span>
              </label>
              <div className="grid grid-cols-4 gap-1">
                {[1, 2, 5, 7].map((d) => (
                  <button
                    key={d}
                    onClick={() => onFilterChange({ days: d, date: '' })}
                    className={`py-1.5 text-[11px] font-mono rounded transition-all duration-200 text-center border ${
                      filters.days === d && !filters.date
                        ? 'bg-[var(--accent-badge)] border-[var(--accent-primary)] text-[var(--accent-primary)] font-bold shadow-sm'
                        : 'bg-[var(--bg-panel-sub)] border-[var(--border-subtle)] text-slate-400 hover:text-slate-200 hover:border-[var(--border-strong)]'
                    }`}
                  >
                    {d === 1 ? '24h' : `${d}d`}
                  </button>
                ))}
              </div>
            </div>

            {/* Satellite Platform */}
            <div className="space-y-1">
              <label className="text-[11px] text-[var(--text-muted)]">Satellite Platform</label>
              <select
                value={filters.satellite}
                onChange={(e) => onFilterChange({ satellite: e.target.value })}
                className="w-full py-1.5 px-2.5 bg-[var(--bg-panel-sub)] border border-[var(--border-subtle)] rounded text-xs text-slate-200 focus:outline-none focus:border-[var(--accent-primary)] font-sans transition-colors"
              >
                <option value="ALL">All Satellite Constellations</option>
                <option value="VIIRS_SNPP_NRT">Suomi NPP (VIIRS 375m)</option>
                <option value="VIIRS_NOAA20_NRT">NOAA-20 (VIIRS 375m)</option>
                <option value="VIIRS_NOAA21_NRT">NOAA-21 (VIIRS 375m)</option>
                <option value="MODIS_NRT">Terra / Aqua (MODIS 1km)</option>
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 2: DETECTION FILTERS */}
        <div className="border-b border-[var(--border-subtle)]">
          <SectionHeader icon={SlidersHorizontal} title="Observation Filters" />
          <div className="px-3 pb-3 space-y-2.5">

            {/* Confidence Filter */}
            <div className="space-y-1">
              <label className="text-[11px] text-[var(--text-muted)]">Minimum Confidence</label>
              <select
                value={filters.minConfidence}
                onChange={(e) => onFilterChange({ minConfidence: e.target.value })}
                className="w-full py-1.5 px-2.5 bg-[var(--bg-panel-sub)] border border-[var(--border-subtle)] rounded text-xs text-slate-200 focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
              >
                <option value="ALL">All Detections (Low, Nominal, High)</option>
                <option value="NOMINAL">Nominal & High (Recommended)</option>
                <option value="HIGH">High Confidence Only</option>
              </select>
            </div>

            {/* Forest Proximity / Land Zone Filter */}
            <div className="space-y-1">
              <label className="text-[11px] text-[var(--text-muted)]">Forest Buffer Zone</label>
              <select
                value={filters.forestFilter || 'ALL'}
                onChange={(e) => onFilterChange({ forestFilter: e.target.value })}
                className="w-full py-1.5 px-2.5 bg-[var(--bg-panel-sub)] border border-[var(--border-subtle)] rounded text-xs text-slate-200 focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
              >
                <option value="ALL">All Regional Detections</option>
                <option value="FOREST_5KM">Forest Buffer Zone (≤ 5 km)</option>
                <option value="FOREST_10KM">Forest Buffer Zone (≤ 10 km)</option>
                <option value="PLAINS">Plains / Non-Forest Only</option>
              </select>
            </div>

            {/* FRP Filter */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[var(--text-muted)]">Min Radiative Power</span>
                <span className="font-mono text-[var(--accent-primary)] font-semibold">{filters.minFrp || 0} MW</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="1"
                value={filters.minFrp || 0}
                onChange={(e) => onFilterChange({ minFrp: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>

            {/* Day / Night Pass */}
            <div className="space-y-1">
              <label className="text-[11px] text-[var(--text-muted)]">Orbital Pass</label>
              <div className="grid grid-cols-3 gap-1">
                {[
                  { label: 'All', val: 'ALL', icon: null },
                  { label: 'Day', val: 'DAY', icon: Sun },
                  { label: 'Night', val: 'NIGHT', icon: Moon }
                ].map((item) => (
                  <button
                    key={item.val}
                    onClick={() => onFilterChange({ daynight: item.val })}
                    className={`py-1.5 text-[11px] rounded border transition-all duration-200 text-center font-mono flex items-center justify-center gap-1 ${
                      filters.daynight === item.val
                        ? 'bg-[var(--accent-badge)] border-[var(--accent-primary)] text-[var(--accent-primary)] font-bold'
                        : 'bg-[var(--bg-panel-sub)] border-[var(--border-subtle)] text-slate-400 hover:text-slate-200 hover:border-[var(--border-strong)]'
                    }`}
                  >
                    {item.icon && <item.icon className="w-3 h-3" />}
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: GEOGRAPHIC & VECTOR LAYERS */}
        <div className="border-b border-[var(--border-subtle)]">
          <SectionHeader icon={Layers} title="Map Layers" />
          <div className="px-3 pb-3 space-y-0.5">
            {[
              { key: 'fires', label: 'Active Fire Points', color: 'bg-amber-500', shape: 'rounded-full w-2.5 h-2.5', always: true },
              { key: 'forests', label: 'Forest Reserves', color: 'bg-emerald-500', shape: 'rounded-sm w-3 h-1.5', always: true },
              { key: 'districts', label: 'District Boundaries', color: 'bg-cyan-400', shape: 'w-3 h-[2px]', chennaiOnly: true },
              { key: 'cma', label: 'Metropolitan (CMA)', color: 'bg-amber-400', shape: 'w-3 h-[2px]', chennaiOnly: true },
              { key: 'sensors', label: 'IEEE Sensor Nodes', color: 'bg-indigo-400', shape: 'rounded-sm w-2.5 h-2.5', chennaiOnly: true }
            ].filter(layer => layer.always || (layer.chennaiOnly && selectedRegion === 'chennai'))
            .map((layer) => (
              <label
                key={layer.key}
                className="flex items-center gap-2.5 cursor-pointer hover:bg-[rgba(255,255,255,0.03)] py-1.5 px-1 rounded transition-all group"
              >
                <input
                  type="checkbox"
                  checked={layerVisibility[layer.key]}
                  onChange={() => onToggleLayer(layer.key)}
                />
                <span className="flex-1 flex items-center justify-between text-[11px]">
                  <span className="group-hover:text-slate-100 transition-colors">{layer.label}</span>
                  <span className={`${layer.color} ${layer.shape}`} />
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* SECTION 4: BASEMAP SELECTOR */}
        <div>
          <SectionHeader icon={Globe} title="Basemap Style" />
          <div className="px-3 pb-3">
            <div className="grid grid-cols-3 gap-1">
              {[
                { id: 'dark', label: 'Dark', desc: 'Esri Canvas' },
                { id: 'satellite', label: 'Imagery', desc: 'Satellite' },
                { id: 'osm', label: 'Street', desc: 'OSM' }
              ].map((bm) => (
                <button
                  key={bm.id}
                  onClick={() => onChangeBasemap(bm.id)}
                  className={`py-1.5 rounded border transition-all duration-200 text-center ${
                    activeBasemap === bm.id
                      ? 'bg-[var(--accent-badge)] border-[var(--accent-primary)] text-[var(--accent-primary)] font-bold shadow-sm'
                      : 'bg-[var(--bg-panel-sub)] border-[var(--border-subtle)] text-slate-400 hover:text-slate-200 hover:border-[var(--border-strong)]'
                  }`}
                >
                  <div className="text-[11px] font-mono">{bm.label}</div>
                  <div className="text-[8px] text-[var(--text-dim)]">{bm.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Footer Info */}
      <div className="p-2.5 border-t border-[var(--border-subtle)] text-[10px] font-mono text-[var(--text-dim)] leading-tight bg-[var(--bg-panel-sub)]">
        <span>CRS: EPSG:4326 / WGS 84</span><br/>
        <span>NASA LANCE / FIRMS Active Fire</span>
      </div>

    </aside>
  );
}
