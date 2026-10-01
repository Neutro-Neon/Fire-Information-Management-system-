import React from 'react';
import { X, Cpu, Layers, Zap, Radio, CheckCircle, Code, ShieldCheck, ArrowRight } from 'lucide-react';

export default function GroundSensorModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#111827] border border-slate-700/80 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-200">
        
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-[#0f172a]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-950/80 border border-indigo-700/60 text-indigo-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                IEEE Ground Sensor Network & Multi-Tier Fusion Architecture
              </h2>
              <div className="text-xs text-indigo-300 font-medium">
                Integrated Forest-Fire Early Detection System Roadmap
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          
          {/* Architecture Concept */}
          <div className="bg-[#090d16] border border-slate-800 rounded-xl p-3.5">
            <h3 className="font-bold text-slate-100 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-blue-400" />
              Hierarchical Early Detection Paradigm
            </h3>
            <p className="text-slate-300 leading-relaxed">
              Traditional remote sensing suffers from temporal latency (satellite orbit revisit intervals), while pure ground IoT sensor networks face coverage constraints in dense reserve forests. This IEEE project bridges both paradigms through a unified spatial fusion architecture.
            </p>
          </div>

          {/* 3-Tier Diagram */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-center">
            
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-blue-950/80 border border-blue-700 text-blue-400 flex items-center justify-center mb-2">
                <Radio className="w-4 h-4" />
              </div>
              <div className="font-bold text-white text-xs">Tier 1: Spaceborne</div>
              <div className="text-[11px] text-slate-400 mt-1">
                NASA FIRMS (VIIRS 375m & MODIS 1km) active thermal anomaly scans
              </div>
              <span className="mt-2 text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                ACTIVE IN APP
              </span>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-indigo-950/80 border border-indigo-700 text-indigo-400 flex items-center justify-center mb-2">
                <Cpu className="w-4 h-4" />
              </div>
              <div className="font-bold text-white text-xs">Tier 2: In-Situ IoT</div>
              <div className="text-[11px] text-slate-400 mt-1">
                Sub-canopy ground sensor nodes (Smoke, VOC gas, Temp, Humidity, Battery)
              </div>
              <span className="mt-2 text-[10px] font-bold text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800">
                DATA MODEL READY
              </span>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-purple-950/80 border border-purple-700 text-purple-400 flex items-center justify-center mb-2">
                <Zap className="w-4 h-4" />
              </div>
              <div className="font-bold text-white text-xs">Tier 3: Fusion Engine</div>
              <div className="text-[11px] text-slate-400 mt-1">
                Correlates FIRMS hotspots with micro-climate & ground telemetry
              </div>
              <span className="mt-2 text-[10px] font-bold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800">
                INTERFACE DEFINED
              </span>
            </div>

          </div>

          {/* Sensor Telemetry Schema */}
          <div className="bg-[#090d16] border border-slate-800 rounded-xl p-3.5">
            <h3 className="font-bold text-slate-100 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Code className="w-4 h-4 text-cyan-400" />
              Ground Sensor Telemetry Schema (`POST /api/sensors/reading`)
            </h3>
            <pre className="bg-slate-950 p-2.5 rounded-lg text-[11px] font-mono text-emerald-300 overflow-x-auto border border-slate-800/80">
{`{
  "sensor_id": "IEEE-NODE-GNP-01",
  "latitude": 13.0063,
  "longitude": 80.2210,
  "temperature": 34.2,         // Ambient deg C
  "humidity": 58.0,            // Relative %
  "smoke_level": 12.4,         // PPM optical extinction
  "gas_level": 4.1,            // CO / VOC PPM
  "battery": 94.5,             // Battery %
  "timestamp": "2026-09-16T11:45:00Z",
  "fire_probability": 0.08,    // On-edge ML model score
  "forest_location": "Guindy National Park"
}`}
            </pre>
          </div>

          {/* Future Fusion Formula Specification */}
          <div className="bg-[#090d16] border border-slate-800 rounded-xl p-3.5">
            <h3 className="font-bold text-slate-100 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              Planned Sensor + Satellite Fusion Algorithm (Upcoming Phase)
            </h3>
            <p className="text-slate-300 leading-relaxed mb-2">
              The backend module <code className="text-amber-300 font-mono">backend/fusion_interface.py</code> specifies the analytical formulation:
            </p>
            <div className="bg-slate-950 p-2 rounded-lg font-mono text-amber-200 text-center text-xs border border-slate-800">
              Confidence<sub>Fused</sub> = w<sub>sat</sub> · P(FIRMS) + w<sub>ground</sub> · f(Smoke, ΔT) + w<sub>env</sub> · f(Wind, FFMC)
            </div>
            <p className="text-slate-400 text-[11px] mt-2">
              * In strict adherence to scientific integrity, artificial fusion scores are not displayed until actual ground nodes and weather stations are calibrated in the field.
            </p>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-[#0f172a] flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Backend Interface: <code className="text-indigo-400 font-mono">sensor_interface.py</code> & <code className="text-indigo-400 font-mono">fusion_interface.py</code>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
