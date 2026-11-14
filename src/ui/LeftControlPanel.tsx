import React, { useState } from 'react';
import { Site, ScientificLayer } from '../types';
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Sparkles,
  Mountain,
  Sun,
  ShieldAlert,
  Droplet,
  Compass,
} from 'lucide-react';

interface LeftControlPanelProps {
  siteA: Site;
  siteB: Site;
  onSelectSiteA: (site: Site) => void;
  onSelectSiteB: (site: Site) => void;
  allSites: Site[];
  isSiteALit: boolean;
  isSiteBLit: boolean;
  scientificLayer: ScientificLayer;
  onSetScientificLayer: (layer: ScientificLayer) => void;
  onOpenMapPicker: () => void;
}

export const LeftControlPanel: React.FC<LeftControlPanelProps> = ({
  siteA,
  siteB,
  onSelectSiteA,
  onSelectSiteB,
  allSites,
  isSiteALit,
  isSiteBLit,
  scientificLayer,
  onSetScientificLayer,
  onOpenMapPicker,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [filterLitOnly, setFilterLitOnly] = useState(false);
  const [activeSiteTab, setActiveSiteTab] = useState<'A' | 'B'>('A');

  const activeSite = activeSiteTab === 'A' ? siteA : siteB;
  const isCurrentActiveLit = activeSiteTab === 'A' ? isSiteALit : isSiteBLit;

  return (
    <div
      className={`relative z-20 transition-all duration-300 flex ${
        isCollapsed ? 'w-10' : 'w-80'
      } h-full bg-space-950/90 backdrop-blur-md border-r border-slate-800 shadow-2xl flex-col overflow-hidden`}
    >
      {/* Collapse/Expand Toggle Tab */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute top-3 -right-3 z-30 p-1 rounded-full bg-space-800 border border-slate-700 text-slate-300 hover:text-white shadow-lg transition-colors"
      >
        {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>

      {isCollapsed ? (
        <div className="flex flex-col items-center pt-8 gap-6 text-slate-500 font-mono text-[11px] tracking-widest uppercase">
          <span className="rotate-90 origin-center whitespace-nowrap text-cyan-400 font-bold">
            TARGETS
          </span>
        </div>
      ) : (
        <div className="flex-1 flex flex-col p-4 gap-4 overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-200">
                Landing Target Selector
              </h3>
            </div>
            <button
              onClick={onOpenMapPicker}
              className="text-[10px] font-mono text-cyan-400 hover:underline"
            >
              2D Map
            </button>
          </div>

          {/* Site A / Site B Target Switcher Tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-space-900 rounded-xl border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setActiveSiteTab('A')}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-bold transition-all ${
                activeSiteTab === 'A'
                  ? 'bg-cyan-500 text-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-cyan-300 inline-block" />
              <span>Location A</span>
            </button>

            <button
              onClick={() => setActiveSiteTab('B')}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-bold transition-all ${
                activeSiteTab === 'B'
                  ? 'bg-amber-400 text-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
              <span>Location B</span>
            </button>
          </div>

          {/* Active Site Selector Dropdown */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wide flex items-center justify-between">
              <span>Select {activeSiteTab === 'A' ? 'Site A' : 'Site B'}</span>
              <span
                className={`px-2 py-0.2 rounded text-[10px] font-bold ${
                  isCurrentActiveLit
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-red-500/20 text-red-300 border border-red-500/40'
                }`}
              >
                {isCurrentActiveLit ? '● Lit Now' : '○ In Shadow'}
              </span>
            </label>

            <select
              value={activeSite.id}
              onChange={(e) => {
                const s = allSites.find((item) => item.id === e.target.value);
                if (s) {
                  if (activeSiteTab === 'A') onSelectSiteA(s);
                  else onSelectSiteB(s);
                }
              }}
              className="w-full bg-space-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-medium focus:outline-none focus:border-cyan-400 cursor-pointer"
            >
              <optgroup label="South Pole Exploration Targets">
                {allSites
                  .filter((s) => s.region === 'south_pole')
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
              </optgroup>
              <optgroup label="Equatorial & Mid-Latitude Missions">
                {allSites
                  .filter((s) => s.region !== 'south_pole')
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.agency})
                    </option>
                  ))}
              </optgroup>
            </select>
          </div>

          {/* Target Scientific & Terrain Profile Card */}
          <div className="p-3.5 rounded-xl bg-space-900/90 border border-slate-800 flex flex-col gap-2.5 text-xs">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-400">COORDINATES</span>
              <span className="text-cyan-300 font-bold">
                {activeSite.lat.toFixed(2)}°, {activeSite.lon.toFixed(2)}°
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-400">ELEVATION</span>
              <span className="text-slate-200">
                {activeSite.elevKm >= 0 ? '+' : ''}{activeSite.elevKm.toFixed(2)} km
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-400">AGENCY / PROGRAM</span>
              <span className="text-amber-300 font-semibold">{activeSite.agency}</span>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed pt-1 border-t border-slate-800/80">
              {activeSite.note}
            </p>
          </div>

          {/* Scientific Exploration Assessment */}
          <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
            <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">
              Scientific Indicators (LRO Diviner & LEND)
            </span>

            {/* Volatile & Ice Prospecting Index */}
            <div className="p-2.5 rounded-xl bg-space-900/60 border border-slate-800 flex flex-col gap-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-300 font-medium text-[11px]">
                  <Droplet className="w-3.5 h-3.5 text-teal-400" />
                  <span>Volatile / Ice Potential</span>
                </span>
                <span className="font-mono font-bold text-teal-300">
                  {activeSite.volatileIceScore}%
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-space-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-teal-500 to-cyan-400 rounded-full"
                  style={{ width: `${activeSite.volatileIceScore}%` }}
                />
              </div>
            </div>

            {/* Surface Rockiness Hazard Index */}
            <div className="p-2.5 rounded-xl bg-space-900/60 border border-slate-800 flex flex-col gap-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-300 font-medium text-[11px]">
                  <ShieldAlert className="w-3.5 h-3.5 text-pink-400" />
                  <span>Rockiness & Landing Hazard</span>
                </span>
                <span className="font-mono font-bold text-pink-300">
                  {activeSite.rockAbundance}%
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-space-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-pink-500 rounded-full"
                  style={{ width: `${activeSite.rockAbundance}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
