import React, { useState } from 'react';
import { X, ExternalLink, Copy, Check, Crosshair, MapPin, Thermometer, Shield, TreePine, Navigation } from 'lucide-react';

export default function EventDetailsPanel({
  fire,
  onClose,
  onZoomTo,
  totalCount,
  isCollapsed,
  onToggleCollapse,
  selectedRegion,
  regionInfo
}) {
  const [copied, setCopied] = useState(false);

  if (isCollapsed) {
    return (
      <div className="w-9 bg-[var(--bg-panel)] border-l border-[var(--border-subtle)] flex flex-col items-center py-3 z-20 select-none transition-all duration-300 slide-in-right">
        <button
          onClick={onToggleCollapse}
          className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-[rgba(255,255,255,0.06)] rounded transition-all"
          title="Expand Event Inspector"
        >
          <Crosshair className="w-4 h-4" />
        </button>
        <div className="mt-6 flex flex-col items-center gap-3">
          <MapPin className="w-3.5 h-3.5 text-[var(--text-dim)]" />
          <Thermometer className="w-3.5 h-3.5 text-[var(--text-dim)]" />
          <TreePine className="w-3.5 h-3.5 text-[var(--text-dim)]" />
        </div>
        <div className="mt-8 [writing-mode:vertical-lr] text-[9px] uppercase font-mono tracking-[0.2em] text-[var(--text-dim)]">
          Inspector
        </div>
      </div>
    );
  }

  const copyCoordinates = (lat, lon) => {
    navigator.clipboard.writeText(`${lat.toFixed(5)}, ${lon.toFixed(5)}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // State A: Empty State (No Fire Selected)
  if (!fire) {
    return (
      <aside className="w-72 bg-[var(--bg-panel)] border-l border-[var(--border-subtle)] flex flex-col justify-between text-xs text-slate-300 z-20 flex-shrink-0 select-none overflow-y-auto transition-all duration-300 slide-in-right">
        <div className="p-3 space-y-4">
          <div className="pb-2 border-b border-[var(--border-subtle)]">
            <div className="text-[10px] uppercase font-bold text-[var(--text-dim)] font-mono tracking-wider">
              Observation Inspector
            </div>
            <div className="text-[11px] text-[var(--text-dim)] mt-0.5">
              Target Telemetry & Signals
            </div>
          </div>

          <div className="py-8 px-2 text-center text-[var(--text-dim)] space-y-3 fade-in">
            <div className="w-12 h-12 mx-auto rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-panel-sub)] flex items-center justify-center">
              <Crosshair className="w-5 h-5 text-[var(--text-dim)]" />
            </div>
            <div className="font-semibold text-slate-300 text-xs uppercase tracking-wide">
              Select a Detection
            </div>
            <p className="text-[11px] text-[var(--text-dim)] leading-relaxed max-w-[220px] mx-auto">
              Select a satellite detection on the map or from the observation stream to inspect its telemetry signals.
            </p>
          </div>

          {/* Regional Monitoring Overview */}
          <div className="pt-3 border-t border-[var(--border-subtle)] space-y-2 text-[11px]">
            <div className="text-[10px] uppercase font-mono font-semibold text-[var(--text-dim)]">
              Active Biome Envelope
            </div>
            <div className="space-y-0 font-mono text-[11px] text-slate-400">
              {[
                { label: 'Region', value: regionInfo?.short_name || 'Selected Biome' },
                { label: 'Country', value: regionInfo?.country || 'Global' },
                { label: 'Bounding Box', value: regionInfo?.bbox || 'Default BBOX', mono: true, small: true },
                { label: 'Active Sensors', value: 'VIIRS 375m / MODIS 1km' },
                { label: 'Hotspots', value: totalCount, highlight: true }
              ].map((item, i) => (
                <div key={i} className="flex justify-between py-1 border-b border-[var(--border-subtle)] last:border-b-0">
                  <span className="text-[var(--text-dim)]">{item.label}</span>
                  <span className={`${item.highlight ? 'text-amber-400 font-bold' : 'text-slate-200'} ${item.small ? 'text-[10px]' : ''}`}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-3 border-t border-[var(--border-subtle)] text-[10px] font-mono text-[var(--text-dim)] bg-[var(--bg-panel-sub)]">
          NASA FIRMS • Global Forest Fire Monitoring
        </div>
      </aside>
    );
  }

  // State B: Fire Detection Selected
  const dist = fire.nearest_forest_reserve?.distance_km;
  const isNearForest = dist !== undefined && dist <= 5.0;

  // Calculate severity visual
  const severityConfig = {
    HIGH: { color: 'text-red-400', bg: 'bg-red-500', bgLight: 'bg-red-500/20', border: 'border-red-800', label: 'HIGH', glow: 'fire-glow' },
    MEDIUM: { color: 'text-orange-400', bg: 'bg-orange-500', bgLight: 'bg-orange-500/15', border: 'border-orange-800', label: 'MEDIUM', glow: '' },
    LOW: { color: 'text-emerald-400', bg: 'bg-emerald-500', bgLight: 'bg-emerald-500/10', border: 'border-emerald-800', label: 'LOW', glow: '' }
  };
  const sev = severityConfig[fire.severity] || severityConfig.LOW;

  return (
    <aside className="w-72 sm:w-80 bg-[var(--bg-panel)] border-l border-[var(--border-subtle)] flex flex-col justify-between text-xs text-slate-300 z-20 flex-shrink-0 select-none overflow-y-auto transition-all duration-300 slide-in-right">
      
      <div className="divide-y divide-[var(--border-subtle)]">
        
        {/* Panel Header with Severity Indicator & Close Button */}
        <div className="p-2.5 flex items-center justify-between bg-[var(--bg-panel-sub)]">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-md ${sev.bgLight} flex items-center justify-center ${sev.glow}`}>
              <div className={`w-3 h-3 rounded-full ${sev.bg}`} />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider">
                Detection — <span className={sev.color}>{sev.label}</span>
              </div>
              <div className="text-[10px] font-mono text-[var(--text-dim)] truncate max-w-[180px]">
                {fire.id}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-100 hover:bg-[rgba(255,255,255,0.06)] rounded transition-all"
            title="Deselect observation"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* SEVERITY GAUGE */}
        <div className="px-3 py-2 bg-[var(--bg-panel-sub)]">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-[var(--border-subtle)] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  fire.severity === 'HIGH' ? 'bg-red-500 w-full' :
                  fire.severity === 'MEDIUM' ? 'bg-orange-400 w-2/3' :
                  'bg-emerald-400 w-1/3'
                }`}
              />
            </div>
            <span className={`text-[10px] font-mono font-bold ${sev.color}`}>{fire.frp} MW</span>
          </div>
        </div>

        {/* 1. LOCATION SECTION */}
        <div className="p-2.5 space-y-1.5 fade-in">
          <div className="text-[10px] uppercase font-semibold text-[var(--text-dim)] font-mono tracking-wider flex items-center gap-1.5">
            <MapPin className="w-3 h-3 text-[var(--accent-primary)]" />
            Geographic Location
          </div>
          
          <div className="text-sm font-semibold text-white leading-snug">
            {fire.locality || fire.formatted_location || 'Regional Observation Area'}
          </div>

          <div className="text-[11px] text-[var(--accent-primary)] font-medium">
            District: <span className="text-slate-200">{fire.district || 'Regional Area'}</span>
          </div>

          <div className="text-[11px] text-[var(--text-dim)]">
            Land: <span className="text-slate-200">{fire.land_type || 'Tropical Vegetation'}</span>
          </div>

          {/* Coordinates Bar */}
          <div className="mt-1 p-1.5 bg-[var(--bg-panel-sub)] border border-[var(--border-subtle)] rounded flex items-center justify-between font-mono text-[11px]">
            <span className="text-slate-200 tabular-nums">
              {fire.latitude.toFixed(4)}°, {fire.longitude.toFixed(4)}°
            </span>
            <button
              onClick={() => copyCoordinates(fire.latitude, fire.longitude)}
              className="text-[10px] text-slate-400 hover:text-[var(--accent-primary)] flex items-center gap-1 transition-all"
              title="Copy coordinates"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* 2. OBSERVATION METADATA */}
        <div className="p-2.5 space-y-1.5">
          <div className="text-[10px] uppercase font-semibold text-[var(--text-dim)] font-mono tracking-wider flex items-center gap-1.5">
            <Navigation className="w-3 h-3 text-[var(--accent-primary)]" />
            Observation Metadata
          </div>

          <div className="space-y-0 font-mono text-[11px]">
            {[
              { label: 'Acquisition', value: `${fire.time_ist} IST`, bold: true },
              { label: 'UTC', value: `${fire.acq_date} ${fire.time_utc} UTC` },
              { label: 'Satellite', value: fire.satellite },
              { label: 'Sensor', value: fire.instrument },
              { label: 'Pass', value: `${fire.daynight} pass`, noBorder: true }
            ].map((item, i) => (
              <div key={i} className={`flex justify-between py-1 ${item.noBorder ? '' : 'border-b border-[var(--border-subtle)]'}`}>
                <span className="text-[var(--text-dim)] font-sans">{item.label}</span>
                <span className={`${item.bold ? 'text-slate-200 font-semibold' : 'text-slate-300'}`}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 3. RADIOMETRIC SIGNALS */}
        <div className="p-2.5 space-y-1.5">
          <div className="text-[10px] uppercase font-semibold text-[var(--text-dim)] font-mono tracking-wider flex items-center gap-1.5">
            <Thermometer className="w-3 h-3 text-[var(--accent-primary)]" />
            Radiometric Signals
          </div>

          <div className="space-y-0 font-mono text-[11px]">
            <div className="flex justify-between py-1 border-b border-[var(--border-subtle)]">
              <span className="text-[var(--text-dim)] font-sans">Fire Radiative Power</span>
              <span className="text-orange-400 font-bold">{fire.frp} MW</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[var(--border-subtle)]">
              <span className="text-[var(--text-dim)] font-sans">Confidence Level</span>
              <span className={`font-semibold ${
                fire.confidence_level === 'High' ? 'text-red-400' : fire.confidence_level === 'Nominal' ? 'text-amber-400' : 'text-slate-400'
              }`}>
                {fire.confidence_display} ({fire.confidence_level})
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-[var(--border-subtle)]">
              <span className="text-[var(--text-dim)] font-sans">Brightness Temp</span>
              <span className="text-slate-200">
                {fire.brightness_temp_c !== null ? `${fire.brightness_temp_c}°C` : 'N/A'}
                {fire.brightness_temp_k ? ` (${fire.brightness_temp_k} K)` : ''}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[var(--text-dim)] font-sans">Background Temp</span>
              <span className="text-slate-400">
                {fire.background_temp_k ? `${fire.background_temp_k} K` : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* 4. FOREST PROXIMITY */}
        <div className="p-2.5 space-y-1.5">
          <div className="text-[10px] uppercase font-semibold text-[var(--text-dim)] font-mono tracking-wider flex items-center gap-1.5">
            <TreePine className="w-3 h-3 text-emerald-400" />
            Forest Proximity
          </div>

          <div className="space-y-0 text-[11px]">
            <div className="flex justify-between py-1 border-b border-[var(--border-subtle)] font-mono">
              <span className="text-[var(--text-dim)] font-sans">Nearest Reserve</span>
              <span className="text-slate-200 font-semibold text-right max-w-[140px] truncate">{fire.nearest_forest_reserve?.name || 'Regional Reserve'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[var(--border-subtle)] font-mono">
              <span className="text-[var(--text-dim)] font-sans">Buffer Distance</span>
              <span className={isNearForest ? "text-amber-400 font-bold" : "text-slate-300"}>
                {dist !== undefined ? `${dist} km` : 'N/A'}
              </span>
            </div>
          </div>

          <div className={`p-2 rounded text-[11px] leading-relaxed border transition-all ${
            isNearForest
              ? 'bg-amber-950/30 border-amber-800/60 text-amber-200'
              : 'bg-[var(--bg-panel-sub)] border-[var(--border-subtle)] text-[var(--text-dim)]'
          }`}>
            {isNearForest ? (
              <span>
                <strong>⚠ Buffer Alert:</strong> Hotspot within {dist} km of {fire.nearest_forest_reserve?.name}. Priority canopy surveillance zone.
              </span>
            ) : (
              <span>
                <strong>Biome Event:</strong> Located {dist !== undefined ? `${dist} km` : 'N/A'} from nearest registered reserve. Surface thermal radiance in {fire.land_type || 'open biomass/farmland'}.
              </span>
            )}
          </div>
        </div>

      </div>

      {/* OPERATIONAL ACTIONS FOOTER */}
      <div className="p-2.5 border-t border-[var(--border-subtle)] flex items-center gap-2 bg-[var(--bg-panel-sub)]">
        <button
          onClick={() => onZoomTo(fire)}
          className="flex-1 py-2 px-2 rounded bg-[var(--accent-badge)] hover:bg-[var(--accent-primary)]/25 border border-[var(--accent-primary)] text-[var(--accent-primary)] font-semibold text-xs transition-all text-center hover:shadow-lg hover:shadow-[var(--accent-glow)]"
        >
          Center on Map
        </button>
        <a
          href={`https://www.google.com/maps?q=${fire.latitude},${fire.longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          className="py-2 px-2.5 rounded bg-[var(--bg-panel)] hover:bg-[var(--border-subtle)] border border-[var(--border-subtle)] text-slate-300 hover:text-white transition-all flex items-center gap-1 text-xs"
          title="Inspect location on Google Earth / Maps"
        >
          <span>Earth</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

    </aside>
  );
}
