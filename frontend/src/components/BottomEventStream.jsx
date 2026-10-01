import React, { useState } from 'react';
import { ChevronUp, ChevronDown, Download, Search, FileJson, Flame } from 'lucide-react';

export default function BottomEventStream({
  fires,
  selectedFire,
  onSelectFire,
  isCollapsed,
  onToggleCollapse,
  selectedRegion
}) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredFires = (fires || []).filter((f) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (f.locality && f.locality.toLowerCase().includes(term)) ||
      (f.district && f.district.toLowerCase().includes(term)) ||
      (f.satellite && f.satellite.toLowerCase().includes(term)) ||
      (f.confidence_display && f.confidence_display.toLowerCase().includes(term)) ||
      `${f.latitude.toFixed(4)}, ${f.longitude.toFixed(4)}`.includes(term)
    );
  });
  const displayedFires = filteredFires.slice(0, 100);

  // Proper CSV export with correct escaping
  const escapeCsvField = (val) => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const exportCsv = () => {
    if (!fires || fires.length === 0) return;
    const headers = [
      'ID', 'Latitude', 'Longitude', 'Locality', 'District', 'Land_Type',
      'Date', 'Time_IST', 'Satellite', 'Instrument', 'FRP_MW', 'Confidence',
      'Brightness_C', 'Nearest_Forest', 'Distance_KM', 'Buffer_Zone'
    ];
    const rows = fires.map((f) => [
      escapeCsvField(f.id),
      f.latitude,
      f.longitude,
      escapeCsvField(f.locality || ''),
      escapeCsvField(f.district || ''),
      escapeCsvField(f.land_type || ''),
      f.acq_date,
      f.time_ist,
      escapeCsvField(f.satellite),
      f.instrument,
      f.frp,
      f.confidence_display,
      f.brightness_temp_c ?? '',
      escapeCsvField(f.nearest_forest_reserve?.name || ''),
      f.nearest_forest_reserve?.distance_km ?? '',
      f.nearest_forest_reserve?.is_forest_proximity ? 'YES' : 'NO'
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `firms_${selectedRegion || 'hotspots'}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportGeoJson = () => {
    if (!fires || fires.length === 0) return;
    const geoJson = {
      type: 'FeatureCollection',
      features: fires.map((f) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [f.longitude, f.latitude]
        },
        properties: {
          id: f.id,
          frp: f.frp,
          severity: f.severity,
          satellite: f.satellite,
          confidence: f.confidence_display,
          time_ist: f.time_ist,
          locality: f.locality || '',
          district: f.district || '',
          nearest_forest: f.nearest_forest_reserve?.name || '',
          forest_distance_km: f.nearest_forest_reserve?.distance_km ?? null
        }
      }))
    };
    const blob = new Blob([JSON.stringify(geoJson, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `firms_${selectedRegion || 'hotspots'}_${new Date().toISOString().slice(0,10)}.geojson`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (isCollapsed) {
    return (
      <div className="h-8 glass-panel border-t border-[var(--border-subtle)] px-3 flex items-center justify-between text-[11px] font-mono text-slate-400 select-none z-20 flex-shrink-0 transition-all duration-300">
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleCollapse}
            className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-all"
            title="Expand Observation Stream"
          >
            <ChevronUp className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
            <Flame className="w-3 h-3 text-amber-400" />
            <span className="font-semibold uppercase tracking-wider text-[10px]">
              Observation Stream
            </span>
          </button>
          <span className="text-[var(--border-strong)]">│</span>
          <span className="text-amber-400 font-bold text-[11px] tabular-nums">{fires ? fires.length : 0}</span>
          <span className="text-[10px] text-[var(--text-dim)]">events detected</span>
        </div>

        <div className="text-[10px] text-[var(--text-dim)]">
          EPSG:4326 • NASA LANCE FIRMS
        </div>
      </div>
    );
  }

  return (
    <div className="h-48 bg-[var(--bg-panel)] border-t border-[var(--border-subtle)] flex flex-col z-20 flex-shrink-0 select-none text-xs transition-all duration-300 slide-up">
      
      {/* Stream Toolbar */}
      <div className="h-8 bg-[var(--bg-panel-sub)] border-b border-[var(--border-subtle)] px-3 flex items-center justify-between text-[11px] font-mono text-slate-300 flex-shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleCollapse}
            className="p-0.5 text-slate-400 hover:text-white rounded transition-all"
            title="Collapse Observation Stream"
          >
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>
          <Flame className="w-3 h-3 text-amber-400" />
          <span className="font-semibold uppercase tracking-wider text-[10px] text-slate-200">
            Observation Stream
          </span>
          <span className="text-[var(--text-dim)] text-[10px] tabular-nums">
            [{displayedFires.length < filteredFires.length ? `100 of ${filteredFires.length}` : `${filteredFires.length}`}]
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Search */}
          <div className="relative flex items-center">
            <Search className="w-3 h-3 text-[var(--text-dim)] absolute left-2 pointer-events-none" />
            <input
              type="text"
              placeholder="Filter by locality, satellite, coords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-6 pr-2 py-1 bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded text-[10px] text-slate-200 placeholder-[var(--text-dim)] focus:outline-none focus:border-[var(--accent-primary)] font-sans w-56 transition-colors"
            />
          </div>

          {/* Export CSV */}
          <button
            onClick={exportCsv}
            className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-200 hover:bg-[rgba(255,255,255,0.05)] px-1.5 py-1 rounded border border-[var(--border-subtle)] transition-all"
            title="Export records to CSV"
          >
            <Download className="w-3 h-3" />
            <span>CSV</span>
          </button>

          {/* Export GeoJSON */}
          <button
            onClick={exportGeoJson}
            className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-200 hover:bg-[rgba(255,255,255,0.05)] px-1.5 py-1 rounded border border-[var(--border-subtle)] transition-all"
            title="Export records as GeoJSON"
          >
            <FileJson className="w-3 h-3" />
            <span>GeoJSON</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left text-[11px] border-collapse font-mono">
          <thead className="bg-[var(--bg-panel-sub)] text-[10px] uppercase text-[var(--text-dim)] sticky top-0 z-10 border-b border-[var(--border-subtle)]">
            <tr>
              <th className="py-1.5 px-2.5 font-medium">Time</th>
              <th className="py-1.5 px-2 font-medium">Coordinates</th>
              <th className="py-1.5 px-2 font-medium font-sans">Locality & District</th>
              <th className="py-1.5 px-2 font-medium">Satellite</th>
              <th className="py-1.5 px-2 font-medium">Sensor</th>
              <th className="py-1.5 px-2 font-medium">FRP (MW)</th>
              <th className="py-1.5 px-2 font-medium">Confidence</th>
              <th className="py-1.5 px-2 font-medium">Forest Buffer</th>
              <th className="py-1.5 px-2 font-medium font-sans">Land Type</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)] text-slate-300">
            {filteredFires.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-6 text-center text-[var(--text-dim)] font-sans text-xs">
                  <div className="flex flex-col items-center gap-1.5">
                    <Flame className="w-4 h-4 text-[var(--text-dim)]" />
                    <span>No active fire detections match current observation filters.</span>
                  </div>
                </td>
              </tr>
            ) : (
              <>
                {displayedFires.map((fire) => {
                  const isSelected = selectedFire?.id === fire.id;
                  const dist = fire.nearest_forest_reserve?.distance_km;
                  const isNearForest = dist !== undefined && dist <= 5.0;

                  return (
                    <tr
                      key={fire.id}
                      onClick={() => onSelectFire(fire)}
                      className={`cursor-pointer table-row-hover ${
                        isSelected
                          ? 'bg-[var(--accent-badge)] border-l-2 border-l-[var(--accent-primary)] text-white font-medium'
                          : ''
                      }`}
                    >
                      {/* Time */}
                      <td className="py-1.5 px-2.5 whitespace-nowrap text-slate-200 tabular-nums">
                        {fire.time_ist} IST
                      </td>

                      {/* Coordinates */}
                      <td className="py-1.5 px-2 whitespace-nowrap text-slate-400 text-[10px] tabular-nums">
                        {fire.latitude.toFixed(4)}°, {fire.longitude.toFixed(4)}°
                      </td>

                      {/* Locality */}
                      <td className="py-1.5 px-2 whitespace-nowrap font-sans max-w-[200px] truncate">
                        <span className="text-slate-200 font-medium">
                          {fire.locality || fire.formatted_location || 'Regional Area'}
                        </span>
                        <span className="text-[var(--text-dim)] ml-1 text-[10px]">
                          ({fire.district || 'Region'})
                        </span>
                      </td>

                      {/* Satellite */}
                      <td className="py-1.5 px-2 whitespace-nowrap text-slate-300">
                        {fire.satellite}
                      </td>

                      {/* Sensor */}
                      <td className="py-1.5 px-2 whitespace-nowrap text-slate-400 text-[10px]">
                        {fire.instrument} ({fire.daynight})
                      </td>

                      {/* FRP */}
                      <td className="py-1.5 px-2 whitespace-nowrap font-bold text-amber-400 tabular-nums">
                        {fire.frp}
                      </td>

                      {/* Confidence */}
                      <td className="py-1.5 px-2 whitespace-nowrap">
                        <span
                          className={`px-1.5 py-0.5 text-[9px] font-semibold rounded inline-block ${
                            fire.confidence_level === 'High'
                              ? 'badge-severity-high'
                              : fire.confidence_level === 'Nominal'
                              ? 'badge-severity-med'
                              : 'badge-severity-low'
                          }`}
                        >
                          {fire.confidence_display}
                        </span>
                      </td>

                      {/* Nearest Forest Reserve */}
                      <td className="py-1.5 px-2 whitespace-nowrap font-sans">
                        {fire.nearest_forest_reserve ? (
                          <div className="text-[10px]">
                            <span className={isNearForest ? 'text-amber-300 font-semibold' : 'text-slate-400'}>
                              {fire.nearest_forest_reserve.name}
                            </span>
                            <span className="text-[var(--text-dim)] ml-1 font-mono tabular-nums">
                              ({dist} km)
                            </span>
                          </div>
                        ) : (
                          <span className="text-[var(--text-dim)] text-[10px] font-mono">
                            N/A
                          </span>
                        )}
                      </td>

                      {/* Land Type */}
                      <td className="py-1.5 px-2 whitespace-nowrap font-sans text-slate-400 text-[10px]">
                        {fire.land_type || 'Tropical Vegetation'}
                      </td>
                    </tr>
                  );
                })}
                {filteredFires.length > 100 && (
                  <tr>
                    <td colSpan={9} className="py-2 px-3 text-center text-[var(--text-dim)] font-mono text-[10px] bg-[var(--bg-panel-sub)] border-t border-[var(--border-subtle)]">
                      Showing top 100 of {filteredFires.length} thermal events. Use search filter or export all {fires.length} observations.
                    </td>
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
