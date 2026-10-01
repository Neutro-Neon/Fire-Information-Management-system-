import React, { useState } from 'react';
import { Flame, Search, ChevronRight, Locate, ArrowUpDown } from 'lucide-react';

export default function FireTable({ fires, selectedFire, onSelectFire }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('time'); // 'time', 'frp', 'conf'
  const [sortDesc, setSortDesc] = useState(true);

  // Filter
  const filtered = (fires || []).filter((f) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      f.satellite.toLowerCase().includes(term) ||
      f.instrument.toLowerCase().includes(term) ||
      f.confidence_display.toLowerCase().includes(term) ||
      f.severity.toLowerCase().includes(term) ||
      f.formatted_ist.toLowerCase().includes(term) ||
      `${f.latitude.toFixed(3)}, ${f.longitude.toFixed(3)}`.includes(term)
    );
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    if (sortBy === 'time') {
      cmp = (a.timestamp_iso || '').localeCompare(b.timestamp_iso || '');
    } else if (sortBy === 'frp') {
      cmp = (a.frp || 0) - (b.frp || 0);
    } else if (sortBy === 'conf') {
      cmp = (a.confidence_level || '').localeCompare(b.confidence_level || '');
    }
    return sortDesc ? -cmp : cmp;
  });

  const toggleSort = (col) => {
    if (sortBy === col) {
      setSortDesc(!sortDesc);
    } else {
      setSortBy(col);
      setSortDesc(true);
    }
  };

  const getSeverityPill = (severity) => {
    switch (severity) {
      case 'HIGH':
        return 'bg-red-950/70 text-red-400 border-red-800/80';
      case 'MEDIUM':
        return 'bg-amber-950/70 text-amber-400 border-amber-800/80';
      default:
        return 'bg-green-950/70 text-green-400 border-green-800/80';
    }
  };

  return (
    <div className="bg-[#111827]/95 border-t border-slate-800 flex flex-col h-full overflow-hidden">
      
      {/* Table Header / Toolbar */}
      <div className="px-4 py-2.5 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-orange-400" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Detected Fire Events
          </h2>
          <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
            {filtered.length} {filtered.length === 1 ? 'record' : 'records'}
          </span>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search satellite, coords, time..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 pr-3 py-1 bg-[#090d16] border border-slate-700/80 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 w-full sm:w-64"
          />
        </div>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left text-xs text-slate-300 border-collapse">
          <thead className="bg-[#0b0f19] text-[11px] uppercase tracking-wider text-slate-400 font-semibold sticky top-0 z-10 border-b border-slate-800">
            <tr>
              <th className="py-2.5 px-3">
                <button
                  onClick={() => toggleSort('time')}
                  className="flex items-center gap-1 hover:text-white"
                >
                  Time (IST)
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="py-2.5 px-3">Location</th>
              <th className="py-2.5 px-3">Satellite / Sensor</th>
              <th className="py-2.5 px-3">
                <button
                  onClick={() => toggleSort('conf')}
                  className="flex items-center gap-1 hover:text-white"
                >
                  Confidence
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="py-2.5 px-3">
                <button
                  onClick={() => toggleSort('frp')}
                  className="flex items-center gap-1 hover:text-white"
                >
                  FRP
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="py-2.5 px-3">Severity</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-500 font-sans">
                  No active fire detections match current filters.
                </td>
              </tr>
            ) : (
              sorted.map((fire) => {
                const isSelected = selectedFire?.id === fire.id;
                return (
                  <tr
                    key={fire.id}
                    onClick={() => onSelectFire(fire)}
                    className={`cursor-pointer transition ${
                      isSelected
                        ? 'bg-blue-950/40 border-l-2 border-l-blue-500 text-white'
                        : 'hover:bg-slate-800/40'
                    }`}
                  >
                    {/* Time */}
                    <td className="py-2 px-3 whitespace-nowrap">
                      <div className="font-semibold text-slate-200">{fire.time_ist} IST</div>
                      <div className="text-[10px] text-slate-400 font-sans">{fire.acq_date}</div>
                    </td>

                    {/* Location */}
                    <td className="py-2 px-3 whitespace-nowrap">
                      <div className="font-bold text-white text-xs">
                        {fire.locality || fire.formatted_location || `${fire.latitude.toFixed(4)}°N, ${fire.longitude.toFixed(4)}°E`}
                      </div>
                      <div className="text-[10px] text-cyan-400 font-sans">
                        {fire.district || 'Chennai Region'} • {fire.latitude.toFixed(3)}°, {fire.longitude.toFixed(3)}°
                      </div>
                    </td>

                    {/* Satellite */}
                    <td className="py-2 px-3 whitespace-nowrap font-sans">
                      <div className="font-medium text-slate-200">{fire.satellite}</div>
                      <div className="text-[10px] text-slate-400">{fire.instrument} ({fire.daynight})</div>
                    </td>

                    {/* Confidence */}
                    <td className="py-2 px-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        fire.confidence_level === 'High'
                          ? 'bg-red-950/80 text-red-300'
                          : fire.confidence_level === 'Nominal'
                          ? 'bg-amber-950/80 text-amber-300'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {fire.confidence_display}
                      </span>
                    </td>

                    {/* FRP */}
                    <td className="py-2 px-3 whitespace-nowrap">
                      <span className="text-orange-400 font-bold">{fire.frp}</span>
                      <span className="text-[10px] text-slate-400 ml-0.5">MW</span>
                    </td>

                    {/* Severity */}
                    <td className="py-2 px-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold font-sans ${getSeverityPill(fire.severity)}`}>
                        {fire.severity}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-2 px-3 whitespace-nowrap font-sans">
                      <span className="text-[11px] text-slate-400">
                        Unconfirmed
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-2 px-3 whitespace-nowrap text-right font-sans">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectFire(fire);
                        }}
                        className="p-1 rounded bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-300 transition"
                        title="Zoom to fire on map"
                      >
                        <Locate className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
