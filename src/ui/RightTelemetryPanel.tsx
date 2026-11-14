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
  Compass,
  Eye,
  RotateCw,
  RotateCcw,
  Camera,
  Globe,
  Activity,
  Sun,
  Layers,
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

  // 3D Viewport Controls & Camera
  showSightlines: boolean;
  onToggleSightlines: () => void;
  showSunOrbit: boolean;
  onToggleSunOrbit: () => void;
  showEarthOrbit: boolean;
  onToggleEarthOrbit: () => void;
  autoSpin: boolean;
  onToggleAutoSpin: () => void;
  spinSpeedIndex: number;
  onSetSpinSpeedIndex: (index: number) => void;
  onFlyToSouthPole: () => void;
  onFlyToSiteA: () => void;
  onFlyToSiteB: () => void;
  onFlyToOrbitalVista: () => void;
  onFitMoon: () => void;
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
  showSightlines,
  onToggleSightlines,
  showSunOrbit,
  onToggleSunOrbit,
  showEarthOrbit,
  onToggleEarthOrbit,
  autoSpin,
  onToggleAutoSpin,
  spinSpeedIndex,
  onSetSpinSpeedIndex,
  onFlyToSouthPole,
  onFlyToSiteA,
  onFlyToSiteB,
  onFlyToOrbitalVista,
  onFitMoon,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeMainTab, setActiveMainTab] = useState<'telemetry' | 'viewport'>('telemetry');
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
            TELEMETRY / 3D
          </span>
        </div>
      ) : (
        <div className="flex-1 flex flex-col p-3 gap-3 overflow-y-auto">
          {/* Main Mode Tabs: Telemetry vs 3D Viewport Controls */}
          <Tabs value={activeMainTab} onValueChange={(val) => setActiveMainTab(val as any)} className="w-full">
            <TabsList className="grid grid-cols-2 w-full bg-space-900 border border-slate-800">
              <TabsTrigger value="telemetry" className="flex items-center gap-1.5 text-xs font-mono">
                <Activity className="w-3.5 h-3.5 text-amber-400" />
                <span>Telemetry</span>
              </TabsTrigger>
              <TabsTrigger value="viewport" className="flex items-center gap-1.5 text-xs font-mono">
                <Compass className="w-3.5 h-3.5 text-cyan-400" />
                <span>3D Viewport</span>
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: MISSION TELEMETRY */}
            <TabsContent value="telemetry" className="flex flex-col gap-4 mt-3">
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
        </TabsContent>

        {/* TAB 2: 3D VIEWPORT CONTROLS */}
        <TabsContent value="viewport" className="flex flex-col gap-3 mt-3 font-mono">
          {/* 1. Camera Flight Bookmarks & Presets */}
          <Card className="p-3 bg-space-900/90 border-slate-800 flex flex-col gap-2.5">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800 text-xs font-bold text-slate-200 uppercase">
              <div className="flex items-center gap-1.5 text-cyan-400">
                <Camera className="w-3.5 h-3.5" />
                <span>Camera Flight Presets</span>
              </div>
              <Badge variant="cyan" className="text-[9px]">3D ORBIT</Badge>
            </div>

            <div className="flex flex-col gap-1.5">
              <Button
                variant="secondary"
                size="sm"
                onClick={onFlyToSouthPole}
                className="w-full justify-start gap-2 text-xs font-mono"
              >
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                <span>South Pole (85°-90°S)</span>
              </Button>

              <Button
                variant="cyanPill"
                size="sm"
                onClick={onFlyToSiteA}
                className="w-full justify-start gap-2 text-xs font-mono truncate"
              >
                <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
                <span className="font-bold">Site A:</span>
                <span className="truncate">{siteA.name.split('(')[0].trim()}</span>
              </Button>

              {siteB && (
                <Button
                  variant="amberPill"
                  size="sm"
                  onClick={onFlyToSiteB}
                  className="w-full justify-start gap-2 text-xs font-mono truncate"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                  <span className="font-bold">Site B:</span>
                  <span className="truncate">{siteB.name.split('(')[0].trim()}</span>
                </Button>
              )}

              <div className="grid grid-cols-2 gap-2 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onFlyToOrbitalVista}
                  className="justify-center gap-1 text-xs border-slate-700/80 hover:bg-space-800 text-slate-200"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-400" />
                  <span>Orbital Vista</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={onFitMoon}
                  className="justify-center gap-1 text-xs border-slate-700/80 hover:bg-space-800 text-slate-200"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                  <span>Fit Moon</span>
                </Button>
              </div>
            </div>
          </Card>

          {/* 2. Trajectories & Ray Sightlines */}
          <Card className="p-3 bg-space-900/90 border-slate-800 flex flex-col gap-2.5">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800 text-xs font-bold text-slate-200 uppercase">
              <div className="flex items-center gap-1.5 text-amber-400">
                <Layers className="w-3.5 h-3.5" />
                <span>Sightlines & Paths</span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Button
                variant={showSightlines ? 'cyanPill' : 'ghost'}
                size="sm"
                onClick={onToggleSightlines}
                className="w-full justify-between text-xs border border-slate-800/80"
              >
                <span className="flex items-center gap-2">
                  <Radio className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Laser Rays</span>
                </span>
                <Badge variant={showSightlines ? 'optimal' : 'secondary'} className="text-[9px]">
                  {showSightlines ? 'VISIBLE' : 'HIDDEN'}
                </Badge>
              </Button>

              <Button
                variant={showSunOrbit ? 'amberPill' : 'ghost'}
                size="sm"
                onClick={onToggleSunOrbit}
                className="w-full justify-between text-xs border border-slate-800/80"
              >
                <span className="flex items-center gap-2">
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Sun Orbit Path</span>
                </span>
                <Badge variant={showSunOrbit ? 'optimal' : 'secondary'} className="text-[9px]">
                  {showSunOrbit ? 'VISIBLE' : 'HIDDEN'}
                </Badge>
              </Button>

              <Button
                variant={showEarthOrbit ? 'cyanPill' : 'ghost'}
                size="sm"
                onClick={onToggleEarthOrbit}
                className="w-full justify-between text-xs border border-slate-800/80"
              >
                <span className="flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-sky-400" />
                  <span>Earth Libration Track</span>
                </span>
                <Badge variant={showEarthOrbit ? 'optimal' : 'secondary'} className="text-[9px]">
                  {showEarthOrbit ? 'VISIBLE' : 'HIDDEN'}
                </Badge>
              </Button>
            </div>
          </Card>

          {/* 3. Auto-Spin Turntable Loop */}
          <Card className="p-3 bg-space-900/90 border-slate-800 flex flex-col gap-2.5">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800 text-xs font-bold text-slate-200 uppercase">
              <div className="flex items-center gap-1.5 text-emerald-400">
                <RotateCw className="w-3.5 h-3.5" />
                <span>Turntable Auto-Spin</span>
              </div>
              <Badge variant={autoSpin ? 'optimal' : 'secondary'} className="text-[9px]">
                {autoSpin ? 'SPINNING' : 'PAUSED'}
              </Badge>
            </div>

            <Button
              variant={autoSpin ? 'emeraldPill' : 'secondary'}
              size="sm"
              onClick={onToggleAutoSpin}
              className="w-full justify-center gap-2 text-xs font-bold"
            >
              <RotateCw className={`w-3.5 h-3.5 ${autoSpin ? 'animate-spin' : ''}`} />
              <span>{autoSpin ? 'Stop Turntable' : 'Start Auto-Spin'}</span>
            </Button>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
              <span className="text-[10px] uppercase">Speed:</span>
              <div className="flex items-center gap-1">
                {[
                  { label: '1x (15°/s)', idx: 0 },
                  { label: '2x (32°/s)', idx: 1 },
                  { label: '4x (65°/s)', idx: 2 },
                ].map((sp) => (
                  <Button
                    key={sp.idx}
                    size="xs"
                    variant={spinSpeedIndex === sp.idx ? 'cyanPill' : 'ghost'}
                    onClick={() => onSetSpinSpeedIndex(sp.idx)}
                    className="text-[10px] px-2 py-0.5 h-6"
                  >
                    {sp.label.split(' ')[0]}
                  </Button>
                ))}
              </div>
            </div>
          </Card>

          {/* 4. 3D Scene Celestial & Surface Lighting Legend */}
          <Card className="p-3 bg-space-900/90 border-slate-800 flex flex-col gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              3D Scene Lighting & Models
            </span>
            <div className="flex flex-col gap-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-amber-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50" />
                  <span>Sunlight Swath (Gold)</span>
                </span>
                <span className="text-[10px] text-slate-500">Solar Grazing Swath</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-cyan-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/50" />
                  <span>Earth Direct Comm (Cyan)</span>
                </span>
                <span className="text-[10px] text-slate-500">Line-of-Sight Beam</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-white">
                  <span className="w-2.5 h-2.5 rounded-full bg-white shadow-sm shadow-white/80" />
                  <span>Surface Point Light</span>
                </span>
                <span className="text-[10px] text-slate-500">Active Beacon</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-600 shadow-sm" />
                  <span>Shadow / Occulted</span>
                </span>
                <span className="text-[10px] text-slate-500">Dormant Mode</span>
              </div>
            </div>
          </Card>

          {/* 5. Navigation & Gesture Quick Reference */}
          <Card className="p-3 bg-space-900/70 border-slate-800/80 flex flex-col gap-1.5 text-[11px] text-slate-300">
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
              Navigation Shortcuts
            </span>
            <div className="flex items-center justify-between text-slate-400">
              <span>Zoom In / Out:</span>
              <span className="text-slate-200 font-bold">2-Finger / Wheel / +/-</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Trackball Orbit:</span>
              <span className="text-slate-200 font-bold">Left Drag (0 Deadzone)</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Focus Crater:</span>
              <span className="text-slate-200 font-bold">Double-Click</span>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )}
</div>
);
};
