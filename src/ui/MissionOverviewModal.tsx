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
  ArrowRight,
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
  siteA: Site;
  siteB?: Site;
  evaluationA: ScenarioEvaluation;
  evaluationB?: ScenarioEvaluation;
  startDateIso: string;
  windowDays: number;
  onSelectSiteA: (site: Site) => void;
  onSelectSiteB?: (site: Site) => void;
  onClose: () => void;
}

export const MissionOverviewModal: React.FC<MissionOverviewModalProps> = ({
  siteA,
  siteB,
  evaluationA,
  evaluationB,
  startDateIso,
  windowDays,
  onSelectSiteA,
  onSelectSiteB,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'scoring'>('overview');
  const [selectedPreset, setSelectedPreset] = useState<string>('balanced');
  const [weights, setWeights] = useState<MissionCriteriaWeights>({ ...DEFAULT_MISSION_WEIGHTS });
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const [pdfDownloadedSite, setPdfDownloadedSite] = useState<'A' | 'B' | null>(null);

  const metricsA = evaluationA.metrics;
  const metricsB = evaluationB?.metrics;
  const windowHours = windowDays * 24;

  // Evaluate site scores under active weights
  const siteScoreA: SiteScoreResult = scoreSite(
    siteA,
    metricsA.sunlightPercent,
    metricsA.earthVisPercent,
    metricsA.bothUpHours,
    windowHours,
    weights
  );

  const siteScoreB: SiteScoreResult | null =
    siteB && metricsB
      ? scoreSite(
          siteB,
          metricsB.sunlightPercent,
          metricsB.earthVisPercent,
          metricsB.bothUpHours,
          windowHours,
          weights
        )
      : null;

  // HLS Landing Constraints Check
  const isSlopeOptimalA = siteA.slopeDeg <= 5.0;
  const isSlopeAcceptableA = siteA.slopeDeg <= 8.0;
  const isBufferSafeA = siteA.distanceToSteepTerrainM >= 100;
  const isPsrWalkableA = siteA.nearestPsrDistanceKm <= 2.0;

  const isSlopeOptimalB = siteB ? siteB.slopeDeg <= 5.0 : false;
  const isSlopeAcceptableB = siteB ? siteB.slopeDeg <= 8.0 : false;
  const isBufferSafeB = siteB ? siteB.distanceToSteepTerrainM >= 100 : false;
  const isPsrWalkableB = siteB ? siteB.nearestPsrDistanceKm <= 2.0 : false;

  const handleApplyPreset = (key: string) => {
    setSelectedPreset(key);
    setWeights({ ...MISSION_PRESET_PROFILES[key].weights });
  };

  const handleWeightChange = (key: keyof MissionCriteriaWeights, val: number) => {
    setSelectedPreset('custom');
    setWeights((prev) => ({ ...prev, [key]: val }));
  };

  const handleDownloadPdf = (targetSite: 'A' | 'B') => {
    setIsPdfGenerating(true);
    try {
      if (targetSite === 'A') {
        generateHlsMissionPdf({
          site: siteA,
          evaluation: evaluationA,
          startDateIso,
          windowDays,
          siteScore: siteScoreA,
        });
      } else if (targetSite === 'B' && siteB && evaluationB && siteScoreB) {
        generateHlsMissionPdf({
          site: siteB,
          evaluation: evaluationB,
          startDateIso,
          windowDays,
          siteScore: siteScoreB,
        });
      }
      setPdfDownloadedSite(targetSite);
      setTimeout(() => setPdfDownloadedSite(null), 3000);
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
      className="max-w-5xl max-h-[92vh] flex flex-col p-0 overflow-hidden bg-space-950 border-slate-800 text-slate-100 font-mono shadow-2xl"
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
              Artemis HLS Flight Overview (Site A vs Site B)
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400 mt-0.5 truncate">
              Side-by-side Human Landing System operational landing feasibility & constraints
            </DialogDescription>
          </div>
        </div>

        {/* Action Controls: PDF Download & Tab Switch */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="cyanPill"
            size="sm"
            onClick={() => handleDownloadPdf('A')}
            disabled={isPdfGenerating}
            className="gap-1.5 font-bold shadow-md h-8 text-xs px-2.5"
            title="Download executive NASA technical memorandum PDF report for Site A"
          >
            {pdfDownloadedSite === 'A' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300">Site A PDF</span>
              </>
            ) : (
              <>
                <FileDown className="w-3.5 h-3.5" />
                <span>PDF (Site A)</span>
              </>
            )}
          </Button>

          {siteB && evaluationB && (
            <Button
              variant="amberPill"
              size="sm"
              onClick={() => handleDownloadPdf('B')}
              disabled={isPdfGenerating}
              className="gap-1.5 font-bold shadow-md h-8 text-xs px-2.5"
              title="Download executive NASA technical memorandum PDF report for Site B"
            >
              {pdfDownloadedSite === 'B' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300">Site B PDF</span>
                </>
              ) : (
                <>
                  <FileDown className="w-3.5 h-3.5" />
                  <span>PDF (Site B)</span>
                </>
              )}
            </Button>
          )}

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
            {/* 1. DUAL EXECUTIVE HERO CARDS (SITE A & SITE B SIDE-BY-SIDE)      */}
            {/* ---------------------------------------------------------------- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* Site A Executive Card */}
              <div className="bg-space-900/90 p-3.5 rounded-xl border border-cyan-500/30 flex items-center justify-between gap-3 shadow-sm">
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="cyan" className="text-[9px] uppercase font-bold px-1 py-0">
                      SITE A
                    </Badge>
                    <span className="text-[11px] text-slate-400 font-mono truncate">
                      {siteA.regionName || siteA.artemisRegionCode || 'Region A'}
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-cyan-300 truncate mt-0.5" title={siteA.name}>
                    {siteA.name.split('(')[0].trim()}
                  </h2>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <span>{Math.abs(siteA.lat).toFixed(3)}°S, {siteA.lon.toFixed(3)}°E</span>
                    <span>·</span>
                    <span>Elev: {siteA.elevKm >= 0 ? '+' : ''}{siteA.elevKm.toFixed(2)} km</span>
                    <span>·</span>
                    <span>Slope: {siteA.slopeDeg.toFixed(1)}°</span>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-space-950 border border-slate-800 min-w-[64px] shrink-0">
                  <span className="text-[8px] text-slate-400 uppercase font-mono">SCORE</span>
                  <span className="text-lg font-bold text-cyan-400 leading-tight">
                    {siteScoreA.totalScore}
                  </span>
                  <span className="text-[8px] text-slate-500">/ 100</span>
                </div>
              </div>

              {/* Site B Executive Card */}
              {siteB && evaluationB && siteScoreB ? (
                <div className="bg-space-900/90 p-3.5 rounded-xl border border-amber-500/30 flex items-center justify-between gap-3 shadow-sm">
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="amber" className="text-[9px] uppercase font-bold px-1 py-0">
                        SITE B
                      </Badge>
                      <span className="text-[11px] text-slate-400 font-mono truncate">
                        {siteB.regionName || siteB.artemisRegionCode || 'Region B'}
                      </span>
                    </div>
                    <h2 className="text-base font-bold text-amber-300 truncate mt-0.5" title={siteB.name}>
                      {siteB.name.split('(')[0].trim()}
                    </h2>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span>{Math.abs(siteB.lat).toFixed(3)}°S, {siteB.lon.toFixed(3)}°E</span>
                      <span>·</span>
                      <span>Elev: {siteB.elevKm >= 0 ? '+' : ''}{siteB.elevKm.toFixed(2)} km</span>
                      <span>·</span>
                      <span>Slope: {siteB.slopeDeg.toFixed(1)}°</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-space-950 border border-slate-800 min-w-[64px] shrink-0">
                    <span className="text-[8px] text-slate-400 uppercase font-mono">SCORE</span>
                    <span className="text-lg font-bold text-amber-400 leading-tight">
                      {siteScoreB.totalScore}
                    </span>
                    <span className="text-[8px] text-slate-500">/ 100</span>
                  </div>
                </div>
              ) : (
                <div className="bg-space-900/40 p-3.5 rounded-xl border border-dashed border-slate-800 flex items-center justify-center text-slate-500 text-xs">
                  <span>No Site B selected for comparison</span>
                </div>
              )}
            </div>

            {/* ---------------------------------------------------------------- */}
            {/* 2. THE FOUR PRIMARY FEASIBILITY PILLARS (SITE A VS SITE B)       */}
            {/* ---------------------------------------------------------------- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* Pillar 1: Solar Power & Daylight */}
              <Card className="p-4 bg-space-900/80 border-slate-800 flex flex-col justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-amber-500/10 border border-amber-500/30">
                    <Zap className="w-4 h-4 text-solar-gold" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-200 uppercase">Solar Power & Daylight</h4>
                    <p className="text-[11px] text-slate-400">Photovoltaic surface power opportunity</p>
                  </div>
                </div>

                {/* Site A Metric */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-cyan-300 font-bold text-[11px]">SITE A: {siteA.name.split('(')[0].trim()}</span>
                    <span className="font-bold text-cyan-400">
                      {metricsA.sunlightPercent.toFixed(1)}% ({metricsA.sunlightHours.toFixed(1)}h)
                    </span>
                  </div>
                  <div className="w-full bg-space-950 h-2 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="bg-cyan-400 h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.max(0, metricsA.sunlightPercent))}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Max Daylight: {metricsA.longestLightHours.toFixed(1)}h</span>
                    <span>Max Night: {metricsA.longestDarkHours.toFixed(1)}h</span>
                  </div>
                </div>

                {/* Site B Metric (if present) */}
                {siteB && metricsB && (
                  <div className="flex flex-col gap-1 pt-2 border-t border-slate-800/80">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-amber-300 font-bold text-[11px]">SITE B: {siteB.name.split('(')[0].trim()}</span>
                      <span className="font-bold text-amber-400">
                        {metricsB.sunlightPercent.toFixed(1)}% ({metricsB.sunlightHours.toFixed(1)}h)
                      </span>
                    </div>
                    <div className="w-full bg-space-950 h-2 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="bg-amber-400 h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, Math.max(0, metricsB.sunlightPercent))}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Max Daylight: {metricsB.longestLightHours.toFixed(1)}h</span>
                      <span>Max Night: {metricsB.longestDarkHours.toFixed(1)}h</span>
                    </div>
                  </div>
                )}
              </Card>

              {/* Pillar 2: Earth Direct Comms */}
              <Card className="p-4 bg-space-900/80 border-slate-800 flex flex-col justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-cyan-500/10 border border-cyan-500/30">
                    <Radio className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-200 uppercase">Direct-to-Earth (DTE) Comms</h4>
                    <p className="text-[11px] text-slate-400">Deep Space Network line-of-sight</p>
                  </div>
                </div>

                {/* Site A Metric */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-cyan-300 font-bold text-[11px]">SITE A: {siteA.name.split('(')[0].trim()}</span>
                    <span className="font-bold text-cyan-400">
                      {metricsA.earthVisPercent.toFixed(1)}% ({metricsA.earthVisHours.toFixed(1)}h)
                    </span>
                  </div>
                  <div className="w-full bg-space-950 h-2 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="bg-cyan-400 h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.max(0, metricsA.earthVisPercent))}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Longest Outage: {metricsA.longestEarthOutageHours.toFixed(1)}h</span>
                    <span>Both-Up: {metricsA.bothUpHours.toFixed(1)}h</span>
                  </div>
                </div>

                {/* Site B Metric (if present) */}
                {siteB && metricsB && (
                  <div className="flex flex-col gap-1 pt-2 border-t border-slate-800/80">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-amber-300 font-bold text-[11px]">SITE B: {siteB.name.split('(')[0].trim()}</span>
                      <span className="font-bold text-amber-400">
                        {metricsB.earthVisPercent.toFixed(1)}% ({metricsB.earthVisHours.toFixed(1)}h)
                      </span>
                    </div>
                    <div className="w-full bg-space-950 h-2 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="bg-amber-400 h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, Math.max(0, metricsB.earthVisPercent))}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Longest Outage: {metricsB.longestEarthOutageHours.toFixed(1)}h</span>
                      <span>Both-Up: {metricsB.bothUpHours.toFixed(1)}h</span>
                    </div>
                  </div>
                )}
              </Card>

              {/* Pillar 3: Landing Slope & Safety */}
              <Card className="p-4 bg-space-900/80 border-slate-800 flex flex-col justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/30">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-200 uppercase">Landing Slope Safety</h4>
                    <p className="text-[11px] text-slate-400">HLS tip-over stability & safety buffer</p>
                  </div>
                </div>

                {/* Site A Slope */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-cyan-300 font-bold text-[11px]">SITE A: {siteA.name.split('(')[0].trim()}</span>
                    <Badge variant={isSlopeOptimalA ? 'emerald' : isSlopeAcceptableA ? 'amber' : 'critical'} className="text-[9px]">
                      {isSlopeOptimalA ? 'Optimal (< 5°)' : isSlopeAcceptableA ? 'Acceptable (< 8°)' : 'Hazard'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-300">
                    <span>Slope: <strong className="text-slate-100">{siteA.slopeDeg.toFixed(1)}°</strong></span>
                    <span>Buffer: <strong className={isBufferSafeA ? 'text-emerald-400' : 'text-rose-400'}>{siteA.distanceToSteepTerrainM}m</strong></span>
                    <span>Confidence: <strong>{siteA.terrainConfidence.toUpperCase()}</strong></span>
                  </div>
                </div>

                {/* Site B Slope (if present) */}
                {siteB && (
                  <div className="flex flex-col gap-1 pt-2 border-t border-slate-800/80">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-amber-300 font-bold text-[11px]">SITE B: {siteB.name.split('(')[0].trim()}</span>
                      <Badge variant={isSlopeOptimalB ? 'emerald' : isSlopeAcceptableB ? 'amber' : 'critical'} className="text-[9px]">
                        {isSlopeOptimalB ? 'Optimal (< 5°)' : isSlopeAcceptableB ? 'Acceptable (< 8°)' : 'Hazard'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-300">
                      <span>Slope: <strong className="text-slate-100">{siteB.slopeDeg.toFixed(1)}°</strong></span>
                      <span>Buffer: <strong className={isBufferSafeB ? 'text-emerald-400' : 'text-rose-400'}>{siteB.distanceToSteepTerrainM}m</strong></span>
                      <span>Confidence: <strong>{siteB.terrainConfidence.toUpperCase()}</strong></span>
                    </div>
                  </div>
                )}
              </Card>

              {/* Pillar 4: Science & PSR Exploration */}
              <Card className="p-4 bg-space-900/80 border-slate-800 flex flex-col justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-purple-500/10 border border-purple-500/30">
                    <Compass className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-200 uppercase">Science & PSR Access</h4>
                    <p className="text-[11px] text-slate-400">Permanently shadowed volatile cold traps</p>
                  </div>
                </div>

                {/* Site A PSR */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-cyan-300 font-bold text-[11px]">SITE A: {siteA.name.split('(')[0].trim()}</span>
                    <Badge variant={isPsrWalkableA ? 'emerald' : 'cyan'} className="text-[9px]">
                      {isPsrWalkableA ? 'Walkable EVA (≤ 2km)' : 'Rover Req.'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-300">
                    <span>Nearest Cold Trap: <strong className="text-purple-300">{siteA.nearestPsrDistanceKm.toFixed(1)} km</strong></span>
                    <span className="text-slate-400 truncate max-w-[150px]" title={siteA.psrName}>{siteA.psrName || 'Cold Trap'}</span>
                  </div>
                </div>

                {/* Site B PSR (if present) */}
                {siteB && (
                  <div className="flex flex-col gap-1 pt-2 border-t border-slate-800/80">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-amber-300 font-bold text-[11px]">SITE B: {siteB.name.split('(')[0].trim()}</span>
                      <Badge variant={isPsrWalkableB ? 'emerald' : 'cyan'} className="text-[9px]">
                        {isPsrWalkableB ? 'Walkable EVA (≤ 2km)' : 'Rover Req.'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-300">
                      <span>Nearest Cold Trap: <strong className="text-purple-300">{siteB.nearestPsrDistanceKm.toFixed(1)} km</strong></span>
                      <span className="text-slate-400 truncate max-w-[150px]" title={siteB.psrName}>{siteB.psrName || 'Cold Trap'}</span>
                    </div>
                  </div>
                )}
              </Card>
            </div>

            {/* ---------------------------------------------------------------- */}
            {/* 3. SLEEK ARTEMIS III REGION SELECTOR (SET AS SITE A OR B)         */}
            {/* ---------------------------------------------------------------- */}
            <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-slate-400">
                  Switch Active Artemis Candidates
                </span>
                <span className="text-[10px] text-slate-500">
                  Click to select site · choose A or B
                </span>
              </div>

              {/* Horizontal Scrollable Site Cards */}
              <div className="grid grid-cols-3 gap-2 pb-1">
                {artemisSites.map((s) => {
                  const isA = s.id === siteA.id;
                  const isB = siteB && s.id === siteB.id;

                  return (
                    <div
                      key={s.id}
                      className={`p-2.5 rounded-lg border text-xs flex flex-col justify-between gap-1.5 transition-colors ${
                        isA
                          ? 'border-cyan-400 bg-cyan-950/40 text-cyan-200 shadow-sm'
                          : isB
                          ? 'border-amber-400 bg-amber-950/40 text-amber-200 shadow-sm'
                          : 'border-slate-800 bg-space-900/60 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[11px] truncate" title={s.name}>
                          {s.name.split('(')[0].trim()}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          {isA && <Badge variant="cyan" className="text-[8px] py-0 px-1">SITE A</Badge>}
                          {isB && <Badge variant="amber" className="text-[8px] py-0 px-1">SITE B</Badge>}
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-slate-800/60">
                        <Button
                          size="xs"
                          variant={isA ? 'cyanPill' : 'outline'}
                          onClick={() => onSelectSiteA(s)}
                          className="h-5 text-[9px] px-1.5"
                        >
                          Set A
                        </Button>
                        {onSelectSiteB && (
                          <Button
                            size="xs"
                            variant={isB ? 'amberPill' : 'outline'}
                            onClick={() => onSelectSiteB(s)}
                            className="h-5 text-[9px] px-1.5"
                          >
                            Set B
                          </Button>
                        )}
                      </div>
                    </div>
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

            {/* Score Breakdown: Site A vs Site B Comparison Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* Site A Breakdown */}
              <div className="bg-space-900/90 p-3.5 rounded-xl border border-cyan-500/30 flex flex-col gap-2">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                  <span className="text-xs font-bold text-cyan-300">SITE A: {siteA.name.split('(')[0].trim()}</span>
                  <span className="text-base font-bold text-cyan-400">{siteScoreA.totalScore}/100</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px]">SOLAR:</span>
                    <span className="font-bold text-solar-gold">{siteScoreA.breakdown.solarScore}/100</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">EARTH:</span>
                    <span className="font-bold text-cyan-400">{siteScoreA.breakdown.earthScore}/100</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">BOTH-UP:</span>
                    <span className="font-bold text-emerald-400">{siteScoreA.breakdown.jointScore}/100</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">SLOPE:</span>
                    <span className="font-bold text-purple-400">{siteScoreA.breakdown.slopeScore}/100</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">CONFIDENCE:</span>
                    <span className="font-bold text-slate-300">{siteScoreA.breakdown.confidenceScore}/100</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">PSR DIST:</span>
                    <span className="font-bold text-blue-400">{siteScoreA.breakdown.psrScore}/100</span>
                  </div>
                </div>
              </div>

              {/* Site B Breakdown (if present) */}
              {siteB && siteScoreB ? (
                <div className="bg-space-900/90 p-3.5 rounded-xl border border-amber-500/30 flex flex-col gap-2">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                    <span className="text-xs font-bold text-amber-300">SITE B: {siteB.name.split('(')[0].trim()}</span>
                    <span className="text-base font-bold text-amber-400">{siteScoreB.totalScore}/100</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[10px]">SOLAR:</span>
                      <span className="font-bold text-solar-gold">{siteScoreB.breakdown.solarScore}/100</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">EARTH:</span>
                      <span className="font-bold text-cyan-400">{siteScoreB.breakdown.earthScore}/100</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">BOTH-UP:</span>
                      <span className="font-bold text-emerald-400">{siteScoreB.breakdown.jointScore}/100</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">SLOPE:</span>
                      <span className="font-bold text-purple-400">{siteScoreB.breakdown.slopeScore}/100</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">CONFIDENCE:</span>
                      <span className="font-bold text-slate-300">{siteScoreB.breakdown.confidenceScore}/100</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">PSR DIST:</span>
                      <span className="font-bold text-blue-400">{siteScoreB.breakdown.psrScore}/100</span>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </DialogContent>
  );
};
