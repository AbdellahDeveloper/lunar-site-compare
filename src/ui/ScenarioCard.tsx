import React, { useState } from 'react';
import {
  AppMode,
  EphemerisPoint,
  HorizonMask,
  ScenarioConfig,
  ScenarioEvaluation,
  Site,
} from '../types';
import { HorizonPanorama } from './HorizonPanorama';
import { SkyPlot } from './SkyPlot';
import { LunarGlobe3D } from './LunarGlobe3D';
import { TimelineGantt } from './TimelineGantt';
import {
  Sun,
  Radio,
  Mountain,
  Compass,
  Layers,
  Copy,
  Trash2,
  ChevronDown,
  Info,
  Clock,
  BatteryCharging,
  Maximize2,
} from 'lucide-react';

interface ScenarioCardProps {
  scenario: ScenarioConfig;
  evaluation: ScenarioEvaluation;
  currentPoint: EphemerisPoint;
  sites: Site[];
  currentScrubMs: number;
  windowStartMs: number;
  windowEndMs: number;
  mode: AppMode;
  onUpdateScenario: (updated: Partial<ScenarioConfig>) => void;
  onDuplicateScenario: () => void;
  onRemoveScenario: () => void;
  onScrub: (timeMs: number) => void;
  canRemove: boolean;
}

export const ScenarioCard: React.FC<ScenarioCardProps> = ({
  scenario,
  evaluation,
  currentPoint,
  sites,
  currentScrubMs,
  windowStartMs,
  windowEndMs,
  mode,
  onUpdateScenario,
  onDuplicateScenario,
  onRemoveScenario,
  onScrub,
  canRemove,
}) => {
  const [activeTab, setActiveTab] = useState<'panorama' | 'skyplot' | 'globe' | 'metrics'>('panorama');
  const [showCustomCoords, setShowCustomCoords] = useState(scenario.siteId === 'custom');

  const selectedSite = sites.find((s) => s.id === scenario.siteId);
  const activeLat = scenario.siteId === 'custom' ? scenario.customLat : (selectedSite?.lat ?? 0);
  const activeLon = scenario.siteId === 'custom' ? scenario.customLon : (selectedSite?.lon ?? 0);
  const activeElev = scenario.siteId === 'custom' ? scenario.customElevKm : (selectedSite?.elevKm ?? 0);

  const formatCountdown = (ms: number | null): string => {
    if (ms === null) return 'N/A';
    const totalHours = ms / (3600 * 1000);
    const days = Math.floor(totalHours / 24);
    const hours = Math.floor(totalHours % 24);
    const mins = Math.floor((ms % (3600 * 1000)) / 60000);
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h ${mins}m`;
  };

  const getVerdictBadgeClass = (tier: string) => {
    switch (tier) {
      case 'optimal':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
      case 'viable':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      case 'constrained':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      default:
        return 'bg-red-500/20 text-red-400 border-red-500/40';
    }
  };

  return (
    <div className="flex flex-col rounded-2xl border border-slate-700/80 bg-space-900/90 shadow-2xl backdrop-blur-md overflow-hidden transition-all">
      {/* Scenario Header */}
      <div className="p-4 bg-space-850/90 border-b border-slate-700/60 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1 min-w-[260px] flex-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-space-700 text-slate-300 uppercase">
              {scenario.name}
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getVerdictBadgeClass(
                evaluation.verdict.tier
              )}`}
            >
              {evaluation.verdict.title}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-1">
            <select
              value={scenario.siteId}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'custom') {
                  setShowCustomCoords(true);
                  onUpdateScenario({ siteId: 'custom' });
                } else {
                  setShowCustomCoords(false);
                  onUpdateScenario({ siteId: val });
                }
              }}
              className="bg-space-950 border border-slate-600/80 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-100 hover:border-cyan-400 focus:outline-none focus:border-cyan-400 transition-colors cursor-pointer"
            >
              <optgroup label="South Pole Candidate Sites (Artemis & CLPS)">
                {sites
                  .filter((s) => s.region === 'south_pole')
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.agency})
                    </option>
                  ))}
              </optgroup>
              <optgroup label="Historic & Other Lunar Missions">
                {sites
                  .filter((s) => s.region !== 'south_pole')
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.agency})
                    </option>
                  ))}
              </optgroup>
              <optgroup label="Custom Coordinates">
                <option value="custom">Manual Custom Coordinates...</option>
              </optgroup>
            </select>

            <button
              onClick={() => onUpdateScenario({ useTerrain: !scenario.useTerrain })}
              title="Toggle between LOLA 3D terrain horizon mask and smooth lunar sphere horizon"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-mono transition-colors ${
                scenario.useTerrain
                  ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                  : 'bg-space-950 border-slate-600 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Mountain className="w-3.5 h-3.5" />
              <span>{scenario.useTerrain ? 'LOLA Horizon' : 'Flat Horizon'}</span>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onDuplicateScenario}
            title="Duplicate Scenario"
            className="p-1.5 rounded-lg bg-space-800 hover:bg-space-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
          >
            <Copy className="w-4 h-4" />
          </button>
          {canRemove && (
            <button
              onClick={onRemoveScenario}
              title="Remove Scenario"
              className="p-1.5 rounded-lg bg-space-800 hover:bg-red-950 text-slate-400 hover:text-red-400 border border-slate-700 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Custom Coordinates Sub-Bar */}
      {(showCustomCoords || scenario.siteId === 'custom') && (
        <div className="px-4 py-2 bg-space-950/80 border-b border-slate-800 flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 font-mono">
            <span className="text-slate-400">Lat:</span>
            <input
              type="number"
              step="0.01"
              min="-90"
              max="90"
              value={scenario.customLat}
              onChange={(e) => onUpdateScenario({ customLat: parseFloat(e.target.value) || 0 })}
              className="w-20 px-2 py-0.5 rounded bg-space-850 border border-slate-700 text-slate-100 text-center"
            />
            <span className="text-slate-500">°</span>
          </div>

          <div className="flex items-center gap-1.5 font-mono">
            <span className="text-slate-400">Lon:</span>
            <input
              type="number"
              step="0.01"
              min="-180"
              max="180"
              value={scenario.customLon}
              onChange={(e) => onUpdateScenario({ customLon: parseFloat(e.target.value) || 0 })}
              className="w-20 px-2 py-0.5 rounded bg-space-850 border border-slate-700 text-slate-100 text-center"
            />
            <span className="text-slate-500">°E</span>
          </div>

          <div className="flex items-center gap-1.5 font-mono">
            <span className="text-slate-400">Elev:</span>
            <input
              type="number"
              step="0.1"
              value={scenario.customElevKm}
              onChange={(e) => onUpdateScenario({ customElevKm: parseFloat(e.target.value) || 0 })}
              className="w-16 px-2 py-0.5 rounded bg-space-850 border border-slate-700 text-slate-100 text-center"
            />
            <span className="text-slate-500">km</span>
          </div>
        </div>
      )}

      {/* Countdown Chips Bar */}
      <div className="px-4 py-2.5 bg-space-900 border-b border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2">
        {/* Sun Status Chip */}
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-space-950/70 border border-slate-700/60">
          <Sun
            className={`w-4 h-4 ${
              evaluation.metrics.currentSunStatus === 'up' ? 'text-solar-gold animate-pulse' : 'text-slate-500'
            }`}
          />
          <div className="flex flex-col text-[11px] font-mono leading-tight">
            <span className="text-slate-400">
              {evaluation.metrics.currentSunStatus === 'up' ? 'Sunset in' : 'Sunrise in'}
            </span>
            <span className="font-semibold text-solar-gold">
              {evaluation.metrics.currentSunStatus === 'up'
                ? formatCountdown(evaluation.metrics.timeToNextSunsetMs)
                : formatCountdown(evaluation.metrics.timeToNextSunriseMs)}
            </span>
          </div>
        </div>

        {/* Earth Status Chip */}
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-space-950/70 border border-slate-700/60">
          <Radio
            className={`w-4 h-4 ${
              evaluation.metrics.currentEarthStatus === 'up' ? 'text-comm-cyan' : 'text-red-400'
            }`}
          />
          <div className="flex flex-col text-[11px] font-mono leading-tight">
            <span className="text-slate-400">
              {evaluation.metrics.currentEarthStatus === 'up' ? 'Earthset in' : 'Earthrise in'}
            </span>
            <span className="font-semibold text-comm-cyan">
              {evaluation.metrics.currentEarthStatus === 'up'
                ? evaluation.metrics.timeToNextEarthsetMs === null
                  ? 'Continuous DTE'
                  : formatCountdown(evaluation.metrics.timeToNextEarthsetMs)
                : formatCountdown(evaluation.metrics.timeToNextEarthriseMs)}
            </span>
          </div>
        </div>

        {/* Daylight Total */}
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-space-950/70 border border-slate-700/60">
          <BatteryCharging className="w-4 h-4 text-amber-400" />
          <div className="flex flex-col text-[11px] font-mono leading-tight">
            <span className="text-slate-400">Light / Window</span>
            <span className="font-semibold text-slate-100">
              {evaluation.metrics.sunlightPercent.toFixed(1)}% ({evaluation.metrics.sunlightHours.toFixed(0)}h)
            </span>
          </div>
        </div>

        {/* Both-Up Total */}
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-space-950/70 border border-slate-700/60">
          <Clock className="w-4 h-4 text-emerald-400" />
          <div className="flex flex-col text-[11px] font-mono leading-tight">
            <span className="text-slate-400">Both-Up Window</span>
            <span className="font-semibold text-emerald-400">
              {evaluation.metrics.bothUpPercent.toFixed(1)}% ({evaluation.metrics.bothUpHours.toFixed(0)}h)
            </span>
          </div>
        </div>
      </div>

      {/* Explorer Mode Verdict Summary Box */}
      {mode === 'explorer' && (
        <div className="px-4 py-3 bg-space-850/60 border-b border-slate-800 text-xs">
          <p className="text-slate-200 font-medium leading-relaxed">
            {evaluation.verdict.operationalSummary}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-700/40 text-[11px] text-slate-300">
            <div>
              <span className="text-solar-gold font-semibold">Sunlight: </span>
              {evaluation.verdict.sunDetail}
            </div>
            <div>
              <span className="text-comm-cyan font-semibold">Earth Comm: </span>
              {evaluation.verdict.earthDetail}
            </div>
          </div>
        </div>
      )}

      {/* View Switcher Tabs */}
      <div className="px-4 pt-3 flex items-center justify-between border-b border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('panorama')}
            className={`pb-2 px-1 border-b-2 font-medium transition-colors ${
              activeTab === 'panorama'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            360° Panorama
          </button>
          <button
            onClick={() => setActiveTab('skyplot')}
            className={`pb-2 px-1 border-b-2 font-medium transition-colors ${
              activeTab === 'skyplot'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Polar Sky Plot
          </button>
          <button
            onClick={() => setActiveTab('globe')}
            className={`pb-2 px-1 border-b-2 font-medium transition-colors ${
              activeTab === 'globe'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            3D Lunar Globe
          </button>
          <button
            onClick={() => setActiveTab('metrics')}
            className={`pb-2 px-1 border-b-2 font-medium transition-colors ${
              activeTab === 'metrics'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Technical Metrics
          </button>
        </div>

        <div className="text-[11px] font-mono text-slate-400 pb-2">
          {activeLat.toFixed(2)}°, {activeLon.toFixed(2)}° | {activeElev >= 0 ? '+' : ''}
          {activeElev.toFixed(1)} km
        </div>
      </div>

      {/* Main Visualizer Area */}
      <div className="p-4 flex flex-col gap-4">
        {activeTab === 'panorama' && (
          <HorizonPanorama
            currentPoint={currentPoint}
            allPoints={evaluation.points}
            mask={evaluation.horizonMaskUsed}
            siteName={scenario.name}
            useTerrain={scenario.useTerrain}
            elevKm={activeElev}
          />
        )}

        {activeTab === 'skyplot' && (
          <SkyPlot
            currentPoint={currentPoint}
            allPoints={evaluation.points}
            siteName={scenario.name}
          />
        )}

        {activeTab === 'globe' && (
          <LunarGlobe3D
            lat={activeLat}
            lon={activeLon}
            siteName={scenario.name}
            currentPoint={currentPoint}
            sunVec={{
              x: Math.cos((currentPoint.sun.elevationDeg * Math.PI) / 180) * Math.sin((currentPoint.sun.azimuthDeg * Math.PI) / 180),
              y: Math.sin((currentPoint.sun.elevationDeg * Math.PI) / 180),
              z: Math.cos((currentPoint.sun.elevationDeg * Math.PI) / 180) * Math.cos((currentPoint.sun.azimuthDeg * Math.PI) / 180),
            }}
            earthVec={{
              x: Math.cos((currentPoint.earth.elevationDeg * Math.PI) / 180) * Math.sin((currentPoint.earth.azimuthDeg * Math.PI) / 180),
              y: Math.sin((currentPoint.earth.elevationDeg * Math.PI) / 180),
              z: Math.cos((currentPoint.earth.elevationDeg * Math.PI) / 180) * Math.cos((currentPoint.earth.azimuthDeg * Math.PI) / 180),
            }}
          />
        )}

        {activeTab === 'metrics' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-3 rounded-xl bg-space-950/70 border border-slate-800">
              <div className="text-slate-500 text-[10px]">TOTAL SUNLIGHT</div>
              <div className="text-solar-gold font-bold text-base mt-1">
                {evaluation.metrics.sunlightHours.toFixed(1)} hrs
              </div>
              <div className="text-slate-400 text-[11px]">
                {evaluation.metrics.sunlightPercent.toFixed(1)}% of window
              </div>
            </div>

            <div className="p-3 rounded-xl bg-space-950/70 border border-slate-800">
              <div className="text-slate-500 text-[10px]">LONGEST LIGHT / DARK</div>
              <div className="text-slate-200 font-bold text-base mt-1">
                {evaluation.metrics.longestLightHours.toFixed(1)}h / {evaluation.metrics.longestDarkHours.toFixed(1)}h
              </div>
              <div className="text-slate-400 text-[11px]">
                {evaluation.metrics.sunsetCount} sunsets in window
              </div>
            </div>

            <div className="p-3 rounded-xl bg-space-950/70 border border-slate-800">
              <div className="text-slate-500 text-[10px]">DIRECT EARTH COMM</div>
              <div className="text-comm-cyan font-bold text-base mt-1">
                {evaluation.metrics.earthVisHours.toFixed(1)} hrs
              </div>
              <div className="text-slate-400 text-[11px]">
                {evaluation.metrics.earthVisPercent.toFixed(1)}% DTE visibility
              </div>
            </div>

            <div className="p-3 rounded-xl bg-space-950/70 border border-slate-800">
              <div className="text-slate-500 text-[10px]">BOTH-UP (POWER + COMM)</div>
              <div className="text-emerald-400 font-bold text-base mt-1">
                {evaluation.metrics.bothUpHours.toFixed(1)} hrs
              </div>
              <div className="text-slate-400 text-[11px]">
                {evaluation.metrics.bothUpPercent.toFixed(1)}% joint window
              </div>
            </div>

            <div className="p-3 rounded-xl bg-space-950/70 border border-slate-800">
              <div className="text-slate-500 text-[10px]">HORIZONTAL PANEL PROXY</div>
              <div className="text-amber-300 font-bold text-base mt-1">
                {(evaluation.metrics.avgPowerHorizontal * 100).toFixed(1)}% flux
              </div>
              <div className="text-slate-400 text-[11px]">mean sin(el) when up</div>
            </div>

            <div className="p-3 rounded-xl bg-space-950/70 border border-slate-800">
              <div className="text-slate-500 text-[10px]">VERTICAL TRACKING PROXY</div>
              <div className="text-emerald-300 font-bold text-base mt-1">
                {(evaluation.metrics.avgPowerTracking * 100).toFixed(1)}% flux
              </div>
              <div className="text-slate-400 text-[11px]">mean cos(el) when up</div>
            </div>

            <div className="p-3 rounded-xl bg-space-950/70 border border-slate-800">
              <div className="text-slate-500 text-[10px]">SUN ELEVATION RANGE</div>
              <div className="text-slate-200 font-bold text-base mt-1">
                {evaluation.metrics.minSunElevation.toFixed(1)}° to {evaluation.metrics.peakSunElevation.toFixed(1)}°
              </div>
              <div className="text-slate-400 text-[11px]">
                Mean when up: {evaluation.metrics.meanSunElevationWhenUp.toFixed(1)}°
              </div>
            </div>

            <div className="p-3 rounded-xl bg-space-950/70 border border-slate-800">
              <div className="text-slate-500 text-[10px]">EARTH ELEVATION RANGE</div>
              <div className="text-cyan-300 font-bold text-base mt-1">
                {evaluation.metrics.minEarthElevation.toFixed(1)}° to {evaluation.metrics.peakEarthElevation.toFixed(1)}°
              </div>
              <div className="text-slate-400 text-[11px]">Libration oscillation</div>
            </div>
          </div>
        )}

        {/* Timeline Gantt Scrubber */}
        <div className="pt-2">
          <TimelineGantt
            windowStartMs={windowStartMs}
            windowEndMs={windowEndMs}
            currentScrubMs={currentScrubMs}
            sunIntervals={evaluation.sunIntervals}
            earthIntervals={evaluation.earthIntervals}
            bothUpIntervals={evaluation.bothUpIntervals}
            onScrub={onScrub}
          />
        </div>
      </div>
    </div>
  );
};
