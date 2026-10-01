import React, { useState } from 'react';
import { Layers, ChevronDown, ChevronUp, Flame, ShieldAlert, Trees, Square, Cpu } from 'lucide-react';

export default function Legend() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="bg-[#111827]/95 backdrop-blur border border-slate-700/80 rounded-xl shadow-xl overflow-hidden max-w-xs text-xs z-[900]">
      
      {/* Header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full px-3 py-2 bg-[#090d16] flex items-center justify-between font-bold text-slate-200 uppercase tracking-wider text-[11px] border-b border-slate-800"
      >
        <span className="flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-blue-400" />
          Map Legend
        </span>
        {collapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {/* Legend Items */}
      {!collapsed && (
        <div className="p-3 space-y-2.5 text-slate-300">
          
          {/* Active Fire Severity */}
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5 flex items-center gap-1">
              <Flame className="w-3 h-3 text-orange-400" />
              Active Fire Detections (FIRMS)
            </div>
            <div className="space-y-1 pl-1">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                <span className="text-[11px]">High Severity (&gt;15 MW / High Conf)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.8)]" />
                <span className="text-[11px]">Medium Severity (5 - 15 MW)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(34,197,94,0.8)]" />
                <span className="text-[11px]">Low Severity (&lt;5 MW / Low Conf)</span>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800/80 pt-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full border border-red-400 flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-red-400 rounded-full animate-ping" />
              </div>
              <span className="text-[11px] text-slate-300">High-Confidence Hotspot (Pulsing)</span>
            </div>
          </div>

          {/* Forest / Vegetation Reserves */}
          <div className="border-t border-slate-800/80 pt-2">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1 flex items-center gap-1">
              <Trees className="w-3 h-3 text-emerald-400" />
              Forest & Vegetation Reserves
            </div>
            <div className="flex items-center gap-2 pl-1">
              <span className="w-3.5 h-3.5 rounded border border-emerald-500 bg-emerald-600/30" />
              <span className="text-[11px]">Guindy, Nanmangalam, Pulicat, Vandalur</span>
            </div>
          </div>

          {/* Regional Boundaries */}
          <div className="border-t border-slate-800/80 pt-2 space-y-1">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
              Geographic Boundaries
            </div>
            <div className="flex items-center gap-2 pl-1">
              <span className="w-4 h-0.5 border-t-2 border-cyan-400" />
              <span className="text-[11px]">District Administrative Borders</span>
            </div>
            <div className="flex items-center gap-2 pl-1">
              <span className="w-4 h-0.5 border-t-2 border-dashed border-amber-400" />
              <span className="text-[11px]">Chennai Metropolitan Area (CMA)</span>
            </div>
          </div>

          {/* Ground Sensors */}
          <div className="border-t border-slate-800/80 pt-2">
            <div className="flex items-center gap-2">
              <div className="p-0.5 rounded bg-indigo-950 border border-indigo-500 text-indigo-400">
                <Cpu className="w-2.5 h-2.5" />
              </div>
              <span className="text-[11px] text-indigo-300">IEEE Ground IoT Sensor Node</span>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
