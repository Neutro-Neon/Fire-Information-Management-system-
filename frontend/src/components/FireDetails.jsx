import React, { useState } from 'react';
import { X, Flame, MapPin, Clock, Satellite, Gauge, Thermometer, ShieldAlert, Trees, Copy, Check, ExternalLink, AlertTriangle, Info } from 'lucide-react';

export default function FireDetails({ fire, onClose, onZoomTo }) {
  const [copied, setCopied] = useState(false);

  if (!fire) return null;

  const copyCoordinates = () => {
    navigator.clipboard.writeText(`${fire.latitude.toFixed(5)}, ${fire.longitude.toFixed(5)}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'HIGH':
        return 'bg-red-950 text-red-300 border-red-700';
      case 'MEDIUM':
        return 'bg-amber-950 text-amber-300 border-amber-700';
      default:
        return 'bg-green-950 text-green-300 border-green-700';
    }
  };

  const dist = fire.nearest_forest_reserve?.distance_km;
  const isNearForest = dist !== undefined && dist <= 5.0;

  return (
    <div className="fixed top-12 right-0 bottom-0 w-80 sm:w-96 bg-[#111827]/95 backdrop-blur-md border-l border-slate-800 shadow-2xl z-[1000] p-4 sm:p-5 flex flex-col justify-between overflow-y-auto text-slate-200">
      
      <div className="space-y-3.5">
        
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-red-950/70 border border-red-800 text-red-400">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${getSeverityBadge(fire.severity)}`}>
                  {fire.severity} SEVERITY
                </span>
                <span className="text-[11px] font-mono text-slate-400">{fire.daynight} pass</span>
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5 truncate max-w-[200px]">
                {fire.id}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Close inspector"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* True Administrative Location Card */}
        <div className="bg-[#090d16] border border-slate-800 rounded-xl p-3 text-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              Administrative Location
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950/80 text-blue-300 font-semibold">
              {fire.district || 'Chennai Region'}
            </span>
          </div>
          <div className="text-sm font-bold text-white">
            {fire.locality || fire.formatted_location || 'Regional Area'}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
            <span>Land Type: <strong className="text-slate-200">{fire.land_type || 'Agricultural / Open Plains'}</strong></span>
          </div>
        </div>

        {/* Forest Proximity Context */}
        {isNearForest ? (
          <div className="bg-emerald-950/40 border border-emerald-800/80 rounded-xl p-3 text-xs leading-relaxed space-y-1">
            <div className="font-bold text-emerald-300 flex items-center gap-1.5">
              <Trees className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Forest Proximity Alert ({dist} km)</span>
            </div>
            <p className="text-[11px] text-emerald-100">
              Hotspot observed in the immediate buffer zone of <strong>{fire.nearest_forest_reserve.name}</strong> ({fire.nearest_forest_reserve.district}). Priority canopy surveillance zone.
            </p>
          </div>
        ) : (
          <div className="bg-amber-950/30 border border-amber-800/60 rounded-xl p-3 text-xs leading-relaxed space-y-1">
            <div className="font-bold text-amber-300 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>Non-Forest Thermal Anomaly</span>
            </div>
            <p className="text-[11px] text-slate-300">
              Located in {fire.locality || 'the plains'}, <strong>{dist} km</strong> from nearest reserve ({fire.nearest_forest_reserve?.name}). This is an open-field/rural thermal radiance (typical of crop residue burning, field clearing, or industrial heat), <strong>not</strong> a forest fire.
            </p>
          </div>
        )}

        {/* Parameters Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          
          {/* Coordinates */}
          <div className="bg-[#090d16] border border-slate-800 rounded-xl p-2.5 flex flex-col justify-between">
            <span className="text-slate-400 text-[10px] uppercase font-semibold flex items-center gap-1">
              <MapPin className="w-3 h-3 text-cyan-400" />
              Coordinates
            </span>
            <div className="font-mono font-bold text-white text-xs mt-1">
              {fire.latitude.toFixed(4)}°N, {fire.longitude.toFixed(4)}°E
            </div>
            <button
              onClick={copyCoordinates}
              className="mt-1 text-[10px] text-slate-400 hover:text-cyan-300 font-mono transition flex items-center gap-1"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied' : 'Copy Lat/Lon'}
            </button>
          </div>

          {/* FRP */}
          <div className="bg-[#090d16] border border-slate-800 rounded-xl p-2.5 flex flex-col justify-between">
            <span className="text-slate-400 text-[10px] uppercase font-semibold flex items-center gap-1">
              <Gauge className="w-3 h-3 text-orange-400" />
              Radiative Power
            </span>
            <div className="font-mono font-bold text-orange-400 text-base mt-1">
              {fire.frp} <span className="text-xs text-slate-400">MW</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
              <div
                className="bg-orange-500 h-full rounded-full"
                style={{ width: `${Math.min(100, (fire.frp / 20) * 100)}%` }}
              />
            </div>
          </div>

          {/* Time */}
          <div className="bg-[#090d16] border border-slate-800 rounded-xl p-2.5">
            <span className="text-slate-400 text-[10px] uppercase font-semibold flex items-center gap-1">
              <Clock className="w-3 h-3 text-blue-400" />
              Time (IST)
            </span>
            <div className="font-mono font-bold text-white text-xs mt-1">
              {fire.time_ist} IST
            </div>
            <div className="text-[10px] font-mono text-slate-400 mt-0.5">
              {fire.acq_date}
            </div>
          </div>

          {/* Confidence */}
          <div className="bg-[#090d16] border border-slate-800 rounded-xl p-2.5">
            <span className="text-slate-400 text-[10px] uppercase font-semibold flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-emerald-400" />
              Confidence
            </span>
            <div className="font-mono font-bold text-white text-xs mt-1">
              {fire.confidence_display}
            </div>
            <div className="text-[10px] font-mono text-slate-400 mt-0.5">
              Level: {fire.confidence_level}
            </div>
          </div>

          {/* Satellite */}
          <div className="bg-[#090d16] border border-slate-800 rounded-xl p-2.5">
            <span className="text-slate-400 text-[10px] uppercase font-semibold flex items-center gap-1">
              <Satellite className="w-3 h-3 text-indigo-400" />
              Satellite Platform
            </span>
            <div className="font-bold text-white text-xs mt-1">
              {fire.satellite}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
              {fire.instrument}
            </div>
          </div>

          {/* Brightness Temperature */}
          <div className="bg-[#090d16] border border-slate-800 rounded-xl p-2.5">
            <span className="text-slate-400 text-[10px] uppercase font-semibold flex items-center gap-1">
              <Thermometer className="w-3 h-3 text-rose-400" />
              Brightness Temp
            </span>
            <div className="font-mono font-bold text-rose-400 text-xs mt-1">
              {fire.brightness_temp_c !== null ? `${fire.brightness_temp_c}°C` : 'N/A'}
            </div>
            <div className="text-[10px] font-mono text-slate-400 mt-0.5">
              {fire.brightness_temp_k ? `${fire.brightness_temp_k} K` : ''}
            </div>
          </div>

        </div>

        {/* Severity Disclaimer */}
        <div className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-800 leading-tight">
          * {fire.severity_disclaimer}
        </div>

      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-3 border-t border-slate-800">
        <button
          onClick={() => onZoomTo(fire)}
          className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition shadow-md"
        >
          Center on Map
        </button>
        <a
          href={`https://www.google.com/maps?q=${fire.latitude},${fire.longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
        >
          <span>Earth</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

    </div>
  );
}
