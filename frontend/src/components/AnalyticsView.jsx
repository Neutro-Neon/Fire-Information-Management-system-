import React from 'react';
import { Flame, ShieldAlert, Zap, Activity, Clock, MapPin, Trees, Satellite, SunMoon, AlertTriangle, ArrowRight, ExternalLink } from 'lucide-react';

export default function AnalyticsView({
  statistics,
  fires,
  lastUpdatedIso,
  isCached,
  loading,
  onSwitchToMap
}) {
  const stats = statistics || {};
  const total = stats.total_detections ?? fires.length ?? 0;
  const highConf = stats.high_confidence_count ?? 0;
  const nominalConf = stats.nominal_confidence_count ?? 0;
  const lowConf = stats.low_confidence_count ?? 0;
  const maxFrp = stats.max_frp ?? 0.0;
  const avgFrp = stats.average_frp ?? 0.0;

  // Proximity breakdown
  const nearForestCount = fires.filter(f => (f.nearest_forest_reserve?.distance_km ?? 999) <= 5.0).length;
  const plainsCount = total - nearForestCount;

  // Satellite breakdown
  const satCounts = {};
  fires.forEach(f => {
    const s = f.satellite || 'Other';
    satCounts[s] = (satCounts[s] || 0) + 1;
  });

  // Day / Night breakdown
  const dayCount = fires.filter(f => f.daynight === 'Day').length;
  const nightCount = fires.filter(f => f.daynight === 'Night').length;

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-6 text-slate-100">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111827] border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-white">
              Satellite Thermal Anomaly Analytics
            </h2>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-950 border border-blue-700 text-blue-300">
              Chennai & Surrounding Districts
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Calculated directly from real NASA FIRMS observations. No synthetic or placeholder data.
          </p>
        </div>
        <button
          onClick={onSwitchToMap}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition flex items-center gap-2 shadow-md flex-shrink-0"
        >
          <span>Return to Interactive Map</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* 1. Core Metrics HUD Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3.5">
        
        {/* Total Active Fires */}
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Active Detections</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold font-mono text-white">{loading ? '—' : total}</span>
            <span className="text-xs text-slate-400 ml-1">hotspots</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">NASA FIRMS Sensors</div>
        </div>

        {/* High Confidence */}
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>High Confidence</span>
            <ShieldAlert className="w-4 h-4 text-red-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-3xl font-bold font-mono text-white">{loading ? '—' : highConf}</span>
            <span className="text-xs text-red-400 font-mono">
              ({total > 0 ? Math.round((highConf / total) * 100) : 0}%)
            </span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Flagged 'h' / ≥80%</div>
        </div>

        {/* Max FRP */}
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Peak FRP</span>
            <Zap className="w-4 h-4 text-orange-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-3xl font-bold font-mono text-white">{loading ? '—' : maxFrp}</span>
            <span className="text-xs font-mono text-orange-400 font-semibold">MW</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Radiative Power</div>
        </div>

        {/* Average FRP */}
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Average FRP</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-3xl font-bold font-mono text-white">{loading ? '—' : avgFrp}</span>
            <span className="text-xs font-mono text-emerald-400 font-semibold">MW</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Mean Intensity</div>
        </div>

        {/* Last Satellite Update */}
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Last Update</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-3">
            <div className="text-sm font-bold font-mono text-white truncate">
              {lastUpdatedIso ? lastUpdatedIso.replace(' UTC', '') : 'Retrieving...'}
            </div>
            <span className="text-[10px] text-emerald-400 font-mono">
              {isCached ? 'Cached (10m)' : 'Live NASA Pull'}
            </span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">UTC Reference</div>
        </div>

        {/* Spatial Coverage */}
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Coverage</span>
            <MapPin className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-3">
            <div className="text-xs font-bold text-white truncate">Chennai Region</div>
            <div className="text-[10px] text-slate-400">4 Districts & Reserves</div>
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono">79.4°-80.6°E</div>
        </div>

      </div>

      {/* 2. Scientific Forest vs Plains Analysis (Directly addressing user question) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Land Cover & Forest Proximity Breakdown */}
        <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-950/80 border border-emerald-800/80 text-emerald-400">
              <Trees className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">
                Forest vs Plains Thermal Distribution
              </h3>
              <p className="text-[11px] text-slate-400">
                Spatial correlation of NASA FIRMS detections against regional reserve forests
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-emerald-400 flex items-center gap-1.5">
                  <Trees className="w-3.5 h-3.5" />
                  Forest Proximity Zone (≤5 km of Reserve)
                </span>
                <span className="font-mono font-bold text-white">{nearForestCount} ({total > 0 ? Math.round((nearForestCount / total) * 100) : 0}%)</span>
              </div>
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all"
                  style={{ width: `${total > 0 ? (nearForestCount / total) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-amber-400 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5" />
                  Plains / Agricultural / Non-Forest Thermal Events
                </span>
                <span className="font-mono font-bold text-white">{plainsCount} ({total > 0 ? Math.round((plainsCount / total) * 100) : 0}%)</span>
              </div>
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all"
                  style={{ width: `${total > 0 ? (plainsCount / total) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* Scientific Context Box */}
          <div className="p-3 bg-[#090d16] border border-slate-800 rounded-xl text-xs space-y-1.5">
            <div className="font-semibold text-amber-300 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              Why do anomalies appear in plains instead of dense forests?
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              NASA FIRMS satellites detect <strong>all mid-infrared thermal radiances</strong> above threshold. In Tamil Nadu, satellite hotspots frequently represent <strong>agricultural crop stubble burning, open field clearing, brick kilns, or industrial heat</strong> rather than active forest canopy fires.
            </p>
            <p className="text-slate-400 text-[11px]">
              Use the <strong className="text-emerald-300">"Forest Buffer (≤ 5km)"</strong> filter on the map to focus exclusively on reserve-adjacent observations.
            </p>
          </div>
        </div>

        {/* Satellite Platform & Instrument Breakdown */}
        <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-950/80 border border-blue-800/80 text-blue-400">
              <Satellite className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">
                Satellite Sensor Contributions
              </h3>
              <p className="text-[11px] text-slate-400">
                Distribution of detections by satellite platform & instrument
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            {Object.entries(satCounts).map(([satName, count]) => (
              <div key={satName} className="flex items-center justify-between p-2.5 bg-[#090d16] border border-slate-800 rounded-xl text-xs">
                <div className="font-semibold text-slate-200 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-400" />
                  <span>{satName}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-white font-bold">{count} fires</span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {total > 0 ? Math.round((count / total) * 100) : 0}%
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Day / Night Breakdown */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <SunMoon className="w-4 h-4 text-purple-400" />
              Diurnal Cycle:
            </span>
            <div className="flex items-center gap-3 font-mono">
              <span className="text-amber-300">☀️ Day: {dayCount}</span>
              <span className="text-purple-300">🌙 Night: {nightCount}</span>
            </div>
          </div>

        </div>

      </div>

      {/* 3. Tracked Forest Reserves Context */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 space-y-3">
        <h3 className="font-bold text-white text-sm flex items-center gap-2">
          <Trees className="w-4 h-4 text-emerald-400" />
          Verified Protected Forest & Vegetation Reserves in Monitoring Area
        </h3>
        <p className="text-xs text-slate-400">
          Official reserve boundary polygons monitored for early fire intrusion:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
          {[
            { name: "Guindy National Park", dist: "Chennai", cat: "National Park" },
            { name: "Nanmangalam", dist: "Chengalpattu/Chennai", cat: "Reserve Forest" },
            { name: "Pulicat Bird Sanctuary", dist: "Tiruvallur", cat: "Sanctuary & Wetland" },
            { name: "Pallikaranai Marsh", dist: "Chennai", cat: "Conservation Reserve" },
            { name: "Vandalur Reserve", dist: "Chengalpattu", cat: "Reserve Forest" },
          ].map((rf) => (
            <div key={rf.name} className="p-3 bg-[#090d16] border border-emerald-950/60 rounded-xl text-xs">
              <div className="font-bold text-emerald-300">{rf.name}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">{rf.cat}</div>
              <div className="text-[10px] text-slate-500 mt-1 font-mono">{rf.dist}</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
