import React, { useState } from 'react';
import {
  EphemerisPoint,
  HorizonMask,
  MonteCarloResult,
  ScenarioEvaluation,
  Site,
  SlipCase,
  UIMode,
} from '../types';
import { HorizonPanorama } from './HorizonPanorama';
import { SkyPlot } from './SkyPlot';
import {
  ChevronLeft,
  ChevronRight,
  Zap,
  Radio,
  Clock,
  ShieldCheck,
  Award,
  Sparkles,
  FileDown,
  Calendar,
} from 'lucide-react';
import { Button, Badge, Card, CardHeader, CardTitle, CardContent, Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui';

interface RightTelemetryPanelProps {
  uiMode: UIMode;
  siteA: Site;
  siteB: Site;
  evaluationA: ScenarioEvaluation;
  evaluationB?: ScenarioEvaluation;
  currentPointA: EphemerisPoint;
  currentPointB?: EphemerisPoint;
  allPointsA: EphemerisPoint[];
  allPointsB?: EphemerisPoint[];
  maskA: HorizonMask | null;
  monteCarloA: MonteCarloResult;
  slipCasesA: SlipCase[];
  onOpenSlipTable: () => void;
  onOpenAlternatives: () => void;
  onOpenExport: () => void;
}

export const RightTelemetryPanel: React.FC<RightTelemetryPanelProps> = ({
  uiMode,
  siteA,
  siteB,
  evaluationA,
  evaluationB,
  currentPointA,
  currentPointB,
  allPointsA,
  allPointsB,
  maskA,
  monteCarloA,
  slipCasesA,
  onOpenSlipTable,
  onOpenAlternatives,
  onOpenExport,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [detailSubTab, setDetailSubTab] = useState<'panorama' | 'skyplot' | 'montecarlo'>('panorama');

  const formatCountdown = (ms: number | null): string => {
    if (ms === null) return 'N/A';
    const totalHours = ms / (3600 * 1000);
    const days = Math.floor(totalHours / 24);
    const hours = Math.floor(totalHours % 24);
    if (days > 0) return `${days}d ${hours}h`;
    const mins = Math.floor((ms % (3600 * 1000)) / 60000);
    return `${hours}h ${mins}m`;
  };

  const getVerdictVariant = (tier: string) => {
    switch (tier) {
      case 'optimal':
        return 'optimal';
      case 'viable':
        return 'viable';
      case 'constrained':
        return 'constrained';
      default:
        return 'critical';
    }
  };

  return (
    <div
      className={`relative z-20 transition-all duration-300 flex ${
        isCollapsed ? 'w-10' : uiMode === 'detailed' ? 'w-96' : 'w-84'
      } h-full bg-space-950/90 backdrop-blur-md border-l border-slate-800 shadow-2xl flex-col overflow-hidden`}
    >
      {/* Collapse/Expand Toggle Tab */}
      <Button
        variant="secondary"
        size="icon-sm"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute top-3 -left-3 z-30 rounded-full border border-slate-700 shadow-lg"
      >
        {isCollapsed ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
      </Button>

      {isCollapsed ? (
        <div className="flex flex-col items-center pt-8 gap-6 text-slate-500 font-mono text-[11px] tracking-widest uppercase">
          <span className="rotate-90 origin-center whitespace-nowrap text-amber-400 font-bold">
            TELEMETRY
          </span>
        </div>
      ) : (
        <div className="flex-1 flex flex-col p-4 gap-4 overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-200">
                Mission Feasibility Scorecard
              </h3>
            </div>
            <Badge variant={getVerdictVariant(evaluationA.verdict.tier)}>
              {evaluationA.verdict.title}
            </Badge>
          </div>

          {/* Real-time Countdowns */}
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <Card className="p-2.5 bg-space-900 border-slate-800 flex flex-col">
              <span className="text-[10px] text-slate-500">
                {evaluationA.metrics.currentSunStatus === 'up' ? 'SUNSET IN' : 'SUNRISE IN'}
              </span>
              <span className="text-sm font-bold text-solar-gold mt-0.5">
                {evaluationA.metrics.currentSunStatus === 'up'
                  ? formatCountdown(evaluationA.metrics.timeToNextSunsetMs)
                  : formatCountdown(evaluationA.metrics.timeToNextSunriseMs)}
              </span>
            </Card>

            <Card className="p-2.5 bg-space-900 border-slate-800 flex flex-col">
              <span className="text-[10px] text-slate-500">
                {evaluationA.metrics.currentEarthStatus === 'up' ? 'EARTHSET IN' : 'EARTHRISE IN'}
              </span>
              <span className="text-sm font-bold text-comm-cyan mt-0.5">
                {evaluationA.metrics.currentEarthStatus === 'up'
                  ? evaluationA.metrics.timeToNextEarthsetMs === null
                    ? 'Continuous'
                    : formatCountdown(evaluationA.metrics.timeToNextEarthsetMs)
                  : formatCountdown(evaluationA.metrics.timeToNextEarthriseMs)}
              </span>
            </Card>
          </div>

          {/* Real-Time Live Telemetry (Solar Power & Earth DTE Status) */}
          <div className="flex flex-col gap-2 font-mono">
            {/* Site A */}
            <div className="flex items-center justify-between p-2.5 bg-space-900/95 rounded-xl border border-cyan-500/40 text-xs shadow-md">
              <div className="flex flex-col min-w-0 max-w-[130px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shrink-0" />
                  <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-wider">
                    SITE A
                  </span>
                </div>
                <span className="text-xs font-bold text-slate-100 truncate">
                  {siteA.name.split('(')[0].trim()}
                </span>
              </div>

              <div className="flex items-center gap-2 text-[11px]">
                <div className="flex flex-col text-right">
                  <span className="text-[9px] text-slate-500 uppercase">SOLAR</span>
                  <span
                    className={`font-bold flex items-center justify-end gap-1 ${
                      currentPointA.sun.isVisible ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    <Zap className="w-3 h-3" />
                    <span>{currentPointA.sun.isVisible ? `${currentPointA.sun.elevationDeg.toFixed(1)}°` : 'SHD'}</span>
                  </span>
                </div>

                <div className="h-6 w-px bg-slate-800" />

                <div className="flex flex-col text-right">
                  <span className="text-[9px] text-slate-500 uppercase">EARTH DTE</span>
                  <span
                    className={`font-bold flex items-center justify-end gap-1 ${
                      currentPointA.earth.isVisible ? 'text-cyan-400' : 'text-slate-400'
                    }`}
                  >
                    <Radio className="w-3 h-3" />
                    <span>{currentPointA.earth.isVisible ? `${currentPointA.earth.elevationDeg.toFixed(1)}°` : 'OCC'}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Site B (when comparing) */}
            {siteB && currentPointB && (
              <div className="flex items-center justify-between p-2.5 bg-space-900/95 rounded-xl border border-amber-500/40 text-xs shadow-md">
                <div className="flex flex-col min-w-0 max-w-[130px]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
                    <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">
                      SITE B
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-100 truncate">
                    {siteB.name.split('(')[0].trim()}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[11px]">
                  <div className="flex flex-col text-right">
                    <span className="text-[9px] text-slate-500 uppercase">SOLAR</span>
                    <span
                      className={`font-bold flex items-center justify-end gap-1 ${
                        currentPointB.sun.isVisible ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      <Zap className="w-3 h-3" />
                      <span>{currentPointB.sun.isVisible ? `${currentPointB.sun.elevationDeg.toFixed(1)}°` : 'SHD'}</span>
                    </span>
                  </div>

                  <div className="h-6 w-px bg-slate-800" />

                  <div className="flex flex-col text-right">
                    <span className="text-[9px] text-slate-500 uppercase">EARTH DTE</span>
                    <span
                      className={`font-bold flex items-center justify-end gap-1 ${
                        currentPointB.earth.isVisible ? 'text-cyan-400' : 'text-slate-400'
                      }`}
                    >
                      <Radio className="w-3 h-3" />
                      <span>{currentPointB.earth.isVisible ? `${currentPointB.earth.elevationDeg.toFixed(1)}°` : 'OCC'}</span>
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Colorful Side-by-Side A/B Comparison Scorecard using shadcn Card */}
          {evaluationB && (
            <Card className="p-3 bg-space-900/95 border-slate-800 flex flex-col gap-2.5 text-xs font-mono">
              <div className="flex items-center justify-between text-[11px] pb-1 border-b border-slate-800 text-slate-400 font-bold">
                <span>METRIC</span>
                <span className="text-cyan-300">SITE A</span>
                <span className="text-amber-300">SITE B</span>
              </div>

              {/* Total Sunlight */}
              <div className="flex items-center justify-between">
                <span className="text-slate-300 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-solar-gold" />
                  Sunlight
                </span>
                <span className={`font-bold ${evaluationA.metrics.sunlightHours >= evaluationB.metrics.sunlightHours ? 'text-emerald-400' : 'text-slate-300'}`}>
                  {evaluationA.metrics.sunlightPercent.toFixed(0)}% ({evaluationA.metrics.sunlightHours.toFixed(0)}h)
                </span>
                <span className={`font-bold ${evaluationB.metrics.sunlightHours >= evaluationA.metrics.sunlightHours ? 'text-emerald-400' : 'text-slate-300'}`}>
                  {evaluationB.metrics.sunlightPercent.toFixed(0)}% ({evaluationB.metrics.sunlightHours.toFixed(0)}h)
                </span>
              </div>

              {/* Direct Earth Comm */}
              <div className="flex items-center justify-between">
                <span className="text-slate-300 flex items-center gap-1">
                  <Radio className="w-3 h-3 text-comm-cyan" />
                  Earth DTE
                </span>
                <span className={`font-bold ${evaluationA.metrics.earthVisHours >= evaluationB.metrics.earthVisHours ? 'text-cyan-300' : 'text-slate-300'}`}>
                  {evaluationA.metrics.earthVisPercent.toFixed(0)}%
                </span>
                <span className={`font-bold ${evaluationB.metrics.earthVisHours >= evaluationA.metrics.earthVisHours ? 'text-cyan-300' : 'text-slate-300'}`}>
                  {evaluationB.metrics.earthVisPercent.toFixed(0)}%
                </span>
              </div>

              {/* Both-Up Window */}
              <div className="flex items-center justify-between">
                <span className="text-slate-300 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-emerald-400" />
                  Both-Up
                </span>
                <span className={`font-bold ${evaluationA.metrics.bothUpHours >= evaluationB.metrics.bothUpHours ? 'text-emerald-400' : 'text-slate-300'}`}>
                  {evaluationA.metrics.bothUpHours.toFixed(1)}h
                </span>
                <span className={`font-bold ${evaluationB.metrics.bothUpHours >= evaluationA.metrics.bothUpHours ? 'text-emerald-400' : 'text-slate-300'}`}>
                  {evaluationB.metrics.bothUpHours.toFixed(1)}h
                </span>
              </div>

              {/* Max Consecutive Night */}
              <div className="flex items-center justify-between">
                <span className="text-slate-300 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-purple-400" />
                  Max Night
                </span>
                <span className={`font-bold ${evaluationA.metrics.longestDarkHours <= evaluationB.metrics.longestDarkHours ? 'text-purple-300' : 'text-slate-400'}`}>
                  {evaluationA.metrics.longestDarkHours.toFixed(1)}h
                </span>
                <span className={`font-bold ${evaluationB.metrics.longestDarkHours <= evaluationA.metrics.longestDarkHours ? 'text-purple-300' : 'text-slate-400'}`}>
                  {evaluationB.metrics.longestDarkHours.toFixed(1)}h
                </span>
              </div>
            </Card>
          )}

          {/* Quick Action Buttons using shadcn Button */}
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenSlipTable}
              className="flex-col h-auto py-2 border-amber-500/40 text-amber-300 hover:bg-amber-500/10 font-mono text-[10px]"
            >
              <Calendar className="w-4 h-4 mb-1 text-amber-400" />
              <span>Slip Analysis</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onOpenAlternatives}
              className="flex-col h-auto py-2 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 font-mono text-[10px]"
            >
              <Sparkles className="w-4 h-4 mb-1 text-emerald-400" />
              <span>Alternatives</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onOpenExport}
              className="flex-col h-auto py-2 border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10 font-mono text-[10px]"
            >
              <FileDown className="w-4 h-4 mb-1 text-cyan-400" />
              <span>Export CSV</span>
            </Button>
          </div>

          {/* DETAILED VIEW SUB-PANELS (Visible in Detailed Flight Ops Mode) */}
          {uiMode === 'detailed' && (
            <div className="flex flex-col gap-3 pt-2 border-t border-slate-800">
              {/* Detailed Sub-Tab Selector using shadcn Tabs */}
              <Tabs value={detailSubTab} onValueChange={(val) => setDetailSubTab(val as any)}>
                <TabsList className="grid grid-cols-3 w-full">
                  <TabsTrigger value="panorama">Panorama</TabsTrigger>
                  <TabsTrigger value="skyplot">Sky Plot</TabsTrigger>
                  <TabsTrigger value="montecarlo">Monte Carlo</TabsTrigger>
                </TabsList>

                {/* Sub-Tab 1: 360° Panorama */}
                <TabsContent value="panorama">
                  <HorizonPanorama
                    currentPoint={currentPointA}
                    allPoints={allPointsA}
                    mask={maskA}
                    siteName={siteA.name}
                    useTerrain={true}
                    elevKm={siteA.elevKm}
                  />
                </TabsContent>

                {/* Sub-Tab 2: Polar Radar Skyplot */}
                <TabsContent value="skyplot">
                  <SkyPlot
                    currentPoint={currentPointA}
                    allPoints={allPointsA}
                    siteName={siteA.name}
                  />
                </TabsContent>

                {/* Sub-Tab 3: Monte Carlo Risk Assessment */}
                <TabsContent value="montecarlo">
                  <Card className="p-3.5 bg-space-900/90 border-slate-800 flex flex-col gap-3 text-xs font-mono">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">DISPERSION TRIALS</span>
                      <span className="text-cyan-300 font-bold">{monteCarloA.trialsCount} Trials</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">SUNLIGHT CERTAINTY</span>
                      <span className="text-solar-gold font-bold">{monteCarloA.successProbability}%</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">DTE LINK CERTAINTY</span>
                      <span className="text-comm-cyan font-bold">{monteCarloA.dteProbability}%</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">WORST-CASE NIGHT</span>
                      <span className="text-red-400 font-bold">{monteCarloA.maxConsecutiveDarkHours}h</span>
                    </div>

                    {/* Histogram */}
                    <div className="flex flex-col gap-1 pt-2 border-t border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase">Darkness Distribution</span>
                      <div className="grid grid-cols-5 gap-1 text-[9px] text-center">
                        {monteCarloA.darknessHistogram.map((bin) => (
                          <div key={bin.binHours} className="flex flex-col items-center">
                            <div className="w-full bg-space-800 h-12 rounded-t flex items-end justify-center p-0.5">
                              <div
                                className="w-full bg-purple-500 rounded-t"
                                style={{ height: `${Math.max(4, (bin.count / monteCarloA.trialsCount) * 100)}%` }}
                              />
                            </div>
                            <span className="text-slate-400 mt-1">{bin.binHours}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-300 leading-normal pt-1">
                      {monteCarloA.recommendation}
                    </p>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
