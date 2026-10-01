import React from 'react';
import { Flame, ShieldAlert, Zap, Activity, Clock, MapPin } from 'lucide-react';

export default function Dashboard({ statistics, count, lastUpdatedIso, isCached, loading }) {
  const stats = statistics || {};
  const total = count ?? stats.total_detections ?? 0;
  const highConf = stats.high_confidence_count ?? 0;
  const maxFrp = stats.max_frp ?? 0.0;
  const avgFrp = stats.average_frp ?? 0.0;
  const highConfPct = total > 0 ? Math.round((highConf / total) * 100) : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 py-3 px-4 sm:px-6 max-w-[1920px] mx-auto">
      
      {/* 1. Total Detections */}
      <div className="bg-[#111827]/90 border border-slate-800/80 rounded-xl p-3 flex flex-col justify-between shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
          <span>Total Active Fires</span>
          <Flame className={`w-4 h-4 ${total > 0 ? 'text-amber-500' : 'text-slate-500'}`} />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl lg:text-3xl font-bold font-mono text-white">
            {loading ? '—' : total}
          </span>
          <span className="text-[11px] text-slate-400">hotspots</span>
        </div>
        <div className="text-[10px] text-slate-500 mt-1 truncate">
          FIRMS Thermal Anomalies
        </div>
        {total > 0 && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500/60" />}
      </div>

      {/* 2. High-Confidence Detections */}
      <div className="bg-[#111827]/90 border border-slate-800/80 rounded-xl p-3 flex flex-col justify-between shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
          <span>High-Confidence</span>
          <ShieldAlert className={`w-4 h-4 ${highConf > 0 ? 'text-red-500' : 'text-slate-500'}`} />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl lg:text-3xl font-bold font-mono text-white">
            {loading ? '—' : highConf}
          </span>
          <span className="text-[11px] text-red-400 font-mono">({highConfPct}%)</span>
        </div>
        <div className="text-[10px] text-slate-500 mt-1 truncate">
          Flagged 'h' / ≥80% Conf.
        </div>
        {highConf > 0 && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500/60" />}
      </div>

      {/* 3. Max FRP */}
      <div className="bg-[#111827]/90 border border-slate-800/80 rounded-xl p-3 flex flex-col justify-between shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
          <span>Max FRP</span>
          <Zap className="w-4 h-4 text-orange-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-2xl lg:text-3xl font-bold font-mono text-white">
            {loading ? '—' : maxFrp}
          </span>
          <span className="text-[11px] text-orange-400 font-semibold font-mono">MW</span>
        </div>
        <div className="text-[10px] text-slate-500 mt-1 truncate">
          Peak Radiative Power
        </div>
        {maxFrp > 0 && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500/60" />}
      </div>

      {/* 4. Average FRP */}
      <div className="bg-[#111827]/90 border border-slate-800/80 rounded-xl p-3 flex flex-col justify-between shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
          <span>Average FRP</span>
          <Activity className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-2xl lg:text-3xl font-bold font-mono text-white">
            {loading ? '—' : avgFrp}
          </span>
          <span className="text-[11px] text-emerald-400 font-semibold font-mono">MW</span>
        </div>
        <div className="text-[10px] text-slate-500 mt-1 truncate">
          Mean Radiative Power
        </div>
      </div>

      {/* 5. Last Satellite Update */}
      <div className="bg-[#111827]/90 border border-slate-800/80 rounded-xl p-3 flex flex-col justify-between shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
          <span>Last Satellite Update</span>
          <Clock className="w-4 h-4 text-cyan-400" />
        </div>
        <div className="mt-2">
          <div className="text-xs font-bold font-mono text-white truncate">
            {lastUpdatedIso ? lastUpdatedIso.replace(' UTC', '') : 'Retrieving...'}
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${isCached ? 'bg-amber-400' : 'bg-emerald-400'}`} />
            <span className="text-[10px] font-mono text-slate-400">
              {isCached ? 'Server Cache (10m TTL)' : 'Fresh NASA Pull'}
            </span>
          </div>
        </div>
        <div className="text-[10px] text-slate-500 mt-0.5">
          UTC Reference
        </div>
      </div>

      {/* 6. Area Covered */}
      <div className="bg-[#111827]/90 border border-slate-800/80 rounded-xl p-3 flex flex-col justify-between shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
          <span>Area Covered</span>
          <MapPin className="w-4 h-4 text-blue-400" />
        </div>
        <div className="mt-1">
          <div className="text-xs font-bold text-white truncate">
            Chennai & Surrounds
          </div>
          <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
            Chengalpattu, Tiruvallur, Kanchi
          </div>
        </div>
        <div className="text-[10px] text-slate-500 mt-1 font-mono">
          79.4°E-80.6°E, 12.2°N-13.7°N
        </div>
      </div>

    </div>
  );
}
