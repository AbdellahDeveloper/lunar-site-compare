import React from 'react';
import {
  Sun,
  Radio,
  Sparkles,
  ShieldCheck,
  Trophy,
  Award,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  MapPin,
  Camera,
} from 'lucide-react';
import { Button, Card, Badge } from '@/components/ui';
import { Site, ScenarioEvaluation, EphemerisPoint } from '@/types';

export interface SimpleHeadToHeadPanelProps {
  siteA: Site;
  siteB: Site;
  evaluationA: ScenarioEvaluation;
  evaluationB?: ScenarioEvaluation;
  currentPointA: EphemerisPoint;
  currentPointB: EphemerisPoint;
  onFlyToSiteA: () => void;
  onFlyToSiteB: () => void;
  onClaimBadge: (site: Site) => void;
  onChangeSites?: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const SimpleHeadToHeadPanel: React.FC<SimpleHeadToHeadPanelProps> = React.memo(({
  siteA,
  siteB,
  evaluationA,
  evaluationB,
  currentPointA,
  currentPointB,
  onFlyToSiteA,
  onFlyToSiteB,
  onClaimBadge,
  onChangeSites,
  isCollapsed,
  onToggleCollapse,
}) => {
  const metricsA = evaluationA.metrics;
  const metricsB = evaluationB?.metrics;

  const sunDaysA = (metricsA.longestLightHours / 24);
  const sunDaysB = metricsB ? (metricsB.longestLightHours / 24) : 0;

  const earthPercentA = metricsA.earthVisPercent;
  const earthPercentB = metricsB ? metricsB.earthVisPercent : 0;

  const iceDistA = siteA.nearestPsrDistanceKm;
  const iceDistB = siteB.nearestPsrDistanceKm;

  const slopeA = siteA.slopeDeg;
  const slopeB = siteB.slopeDeg;

  // Determine winners per category
  const sunWinner: 'A' | 'B' | 'TIE' =
    Math.abs(sunDaysA - sunDaysB) < 0.2 ? 'TIE' : sunDaysA > sunDaysB ? 'A' : 'B';

  const earthWinner: 'A' | 'B' | 'TIE' =
    Math.abs(earthPercentA - earthPercentB) < 2 ? 'TIE' : earthPercentA > earthPercentB ? 'A' : 'B';

  const iceWinner: 'A' | 'B' | 'TIE' =
    Math.abs(iceDistA - iceDistB) < 0.2 ? 'TIE' : iceDistA < iceDistB ? 'A' : 'B';

  const slopeWinner: 'A' | 'B' | 'TIE' =
    Math.abs(slopeA - slopeB) < 0.5 ? 'TIE' : slopeA < slopeB ? 'A' : 'B';

  // Overall Score Calculation
  let winsA = 0;
  let winsB = 0;
  if (sunWinner === 'A') winsA++; else if (sunWinner === 'B') winsB++;
  if (earthWinner === 'A') winsA++; else if (earthWinner === 'B') winsB++;
  if (iceWinner === 'A') winsA++; else if (iceWinner === 'B') winsB++;
  if (slopeWinner === 'A') winsA++; else if (slopeWinner === 'B') winsB++;

  const overallWinner: 'A' | 'B' | 'TIE' =
    winsA > winsB ? 'A' : winsB > winsA ? 'B' : 'TIE';

  const winningSite = overallWinner === 'B' ? siteB : siteA;

  return (
    <div className="relative z-20 w-full h-full bg-space-950/98 flex flex-col overflow-hidden select-none font-mono">
      {/* Collapse/Expand Toggle Tab */}
      <Button
        variant="secondary"
        size="icon-sm"
        onClick={onToggleCollapse}
        className="absolute top-2.5 left-2 z-30 rounded-md border border-slate-700 shadow-md bg-space-900/90 text-slate-300 hover:text-white"
        title={isCollapsed ? 'Expand Face-Off' : 'Collapse Face-Off'}
      >
        {isCollapsed ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
      </Button>

      {isCollapsed ? (
        <div className="flex flex-col items-center pt-8 gap-6 text-slate-500 font-mono text-[11px] tracking-widest uppercase">
          <span className="rotate-90 origin-center whitespace-nowrap text-amber-400 font-bold flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 inline -rotate-90" />
            BASE FACE-OFF
          </span>
        </div>
      ) : (
        <div className="flex-1 flex flex-col p-3 gap-3 overflow-y-auto no-scrollbar">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-solar-gold" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-100">
                Base Face-Off
              </span>
              <Badge variant="viable" className="text-[9px] py-0 h-4">
                Simple View
              </Badge>
            </div>
            <span className="text-[10px] text-slate-400">Site A vs Site B</span>
          </div>

          {/* Active Contenders Summary Card (Location selection managed in Left Panel) */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* Site A Card */}
            <div className="p-2.5 rounded-xl bg-space-900/80 border border-cyan-500/40 flex flex-col gap-1 justify-between shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-cyan-400 flex items-center gap-1 font-mono">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  SITE A
                </span>
                <button
                  onClick={onFlyToSiteA}
                  className="text-[10px] text-slate-400 hover:text-cyan-300 flex items-center gap-0.5"
                  title="Fly camera to Site A"
                >
                  <Camera className="w-3 h-3" />
                  Fly
                </button>
              </div>
              <div className="font-semibold text-slate-100 text-[11px] truncate" title={siteA.name}>
                {siteA.name.split('(')[0].trim()}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                {Math.abs(siteA.lat).toFixed(2)}°S, {siteA.lon.toFixed(2)}°E
              </div>
            </div>

            {/* Site B Card */}
            <div className="p-2.5 rounded-xl bg-space-900/80 border border-amber-500/40 flex flex-col gap-1 justify-between shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-amber-400 flex items-center gap-1 font-mono">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  SITE B
                </span>
                <button
                  onClick={onFlyToSiteB}
                  className="text-[10px] text-slate-400 hover:text-amber-300 flex items-center gap-0.5"
                  title="Fly camera to Site B"
                >
                  <Camera className="w-3 h-3" />
                  Fly
                </button>
              </div>
              <div className="font-semibold text-slate-100 text-[11px] truncate" title={siteB.name}>
                {siteB.name.split('(')[0].trim()}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                {Math.abs(siteB.lat).toFixed(2)}°S, {siteB.lon.toFixed(2)}°E
              </div>
            </div>
          </div>

          {onChangeSites && (
            <Button
              variant="ghost"
              size="xs"
              onClick={onChangeSites}
              className="w-full text-[10px] h-6 text-slate-400 hover:text-cyan-300 hover:bg-slate-800/60 font-mono flex items-center justify-center gap-1 border border-slate-800/80 rounded-lg"
            >
              <MapPin className="w-3 h-3 text-cyan-400" />
              <span>Change Locations in Left Panel</span>
              <ArrowRight className="w-2.5 h-2.5 ml-0.5 opacity-60" />
            </Button>
          )}

          {/* 4 Head-to-Head Comparison Battle Cards */}
          <div className="flex flex-col gap-2.5">
            {/* 1. Solar Power */}
            <Card className="p-2.5 bg-space-900/70 border-slate-800 flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs gap-2">
                <span className="flex items-center gap-1.5 text-solar-gold font-bold whitespace-nowrap truncate">
                  <Sun className="w-3.5 h-3.5 shrink-0" />
                  Solar Daylight
                </span>
                <Badge
                  className={`text-[9px] py-0 h-5 px-2 font-bold whitespace-nowrap shrink-0 ${
                    sunWinner === 'A'
                      ? 'bg-cyan-950 text-cyan-300 border-cyan-500/50'
                      : sunWinner === 'B'
                      ? 'bg-amber-950 text-amber-300 border-amber-500/50'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {sunWinner === 'TIE' ? 'TIE' : `SITE ${sunWinner} WINS`}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="flex items-center justify-between px-2 py-1 bg-space-950/70 rounded border border-slate-800 whitespace-nowrap overflow-hidden">
                  <span className="text-slate-400 shrink-0">Site A:</span>
                  <span className="font-bold text-cyan-300 ml-1 truncate">{sunDaysA.toFixed(1)} Days</span>
                </div>
                <div className="flex items-center justify-between px-2 py-1 bg-space-950/70 rounded border border-slate-800 whitespace-nowrap overflow-hidden">
                  <span className="text-slate-400 shrink-0">Site B:</span>
                  <span className="font-bold text-amber-300 ml-1 truncate">{sunDaysB.toFixed(1)} Days</span>
                </div>
              </div>
            </Card>

            {/* 2. Earth Signal */}
            <Card className="p-2.5 bg-space-900/70 border-slate-800 flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs gap-2">
                <span className="flex items-center gap-1.5 text-cyan-400 font-bold whitespace-nowrap truncate">
                  <Radio className="w-3.5 h-3.5 shrink-0" />
                  Earth Contact
                </span>
                <Badge
                  className={`text-[9px] py-0 h-5 px-2 font-bold whitespace-nowrap shrink-0 ${
                    earthWinner === 'A'
                      ? 'bg-cyan-950 text-cyan-300 border-cyan-500/50'
                      : earthWinner === 'B'
                      ? 'bg-amber-950 text-amber-300 border-amber-500/50'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {earthWinner === 'TIE' ? 'TIE' : `SITE ${earthWinner} WINS`}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="flex items-center justify-between px-2 py-1 bg-space-950/70 rounded border border-slate-800 whitespace-nowrap overflow-hidden">
                  <span className="text-slate-400 shrink-0">Site A:</span>
                  <span className="font-bold text-cyan-300 ml-1 truncate">{earthPercentA.toFixed(0)}%</span>
                </div>
                <div className="flex items-center justify-between px-2 py-1 bg-space-950/70 rounded border border-slate-800 whitespace-nowrap overflow-hidden">
                  <span className="text-slate-400 shrink-0">Site B:</span>
                  <span className="font-bold text-amber-300 ml-1 truncate">{earthPercentB.toFixed(0)}%</span>
                </div>
              </div>
            </Card>

            {/* 3. Water Ice Access */}
            <Card className="p-2.5 bg-space-900/70 border-slate-800 flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs gap-2">
                <span className="flex items-center gap-1.5 text-teal-400 font-bold whitespace-nowrap truncate">
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  Water Ice Access
                </span>
                <Badge
                  className={`text-[9px] py-0 h-5 px-2 font-bold whitespace-nowrap shrink-0 ${
                    iceWinner === 'A'
                      ? 'bg-cyan-950 text-cyan-300 border-cyan-500/50'
                      : iceWinner === 'B'
                      ? 'bg-amber-950 text-amber-300 border-amber-500/50'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {iceWinner === 'TIE' ? 'TIE' : `SITE ${iceWinner} WINS`}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="flex items-center justify-between px-2 py-1 bg-space-950/70 rounded border border-slate-800 whitespace-nowrap overflow-hidden">
                  <span className="text-slate-400 shrink-0">Site A:</span>
                  <span className="font-bold text-cyan-300 ml-1 truncate">{iceDistA.toFixed(1)} km</span>
                </div>
                <div className="flex items-center justify-between px-2 py-1 bg-space-950/70 rounded border border-slate-800 whitespace-nowrap overflow-hidden">
                  <span className="text-slate-400 shrink-0">Site B:</span>
                  <span className="font-bold text-amber-300 ml-1 truncate">{iceDistB.toFixed(1)} km</span>
                </div>
              </div>
            </Card>

            {/* 4. Landing Safety */}
            <Card className="p-2.5 bg-space-900/70 border-slate-800 flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs gap-2">
                <span className="flex items-center gap-1.5 text-emerald-400 font-bold whitespace-nowrap truncate">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  Terrain Flatness
                </span>
                <Badge
                  className={`text-[9px] py-0 h-5 px-2 font-bold whitespace-nowrap shrink-0 ${
                    slopeWinner === 'A'
                      ? 'bg-cyan-950 text-cyan-300 border-cyan-500/50'
                      : slopeWinner === 'B'
                      ? 'bg-amber-950 text-amber-300 border-amber-500/50'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {slopeWinner === 'TIE' ? 'TIE' : `SITE ${slopeWinner} WINS`}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="flex items-center justify-between px-2 py-1 bg-space-950/70 rounded border border-slate-800 whitespace-nowrap overflow-hidden">
                  <span className="text-slate-400 shrink-0">Site A:</span>
                  <span className="font-bold text-cyan-300 ml-1 truncate">{slopeA.toFixed(1)}°</span>
                </div>
                <div className="flex items-center justify-between px-2 py-1 bg-space-950/70 rounded border border-slate-800 whitespace-nowrap overflow-hidden">
                  <span className="text-slate-400 shrink-0">Site B:</span>
                  <span className="font-bold text-amber-300 ml-1 truncate">{slopeB.toFixed(1)}°</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Grand Verdict Card */}
          <div className="p-3.5 rounded-xl bg-gradient-to-br from-space-900 via-space-950 to-slate-900 border-2 border-emerald-500/40 shadow-lg flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-extrabold text-emerald-300 flex items-center gap-1.5 uppercase whitespace-nowrap">
                <Trophy className="w-4 h-4 text-solar-gold shrink-0" />
                Overall Winner
              </span>
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-bold text-[10px] h-5 px-2 whitespace-nowrap shrink-0">
                {overallWinner === 'TIE' ? 'BALANCED MATCH' : `SITE ${overallWinner} WINS (${Math.max(winsA, winsB)}/4)`}
              </Badge>
            </div>

            <div className="text-xs font-bold text-white">
              {winningSite.name.split('(')[0].trim()}
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
              {overallWinner === 'A'
                ? `Site A (${siteA.name.split('(')[0].trim()}) provides the superior combination of ${
                    sunWinner === 'A' ? 'longer solar daylight, ' : ''
                  }${earthWinner === 'A' ? 'unbroken Earth communication, ' : ''}${
                    iceWinner === 'A' ? 'closer ice access, ' : ''
                  }and safer landing slopes.`
                : overallWinner === 'B'
                ? `Site B (${siteB.name.split('(')[0].trim()}) wins the face-off with superior operational margins for Artemis base infrastructure.`
                : 'Both locations offer balanced tradeoffs between solar generation and communication access.'}
            </p>

            {/* Claim Badge Button for Winner */}
            <Button
              size="sm"
              onClick={() => onClaimBadge(winningSite)}
              className="mt-1 w-full font-bold text-xs bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white shadow-md shadow-cyan-950/50 h-8"
            >
              <Award className="w-3.5 h-3.5 mr-1.5 text-solar-gold" />
              Pick as Favorite & Get Badge!
            </Button>
          </div>
        </div>
      )}
    </div>
  );
});
