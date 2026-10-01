import React from 'react';
import { ShieldCheck, Info, RefreshCw } from 'lucide-react';

export default function EmptyState({ message, onResetFilters, onRefresh, loading }) {
  return (
    <div className="bg-[#111827]/90 backdrop-blur border border-slate-700/80 rounded-2xl p-4 sm:p-6 text-center max-w-md mx-auto shadow-2xl z-[800]">
      <div className="w-12 h-12 rounded-full bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 flex items-center justify-center mx-auto mb-3">
        <ShieldCheck className="w-6 h-6" />
      </div>
      <h3 className="text-base font-bold text-white tracking-tight">
        {message || "No FIRMS active-fire detections found for this period."}
      </h3>
      <p className="text-xs text-slate-400 mt-2 leading-relaxed">
        NASA FIRMS satellites (VIIRS & MODIS) observed zero thermal anomalies within the selected time and filter parameters for the Chennai region.
      </p>
      <div className="mt-3.5 p-2 bg-[#090d16] border border-slate-800 rounded-lg text-[11px] text-slate-400 flex items-start gap-2 text-left">
        <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
        <span>
          <strong>Scientific Integrity:</strong> As per IEEE project standards, no simulated or placeholder fire points are generated. District boundaries and forest reserves remain active on the map.
        </span>
      </div>
      <div className="flex items-center justify-center gap-2.5 mt-4">
        <button
          onClick={onResetFilters}
          className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
        >
          Reset Filters
        </button>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition flex items-center gap-1.5 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh FIRMS</span>
        </button>
      </div>
    </div>
  );
}
