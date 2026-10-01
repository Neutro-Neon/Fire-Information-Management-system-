import React from 'react';
import { Flame, Map, BarChart3, Table, Cpu, RefreshCw, ShieldCheck, AlertTriangle } from 'lucide-react';

export default function Header({
  activeTab,
  onSelectTab,
  health,
  onRefresh,
  loading,
  totalFires
}) {
  const isKeyValid = health?.firms_key_status?.valid;
  const maskedKey = health?.firms_key_status?.masked_key || 'Unconfigured';

  const navTabs = [
    { id: 'map', label: 'Interactive Map', icon: Map },
    { id: 'analytics', label: 'Analytics HUD', icon: BarChart3 },
    { id: 'table', label: `Detections Table (${totalFires})`, icon: Table },
    { id: 'sensors', label: 'Ground Sensors & Fusion', icon: Cpu },
  ];

  return (
    <header className="bg-[#0f172a] border-b border-slate-800 sticky top-0 z-50 flex-shrink-0">
      <div className="max-w-[1920px] mx-auto px-4 py-2 flex items-center justify-between gap-3">
        
        {/* Left: Branding */}
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-red-950/70 border border-red-800/60 rounded-xl text-red-500 flex-shrink-0 shadow-inner">
            <Flame className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2">
                NASA FIRMS Forest Fire Monitor
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-950/80 border border-blue-700/60 text-blue-400">
                  Chennai Region
                </span>
              </h1>
              <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/50 text-emerald-400">
                <ShieldCheck className="w-3 h-3" />
                IEEE Project
              </span>
            </div>
            <div className="text-[10px] text-slate-400 flex items-center gap-1">
              <span>NASA FIRMS Active Thermal Observations</span>
              <span className="text-slate-600">•</span>
              <span className="text-amber-400 font-medium">Unconfirmed Ground Fires</span>
            </div>
          </div>
        </div>

        {/* Center: Clean Navigation Tabs */}
        <nav className="flex items-center bg-[#090d16] border border-slate-800 rounded-xl p-1 gap-1">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right: Key Status & Sync */}
        <div className="flex items-center gap-2 text-xs">
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#090d16] border border-slate-800 text-[11px] font-mono text-slate-300">
            <div className={`w-1.5 h-1.5 rounded-full ${isKeyValid ? 'bg-emerald-400 animate-ping' : 'bg-red-400'}`} />
            <span>FIRMS: {maskedKey}</span>
          </div>

          <button
            onClick={onRefresh}
            disabled={loading}
            className="px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 hover:text-white transition flex items-center gap-1.5 font-medium disabled:opacity-50 text-xs shadow-sm"
            title="Request fresh data directly from NASA FIRMS"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-400' : ''}`} />
            <span className="hidden sm:inline">{loading ? 'Fetching...' : 'Sync FIRMS'}</span>
          </button>
        </div>

      </div>
    </header>
  );
}
