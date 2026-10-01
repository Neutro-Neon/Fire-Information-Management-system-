import React, { useState, useEffect } from 'react';
import { RefreshCw, Radio, Palette, Satellite, Flame, ShieldAlert, Clock } from 'lucide-react';

export default function GisHeader({
  health,
  onRefresh,
  loading,
  statistics,
  totalCount,
  cached,
  lastRetrievedIso,
  onToggleSensorsView,
  showSensorsView,
  selectedRegion,
  onSelectRegion,
  currentTheme,
  onChangeTheme
}) {
  const highConfCount = statistics?.high_confidence_count ?? 0;
  const maxFrp = statistics?.max_frp ?? 0;
  const forestBufferCount = statistics?.forest_proximity_count ?? 0;

  // Live clock that updates every second
  const [timeNow, setTimeNow] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setTimeNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const timeIstStr = timeNow.toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Asia/Kolkata'
  });
  const timeUtcStr = timeNow.toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'UTC'
  });

  const regionsList = [
    { id: 'all', label: 'Global', icon: '🌍' },
    { id: 'chennai', label: 'Chennai', icon: '🇮🇳' },
    { id: 'indonesia', label: 'Indonesia', icon: '🇮🇩' },
    { id: 'amazon', label: 'Amazon', icon: '🇧🇷' }
  ];

  const themesList = [
    { id: 'forest', label: 'Forest Slate' },
    { id: 'charcoal', label: 'Charcoal Titanium' },
    { id: 'obsidian', label: 'Obsidian Stealth' },
    { id: 'steel', label: 'Navy Steel' }
  ];

  const hasCritical = forestBufferCount > 0 || (maxFrp > 10);

  return (
    <header className="h-11 glass-strong px-3 flex items-center justify-between text-xs text-slate-300 flex-shrink-0 z-30 select-none transition-colors duration-300">
      
      {/* Left: Brand + Region Switcher */}
      <div className="flex items-center gap-3">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Flame className="w-4 h-4 text-[var(--accent-primary)]" />
            {hasCritical && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500 live-ping" />
            )}
          </div>
          <div className="hidden sm:flex flex-col leading-none">
            <span className="font-bold text-slate-100 tracking-wider text-[10.5px] uppercase font-mono">
              FIRMS Surveillance
            </span>
            <span className="text-[8.5px] text-[var(--text-dim)] font-mono tracking-wide">
              NASA LANCE / Active Fire
            </span>
          </div>
        </div>

        {/* Region Switcher */}
        <div className="flex items-center gap-0.5 glass-panel rounded-md p-0.5">
          {regionsList.map((r) => {
            const isActive = selectedRegion === r.id;
            return (
              <button
                key={r.id}
                onClick={() => onSelectRegion(r.id)}
                className={`px-2.5 py-1.5 text-[10px] font-mono uppercase tracking-wider rounded-[3px] transition-all duration-200 flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-[var(--accent-primary)] text-black font-bold shadow-lg shadow-[var(--accent-glow)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[rgba(255,255,255,0.05)]'
                }`}
                title={`Switch to ${r.label}`}
              >
                <span className="text-[11px]">{r.icon}</span>
                <span>{r.label}</span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-black opacity-50 animate-pulse" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Center: Metrics Strip */}
      <div className="hidden xl:flex items-center gap-1.5">
        {/* Active Hotspots */}
        <div className="flex items-center gap-1.5 glass-panel rounded px-2.5 py-1">
          <Flame className="w-3 h-3 text-amber-400" />
          <span className="text-[9px] uppercase text-[var(--text-dim)] font-mono">Hotspots</span>
          <span className="font-bold text-amber-400 font-mono text-[12px] tabular-nums">{totalCount}</span>
        </div>

        {/* High Confidence */}
        <div className="flex items-center gap-1.5 glass-panel rounded px-2.5 py-1">
          <ShieldAlert className="w-3 h-3 text-red-400" />
          <span className="text-[9px] uppercase text-[var(--text-dim)] font-mono">High Conf</span>
          <span className="font-bold text-slate-200 font-mono text-[12px] tabular-nums">{highConfCount}</span>
        </div>

        {/* Max FRP */}
        <div className="flex items-center gap-1.5 glass-panel rounded px-2.5 py-1">
          <span className="text-[9px] uppercase text-[var(--text-dim)] font-mono">Peak FRP</span>
          <span className="font-bold text-orange-400 font-mono text-[12px] tabular-nums">{maxFrp} <span className="text-[9px] text-[var(--text-dim)] font-normal">MW</span></span>
        </div>

        {/* Forest Buffer Alert */}
        <div className={`flex items-center gap-1.5 rounded px-2.5 py-1 transition-all ${
          forestBufferCount > 0
            ? 'glass-panel border-red-900 fire-glow'
            : 'glass-panel'
        }`}>
          <span className="text-[9px] uppercase text-[var(--text-dim)] font-mono">Buffer</span>
          <span className={`font-bold font-mono text-[12px] tabular-nums ${forestBufferCount > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
            {forestBufferCount}
          </span>
        </div>
      </div>

      {/* Right: Theme, Status, Clock, Actions */}
      <div className="flex items-center gap-2">
        
        {/* Theme Selector */}
        <div className="hidden lg:flex items-center gap-1 glass-panel rounded px-2 py-1 text-[10px] font-mono">
          <Palette className="w-3 h-3 text-[var(--accent-primary)]" />
          <select
            value={currentTheme}
            onChange={(e) => onChangeTheme(e.target.value)}
            className="bg-transparent text-[10px] font-medium text-slate-300 focus:outline-none cursor-pointer py-0.5 pr-4"
            title="Switch UI Color Palette"
          >
            {themesList.map((t) => (
              <option key={t.id} value={t.id} className="bg-[#0f1520] text-slate-200">
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Connection & Feed Status */}
        <div className={`flex items-center gap-1.5 text-[10px] font-mono px-2 py-1 rounded glass-panel transition-all duration-300 ${
          loading ? 'border-amber-800' : ''
        }`}>
          <span className="relative flex items-center justify-center w-2 h-2">
            <span className={`w-1.5 h-1.5 rounded-full ${cached ? 'bg-amber-400' : 'bg-emerald-400'}`} />
            {!cached && <span className="absolute w-2 h-2 rounded-full bg-emerald-400 live-ping" />}
          </span>
          <span className="text-slate-300 font-medium tracking-tight hidden sm:inline">
            {cached ? 'CACHED' : 'LIVE'}
          </span>
          <Satellite className={`w-3 h-3 text-[var(--text-dim)] ${loading ? 'orbit-spin' : ''}`} />
        </div>

        {/* Live Clock */}
        <div className="hidden md:flex items-center gap-1.5 glass-panel rounded px-2 py-1 text-[10px] font-mono tabular-nums">
          <Clock className="w-3 h-3 text-[var(--accent-primary)]" />
          <div className="flex flex-col leading-none gap-0.5">
            <span className="text-slate-200">{timeUtcStr} <span className="text-[var(--text-dim)]">UTC</span></span>
          </div>
        </div>

        {/* IEEE Sensors (Chennai only) */}
        {selectedRegion === 'chennai' && (
          <button
            onClick={onToggleSensorsView}
            className={`px-2 py-1.5 text-[10px] font-mono uppercase tracking-wider rounded transition-all duration-200 flex items-center gap-1 ${
              showSensorsView
                ? 'bg-emerald-950 border border-emerald-600 text-emerald-200 shadow-lg shadow-emerald-900/30'
                : 'glass-panel text-slate-400 hover:text-slate-200 hover:border-[var(--border-strong)]'
            }`}
            title="IEEE Ground Sensor Network Telemetry"
          >
            <Radio className="w-3 h-3 text-indigo-400" />
            <span className="hidden xl:inline">IoT Nodes</span>
          </button>
        )}

        {/* Refresh Action */}
        <button
          onClick={onRefresh}
          disabled={loading}
          className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-[rgba(255,255,255,0.06)] rounded transition-all duration-200 disabled:opacity-40 glass-panel"
          title="Fetch latest FIRMS observations (Force refresh)"
        >
          <RefreshCw className={`w-3.5 h-3.5 transition-transform duration-500 ${loading ? 'animate-spin text-[var(--accent-primary)]' : ''}`} />
        </button>

      </div>

    </header>
  );
}
