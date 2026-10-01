import React from 'react';
import { X, Radio, Terminal, Cpu, Wifi, Zap } from 'lucide-react';

export default function SensorView({ onClose, sensors }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 fade-in" onClick={onClose}>
      <div
        className="glass-strong w-full max-w-4xl max-h-[85vh] flex flex-col rounded-lg shadow-2xl shadow-black/50 text-xs text-slate-300"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Header */}
        <div className="h-10 bg-[var(--bg-panel-sub)] border-b border-[var(--border-subtle)] px-4 flex items-center justify-between flex-shrink-0 rounded-t-lg">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded bg-indigo-500/15 flex items-center justify-center">
              <Radio className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div>
              <span className="font-bold text-slate-100 uppercase tracking-wider text-[11px] font-mono">
                IEEE Ground Sensor Network
              </span>
              <span className="text-[var(--text-dim)] text-[10px] font-mono ml-2">Telemetry Specification</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-[rgba(255,255,255,0.06)] rounded transition-all"
            title="Close specification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          
          {/* Architecture Overview */}
          <div className="space-y-2 fade-in">
            <div className="text-[10px] uppercase font-bold text-[var(--text-dim)] font-mono tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
              1. Multi-Tier Sensor-Satellite Fusion Architecture
            </div>
            <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
              This IEEE project synthesizes spaceborne thermal radiance measurements (NASA FIRMS VIIRS/MODIS) with in-situ sub-canopy microclimate sensors to distinguish high-risk forest fires from regional agricultural and industrial thermal events.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1 font-mono text-[11px]">
              {[
                {
                  title: 'Tier 1: Orbital Sensing',
                  subtitle: 'NASA FIRMS Constellation',
                  desc: 'VIIRS 375m & MODIS 1km radiances',
                  icon: Wifi,
                  color: 'text-cyan-400'
                },
                {
                  title: 'Tier 2: Canopy IoT Nodes',
                  subtitle: 'In-Situ Microclimate Nodes',
                  desc: 'Smoke (optical PPM), ΔT, VOC, RH%',
                  icon: Cpu,
                  color: 'text-indigo-400'
                },
                {
                  title: 'Tier 3: Fusion Analytics',
                  subtitle: 'Spatiotemporal Correlation',
                  desc: 'Forest proximity buffer verification',
                  icon: Zap,
                  color: 'text-amber-400'
                }
              ].map((tier, i) => (
                <div key={i} className="p-3 bg-[var(--bg-panel-sub)] border border-[var(--border-subtle)] rounded-md hover:border-[var(--border-strong)] transition-all">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <tier.icon className={`w-3.5 h-3.5 ${tier.color}`} />
                    <div className="text-[var(--text-dim)] uppercase text-[10px] font-bold">{tier.title}</div>
                  </div>
                  <div className="text-slate-200 font-semibold">{tier.subtitle}</div>
                  <div className="text-[10px] text-[var(--text-dim)] mt-0.5">{tier.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Telemetry Ingestion Contract */}
          <div className="space-y-2">
            <div className="text-[10px] uppercase font-bold text-[var(--text-dim)] font-mono tracking-wider flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              <span>2. Telemetry Ingestion Contract (REST API)</span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)]">
              Hardware microcontrollers (ESP32 / LoRaWAN gateways) post live packet data to <code className="text-cyan-300 font-mono bg-cyan-950/30 px-1 py-0.5 rounded text-[10px]">POST /api/sensors/reading</code>:
            </p>
            <pre className="p-4 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-md font-mono text-[11px] text-cyan-200 overflow-x-auto leading-relaxed">
{`{
  "sensor_id": "IEEE-NODE-GNP-01",
  "latitude": 13.0063,
  "longitude": 80.2210,
  "temperature": 34.2,         // Ambient deg C
  "humidity": 58.0,            // Relative %
  "smoke_level": 12.4,         // PPM optical extinction
  "gas_level": 4.1,            // CO / VOC PPM
  "battery": 94.5,             // Battery %
  "timestamp": "2026-09-17T11:45:00Z",
  "fire_probability": 0.08,    // On-edge ML model score
  "forest_location": "Guindy National Park"
}`}
            </pre>
          </div>

          {/* Mathematical Fusion Specification */}
          <div className="space-y-2">
            <div className="text-[10px] uppercase font-bold text-[var(--text-dim)] font-mono tracking-wider">
              3. Verification & False Alarm Mitigation Equation
            </div>
            <div className="p-4 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-md font-mono text-[11px] text-slate-300 space-y-2">
              <div className="text-amber-400 font-bold text-[12px]">
                Confidence<sub>Fused</sub> = w<sub>sat</sub> · P(FIRMS) + w<sub>ground</sub> · f(Smoke, ΔT) + w<sub>buffer</sub> · I(Dist ≤ 5km)
              </div>
              <p className="text-[10px] text-[var(--text-dim)] font-sans mt-1.5 leading-relaxed">
                Where agricultural plains burning (&gt;15 km from forest reserves) is isolated from canopy fires to prevent false forest emergency alerts.
              </p>
            </div>
          </div>

          {/* Active Sensor Nodes (if any) */}
          {sensors && sensors.length > 0 && (
            <div className="space-y-2">
              <div className="text-[10px] uppercase font-bold text-[var(--text-dim)] font-mono tracking-wider flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-emerald-400" />
                <span>4. Registered Sensor Nodes ({sensors.length})</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {sensors.map((s, i) => (
                  <div key={i} className="p-2.5 bg-[var(--bg-panel-sub)] border border-[var(--border-subtle)] rounded-md font-mono text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-indigo-400 font-bold">{s.sensor_id}</span>
                      <span className="text-emerald-400 text-[10px]">{s.battery}% batt</span>
                    </div>
                    <div className="text-slate-300 mt-0.5">{s.forest_location}</div>
                    <div className="text-[var(--text-dim)] text-[10px] mt-0.5">
                      Temp: {s.temperature}°C • Smoke: {s.smoke_level} ppm • Fire P: {(s.fire_probability * 100).toFixed(0)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="h-10 bg-[var(--bg-panel-sub)] border-t border-[var(--border-subtle)] px-4 flex items-center justify-between flex-shrink-0 text-[10px] font-mono text-[var(--text-dim)] rounded-b-lg">
          <span>Backend: GET /api/sensors • POST /api/sensors/reading</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-[var(--bg-panel)] hover:bg-[var(--border-subtle)] border border-[var(--border-subtle)] text-slate-300 rounded transition-all text-[11px]"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
