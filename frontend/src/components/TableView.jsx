import React, { useState } from 'react';
import { Flame, Search, ArrowUpDown, Locate, Download, Trees, ExternalLink, ArrowRight, ShieldAlert } from 'lucide-react';

export default function TableView({ fires, onSelectFireAndSwitchToMap, onSwitchToMap }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('time');
  const [sortDesc, setSortDesc] = useState(true);
  const [forestFilter, setForestFilter] = useState('ALL');

  // Filter
  const filtered = (fires || []).filter((f) => {
    // Forest proximity filter
    const dist = f.nearest_forest_reserve?.distance_km ?? 999;
    if (forestFilter === 'FOREST_5KM' && dist > 5.0) return false;
    if (forestFilter === 'FOREST_10KM' && dist > 10.0) return false;
    if (forestFilter === 'PLAINS' && dist <= 5.0) return false;

    // Search term
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      f.satellite.toLowerCase().includes(term) ||
      f.instrument.toLowerCase().includes(term) ||
      f.confidence_display.toLowerCase().includes(term) ||
      f.severity.toLowerCase().includes(term) ||
      f.formatted_ist.toLowerCase().includes(term) ||
      (f.nearest_forest_reserve?.name || '').toLowerCase().includes(term) ||
      `${f.latitude.toFixed(4)}, ${f.longitude.toFixed(4)}`.includes(term)
    );
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    if (sortBy === 'time') {
      cmp = (a.timestamp_iso || '').localeCompare(b.timestamp_iso || '');
    } else if (sortBy === 'frp') {
      cmp = (a.frp || 0) - (b.frp || 0);
    } else if (sortBy === 'dist') {
      const d1 = a.nearest_forest_reserve?.distance_km ?? 999;
      const d2 = b.nearest_forest_reserve?.distance_km ?? 999;
      cmp = d1 - d2;
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

  // Export to CSV
  const handleExportCSV = () => {
    if (!sorted.length) return;
    const headers = ['ID', 'Latitude', 'Longitude', 'Date', 'Time_IST', 'Satellite', 'Instrument', 'Confidence', 'FRP_MW', 'Severity', 'Nearest_Forest', 'Distance_km', 'Land_Cover_Context'];
    const rows = sorted.map(f => [
      f.id,
      f.latitude,
      f.longitude,
      f.acq_date,
      f.time_ist,
      f.satellite,
      f.instrument,
      f.confidence_display,
      f.frp,
      f.severity,
      f.nearest_forest_reserve?.name || 'N/A',
      f.nearest_forest_reserve?.distance_km || 'N/A',
      `"${f.nearest_forest_reserve?.land_use_classification || 'N/A'}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `firms_fire_detections_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-4 text-slate-100">
      
      {/* Top Controls Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#111827] border border-slate-800 rounded-2xl p-4 shadow-lg">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-400" />
            NASA FIRMS Active Fire Detections
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
              {filtered.length} matching
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Full tabular inspection of thermal anomaly observations over Chennai & surrounding region
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          {/* Switch to Map Button */}
          <button
            onClick={onSwitchToMap}
            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-sm"
          >
            <span>View on Map</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#111827] border border-slate-800 rounded-xl p-3 text-xs">
        
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search satellite, coordinates, forest reserve, or time..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-[#090d16] border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Forest Proximity Filter Selector */}
        <div className="flex items-center gap-2">
          <Trees className="w-4 h-4 text-emerald-400" />
          <span className="text-slate-400 font-medium">Zone Filter:</span>
          <select
            value={forestFilter}
            onChange={(e) => setForestFilter(e.target.value)}
            className="bg-[#090d16] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-medium"
          >
            <option value="ALL">All Detections (Plains & Forest Buffer)</option>
            <option value="FOREST_5KM">Forest Buffer Zone Only (≤ 5 km)</option>
            <option value="FOREST_10KM">Forest Buffer Zone Only (≤ 10 km)</option>
            <option value="PLAINS">Plains / Agricultural Only (&gt; 5 km)</option>
          </select>
        </div>

      </div>

      {/* Detections Table */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300 border-collapse">
            <thead className="bg-[#0b0f19] text-[11px] uppercase tracking-wider text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">
                  <button onClick={() => toggleSort('time')} className="flex items-center gap-1 hover:text-white">
                    Acq Time (IST)
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3 px-4">Coordinates</th>
                <th className="py-3 px-4">
                  <button onClick={() => toggleSort('dist')} className="flex items-center gap-1 hover:text-white">
                    Nearest Reserve & Land Context
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3 px-4">Satellite & Instrument</th>
                <th className="py-3 px-4">Confidence</th>
                <th className="py-3 px-4">
                  <button onClick={() => toggleSort('frp')} className="flex items-center gap-1 hover:text-white">
                    FRP (MW)
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 font-mono">
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 font-sans">
                    No satellite thermal anomaly records match your criteria.
                  </td>
                </tr>
              ) : (
                sorted.map((fire) => {
                  const dist = fire.nearest_forest_reserve?.distance_km;
                  const isNearForest = dist !== undefined && dist <= 5.0;

                  return (
                    <tr
                      key={fire.id}
                      className="hover:bg-slate-800/40 transition cursor-pointer"
                      onClick={() => onSelectFireAndSwitchToMap(fire)}
                    >
                      {/* Time */}
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-white">{fire.time_ist} IST</div>
                        <div className="text-[10px] text-slate-400 font-sans">{fire.acq_date}</div>
                      </td>

                      {/* Coordinates */}
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <div className="text-cyan-300 font-medium">
                          {fire.latitude.toFixed(4)}°N, {fire.longitude.toFixed(4)}°E
                        </div>
                        <div className="text-[10px] text-slate-400 font-sans">{fire.daynight} pass</div>
                      </td>

                      {/* True Locality, District & Land Zone */}
                      <td className="py-2.5 px-4">
                        <div>
                          <div className="font-sans font-bold text-white text-xs">
                            {fire.locality || fire.formatted_location || 'Regional Plains'}
                          </div>
                          <div className="text-[11px] font-sans text-cyan-400">
                            {fire.district || 'Tamil Nadu'}
                          </div>
                          <div className="text-[10px] font-sans text-slate-400 mt-0.5 flex items-center gap-1">
                            {isNearForest ? (
                              <span className="text-emerald-300 font-semibold flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                🌲 Near {fire.nearest_forest_reserve?.name} ({dist} km)
                              </span>
                            ) : (
                              <span className="text-slate-400">
                                🚜 {fire.land_type || 'Agricultural Plains'} ({dist} km to reserve)
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Satellite */}
                      <td className="py-2.5 px-4 whitespace-nowrap font-sans">
                        <div className="font-medium text-slate-200">{fire.satellite}</div>
                        <div className="text-[10px] text-slate-400">{fire.instrument}</div>
                      </td>

                      {/* Confidence */}
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          fire.confidence_level === 'High'
                            ? 'bg-red-950 text-red-300 border border-red-800'
                            : fire.confidence_level === 'Nominal'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {fire.confidence_display}
                        </span>
                      </td>

                      {/* FRP */}
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <span className="text-orange-400 font-bold text-sm">{fire.frp}</span>
                        <span className="text-[10px] text-slate-400 ml-1">MW</span>
                      </td>

                      {/* Severity */}
                      <td className="py-2.5 px-4 whitespace-nowrap font-sans">
                        <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${
                          fire.severity === 'HIGH'
                            ? 'bg-red-950 text-red-300 border-red-800'
                            : fire.severity === 'MEDIUM'
                            ? 'bg-amber-950 text-amber-300 border-amber-800'
                            : 'bg-green-950 text-green-300 border-green-800'
                        }`}>
                          {fire.severity}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-2.5 px-4 whitespace-nowrap text-right font-sans">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectFireAndSwitchToMap(fire);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-blue-600/30 hover:bg-blue-600 text-blue-300 hover:text-white font-medium text-xs transition flex items-center gap-1 ml-auto"
                        >
                          <Locate className="w-3.5 h-3.5" />
                          <span>Locate</span>
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

    </div>
  );
}
