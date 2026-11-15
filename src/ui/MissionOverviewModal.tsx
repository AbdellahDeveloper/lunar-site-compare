import React, { useState } from 'react';
import {
  Site,
  ScenarioEvaluation,
  ScenarioConfig,
  MissionCriteriaWeights,
  SiteScoreResult,
} from '../types';
import {
  DEFAULT_MISSION_WEIGHTS,
  MISSION_PRESET_PROFILES,
  scoreSite,
  rankSitesUnderCriteria,
} from '../engine/recommendation';
import { LUNAR_SITES, ARTEMIS_III_REGIONS } from '../data/sites';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Radio,
  Clock,
  Compass,
  Sliders,
  Award,
  Layers,
  MapPin,
  X,
} from 'lucide-react';
import {
  Button,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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

  const metrics = evaluation.metrics;
  const windowHours = windowDays * 24;

  // Evaluate current site score under active weights
  const siteScore = scoreSite(
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

  return (
    <DialogContent onClose={onClose} className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-space-950 border-slate-800 text-slate-100 font-mono">
      {/* Header */}
      <DialogHeader className="p-4 bg-space-900 border-b border-slate-800 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-solar-gold" />
          <div>
            <DialogTitle className="text-sm font-bold uppercase tracking-wider text-slate-100">
              NASA Artemis Mission Flight Overview & Constraint Verification
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400 mt-0.5">
              Terrain-aware feasibility assessment according to Human Landing System (HLS) operational constraints
            </DialogDescription>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1 bg-space-950 p-1 rounded-lg border border-slate-800">
          <Button
            variant={activeTab === 'overview' ? 'nasa' : 'ghost'}
            size="xs"
            onClick={() => setActiveTab('overview')}
            className="text-xs"
          >
            Flight Overview
          </Button>
          <Button
            variant={activeTab === 'scoring' ? 'nasa' : 'ghost'}
            size="xs"
            onClick={() => setActiveTab('scoring')}
            className="text-xs"
          >
            Multi-Criteria Model
          </Button>
        </div>
      </DialogHeader>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {activeTab === 'overview' ? (
          <>
            {/* 1. Mission Configuration Banner */}
            <div className="grid grid-cols-4 gap-3 bg-space-900/90 p-3.5 rounded-xl border border-slate-800 text-xs">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 uppercase">ARTEMIS REGION</span>
                <span className="text-amber-400 font-bold text-sm truncate mt-0.5">
                  {site.regionName || site.name}
                </span>
                <span className="text-[10px] text-slate-400">Code: {site.artemisRegionCode || 'OTHER'}</span>
              </div>

              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 uppercase">CANDIDATE SITE</span>
                <span className="text-slate-100 font-bold text-sm truncate mt-0.5">
                  {site.name.split('(')[0].trim()}
                </span>
                <span className="text-[10px] text-slate-400">
                  {Math.abs(site.lat).toFixed(3)}°S, {site.lon.toFixed(3)}°E ({site.elevKm >= 0 ? '+' : ''}{site.elevKm.toFixed(1)} km)
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 uppercase">ANALYSIS EPOCH</span>
                <span className="text-cyan-400 font-bold text-sm mt-0.5">
                  {startDateIso}
                </span>
                <span className="text-[10px] text-slate-400">Mission Duration: {windowDays} days ({windowHours}h)</span>
              </div>

              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 uppercase">OVERALL VIABILITY</span>
                <div className="mt-0.5">
                  <Badge variant={evaluation.verdict.tier === 'optimal' ? 'emerald' : evaluation.verdict.tier === 'viable' ? 'cyan' : 'critical'}>
                    {evaluation.verdict.title}
                  </Badge>
                </div>
                <span className="text-[10px] text-slate-400 truncate mt-1">Score: {siteScore.totalScore} / 100</span>
              </div>
            </div>

            {/* 2. Scientific & Engineering Constraints Verification */}
            <div className="flex flex-col gap-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Engineering Constraints Check (Wueller et al. 2026 / NASA HLS)
              </h4>

              <div className="grid grid-cols-4 gap-3 text-xs">
                {/* Slope Check */}
                <Card className="p-3 bg-space-900 border-slate-800 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 uppercase">Landing Slope</span>
                    {isSlopeOptimal ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : isSlopeAcceptable ? (
                      <CheckCircle2 className="w-4 h-4 text-amber-400" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                    )}
                  </div>
                  <span className={`text-base font-bold ${isSlopeOptimal ? 'text-emerald-400' : isSlopeAcceptable ? 'text-amber-400' : 'text-red-400'}`}>
                    {site.slopeDeg.toFixed(1)}°
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Goal: &lt; 5.0° | Max: &lt; 8.0°
                  </span>
                </Card>

                {/* Steep Terrain Buffer */}
                <Card className="p-3 bg-space-900 border-slate-800 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 uppercase">&gt;8° Slope Buffer</span>
                    {isBufferSafe ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                    )}
                  </div>
                  <span className={`text-base font-bold ${isBufferSafe ? 'text-emerald-400' : 'text-red-400'}`}>
                    {site.distanceToSteepTerrainM} m
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Constraint: &ge; 100 m buffer
                  </span>
                </Card>

                {/* PSR Exploration Radius */}
                <Card className="p-3 bg-space-900 border-slate-800 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 uppercase">Nearest PSR Walk</span>
                    {isPsrWalkable ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                    )}
                  </div>
                  <span className={`text-base font-bold ${isPsrWalkable ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {site.nearestPsrDistanceKm.toFixed(1)} km
                  </span>
                  <span className="text-[10px] text-slate-400 truncate" title={site.psrName}>
                    {site.psrName || 'Nearby Shadow'}
                  </span>
                </Card>

                {/* Terrain Model Confidence */}
                <Card className="p-3 bg-space-900 border-slate-800 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 uppercase">LOLA Confidence</span>
                    <Badge variant={site.terrainConfidence === 'high' ? 'emerald' : 'cyan'} className="text-[9px]">
                      {site.terrainConfidence.toUpperCase()}
                    </Badge>
                  </div>
                  <span className="text-base font-bold text-slate-100">
                    &plusmn;{site.elevationUncertaintyM?.toFixed(2) || '0.35'} m Z
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {site.lolaObsDensity || 140} shots/px | &plusmn;{site.slopeUncertaintyDeg?.toFixed(1) || '1.8'}° slope
                  </span>
                </Card>
              </div>
            </div>

            {/* 3. Mission Opportunity Metrics */}
            <div className="flex flex-col gap-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-cyan-400" />
                Calculated Mission Windows & Power Summary
              </h4>

              <div className="grid grid-cols-3 gap-3 text-xs">
                {/* Sunlight */}
                <Card className="p-3 bg-space-900 border-slate-800 flex flex-col gap-1">
                  <span className="text-[10px] text-slate-400 uppercase flex items-center gap-1 text-solar-gold">
                    <Zap className="w-3 h-3" />
                    Sunlit Opportunity
                  </span>
                  <span className="text-lg font-bold text-solar-gold">
                    {metrics.sunlightHours.toFixed(1)} hrs ({metrics.sunlightPercent.toFixed(1)}%)
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Longest light: {metrics.longestLightHours.toFixed(1)}h | Longest dark: {metrics.longestDarkHours.toFixed(1)}h
                  </span>
                </Card>

                {/* Earth Visibility */}
                <Card className="p-3 bg-space-900 border-slate-800 flex flex-col gap-1">
                  <span className="text-[10px] text-slate-400 uppercase flex items-center gap-1 text-comm-cyan">
                    <Radio className="w-3 h-3" />
                    Direct-to-Earth Comm
                  </span>
                  <span className="text-lg font-bold text-comm-cyan">
                    {metrics.earthVisHours.toFixed(1)} hrs ({metrics.earthVisPercent.toFixed(1)}%)
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Max blackout: {metrics.longestEarthOutageHours.toFixed(1)}h | Outages: {metrics.earthsetCount}
                  </span>
                </Card>

                {/* Combined Both-Up */}
                <Card className="p-3 bg-space-900 border-slate-800 flex flex-col gap-1">
                  <span className="text-[10px] text-slate-400 uppercase flex items-center gap-1 text-emerald-400">
                    <Clock className="w-3 h-3" />
                    Joint Power + DTE Overlap
                  </span>
                  <span className="text-lg font-bold text-emerald-400">
                    {metrics.bothUpHours.toFixed(1)} hrs ({metrics.bothUpPercent.toFixed(1)}%)
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Longest joint window: {metrics.longestBothUpHours.toFixed(1)}h
                  </span>
                </Card>
              </div>
            </div>

            {/* 4. Quick Artemis III Region Switcher */}
            <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
              <span className="text-xs font-bold uppercase text-slate-400">
                Switch to Another Artemis III Candidate Site
              </span>
              <div className="grid grid-cols-3 gap-2">
                {LUNAR_SITES.filter((s) => s.artemisRegionCode && s.artemisRegionCode !== 'OTHER').map((s) => (
                  <Button
                    key={s.id}
                    variant={s.id === site.id ? 'nasa' : 'secondary'}
                    size="sm"
                    onClick={() => onSelectSite(s)}
                    className="justify-between text-xs font-mono h-auto py-2"
                  >
                    <div className="flex flex-col text-left truncate mr-2">
                      <span className="font-bold text-slate-200 truncate">{s.regionName}</span>
                      <span className="text-[10px] text-slate-400 truncate">{s.name.split('(')[0].trim()}</span>
                    </div>
                    <Badge variant={s.slopeDeg <= 5.0 ? 'emerald' : 'amber'} className="text-[9px] shrink-0">
                      {s.slopeDeg.toFixed(1)}°
                    </Badge>
                  </Button>
                ))}
              </div>
            </div>
          </>
        ) : (
          /* TAB 2: EXPLAINABLE MULTI-CRITERIA SCORING MODEL */
          <div className="flex flex-col gap-4">
            {/* Presets Bar */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-bold uppercase text-slate-400">Mission Profile Presets</span>
              <div className="grid grid-cols-4 gap-2">
                {Object.entries(MISSION_PRESET_PROFILES).map(([key, prof]) => (
                  <Button
                    key={key}
                    variant={selectedPreset === key ? 'nasa' : 'secondary'}
                    size="sm"
                    onClick={() => handleApplyPreset(key)}
                    className="flex-col h-auto py-2 text-left items-start"
                  >
                    <span className="font-bold text-xs truncate w-full">{prof.name}</span>
                    <span className="text-[9px] text-slate-400 line-clamp-2 mt-0.5 font-normal">
                      {prof.description}
                    </span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Sliders Grid */}
            <Card className="p-4 bg-space-900 border-slate-800 flex flex-col gap-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="font-bold uppercase text-slate-200">
                  Custom Criteria Weight Sliders (S = &Sigma; w_i &times; C_i)
                </span>
                <span className="text-[11px] text-cyan-400">
                  Formula: S = w1*P + w2*E + w3*O + w4*L + w5*C + w6*R
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Solar Weight */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-slate-300">
                    <span>Solar Illumination Duration (w1)</span>
                    <span className="text-solar-gold font-bold">{(weights.solar * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={weights.solar}
                    onChange={(e) => handleWeightChange('solar', parseFloat(e.target.value))}
                    className="accent-amber-400 cursor-pointer"
                  />
                </div>

                {/* Earth DTE Weight */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-slate-300">
                    <span>Direct-to-Earth Visibility (w2)</span>
                    <span className="text-comm-cyan font-bold">{(weights.earth * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={weights.earth}
                    onChange={(e) => handleWeightChange('earth', parseFloat(e.target.value))}
                    className="accent-cyan-400 cursor-pointer"
                  />
                </div>

                {/* Simultaneous Overlap Weight */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-slate-300">
                    <span>Simultaneous Both-Up Overlap (w3)</span>
                    <span className="text-emerald-400 font-bold">{(weights.jointBothUp * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={weights.jointBothUp}
                    onChange={(e) => handleWeightChange('jointBothUp', parseFloat(e.target.value))}
                    className="accent-emerald-400 cursor-pointer"
                  />
                </div>

                {/* Landing Slope Weight */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-slate-300">
                    <span>Landing Slope Safety &lt;5° (w4)</span>
                    <span className="text-purple-400 font-bold">{(weights.landingSlope * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={weights.landingSlope}
                    onChange={(e) => handleWeightChange('landingSlope', parseFloat(e.target.value))}
                    className="accent-purple-400 cursor-pointer"
                  />
                </div>

                {/* Terrain Confidence Weight */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-slate-300">
                    <span>LOLA Terrain Confidence (w5)</span>
                    <span className="text-slate-300 font-bold">{(weights.terrainConfidence * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={weights.terrainConfidence}
                    onChange={(e) => handleWeightChange('terrainConfidence', parseFloat(e.target.value))}
                    className="accent-slate-400 cursor-pointer"
                  />
                </div>

                {/* PSR Proximity Weight */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-slate-300">
                    <span>PSR Proximity &lt;2km (w6)</span>
                    <span className="text-blue-400 font-bold">{(weights.psrAccessibility * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={weights.psrAccessibility}
                    onChange={(e) => handleWeightChange('psrAccessibility', parseFloat(e.target.value))}
                    className="accent-blue-400 cursor-pointer"
                  />
                </div>
              </div>
            </Card>

            {/* Current Site Score Result Card */}
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

              <div className="grid grid-cols-3 gap-3 text-[11px] text-right">
                <div>
                  <span className="text-slate-500 block">Solar:</span>
                  <span className="font-bold text-solar-gold">{siteScore.breakdown.solarScore}/100</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Earth:</span>
                  <span className="font-bold text-comm-cyan">{siteScore.breakdown.earthScore}/100</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Both-Up:</span>
                  <span className="font-bold text-emerald-400">{siteScore.breakdown.jointScore}/100</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Slope:</span>
                  <span className="font-bold text-purple-400">{siteScore.breakdown.slopeScore}/100</span>
                </div>
                <div>
                  <span className="text-slate-500 block">LOLA Conf:</span>
                  <span className="font-bold text-slate-300">{siteScore.breakdown.confidenceScore}/100</span>
                </div>
                <div>
                  <span className="text-slate-500 block">PSR Dist:</span>
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

