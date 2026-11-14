import React, { useState } from 'react';
import { Site, ScientificLayer, EphemerisPoint } from '../types';
import {
  ChevronLeft,
  ChevronRight,
  Compass,
  MapPin,
  ShieldAlert,
  Droplet,
  Sun,
  Moon,
  Zap,
  Radio,
} from 'lucide-react';
import { Button, Badge, Card, CardHeader, CardTitle, CardContent, Select } from '@/components/ui';

interface LeftControlPanelProps {
  siteA: Site;
  siteB: Site;
  currentPointA: EphemerisPoint;
  currentPointB?: EphemerisPoint;
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
  currentPointA,
  currentPointB,
  onSelectSiteA,
  onSelectSiteB,
  allSites,
  isSiteALit,
  isSiteBLit,
  onOpenMapPicker,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
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
      <Button
        variant="secondary"
        size="icon-sm"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute top-3 -right-3 z-30 rounded-full border border-slate-700 shadow-lg"
      >
        {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </Button>

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
            <Button
              variant="link"
              size="xs"
              onClick={onOpenMapPicker}
              className="text-[10px] font-mono text-cyan-400"
            >
              2D Map
            </Button>
          </div>

          {/* Site A / Site B Target Switcher Tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-space-900 rounded-xl border border-slate-800 text-xs font-mono">
            <Button
              variant={activeSiteTab === 'A' ? 'nasa' : 'ghost'}
              size="sm"
              onClick={() => setActiveSiteTab('A')}
              className="gap-1.5"
            >
              <span className="w-2 h-2 rounded-full bg-cyan-300 inline-block" />
              <span>Location A</span>
            </Button>

            <Button
              variant={activeSiteTab === 'B' ? 'solar' : 'ghost'}
              size="sm"
              onClick={() => setActiveSiteTab('B')}
              className="gap-1.5"
            >
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
              <span>Location B</span>
            </Button>
          </div>

          {/* Active Site Selector Dropdown */}
          <div className="flex flex-col gap-1.5">
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wide flex items-center justify-between">
              <span>Select {activeSiteTab === 'A' ? 'Site A' : 'Site B'}</span>
              <Badge variant={isCurrentActiveLit ? 'optimal' : 'destructive'} className="gap-1">
                {isCurrentActiveLit ? (
                  <>
                    <Sun className="w-3 h-3 text-emerald-300" />
                    <span>Lit Now</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3 h-3 text-red-300" />
                    <span>In Shadow</span>
                  </>
                )}
              </Badge>
            </div>

            <Select
              value={activeSite.id}
              onChange={(e) => {
                const s = allSites.find((item) => item.id === e.target.value);
                if (s) {
                  if (activeSiteTab === 'A') onSelectSiteA(s);
                  else onSelectSiteB(s);
                }
              }}
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
            </Select>
          </div>

          {/* Live Real-Time Telemetry Cards (Docked in Side Panel) */}
          <div className="flex flex-col gap-2 pt-1 font-mono">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center justify-between">
              <span>Live Telemetry Status</span>
              <span className="text-[9px] text-cyan-400">REAL-TIME</span>
            </div>

            {/* Location A Live Status */}
            <div className="flex flex-col gap-2 bg-space-900/95 p-2.5 rounded-xl border border-cyan-500/40 shadow-lg shadow-cyan-950/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shrink-0" />
                  <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-wider shrink-0">
                    LOCATION A
                  </span>
                  <span className="text-xs font-bold text-slate-100 truncate ml-1">
                    {siteA.name.split('(')[0].trim()}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-slate-800 text-[11px]">
                {/* Solar Power */}
                <div className="flex flex-col">
                  <span className="text-[9px] text-slate-500 uppercase">SOLAR POWER</span>
                  <span
                    className={`font-bold flex items-center gap-1 ${
                      currentPointA.sun.isVisible ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">
                      {currentPointA.sun.isVisible
                        ? `LIT (${currentPointA.sun.elevationDeg.toFixed(1)}°)`
                        : `SHADOW (${currentPointA.sun.elevationDeg.toFixed(1)}°)`}
                    </span>
                  </span>
                </div>

                {/* Earth DTE */}
                <div className="flex flex-col">
                  <span className="text-[9px] text-slate-500 uppercase">EARTH DTE</span>
                  <span
                    className={`font-bold flex items-center gap-1 ${
                      currentPointA.earth.isVisible ? 'text-cyan-400' : 'text-slate-400'
                    }`}
                  >
                    <Radio className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">
                      {currentPointA.earth.isVisible
                        ? `LINK (${currentPointA.earth.elevationDeg.toFixed(1)}°)`
                        : `OCCULT (${currentPointA.earth.elevationDeg.toFixed(1)}°)`}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* Location B Live Status (when comparing) */}
            {siteB && currentPointB && (
              <div className="flex flex-col gap-2 bg-space-900/95 p-2.5 rounded-xl border border-amber-500/40 shadow-lg shadow-amber-950/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
                    <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider shrink-0">
                      LOCATION B
                    </span>
                    <span className="text-xs font-bold text-slate-100 truncate ml-1">
                      {siteB.name.split('(')[0].trim()}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-slate-800 text-[11px]">
                  {/* Solar Power */}
                  <div className="flex flex-col">
                    <span className="text-[9px] text-slate-500 uppercase">SOLAR POWER</span>
                    <span
                      className={`font-bold flex items-center gap-1 ${
                        currentPointB.sun.isVisible ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      <Zap className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">
                        {currentPointB.sun.isVisible
                          ? `LIT (${currentPointB.sun.elevationDeg.toFixed(1)}°)`
                          : `SHADOW (${currentPointB.sun.elevationDeg.toFixed(1)}°)`}
                      </span>
                    </span>
                  </div>

                  {/* Earth DTE */}
                  <div className="flex flex-col">
                    <span className="text-[9px] text-slate-500 uppercase">EARTH DTE</span>
                    <span
                      className={`font-bold flex items-center gap-1 ${
                        currentPointB.earth.isVisible ? 'text-cyan-400' : 'text-slate-400'
                      }`}
                    >
                      <Radio className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">
                        {currentPointB.earth.isVisible
                          ? `LINK (${currentPointB.earth.elevationDeg.toFixed(1)}°)`
                          : `OCCULT (${currentPointB.earth.elevationDeg.toFixed(1)}°)`}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Target Scientific & Terrain Profile Card using shadcn Card */}
          <Card className="bg-space-900/90 border-slate-800">
            <CardHeader className="p-3 pb-2">
              <CardTitle className="text-[11px] text-slate-400 flex items-center justify-between">
                <span>COORDINATES</span>
                <span className="text-cyan-300 font-bold">
                  {activeSite.lat.toFixed(2)}°, {activeSite.lon.toFixed(2)}°
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 flex flex-col gap-2 text-xs">
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

              <p className="text-[11px] text-slate-300 leading-relaxed pt-1.5 border-t border-slate-800/80">
                {activeSite.note}
              </p>
            </CardContent>
          </Card>

          {/* Scientific Exploration Assessment */}
          <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
            <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">
              Scientific Indicators (LRO Diviner & LEND)
            </span>

            {/* Volatile & Ice Prospecting Index */}
            <Card className="p-2.5 bg-space-900/60 border-slate-800">
              <div className="flex items-center justify-between mb-1.5">
                <span className="flex items-center gap-1.5 text-slate-300 font-medium text-[11px]">
                  <Droplet className="w-3.5 h-3.5 text-teal-400" />
                  <span>Volatile / Ice Potential</span>
                </span>
                <span className="font-mono font-bold text-teal-300 text-xs">
                  {activeSite.volatileIceScore}%
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-space-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-teal-500 to-cyan-400 rounded-full"
                  style={{ width: `${activeSite.volatileIceScore}%` }}
                />
              </div>
            </Card>

            {/* Surface Rockiness Hazard Index */}
            <Card className="p-2.5 bg-space-900/60 border-slate-800">
              <div className="flex items-center justify-between mb-1.5">
                <span className="flex items-center gap-1.5 text-slate-300 font-medium text-[11px]">
                  <ShieldAlert className="w-3.5 h-3.5 text-pink-400" />
                  <span>Rockiness & Landing Hazard</span>
                </span>
                <span className="font-mono font-bold text-pink-300 text-xs">
                  {activeSite.rockAbundance}%
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-space-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-pink-500 rounded-full"
                  style={{ width: `${activeSite.rockAbundance}%` }}
                />
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};
