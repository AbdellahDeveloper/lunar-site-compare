import React, { useState } from 'react';
import {
  Site,
  ScenarioEvaluation,
  MissionCriteriaWeights,
  SiteScoreResult,
} from '../types';
import {
  DEFAULT_MISSION_WEIGHTS,
  MISSION_PRESET_PROFILES,
  scoreSite,
} from '../engine/recommendation';
import { LUNAR_SITES } from '../data/sites';
import { generateHlsMissionPdf } from '../engine/exportMissionPdf';
import {
  ShieldCheck,
  Zap,
  Radio,
  Compass,
  FileDown,
  Check,
  Award,
  Sparkles,
} from 'lucide-react';
import {
  Button,
  Badge,
  Card,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  InfoTooltip,
} from '@/components/ui';

interface MissionOverviewModalProps {
  site: Site;
  evaluation: ScenarioEvaluation;
  startDateIso: string;
  windowDays: number;
  onSelectSite: (site: Site) => void;
  onClose: () => void;
}

export const MissionOverviewModal: React.FC<MissionOverviewModalProps> = ({
  site,
  evaluation,
  startDateIso,
  windowDays,
  onSelectSite,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'scoring'>('overview');
  const [selectedPreset, setSelectedPreset] = useState<string>('balanced');
  const [weights, setWeights] = useState<MissionCriteriaWeights>({ ...DEFAULT_MISSION_WEIGHTS });
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const [pdfDownloaded, setPdfDownloaded] = useState(false);

  const metrics = evaluation.metrics;
  const windowHours = windowDays * 24;

  // Evaluate current site score under active weights
  const siteScore: SiteScoreResult = scoreSite(
    site,
    metrics.sunlightPercent,
    metrics.earthVisPercent,
    metrics.bothUpHours,
    windowHours,
    weights
  );

  // HLS Landing Constraints Check
  const isSlopeOptimal = site.slopeDeg <= 5.0;
  const isSlopeAcceptable = site.slopeDeg <= 8.0;
  const isBufferSafe = site.distanceToSteepTerrainM >= 100;
  const isPsrWalkable = site.nearestPsrDistanceKm <= 2.0;

  const handleApplyPreset = (key: string) => {
    setSelectedPreset(key);
    setWeights({ ...MISSION_PRESET_PROFILES[key].weights });
  };

  const handleWeightChange = (key: keyof MissionCriteriaWeights, val: number) => {
    setSelectedPreset('custom');
    setWeights((prev) => ({ ...prev, [key]: val }));
  };

  const handleDownloadPdf = () => {
    setIsPdfGenerating(true);
    try {
      generateHlsMissionPdf({
        site,
        evaluation,
        startDateIso,
        windowDays,
        siteScore,
      });
      setPdfDownloaded(true);
      setTimeout(() => setPdfDownloaded(false), 3000);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    } finally {
      setIsPdfGenerating(false);
    }
  };

  const artemisSites = LUNAR_SITES.filter(
    (s) => s.artemisRegionCode && s.artemisRegionCode !== 'OTHER'
  );

  return (
    <DialogContent
      onClose={onClose}
      className="max-w-4xl max-h-[92vh] flex flex-col p-0 overflow-hidden bg-space-950 border-slate-800 text-slate-100 font-mono shadow-2xl"
    >
      {/* -------------------------------------------------------------------- */}
      {/* HEADER WITH DOWNLOAD PDF BUTTON & TAB SWITCHER                      */}
      {/* -------------------------------------------------------------------- */}
      <DialogHeader className="p-4 bg-space-900/95 border-b border-slate-800/90 flex flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-solar-gold/10 border border-solar-gold/30 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5 text-solar-gold" />
          </div>
          <div className="min-w-0">
            <DialogTitle className="text-sm font-bold uppercase tracking-wider text-slate-100 truncate">
              Artemis HLS Flight Overview
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400 mt-0.5 truncate">
              Human Landing System operational landing feasibility & constraints
            </DialogDescription>
          </div>
        </div>

        {/* Action Controls: PDF Download & Tab Switch */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="cyanPill"
            size="sm"
            onClick={handleDownloadPdf}
            disabled={isPdfGenerating}
            className="gap-1.5 font-bold shadow-md h-8 text-xs px-3"
            title="Download executive NASA technical memorandum PDF report"
          >
            {pdfDownloaded ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300">Downloaded PDF</span>
              </>
            ) : isPdfGenerating ? (
              <>
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <FileDown className="w-3.5 h-3.5" />
                <span>Download PDF Report</span>
              </>
            )}
          </Button>

          {/* Tab Switch */}
          <div className="flex items-center gap-1 bg-space-950 p-0.5 rounded-lg border border-slate-800">
            <Button
              variant={activeTab === 'overview' ? 'nasa' : 'ghost'}
              size="xs"
              onClick={() => setActiveTab('overview')}
              className="text-xs h-7 px-2.5"
            >
              Overview
            </Button>
            <Button
              variant={activeTab === 'scoring' ? 'nasa' : 'ghost'}
              size="xs"
              onClick={() => setActiveTab('scoring')}
              className="text-xs h-7 px-2.5"
            >
              Scoring Model
            </Button>
          </div>
        </div>
      </DialogHeader>

      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 no-scrollbar">
        {activeTab === 'overview' ? (
          <>
            {/* ---------------------------------------------------------------- */}
            {/* 1. SIMPLIFIED EXECUTIVE HERO CARD                                */}
            {/* ---------------------------------------------------------------- */}
            <div className="bg-space-900/90 p-4 rounded-xl border border-slate-800 flex items-center justify-between gap-4 shadow-sm">
              <div className="flex flex-col gap-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Badge variant="amber" className="text-[10px] uppercase font-bold px-1.5 py-0">
                    {site.artemisRegionCode ? `REGION ${site.artemisRegionCode}` : 'ARTEMIS III'}
                  </Badge>
                  <span className="text-xs text-slate-400 font-mono">
                    {site.regionName || 'South Polar Cluster'}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-slate-100 truncate mt-0.5">
                  {site.name.split('(')[0].trim()}
                </h2>
                <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                  <span>{Math.abs(site.lat).toFixed(4)}°S, {site.lon.toFixed(4)}°E</span>
                  <span>·</span>
                  <span>Elev: {site.elevKm >= 0 ? '+' : ''}{site.elevKm.toFixed(2)} km</span>
                  <span>·</span>
                  <span>Slope: {site.slopeDeg.toFixed(1)}°</span>
                  <span>·</span>
                  <span className="text-cyan-400">{startDateIso} ({windowDays}d / {windowHours}h)</span>
                </div>
              </div>

              {/* Score & Verdict Pill */}
              <div className="flex items-center gap-4 shrink-0 pl-4 border-l border-slate-800">
                <div className="flex flex-col items-end">
                  <span className="text-[10px] text-slate-400 uppercase font-mono">FEASIBILITY TIER</span>
                  <Badge
                    variant={
                      evaluation.verdict.tier === 'optimal'
                        ? 'emerald'
                        : evaluation.verdict.tier === 'viable'
                        ? 'cyan'
                        : 'critical'
                    }
                    className="text-xs px-2.5 py-1 mt-1 font-bold"
                  >
                    {evaluation.verdict.title}
                  </Badge>
                </div>

                <div className="flex flex-col items-center justify-center p-2.5 rounded-lg bg-space-950 border border-slate-800 min-w-[76px]">
                  <span className="text-[9px] text-slate-400 uppercase font-mono">SCORE</span>
                  <span className="text-xl font-bold text-cyan-400 leading-tight">
                    {siteScore.totalScore}
                  </span>
                  <span className="text-[9px] text-slate-500">/ 100</span>
                </div>
              </div>
            </div>

            {/* ---------------------------------------------------------------- */}
            {/* 2. THE FOUR SPACIOUS PRIMARY FEASIBILITY PILLARS (2x2 Grid)      */}
            {/* ---------------------------------------------------------------- */}
            <div className="grid grid-cols-2 gap-3.5">
              {/* Pillar 1: Solar Power */}
              <Card className="p-4 bg-space-900/80 border-slate-800 flex flex-col justify-between gap-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-amber-500/10 border border-amber-500/30">
                      <Zap className="w-4 h-4 text-solar-gold" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-200 uppercase">Solar Power & Daylight</h4>
                      <p className="text-[11px] text-slate-400">Photovoltaic surface power opportunity</p>
                    </div>
                  </div>
                  <Badge variant={metrics.sunlightPercent >= 70 ? 'emerald' : 'amber'} className="text-[10px]">
                    {metrics.sunlightPercent >= 70 ? 'Optimal' : 'Viable'}
                  </Badge>
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-bold text-solar-gold">
                      {metrics.sunlightPercent.toFixed(1)}%
                    </span>
                    <span className="text-xs text-slate-300 font-mono">
                      {metrics.sunlightHours.toFixed(1)} hrs daylight
                    </span>
                  </div>
                  {/* Progress Bar */}
                  <div className="w-full bg-space-950 h-2 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="bg-solar-gold h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.max(0, metrics.sunlightPercent))}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-[11px] text-slate-300">
                  <div>
                    <span className="text-slate-500 block text-[10px]">MAX DAYLIGHT:</span>
                    <span className="font-bold text-solar-gold">
                      {metrics.longestLightHours.toFixed(1)}h ({(metrics.longestLightHours / 24).toFixed(1)}d)
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">MAX NIGHT:</span>
                    <span className="font-bold text-rose-400">
                      {metrics.longestDarkHours.toFixed(1)}h ({(metrics.longestDarkHours / 24).toFixed(1)}d)
                    </span>
                  </div>
                </div>
              </Card>

              {/* Pillar 2: Earth Comms */}
              <Card className="p-4 bg-space-900/80 border-slate-800 flex flex-col justify-between gap-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-cyan-500/10 border border-cyan-500/30">
                      <Radio className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-200 uppercase">Direct-to-Earth Comms</h4>
                      <p className="text-[11px] text-slate-400">Deep Space Network line-of-sight</p>
                    </div>
                  </div>
                  <Badge variant={metrics.earthVisPercent >= 50 ? 'emerald' : 'cyan'} className="text-[10px]">
                    {metrics.earthVisPercent >= 50 ? 'Nominal Link' : 'Periodic'}
                  </Badge>
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-bold text-cyan-400">
                      {metrics.earthVisPercent.toFixed(1)}%
                    </span>
                    <span className="text-xs text-slate-300 font-mono">
                      {metrics.earthVisHours.toFixed(1)} hrs link up
                    </span>
                  </div>
                  {/* Progress Bar */}
                  <div className="w-full bg-space-950 h-2 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="bg-cyan-400 h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.max(0, metrics.earthVisPercent))}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-[11px] text-slate-300">
                  <div>
                    <span className="text-slate-500 block text-[10px]">LONGEST OUTAGE:</span>
                    <span className="font-bold text-amber-400">
                      {metrics.longestEarthOutageHours.toFixed(1)}h ({(metrics.longestEarthOutageHours / 24).toFixed(1)}d)
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">JOINT POWER & COMMS:</span>
                    <span className="font-bold text-emerald-400">
                      {metrics.bothUpPercent.toFixed(1)}% ({metrics.bothUpHours.toFixed(1)}h)
                    </span>
                  </div>
                </div>
              </Card>

              {/* Pillar 3: Landing Slope & Safety */}
              <Card className="p-4 bg-space-900/80 border-slate-800 flex flex-col justify-between gap-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/30">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-200 uppercase">Landing Slope Safety</h4>
                      <p className="text-[11px] text-slate-400">HLS tip-over stability & buffer</p>
                    </div>
                  </div>
                  <Badge variant={isSlopeOptimal ? 'emerald' : isSlopeAcceptable ? 'amber' : 'critical'} className="text-[10px]">
                    {isSlopeOptimal ? 'Pass (< 5.0°)' : isSlopeAcceptable ? 'Acceptable (< 8°)' : 'Fail (> 8°)'}
                  </Badge>
                </div>

                <div className="flex items-baseline justify-between">
                  <span className={`text-2xl font-bold ${isSlopeOptimal ? 'text-emerald-400' : isSlopeAcceptable ? 'text-amber-400' : 'text-red-400'}`}>
                    {site.slopeDeg.toFixed(1)}°
                  </span>
                  <span className="text-xs text-slate-400">
                    HLS Constraint: &lt; 5.0° (Max &lt; 8.0°)
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-[11px] text-slate-300">
                  <div>
                    <span className="text-slate-500 block text-[10px]">STEEP TERRAIN BUFFER:</span>
                    <span className={`font-bold ${isBufferSafe ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {site.distanceToSteepTerrainM} m {isBufferSafe ? '(Safe ≥ 100m)' : '(Too close)'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">LOLA CONFIDENCE:</span>
                    <span className="font-bold text-slate-200">
                      {site.terrainConfidence.toUpperCase()} (±{site.elevationUncertaintyM?.toFixed(2) || '0.35'}m Z)
                    </span>
                  </div>
                </div>
              </Card>

              {/* Pillar 4: Science & PSR Exploration */}
              <Card className="p-4 bg-space-900/80 border-slate-800 flex flex-col justify-between gap-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-purple-500/10 border border-purple-500/30">
                      <Compass className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-200 uppercase">Science & PSR Access</h4>
                      <p className="text-[11px] text-slate-400">Permanently shadowed water ice</p>
                    </div>
                  </div>
                  <Badge variant={isPsrWalkable ? 'emerald' : 'cyan'} className="text-[10px]">
                    {isPsrWalkable ? 'Walkable EVA' : 'Rover Req.'}
                  </Badge>
                </div>

                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold text-purple-400">
                    {site.nearestPsrDistanceKm.toFixed(1)} km
                  </span>
                  <span className="text-xs text-slate-300 truncate max-w-[170px]" title={site.psrName}>
                    {site.psrName || 'Nearby Cold Trap'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-[11px] text-slate-300">
                  <div>
                    <span className="text-slate-500 block text-[10px]">EVA TRAVERSE LIMIT:</span>
                    <span className={`font-bold ${isPsrWalkable ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {isPsrWalkable ? '≤ 2.0 km Walking Pass' : '> 2.0 km Needs Rover'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">RESOURCE VALUE:</span>
                    <span className="font-bold text-cyan-300">
                      High Volatile Potential
                    </span>
                  </div>
                </div>
              </Card>
            </div>

            {/* ---------------------------------------------------------------- */}
            {/* 3. SLEEK ARTEMIS III REGION SWITCHER                             */}
            {/* ---------------------------------------------------------------- */}
            <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-slate-400">
                  Quick Switch: Artemis III Candidate Sites
                </span>
                <span className="text-[10px] text-slate-500">
                  {artemisSites.length} official candidates
                </span>
              </div>

              {/* Horizontal Scrollable Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                {artemisSites.map((s) => {
                  const isSelected = s.id === site.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => onSelectSite(s)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono whitespace-nowrap transition-all ${
                        isSelected
                          ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 shadow-sm'
                          : 'bg-space-900/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                      }`}
                    >
                      <span className="font-bold">{s.regionName || s.name.split('(')[0].trim()}</span>
                      <span
                        className={`text-[10px] px-1 py-0.2 rounded ${
                          s.slopeDeg <= 5.0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        {s.slopeDeg.toFixed(1)}°
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          /* ------------------------------------------------------------------ */
          /* TAB 2: EXPLAINABLE MULTI-CRITERIA SCORING MODEL                   */
          /* ------------------------------------------------------------------ */
          <div className="flex flex-col gap-4">
            {/* Mission Presets */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold uppercase text-slate-400">
                Mission Operational Weight Presets
              </span>
              <div className="grid grid-cols-4 gap-2">
                {Object.entries(MISSION_PRESET_PROFILES).map(([key, prof]) => {
                  const shortNames: Record<string, string> = {
                    balanced: 'Standard HLS',
                    solarPriority: 'Solar Science',
                    commPriority: 'Direct Earth (DTE)',
                    psrProspector: 'Ice / PSR Rover',
                  };
                  const displayName = shortNames[key] || prof.name;

                  return (
                    <div
                      key={key}
                      onClick={() => handleApplyPreset(key)}
                      className={`flex items-center justify-between gap-1.5 px-3 py-2.5 rounded-lg cursor-pointer transition-all border text-xs font-mono select-none ${
                        selectedPreset === key
                          ? 'bg-cyan-600 text-white border-cyan-400 shadow-md shadow-cyan-900/40 ring-1 ring-cyan-300'
                          : 'bg-space-900/90 text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-space-800'
                      }`}
                    >
                      <span className="font-bold truncate" title={prof.name}>
                        {displayName}
                      </span>
                      <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                        <InfoTooltip
                          text={
                            <div className="flex flex-col gap-1">
                              <span className="font-bold text-cyan-300 text-xs">{prof.name}</span>
                              <span className="text-slate-300 text-[11px] leading-relaxed">
                                {prof.description}
                              </span>
                            </div>
                          }
                          side="top"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Weights Sliders */}
            <Card className="p-4 bg-space-900 border-slate-800 flex flex-col gap-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="font-bold uppercase text-slate-200">
                  Custom Criteria Weight Tuning
                </span>
                <span className="text-[11px] text-cyan-400">
                  Formula: S = Σ (w_i · C_i)
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-slate-300 text-[11px]">
                    <span>Solar Illumination (w1)</span>
                    <span className="text-solar-gold font-bold">{(weights.solar * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={weights.solar}
                    onChange={(e) => handleWeightChange('solar', parseFloat(e.target.value))}
                    className="accent-amber-400 cursor-pointer h-1.5"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-slate-300 text-[11px]">
                    <span>Earth Visibility (w2)</span>
                    <span className="text-cyan-400 font-bold">{(weights.earth * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={weights.earth}
                    onChange={(e) => handleWeightChange('earth', parseFloat(e.target.value))}
                    className="accent-cyan-400 cursor-pointer h-1.5"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-slate-300 text-[11px]">
                    <span>Both-Up Overlap (w3)</span>
                    <span className="text-emerald-400 font-bold">{(weights.jointBothUp * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={weights.jointBothUp}
                    onChange={(e) => handleWeightChange('jointBothUp', parseFloat(e.target.value))}
                    className="accent-emerald-400 cursor-pointer h-1.5"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-slate-300 text-[11px]">
                    <span>Landing Slope Safety (w4)</span>
                    <span className="text-purple-400 font-bold">{(weights.landingSlope * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={weights.landingSlope}
                    onChange={(e) => handleWeightChange('landingSlope', parseFloat(e.target.value))}
                    className="accent-purple-400 cursor-pointer h-1.5"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-slate-300 text-[11px]">
                    <span>LOLA Confidence (w5)</span>
                    <span className="text-slate-300 font-bold">{(weights.terrainConfidence * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={weights.terrainConfidence}
                    onChange={(e) => handleWeightChange('terrainConfidence', parseFloat(e.target.value))}
                    className="accent-slate-400 cursor-pointer h-1.5"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-slate-300 text-[11px]">
                    <span>PSR Accessibility (w6)</span>
                    <span className="text-blue-400 font-bold">{(weights.psrAccessibility * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={weights.psrAccessibility}
                    onChange={(e) => handleWeightChange('psrAccessibility', parseFloat(e.target.value))}
                    className="accent-blue-400 cursor-pointer h-1.5"
                  />
                </div>
              </div>
            </Card>

            {/* Score Breakdown Footer */}
            <div className="bg-space-900/90 p-4 rounded-xl border border-cyan-500/30 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs text-slate-400 uppercase">Composite Weighted Viability Score</span>
                <span className="text-2xl font-bold text-cyan-300 mt-1">
                  {siteScore.totalScore} <span className="text-sm font-normal text-slate-400">/ 100</span>
                </span>
                <span className="text-xs text-emerald-400 font-bold mt-1">
                  {siteScore.paretoStatus}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-xs text-right">
                <div>
                  <span className="text-slate-500 block text-[10px]">SOLAR:</span>
                  <span className="font-bold text-solar-gold">{siteScore.breakdown.solarScore}/100</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">EARTH:</span>
                  <span className="font-bold text-cyan-400">{siteScore.breakdown.earthScore}/100</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">BOTH-UP:</span>
                  <span className="font-bold text-emerald-400">{siteScore.breakdown.jointScore}/100</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">SLOPE:</span>
                  <span className="font-bold text-purple-400">{siteScore.breakdown.slopeScore}/100</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">CONFIDENCE:</span>
                  <span className="font-bold text-slate-300">{siteScore.breakdown.confidenceScore}/100</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">PSR DIST:</span>
                  <span className="font-bold text-blue-400">{siteScore.breakdown.psrScore}/100</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DialogContent>
  );
};
