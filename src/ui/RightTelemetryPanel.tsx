import React from 'react';
import {
  EphemerisPoint,
  HorizonMask,
  MonteCarloResult,
  ScenarioEvaluation,
  Site,
  SlipCase,
  UIMode,
} from '../types';
import { SkyPlot } from './SkyPlot';
import { ElevationProfileChart } from './ElevationProfileChart';
import {
  ChevronLeft,
  ChevronRight,
  Radio,
  Eye,
  Camera,
  Globe,
  Activity,
  Sun,
  Orbit,
  Disc,
  ShieldAlert,
} from 'lucide-react';
import {
  Button,
  Badge,
  Card,
  Switch,
  InfoTooltip,
} from '@/components/ui';

interface RightTelemetryPanelProps {
  activeTool: string;
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
  windowStartMs: number;
  windowEndMs: number;
  onScrub: (timeMs: number) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;

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
  onFlyToMoonSystemFocus?: () => void;
  onFitMoon: () => void;
}

export const RightTelemetryPanel: React.FC<RightTelemetryPanelProps> = ({
  activeTool,
  siteA,
  siteB,
  evaluationA,
  evaluationB,
  currentPointA,
  currentPointB,
  allPointsA,
  maskA,
  monteCarloA,
  windowStartMs,
  windowEndMs,
  onScrub,
  isCollapsed,
  onToggleCollapse,
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
  onFlyToMoonSystemFocus,
  onFitMoon,
}) => {
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

  // Determine current active section for Right Sidebar
  const isElevationMode = activeTool === 'terrain-profile';
  const isSightlinesMode = activeTool === 'sight-lines';
  const isPolarSkyMode = activeTool === 'polar-sky';
  const isMonteCarloMode = activeTool === 'monte-carlo';
  const isCameraMode = activeTool === 'places-of-interest';
  const isShadingMode = activeTool === 'moon-shading';
  const isTelemetryMode =
    activeTool === 'measurements' ||
    (!isElevationMode &&
      !isSightlinesMode &&
      !isPolarSkyMode &&
      !isMonteCarloMode &&
      !isCameraMode &&
      !isShadingMode);

  const getSectionTitle = () => {
    if (isElevationMode) return 'Terrain Profile';
    if (isSightlinesMode) return 'Sight Lines & Rays';
    if (isPolarSkyMode) return 'Polar Sky Plot';
    if (isMonteCarloMode) return 'Monte Carlo Risk';
    if (isCameraMode) return 'Camera Presets';
    if (isShadingMode) return 'Solar Illumination';
    return 'Telemetry';
  };

  return (
    <div
      className="relative z-20 w-full h-full bg-space-950/95 backdrop-blur-md flex flex-col overflow-hidden select-none"
    >
      {/* Collapse/Expand Toggle Tab */}
      <Button
        variant="secondary"
        size="icon-sm"
        onClick={onToggleCollapse}
        className="absolute top-2.5 left-2 z-30 rounded-md border border-slate-700 shadow-md bg-space-900/90 text-slate-300 hover:text-white"
        title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
      >
        {isCollapsed ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
      </Button>

      {isCollapsed ? (
        <div className="flex flex-col items-center pt-8 gap-6 text-slate-500 font-mono text-[11px] tracking-widest uppercase">
          <span className="rotate-90 origin-center whitespace-nowrap text-amber-400 font-bold">
            {getSectionTitle().toUpperCase()}
          </span>
        </div>
      ) : (
        <div className="flex-1 flex flex-col p-3 gap-3 overflow-y-auto no-scrollbar">
          {/* Minimalist Section Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-1.5">
              {isElevationMode && <Activity className="w-3.5 h-3.5 text-cyan-400" />}
              {isSightlinesMode && <Eye className="w-3.5 h-3.5 text-amber-400" />}
              {isPolarSkyMode && <Disc className="w-3.5 h-3.5 text-cyan-400" />}
              {isMonteCarloMode && <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />}
              {isCameraMode && <Camera className="w-3.5 h-3.5 text-cyan-400" />}
              {isShadingMode && <Sun className="w-3.5 h-3.5 text-solar-gold" />}
              {isTelemetryMode && <Radio className="w-3.5 h-3.5 text-amber-400" />}
              <span className="text-xs font-bold font-mono uppercase tracking-wider text-slate-200">
                {getSectionTitle()}
              </span>
              <InfoTooltip
                text={
                  isElevationMode
                    ? 'Topographic horizon mask H(α) vs. Sun and Earth elevation h(t) over time.'
                    : isSightlinesMode
                    ? 'Line-of-sight laser rays and apparent celestial ephemeris trails.'
                    : isPolarSkyMode
                    ? 'Polar radar azimuth-elevation projection with local terrain occlusion.'
                    : isMonteCarloMode
                    ? '120-run stochastic landing dispersion assessment.'
                    : isCameraMode
                    ? 'Reconnaissance flight presets and 3D turntable controls.'
                    : isShadingMode
                    ? 'Solar grazing angle, shadow duration, and continuous daylight metrics.'
                    : 'Instantaneous solar flux, RF link margin, and visibility countdowns.'
                }
              />
            </div>
          </div>

          {/* ============================================================== */}
          {/* 1. TERRAIN PROFILE [h(t)]                                      */}
          {/* ============================================================== */}
          {isElevationMode && (
            <div className="flex flex-col gap-2.5 animate-fade-in font-mono">
              {/* Clearance Status Cards */}
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <Card className="p-2 bg-space-900/80 border-slate-800">
                  <div className="flex items-center justify-between text-slate-400 mb-0.5">
                    <span>SOLAR CLEARANCE</span>
                    <InfoTooltip text="Clearance above terrain: C(t) = h(t) - H(α). Positive means direct line-of-sight; negative means occluded." />
                  </div>
                  <span
                    className={`text-sm font-bold ${
                      currentPointA.sun.clearanceDeg !== undefined && currentPointA.sun.clearanceDeg > 0
                        ? 'text-emerald-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {currentPointA.sun.clearanceDeg !== undefined
                      ? `${currentPointA.sun.clearanceDeg >= 0 ? '+' : ''}${currentPointA.sun.clearanceDeg.toFixed(1)}°`
                      : `${currentPointA.sun.elevationDeg >= 0 ? '+' : ''}${currentPointA.sun.elevationDeg.toFixed(1)}°`}
                  </span>
                </Card>

                <Card className="p-2 bg-space-900/80 border-slate-800">
                  <div className="flex items-center justify-between text-slate-400 mb-0.5">
                    <span>EARTH CLEARANCE</span>
                    <InfoTooltip text="Clearance of direct-to-Earth communication link above local horizon peaks." />
                  </div>
                  <span
                    className={`text-sm font-bold ${
                      currentPointA.earth.clearanceDeg !== undefined && currentPointA.earth.clearanceDeg > 0
                        ? 'text-cyan-400'
                        : 'text-amber-400'
                    }`}
                  >
                    {currentPointA.earth.clearanceDeg !== undefined
                      ? `${currentPointA.earth.clearanceDeg >= 0 ? '+' : ''}${currentPointA.earth.clearanceDeg.toFixed(1)}°`
                      : `${currentPointA.earth.elevationDeg >= 0 ? '+' : ''}${currentPointA.earth.elevationDeg.toFixed(1)}°`}
                  </span>
                </Card>
              </div>

              {/* Authentic Elevation vs Time Profile Chart */}
              <ElevationProfileChart
                points={allPointsA}
                currentScrubMs={currentPointA.timeMs}
                onScrub={onScrub}
                siteName={siteA.name}
                windowStartMs={windowStartMs}
                windowEndMs={windowEndMs}
                height={260}
              />
            </div>
          )}

          {/* ============================================================== */}
          {/* 2. SIGHT LINES & 3D RAYS                                       */}
          {/* ============================================================== */}
          {isSightlinesMode && (
            <div className="flex flex-col gap-2.5 animate-fade-in font-mono">
              <span className="text-[10px] text-slate-400 uppercase">3D RAY TOGGLES</span>

              <Card className="p-2.5 bg-space-900/60 border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-200 flex items-center gap-1">
                  Direct 3D Sightlines
                  <InfoTooltip text="Laser rays from site directly connecting to Sun and Earth positions." />
                </span>
                <Switch checked={showSightlines} onCheckedChange={onToggleSightlines} />
              </Card>

              <Card className="p-2.5 bg-space-900/60 border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-200 flex items-center gap-1">
                  Sun Ephemeris Orbit
                  <InfoTooltip text="Apparent 3D solar trajectory path in the local lunar sky." />
                </span>
                <Switch checked={showSunOrbit} onCheckedChange={onToggleSunOrbit} />
              </Card>

              <Card className="p-2.5 bg-space-900/60 border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-200 flex items-center gap-1">
                  Earth Libration Path
                  <InfoTooltip text="Apparent 3D Earth position ellipse over the synodic month." />
                </span>
                <Switch checked={showEarthOrbit} onCheckedChange={onToggleEarthOrbit} />
              </Card>

              {/* Geometric Line of Sight Status */}
              <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-800 text-[11px]">
                <span className="text-[10px] text-slate-400 uppercase">RAY STATUS (SITE A)</span>
                <div className="flex items-center justify-between p-2 bg-space-900/80 rounded border border-slate-800">
                  <span className="text-solar-gold font-bold">Sun Vector</span>
                  <Badge variant={currentPointA.sun.isVisible ? 'optimal' : 'destructive'} className="text-[9px] py-0 h-4">
                    {currentPointA.sun.isVisible ? 'CLEAR LOS' : 'OCCLUDED'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-space-900/80 rounded border border-slate-800">
                  <span className="text-cyan-400 font-bold">Earth Direct Link</span>
                  <Badge variant={currentPointA.earth.isVisible ? 'optimal' : 'destructive'} className="text-[9px] py-0 h-4">
                    {currentPointA.earth.isVisible ? 'LINK ACQUIRED' : 'BLOCKED'}
                  </Badge>
                </div>
              </div>
            </div>
          )}


          {/* ============================================================== */}
          {/* 4. POLAR RADAR SKY PLOT                                        */}
          {/* ============================================================== */}
          {isPolarSkyMode && (
            <div className="flex flex-col gap-2 animate-fade-in font-mono">
              <SkyPlot
                currentPoint={currentPointA}
                allPoints={allPointsA}
                siteName={siteA.name}
              />
            </div>
          )}

          {/* ============================================================== */}
          {/* 5. MONTE CARLO LANDING RISK                                    */}
          {/* ============================================================== */}
          {isMonteCarloMode && (
            <div className="flex flex-col gap-2.5 animate-fade-in font-mono">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <Card className="p-2.5 bg-space-900 border-slate-800 flex flex-col">
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    SUNLIGHT PROB.
                    <InfoTooltip text="Probability of meeting continuous solar illumination threshold." />
                  </span>
                  <span className="text-solar-gold font-bold text-base mt-0.5">
                    {monteCarloA.successProbability}%
                  </span>
                </Card>

                <Card className="p-2.5 bg-space-900 border-slate-800 flex flex-col">
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    DTE COMM PROB.
                    <InfoTooltip text="Probability of maintaining direct-to-Earth link." />
                  </span>
                  <span className="text-cyan-400 font-bold text-base mt-0.5">
                    {monteCarloA.dteProbability}%
                  </span>
                </Card>
              </div>

              <Card className="p-2 bg-space-900/60 border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1">
                  WORST-CASE NIGHT
                  <InfoTooltip text="Longest consecutive period in shadow across all stochastic trials." />
                </span>
                <span className="text-red-400 font-bold">{monteCarloA.maxConsecutiveDarkHours}h</span>
              </Card>

              {/* Compact Histogram */}
              <div className="flex flex-col gap-1 p-2 bg-space-900/80 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase">DARKNESS DISTRIBUTION</span>
                <div className="grid grid-cols-5 gap-1 text-[8px] text-center pt-1">
                  {monteCarloA.darknessHistogram.map((bin) => (
                    <div key={bin.binHours} className="flex flex-col items-center">
                      <div className="w-full bg-space-800 h-10 rounded-t flex items-end justify-center p-0.5">
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

              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                <span>Recommendation</span>
                <InfoTooltip text={monteCarloA.recommendation} />
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* 6. CAMERA FLIGHT PRESETS                                       */}
          {/* ============================================================== */}
          {isCameraMode && (
            <div className="flex flex-col gap-2 animate-fade-in font-mono">
              <span className="text-[10px] text-slate-400 uppercase">ORBITAL PRESETS</span>

              <Button
                variant="secondary"
                size="sm"
                onClick={onFlyToMoonSystemFocus}
                className="w-full justify-start gap-2 text-xs font-mono font-bold text-cyan-300 border border-cyan-500/40 bg-cyan-950/30 hover:bg-cyan-950/60"
              >
                <Orbit className="w-3.5 h-3.5 text-cyan-400" />
                <span>Focus Moon & System</span>
              </Button>

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
                <span className="truncate">Site A Recon</span>
              </Button>

              {siteB && (
                <Button
                  variant="amberPill"
                  size="sm"
                  onClick={onFlyToSiteB}
                  className="w-full justify-start gap-2 text-xs font-mono truncate"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                  <span className="truncate">Site B Recon</span>
                </Button>
              )}

              <div className="grid grid-cols-2 gap-1.5 pt-1">
                <Button variant="outline" size="xs" onClick={onFlyToOrbitalVista} className="text-xs">
                  Orbital Vista
                </Button>
                <Button variant="outline" size="xs" onClick={onFitMoon} className="text-xs">
                  Fit Moon
                </Button>
              </div>

              {/* Turntable */}
              <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-200 flex items-center gap-1">
                    Auto-Spin Turntable
                    <InfoTooltip text="Slowly rotate 3D Moon around polar axis." />
                  </span>
                  <Switch checked={autoSpin} onCheckedChange={onToggleAutoSpin} />
                </div>
                <div className="grid grid-cols-3 gap-1 pt-1">
                  {[0.25, 0.55, 1.15].map((spd, idx) => (
                    <Button
                      key={spd}
                      variant={spinSpeedIndex === idx ? 'nasa' : 'outline'}
                      size="xs"
                      onClick={() => onSetSpinSpeedIndex(idx)}
                      className="text-[10px] h-6"
                    >
                      {spd}x
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* 7. SOLAR ILLUMINATION & MOON SHADING                          */}
          {/* ============================================================== */}
          {isShadingMode && (
            <div className="flex flex-col gap-2.5 animate-fade-in font-mono">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <Card className="p-2.5 bg-space-900 border-slate-800 flex flex-col">
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    SUN ELEVATION
                    <InfoTooltip text="Instantaneous topocentric elevation angle of the Sun." />
                  </span>
                  <span className="text-solar-gold font-bold text-base mt-0.5">
                    {currentPointA.sun.elevationDeg >= 0 ? '+' : ''}{currentPointA.sun.elevationDeg.toFixed(2)}°
                  </span>
                </Card>

                <Card className="p-2.5 bg-space-900 border-slate-800 flex flex-col">
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    DUTY CYCLE
                    <InfoTooltip text="Total percentage of time site receives sunlight across the window." />
                  </span>
                  <span className="text-emerald-400 font-bold text-base mt-0.5">
                    {evaluationA.metrics.sunlightPercent.toFixed(1)}%
                  </span>
                </Card>
              </div>

              <Card className="p-2.5 bg-space-900/60 border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1">
                  LONGEST DAYLIGHT
                  <InfoTooltip text="Maximum unbroken period of continuous solar illumination." />
                </span>
                <span className="text-solar-gold font-bold">
                  {formatCountdown(evaluationA.metrics.longestLightHours * 3600 * 1000)}
                </span>
              </Card>

              <Card className="p-2.5 bg-space-900/60 border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1">
                  LONGEST NIGHT
                  <InfoTooltip text="Maximum unbroken period spent in crater rim shadow." />
                </span>
                <span className="text-rose-400 font-bold">
                  {formatCountdown(evaluationA.metrics.longestDarkHours * 3600 * 1000)}
                </span>
              </Card>
            </div>
          )}

          {/* ============================================================== */}
          {/* 8. TELEMETRY & MEASUREMENTS (DEFAULT RIGHT PANEL)              */}
          {/* ============================================================== */}
          {isTelemetryMode && (
            <div className="flex flex-col gap-2.5 animate-fade-in font-mono">
              {/* Verdict Header */}
              <div className="flex items-center justify-between pb-1 border-b border-slate-800 text-xs">
                <span className="text-slate-400 flex items-center gap-1">
                  FEASIBILITY
                  <InfoTooltip text="Combined multi-criteria landing score evaluating solar flux, DTE comms, and slope." />
                </span>
                <Badge variant={getVerdictVariant(evaluationA.verdict.tier)}>
                  {evaluationA.verdict.title}
                </Badge>
              </div>

              {/* Real-time Countdowns */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <Card className="p-2 bg-space-900 border-slate-800 flex flex-col">
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    SUNLIGHT
                    <InfoTooltip text="Duration until next sunset or sunrise." />
                  </span>
                  <span className="text-xs font-bold text-solar-gold mt-0.5 truncate">
                    {currentPointA.sun.isVisible ? 'LIT' : 'SHADOW'}{' '}
                    ({formatCountdown(
                      (() => {
                        if (currentPointA.sun.isVisible) {
                          const curInt = evaluationA.sunIntervals.find(i => currentPointA.timeMs >= i.startMs && currentPointA.timeMs <= i.endMs);
                          return curInt ? curInt.endMs - currentPointA.timeMs : null;
                        } else {
                          const nextInt = evaluationA.sunIntervals.find(i => i.startMs > currentPointA.timeMs);
                          return nextInt ? nextInt.startMs - currentPointA.timeMs : null;
                        }
                      })()
                    )})
                  </span>
                </Card>

                <Card className="p-2 bg-space-900 border-slate-800 flex flex-col">
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    DTE COMM
                    <InfoTooltip text="Duration of continuous direct-to-Earth communication." />
                  </span>
                  <span className="text-xs font-bold text-cyan-400 mt-0.5 truncate">
                    {currentPointA.earth.isVisible ? 'LINK UP' : 'BLACKOUT'}{' '}
                    ({formatCountdown(
                      (() => {
                        if (currentPointA.earth.isVisible) {
                          const curInt = evaluationA.earthIntervals.find(i => currentPointA.timeMs >= i.startMs && currentPointA.timeMs <= i.endMs);
                          return curInt ? curInt.endMs - currentPointA.timeMs : null;
                        } else {
                          const nextInt = evaluationA.earthIntervals.find(i => i.startMs > currentPointA.timeMs);
                          return nextInt ? nextInt.startMs - currentPointA.timeMs : null;
                        }
                      })()
                    )})
                  </span>
                </Card>
              </div>

              {/* Power & RF Metrics */}
              <div className="flex flex-col gap-1.5 pt-1 border-t border-slate-800 text-[11px]">
                <div className="flex items-center justify-between p-2 bg-space-900/80 rounded border border-slate-800">
                  <span className="text-slate-400 flex items-center gap-1">
                    SOLAR POWER FLUX
                    <InfoTooltip text="Instantaneous solar irradiance (W/m²) received at current sun elevation." />
                  </span>
                  <span className="text-solar-gold font-bold">
                    {currentPointA.trackingPowerFlux.toFixed(0)} W/m²
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 bg-space-900/80 rounded border border-slate-800">
                  <span className="text-slate-400 flex items-center gap-1">
                    DTE LINK MARGIN
                    <InfoTooltip text="Direct-to-Earth RF carrier-to-noise margin above receiver threshold." />
                  </span>
                  <span className={`font-bold ${currentPointA.earth.isVisible ? 'text-cyan-400' : 'text-slate-500'}`}>
                    {currentPointA.earth.isVisible ? '+14.2 dB' : 'NO LINK'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 bg-space-900/80 rounded border border-slate-800">
                  <span className="text-slate-400 flex items-center gap-1">
                    SUN ANGLE
                    <InfoTooltip text="Elevation and Azimuth angles of the Sun relative to local horizon frame." />
                  </span>
                  <span className="text-slate-200">
                    {currentPointA.sun.elevationDeg >= 0 ? '+' : ''}{currentPointA.sun.elevationDeg.toFixed(1)}° el, {currentPointA.sun.azimuthDeg.toFixed(0)}° az
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 bg-space-900/80 rounded border border-slate-800">
                  <span className="text-slate-400 flex items-center gap-1">
                    EARTH ANGLE
                    <InfoTooltip text="Elevation and Azimuth angles of Earth relative to local horizon frame." />
                  </span>
                  <span className="text-slate-200">
                    {currentPointA.earth.elevationDeg >= 0 ? '+' : ''}{currentPointA.earth.elevationDeg.toFixed(1)}° el, {currentPointA.earth.azimuthDeg.toFixed(0)}° az
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
