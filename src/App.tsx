import { DialogContent, DialogDescription, DialogHeader, DialogTitle, ResizableHandle, ResizablePanel, ResizablePanelGroup, usePanelRef } from '@/components/ui';
import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { PRECOMPUTED_HORIZONS, generateCustomHorizon } from './data/horizons';
import { LUNAR_SITES } from './data/sites';
import { AlternativeCandidate, findAlternativeScenarios } from './engine/alternatives';
import { createLocalFrame } from './engine/local';
import { runMonteCarloAssessment } from './engine/monteCarlo';
import { bodyVectors } from './engine/moon';
import { OptimalRoiResult, RoiPoint, findOptimalSiteInPolygon } from './engine/roiOptimizer';
import { evaluateScenario } from './engine/series';
import { computeSlipAnalysis } from './engine/slip';
import { evaluateVisibilityAtInstant } from './engine/visibility';
import {
  EphemerisPoint,
  HorizonMask,
  ScenarioConfig,
  Site,
  UIMode
} from './types';
import { AlternativesModal } from './ui/AlternativesModal';
import { AstronautBadgeModal } from './ui/AstronautBadgeModal';
import { CesiumLunarViewport, CesiumViewportHandle } from './ui/CesiumLunarViewport';
import { DesignateSiteModal } from './ui/DesignateSiteModal';
import { ExportModal } from './ui/ExportModal';
import { LearnTourModal } from './ui/LearnTourModal';
import { LeftControlPanel } from './ui/LeftControlPanel';
import { MapPicker2D } from './ui/MapPicker2D';
import { MissionOverviewModal } from './ui/MissionOverviewModal';
import { NasaHeader } from './ui/NasaHeader';
import { NasaTimelineScrubber } from './ui/NasaTimelineScrubber';
import { RightTelemetryPanel } from './ui/RightTelemetryPanel';
import { RoiDrawingHud } from './ui/RoiDrawingHud';
import { RoiSearchModal } from './ui/RoiSearchModal';
import { SimpleHeadToHeadPanel } from './ui/SimpleHeadToHeadPanel';
import { SlipTable } from './ui/SlipTable';
import { TopToolRibbon } from './ui/TopToolRibbon';

export const App: React.FC = () => {
  // UI Mode: starts in Simple View with 3D-first central focus
  const [uiMode, setUIMode] = useState<UIMode>('simple');

  // Resizable Sidebars imperative refs
  const leftPanelRef = usePanelRef();
  const rightPanelRef = usePanelRef();

  // Epoch & Window
  const [startDateIso, setStartDateIso] = useState('2026-11-20');
  const [windowDays, setWindowDays] = useState(28);

  const windowStartMs = useMemo(() => {
    return new Date(`${startDateIso}T00:00:00Z`).getTime();
  }, [startDateIso]);

  const windowEndMs = useMemo(() => {
    return windowStartMs + windowDays * 24 * 3600 * 1000;
  }, [windowStartMs, windowDays]);

  const handleUpdateWindow = (newStartMs: number, newEndMs: number) => {
    if (newEndMs <= newStartMs) return;
    const newStartDate = new Date(newStartMs).toISOString().split('T')[0];
    const days = Math.max(1, Math.round((newEndMs - newStartMs) / (24 * 3600 * 1000)));
    setStartDateIso(newStartDate);
    setWindowDays(days);
    setCurrentScrubMs((prev) => Math.max(newStartMs, Math.min(newEndMs, prev)));
  };

  const [currentScrubMs, setCurrentScrubMs] = useState(windowStartMs);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(24); // 24 hours (1 full day) per second

  // Landing Sites
  const [siteA, setSiteA] = useState<Site>(
    LUNAR_SITES.find((s) => s.id === 'shackleton-rim') || LUNAR_SITES[0]
  );
  const [siteB, setSiteB] = useState<Site>(
    LUNAR_SITES.find((s) => s.id === 'malapert-mountain') || LUNAR_SITES[1]
  );

  // 3D Viewport Controls & Overlays State
  const [showSightlines, setShowSightlines] = useState(true);
  const [showSunOrbit, setShowSunOrbit] = useState(true);
  const [showEarthOrbit, setShowEarthOrbit] = useState(true);
  const [showGraticule, setShowGraticule] = useState(true);
  const [autoSpin, setAutoSpin] = useState(false);
  const [spinSpeedIndex, setSpinSpeedIndex] = useState(1);
  const cesiumViewportRef = useRef<CesiumViewportHandle | null>(null);

  // Planetary Mission Highlights (Sunlight, Earth Direct Comm, Overlap, and Scientific Overlays)
  const [showSunHighlight, setShowSunHighlight] = useState(true); // Enabled by default
  const [showEarthHighlight, setShowEarthHighlight] = useState(true); // Enabled by default
  const [showIceOverlay, setShowIceOverlay] = useState(false); // Disabled by default
  const [showRockOverlay, setShowRockOverlay] = useState(false); // Disabled by default
  const [showSlopeOverlay, setShowSlopeOverlay] = useState(false); // Disabled by default

  // Top Ribbon & Sidebar Synchronized Navigation
  const [activeTool, setActiveTool] = useState<string>('landing-sites');
  const [isLeftCollapsed, setIsLeftCollapsed] = useState<boolean>(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState<boolean>(false);

  // Modals
  const [showSlipModal, setShowSlipModal] = useState(false);
  const [showAlternativesModal, setShowAlternativesModal] = useState(false);
  const [showMapPickerModal, setShowMapPickerModal] = useState(false);
  const [mapTarget, setMapTarget] = useState<'A' | 'B'>('A');
  const [showLearnTourModal, setShowLearnTourModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showMissionOverviewModal, setShowMissionOverviewModal] = useState(false);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [selectedBadgeSite, setSelectedBadgeSite] = useState<Site>(siteA);

  // 3D Direct Surface Picking Mode
  const [isPicking3DLocation, setIsPicking3DLocation] = useState(false);
  const [pendingPickCoords, setPendingPickCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [showDesignateSiteModal, setShowDesignateSiteModal] = useState(false);

  // ROI Site Search & Optimization Tool Mode
  const [isDrawingRoi, setIsDrawingRoi] = useState(false);
  const [roiPolygon, setRoiPolygon] = useState<RoiPoint[]>([]);
  const [isOptimizingRoi, setIsOptimizingRoi] = useState(false);
  const [optimalRoiResult, setOptimalRoiResult] = useState<OptimalRoiResult | null>(null);
  const [showRoiResultModal, setShowRoiResultModal] = useState(false);

  // Sidebar Collapse Toggles via Resizable Panel API
  const toggleLeftCollapse = () => {
    const panel = leftPanelRef.current;
    if (!panel) return;
    if (panel.isCollapsed()) {
      panel.expand();
      setIsLeftCollapsed(false);
    } else {
      panel.collapse();
      setIsLeftCollapsed(true);
    }
  };

  const toggleRightCollapse = () => {
    const panel = rightPanelRef.current;
    if (!panel) return;
    if (panel.isCollapsed()) {
      panel.expand();
      setIsRightCollapsed(false);
    } else {
      panel.collapse();
      setIsRightCollapsed(true);
    }
  };

  // Top Ribbon Tool Selection Handler: Opens the relevant sidebar showing ONLY that tool
  const handleSelectTool = (toolId: string) => {
    setActiveTool(toolId);

    const leftTools = ['landing-sites', 'layer-management', 'coordinates', 'placemarks', 'graticule'];
    const rightTools = [
      'polar-sky',
      'monte-carlo',
      'places-of-interest',
      'moon-shading',
    ];

    if (leftTools.includes(toolId)) {
      leftPanelRef.current?.expand();
      setIsLeftCollapsed(false);
      if (toolId === 'graticule') {
        setShowGraticule((prev) => !prev);
      }
    } else if (rightTools.includes(toolId)) {
      rightPanelRef.current?.expand();
      setIsRightCollapsed(false);
    } else if (toolId === 'search-lunar') {
      setIsPicking3DLocation(true);
      setIsDrawingRoi(false);
    } else if (toolId === 'roi-optimizer') {
      setIsDrawingRoi(true);
      setIsPicking3DLocation(false);
      setRoiPolygon([]);
      setOptimalRoiResult(null);
    } else if (toolId === 'hls-overview') {
      setIsPlaying(false);
      setShowMissionOverviewModal(true);
    } else if (toolId === 'my-badge') {
      setSelectedBadgeSite(siteA);
      setShowBadgeModal(true);
    }
  };

  // Reset scrub when window shifts
  useEffect(() => {
    if (currentScrubMs < windowStartMs || currentScrubMs > windowEndMs) {
      setCurrentScrubMs(windowStartMs);
    }
  }, [windowStartMs, windowEndMs]);

  // URL Hash state parsing on initial mount
  useEffect(() => {
    try {
      const hash = window.location.hash.substring(1);
      if (hash) {
        const params = new URLSearchParams(hash);
        const epoch = params.get('epoch');
        const days = params.get('days');
        const sA = params.get('sA');
        const sB = params.get('sB');
        const m = params.get('mode');
        const vm = params.get('view');

        if (epoch) setStartDateIso(epoch);
        if (days) setWindowDays(Number(days));
        if (m === 'simple' || m === 'detailed') setUIMode(m);

        if (sA) {
          const matchA = LUNAR_SITES.find((s) => s.id === sA);
          if (matchA) setSiteA(matchA);
        }
        if (sB) {
          const matchB = LUNAR_SITES.find((s) => s.id === sB);
          if (matchB) setSiteB(matchB);
        }
      }
    } catch {
      // Ignore hash parse errors
    }
  }, []);

  const handleShareUrl = () => {
    const params = new URLSearchParams();
    params.set('epoch', startDateIso);
    params.set('days', windowDays.toString());
    params.set('mode', uiMode);
    params.set('sA', siteA.id);
    params.set('sB', siteB.id);
    const url = `${window.location.origin}${window.location.pathname}#${params.toString()}`;
    navigator.clipboard.writeText(url);

    if (uiMode === 'simple') {
      const sunA = evaluationA.metrics.longestLightHours;
      const sunB = evaluationB ? evaluationB.metrics.longestLightHours : 0;
      const earthA = evaluationA.metrics.earthVisPercent;
      const earthB = evaluationB?.metrics ? evaluationB.metrics.earthVisPercent : 0;
      const winnerSite = (sunB + earthB) > (sunA + earthA) ? siteB : siteA;
      setSelectedBadgeSite(winnerSite);
      setShowBadgeModal(true);
    }
  };

  // Resolve Horizon Masks
  const maskA = useMemo<HorizonMask | null>(() => {
    return PRECOMPUTED_HORIZONS[siteA.id] || generateCustomHorizon(siteA.lat, siteA.lon, siteA.elevKm);
  }, [siteA]);

  const maskB = useMemo<HorizonMask | null>(() => {
    return PRECOMPUTED_HORIZONS[siteB.id] || generateCustomHorizon(siteB.lat, siteB.lon, siteB.elevKm);
  }, [siteB]);

  // Scenarios Config
  const scenarioConfigA: ScenarioConfig = useMemo(() => ({
    id: 'sc-A',
    name: siteA.name,
    siteId: siteA.id,
    customLat: siteA.lat,
    customLon: siteA.lon,
    customElevKm: siteA.elevKm,
    customName: siteA.name,
    useTerrain: true,
  }), [siteA]);

  const scenarioConfigB: ScenarioConfig = useMemo(() => ({
    id: 'sc-B',
    name: siteB.name,
    siteId: siteB.id,
    customLat: siteB.lat,
    customLon: siteB.lon,
    customElevKm: siteB.elevKm,
    customName: siteB.name,
    useTerrain: true,
  }), [siteB]);

  // Full Evaluations across window
  const evaluationA = useMemo(() => {
    return evaluateScenario(
      scenarioConfigA,
      siteA.lat,
      siteA.lon,
      siteA.elevKm,
      maskA,
      windowStartMs,
      windowEndMs,
      currentScrubMs,
      30 * 60 * 1000
    );
  }, [scenarioConfigA, siteA, maskA, windowStartMs, windowEndMs]);

  const evaluationB = useMemo(() => {
    return evaluateScenario(
      scenarioConfigB,
      siteB.lat,
      siteB.lon,
      siteB.elevKm,
      maskB,
      windowStartMs,
      windowEndMs,
      currentScrubMs,
      30 * 60 * 1000
    );
  }, [scenarioConfigB, siteB, maskB, windowStartMs, windowEndMs]);

  // Real-time Moon-fixed Body Vectors at exact currentScrubMs
  const currentBodyVecs = useMemo(() => {
    return bodyVectors(currentScrubMs);
  }, [currentScrubMs]);

  // Live Topocentric Points at currentScrubMs (60 fps smooth)
  const currentPointA = useMemo<EphemerisPoint>(() => {
    const frame = createLocalFrame(siteA.lat, siteA.lon, siteA.elevKm);
    const vis = evaluateVisibilityAtInstant(currentBodyVecs.sun, currentBodyVecs.earth, frame, maskA, siteA.elevKm);
    return {
      timeMs: currentScrubMs,
      dateIso: new Date(currentScrubMs).toISOString(),
      sun: vis.sun,
      earth: vis.earth,
      isBothUp: vis.isBothUp,
      horizontalPowerFlux: vis.horizontalPowerFlux,
      trackingPowerFlux: vis.trackingPowerFlux,
    };
  }, [siteA, maskA, currentBodyVecs, currentScrubMs]);

  const currentPointB = useMemo<EphemerisPoint>(() => {
    const frame = createLocalFrame(siteB.lat, siteB.lon, siteB.elevKm);
    const vis = evaluateVisibilityAtInstant(currentBodyVecs.sun, currentBodyVecs.earth, frame, maskB, siteB.elevKm);
    return {
      timeMs: currentScrubMs,
      dateIso: new Date(currentScrubMs).toISOString(),
      sun: vis.sun,
      earth: vis.earth,
      isBothUp: vis.isBothUp,
      horizontalPowerFlux: vis.horizontalPowerFlux,
      trackingPowerFlux: vis.trackingPowerFlux,
    };
  }, [siteB, maskB, currentBodyVecs, currentScrubMs]);

  // Monte Carlo Assessment for Site A: lazy computed only when in detailed view & monte-carlo tool active
  const monteCarloA = useMemo(() => {
    if (uiMode !== 'detailed' || activeTool !== 'monte-carlo') {
      return {
        trialsCount: 0,
        successProbability: 85,
        dteProbability: 95,
        avgSunlightHours: 320,
        avgDarkHours: 18,
        maxConsecutiveDarkHours: 24,
        darknessHistogram: [],
        riskRating: 'Low' as const,
        recommendation: 'Terrain safe. Nominal illumination.',
      };
    }
    return runMonteCarloAssessment(siteA, scenarioConfigA, windowStartMs, windowEndMs, 100, maskA);
  }, [siteA, scenarioConfigA, windowStartMs, windowEndMs, maskA, uiMode, activeTool]);

  // Slip analysis for Site A: lazy computed on-demand only when slip modal is opened
  const slipCasesA = useMemo(() => {
    if (!showSlipModal) return [];
    return computeSlipAnalysis(
      scenarioConfigA,
      siteA.lat,
      siteA.lon,
      siteA.elevKm,
      maskA,
      windowStartMs,
      windowEndMs
    );
  }, [showSlipModal, scenarioConfigA, siteA, maskA, windowStartMs, windowEndMs]);

  // Alternatives search for Site A
  const alternativeCandidates = useMemo(() => {
    if (!showAlternativesModal) return [];
    return findAlternativeScenarios(
      scenarioConfigA,
      siteA,
      LUNAR_SITES,
      windowStartMs,
      windowEndMs - windowStartMs,
      maskA
    );
  }, [showAlternativesModal, scenarioConfigA, siteA, maskA, windowStartMs, windowEndMs]);

  // Animation Simulation Loop
  const lastTickRef = useRef<number>(performance.now());
  useEffect(() => {
    if (!isPlaying) return;

    let animId: number;
    lastTickRef.current = performance.now();

    const loop = (now: number) => {
      const dtSec = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;

      setCurrentScrubMs((prev) => {
        // Fast dynamic simulation: playbackSpeed is hours advanced per real second
        const next = prev + dtSec * playbackSpeed * 3600 * 1000;
        if (next >= windowEndMs) {
          setIsPlaying(false);
          return windowEndMs;
        }
        return next;
      });

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, playbackSpeed, windowEndMs]);

  const handleApplyAlternative = (cand: AlternativeCandidate) => {
    setShowAlternativesModal(false);
    if (cand.type === 'date_shift') {
      setStartDateIso(cand.startDateIso);
    } else {
      const matchSite = LUNAR_SITES.find((s) => s.name === cand.siteName);
      if (matchSite) setSiteA(matchSite);
    }
  };

  const handleApplyMapCoords = (lat: number, lon: number, name: string) => {
    const customSite: Site = {
      id: `custom_${lat}_${lon}`,
      name,
      agency: 'User Custom Target',
      kind: 'candidate',
      region: lat < -75 ? 'south_pole' : 'equatorial',
      lat,
      lon,
      elevKm: 0,
      verified: true,
      note: 'User designated coordinates on lunar surface.',
      slopeDeg: 3.5,
      distanceToSteepTerrainM: 200,
      nearestPsrDistanceKm: lat < -80 ? 1.5 : 25,
      terrainConfidence: 'moderate',
      rockAbundance: 15,
      thermalInertia: 60,
      volatileIceScore: lat < -80 ? 75 : 10,
      isPsrColdTrap: false,
    };

    if (mapTarget === 'A') setSiteA(customSite);
    else setSiteB(customSite);
    setShowMapPickerModal(false);
  };

  // 3D Direct Surface Picking Handlers
  const handlePickSurfaceCoords = (lat: number, lon: number) => {
    setPendingPickCoords({ lat, lon });
    setShowDesignateSiteModal(true);
  };

  const handleConfirmDesignatedSite = (name: string, target: 'A' | 'B') => {
    if (!pendingPickCoords) return;
    const { lat, lon } = pendingPickCoords;
    const latStr = `${Math.abs(lat).toFixed(3)}°${lat < 0 ? 'S' : 'N'}`;
    const lonStr = `${Math.abs(lon).toFixed(3)}°${lon >= 0 ? 'E' : 'W'}`;

    const customSite: Site = {
      id: `custom_${lat.toFixed(4)}_${lon.toFixed(4)}`,
      name: name.trim() || `Designated Site (${latStr}, ${lonStr})`,
      agency: 'User Custom Target',
      kind: 'candidate',
      region: lat < -75 ? 'south_pole' : 'equatorial',
      lat,
      lon,
      elevKm: 0,
      verified: true,
      note: `Designated on 3D Moon at ${latStr}, ${lonStr}.`,
      slopeDeg: 3.5,
      distanceToSteepTerrainM: 200,
      nearestPsrDistanceKm: lat < -80 ? 1.5 : 25,
      terrainConfidence: 'moderate',
      rockAbundance: 15,
      thermalInertia: 60,
      volatileIceScore: lat < -80 ? 75 : 10,
      isPsrColdTrap: false,
    };

    if (target === 'A') {
      setSiteA(customSite);
    } else {
      setSiteB(customSite);
    }

    setShowDesignateSiteModal(false);
    setPendingPickCoords(null);
    setIsPicking3DLocation(false);

    // Smoothly fly camera to newly designated target
    cesiumViewportRef.current?.flyToCoordinates(lat, lon, 450);
  };

  const handleCancelPick = () => {
    setShowDesignateSiteModal(false);
    setPendingPickCoords(null);
    setIsPicking3DLocation(false);
  };

  // ROI Optimization Handlers
  const handleAddRoiPoint = (pt: RoiPoint) => {
    setRoiPolygon((prev) => [...prev, pt]);
  };

  const handleRunRoiOptimization = () => {
    if (roiPolygon.length < 3) return;
    setIsOptimizingRoi(true);

    setTimeout(() => {
      try {
        const result = findOptimalSiteInPolygon(
          roiPolygon,
          windowStartMs,
          windowEndMs,
          LUNAR_SITES
        );
        setOptimalRoiResult(result);
        setShowRoiResultModal(true);
        setIsDrawingRoi(false);

        // Center camera view on the newly discovered optimal target
        cesiumViewportRef.current?.flyToCoordinates(result.bestSite.lat, result.bestSite.lon, 420);
      } catch (err) {
        console.error('ROI optimization error:', err);
      } finally {
        setIsOptimizingRoi(false);
      }
    }, 50);
  };

  const handleClearRoi = () => {
    setRoiPolygon([]);
    setOptimalRoiResult(null);
  };

  const handleCancelRoi = () => {
    setIsDrawingRoi(false);
    setRoiPolygon([]);
    setOptimalRoiResult(null);
    setShowRoiResultModal(false);
  };

  const handleApplyRoiSiteToA = (site: Site) => {
    setSiteA(site);
    setShowRoiResultModal(false);
    cesiumViewportRef.current?.flyToCoordinates(site.lat, site.lon, 450);
  };

  const handleApplyRoiSiteToB = (site: Site) => {
    setSiteB(site);
    setShowRoiResultModal(false);
    cesiumViewportRef.current?.flyToCoordinates(site.lat, site.lon, 450);
  };

  const handleRedrawRoi = () => {
    setShowRoiResultModal(false);
    setOptimalRoiResult(null);
    setRoiPolygon([]);
    setIsDrawingRoi(true);
  };

  const handleSelectModalSiteA = useCallback((newSite: Site) => {
    setSiteA(newSite);
  }, []);

  const handleSelectModalSiteB = useCallback((newSite: Site) => {
    setSiteB(newSite);
  }, []);

  const handleCloseMissionOverviewModal = useCallback(() => {
    setShowMissionOverviewModal(false);
  }, []);

  // Keyboard shortcut: Escape cancels 3D pick mode or ROI drawing mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isDrawingRoi) {
          handleCancelRoi();
        } else if (isPicking3DLocation) {
          handleCancelPick();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPicking3DLocation, isDrawingRoi]);

  return (
    <div className="w-screen h-screen overflow-hidden bg-space-950 text-slate-100 flex flex-col select-none">
      {/* NASA Mission Operations Header */}
      <NasaHeader
        uiMode={uiMode}
        onSetUIMode={setUIMode}
        onOpenLearnTour={() => setShowLearnTourModal(true)}
        onOpenMissionOverview={() => {
          setIsPlaying(false);
          setShowMissionOverviewModal(true);
        }}
        onShareUrl={handleShareUrl}
      />

      {/* Top Tool Ribbon (Celestial Mapping System Card Toolbar) */}
      <TopToolRibbon
        uiMode={uiMode}
        activeTool={activeTool}
        onSelectTool={handleSelectTool}
        showGraticule={showGraticule}
        onShareUrl={handleShareUrl}
      />

      {/* Main Mission Operations Center with Nested Resizable Panels (Vertical Group for Workspace & Timeline) */}
      <div className="flex-1 w-full flex overflow-hidden relative">
        <ResizablePanelGroup direction="vertical" className="h-full w-full">
          {/* Upper Workspace Panel (Horizontal Group: Left Panel, 3D Moon Viewport, Right Panel) */}
          <ResizablePanel
            id="workspace-viewport"
            minSize={250}
            className="relative h-full w-full overflow-hidden"
          >
            <ResizablePanelGroup direction="horizontal" className="h-full w-full">
              {/* Left Resizable Sidebar */}
              <ResizablePanel
                panelRef={leftPanelRef}
                id="left-sidebar"
                defaultSize="22%"
                minSize={280}
                maxSize={550}
                collapsible={true}
                collapsedSize={40}
                onResize={() => {
                  if (leftPanelRef.current) {
                    setIsLeftCollapsed(leftPanelRef.current.isCollapsed());
                  }
                }}
                className="transition-all duration-150"
              >
                <LeftControlPanel
                  uiMode={uiMode}
                  activeTool={activeTool}
                  siteA={siteA}
                  siteB={siteB}
                  onSelectSiteA={setSiteA}
                  onSelectSiteB={setSiteB}
                  allSites={LUNAR_SITES}
                  isSiteALit={currentPointA.sun.isVisible}
                  isSiteBLit={currentPointB.sun.isVisible}
                  isCollapsed={isLeftCollapsed}
                  onToggleCollapse={toggleLeftCollapse}
                  showGraticule={showGraticule}
                  onToggleGraticule={() => setShowGraticule(!showGraticule)}
                  showSightlines={showSightlines}
                  onToggleSightlines={() => setShowSightlines(!showSightlines)}
                  showSunOrbit={showSunOrbit}
                  onToggleSunOrbit={() => setShowSunOrbit(!showSunOrbit)}
                  showSunHighlight={showSunHighlight}
                  onToggleSunHighlight={() => setShowSunHighlight(!showSunHighlight)}
                  showEarthHighlight={showEarthHighlight}
                  onToggleEarthHighlight={() => setShowEarthHighlight(!showEarthHighlight)}
                  showIceOverlay={showIceOverlay}
                  onToggleIceOverlay={() => setShowIceOverlay(!showIceOverlay)}
                  showRockOverlay={showRockOverlay}
                  onToggleRockOverlay={() => setShowRockOverlay(!showRockOverlay)}
                  showSlopeOverlay={showSlopeOverlay}
                  onToggleSlopeOverlay={() => setShowSlopeOverlay(!showSlopeOverlay)}
                  sunVec={currentBodyVecs.sun}
                  earthVec={currentBodyVecs.earth}
                  onStart3DPicking={() => setIsPicking3DLocation(true)}
                  onFlyToSite={(site) => {
                    cesiumViewportRef.current?.flyToCoordinates(site.lat, site.lon, 450);
                  }}
                />
              </ResizablePanel>

              <ResizableHandle withHandle={!isLeftCollapsed} />

              {/* Central 3D Lunar Viewport (ALWAYS FOCUSED ON THE 3D MOON IN CESIUM) */}
              <ResizablePanel id="center-viewport" minSize={360} className="relative h-full">
                {/* Floating HUD for Active ROI Drawing Mode */}
                {isDrawingRoi && (
                  <RoiDrawingHud
                    uiMode={uiMode}
                    pointsCount={roiPolygon.length}
                    isOptimizing={isOptimizingRoi}
                    onOptimize={handleRunRoiOptimization}
                    onClear={handleClearRoi}
                    onCancel={handleCancelRoi}
                  />
                )}

                <CesiumLunarViewport
                  ref={cesiumViewportRef}
                  siteA={siteA}
                  siteB={siteB}
                  currentPointA={currentPointA}
                  currentPointB={currentPointB}
                  allPointsA={evaluationA.points}
                  allPointsB={evaluationB.points}
                  sunVec={currentBodyVecs.sun}
                  earthVec={currentBodyVecs.earth}
                  currentTimeMs={currentScrubMs}
                  showSightlines={showSightlines}
                  showSunOrbit={showSunOrbit}
                  showEarthOrbit={showEarthOrbit}
                  showSunHighlight={showSunHighlight}
                  showEarthHighlight={showEarthHighlight}
                  showIceOverlay={showIceOverlay}
                  showRockOverlay={showRockOverlay}
                  showSlopeOverlay={showSlopeOverlay}
                  autoSpin={autoSpin}
                  spinSpeedIndex={spinSpeedIndex}
                  showGraticule={showGraticule}
                  allSites={LUNAR_SITES}
                  isPickingLocation={isPicking3DLocation}
                  onPickSurfaceCoords={handlePickSurfaceCoords}
                  onStartPickLocation={() => setIsPicking3DLocation(true)}
                  onCancelPickLocation={handleCancelPick}
                  pendingPickCoords={pendingPickCoords}
                  isDrawingRoi={isDrawingRoi}
                  roiPolygon={roiPolygon}
                  onAddRoiPoint={handleAddRoiPoint}
                  optimalCandidate={
                    optimalRoiResult
                      ? {
                        lat: optimalRoiResult.bestSite.lat,
                        lon: optimalRoiResult.bestSite.lon,
                        score: optimalRoiResult.score,
                        name: optimalRoiResult.bestSite.name,
                      }
                      : null
                  }
                />
              </ResizablePanel>

              <ResizableHandle withHandle={!isRightCollapsed} />

              {/* Right Resizable Sidebar */}
              <ResizablePanel
                panelRef={rightPanelRef}
                id="right-sidebar"
                defaultSize="30%"
                minSize={330}
                maxSize={650}
                collapsible={true}
                collapsedSize={40}
                onResize={() => {
                  if (rightPanelRef.current) {
                    setIsRightCollapsed(rightPanelRef.current.isCollapsed());
                  }
                }}
                className="transition-all duration-150"
              >
                {uiMode === 'simple' ? (
                  <SimpleHeadToHeadPanel
                    siteA={siteA}
                    siteB={siteB}
                    evaluationA={evaluationA}
                    evaluationB={evaluationB}
                    currentPointA={currentPointA}
                    currentPointB={currentPointB}
                    onFlyToSiteA={() => cesiumViewportRef.current?.flyToSiteA()}
                    onFlyToSiteB={() => cesiumViewportRef.current?.flyToSiteB()}
                    isCollapsed={isRightCollapsed}
                    onToggleCollapse={toggleRightCollapse}
                  />
                ) : (
                  <RightTelemetryPanel
                    uiMode={uiMode}
                    siteA={siteA}
                    siteB={siteB}
                    evaluationA={evaluationA}
                    evaluationB={evaluationB}
                    currentPointA={currentPointA}
                    currentPointB={currentPointB}
                    allPointsA={evaluationA.points}
                    allPointsB={evaluationB.points}
                    maskA={maskA}
                    monteCarloA={monteCarloA}
                    slipCasesA={slipCasesA}
                    windowStartMs={windowStartMs}
                    windowEndMs={windowEndMs}
                    onScrub={setCurrentScrubMs}
                    activeTool={activeTool}
                    isCollapsed={isRightCollapsed}
                    onToggleCollapse={toggleRightCollapse}
                    showSunOrbit={showSunOrbit}
                    onToggleSunOrbit={() => setShowSunOrbit((p) => !p)}
                    showEarthOrbit={showEarthOrbit}
                    onToggleEarthOrbit={() => setShowEarthOrbit((p) => !p)}
                    autoSpin={autoSpin}
                    onToggleAutoSpin={() => setAutoSpin((p) => !p)}
                    spinSpeedIndex={spinSpeedIndex}
                    onSetSpinSpeedIndex={setSpinSpeedIndex}
                    onFlyToSouthPole={() => cesiumViewportRef.current?.flyToSouthPole()}
                    onFlyToSiteA={() => cesiumViewportRef.current?.flyToSiteA()}
                    onFlyToSiteB={() => cesiumViewportRef.current?.flyToSiteB()}
                    onFlyToOrbitalVista={() => cesiumViewportRef.current?.flyToOrbitalVista()}
                    onFlyToMoonSystemFocus={() => cesiumViewportRef.current?.flyToMoonSystemFocus()}
                    onFitMoon={() => cesiumViewportRef.current?.handleFitMoon()}
                  />
                )}
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>

          {/* Resizable Divider Handle above Timeline Dock */}
          <ResizableHandle withHandle={true} />

          {/* Bottom Resizable Timeline Panel */}
          <ResizablePanel
            id="timeline-dock"
            defaultSize={210}
            minSize={180}
            maxSize={450}
            collapsible={true}
            collapsedSize={36}
            className="w-full bg-space-950/95 overflow-hidden flex flex-col"
          >
            <NasaTimelineScrubber
              currentScrubMs={currentScrubMs}
              windowStartMs={windowStartMs}
              windowEndMs={windowEndMs}
              isPlaying={isPlaying}
              playbackSpeed={playbackSpeed}
              siteA={siteA}
              siteB={siteB}
              sunIntervalsA={evaluationA.sunIntervals}
              earthIntervalsA={evaluationA.earthIntervals}
              bothUpIntervalsA={evaluationA.bothUpIntervals}
              sunIntervalsB={evaluationB?.sunIntervals}
              earthIntervalsB={evaluationB?.earthIntervals}
              bothUpIntervalsB={evaluationB?.bothUpIntervals}
              onTogglePlay={() => setIsPlaying((p) => !p)}
              onSetSpeed={setPlaybackSpeed}
              onScrub={setCurrentScrubMs}
              onStepTime={(deltaHours) => {
                setCurrentScrubMs((prev) =>
                  Math.max(windowStartMs, Math.min(windowEndMs, prev + deltaHours * 3600 * 1000))
                );
              }}
              onResetToStart={() => {
                setIsPlaying(false);
                setCurrentScrubMs(windowStartMs);
              }}
              onUpdateWindow={handleUpdateWindow}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Modals */}
      {showDesignateSiteModal && pendingPickCoords && (
        <DesignateSiteModal
          coords={pendingPickCoords}
          initialTarget="A"
          onConfirm={handleConfirmDesignatedSite}
          onClose={handleCancelPick}
        />
      )}

      {showSlipModal && (
        <SlipTable
          slipCases={slipCasesA}
          scenarioName={siteA.name}
          onClose={() => setShowSlipModal(false)}
        />
      )}

      {showAlternativesModal && (
        <AlternativesModal
          candidates={alternativeCandidates}
          currentScenarioName={siteA.name}
          onApplyAlternative={handleApplyAlternative}
          onClose={() => setShowAlternativesModal(false)}
        />
      )}

      {showMapPickerModal && (
        <DialogContent onClose={() => setShowMapPickerModal(false)} className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Pick Coordinates on Lunar Map for Location {mapTarget}</DialogTitle>
            <DialogDescription>
              Select an existing lunar exploration site or click anywhere on the lunar surface to designate custom coordinates.
            </DialogDescription>
          </DialogHeader>

          <MapPicker2D
            selectedSiteId={mapTarget === 'A' ? siteA.id : siteB.id}
            currentLat={mapTarget === 'A' ? siteA.lat : siteB.lat}
            currentLon={mapTarget === 'A' ? siteA.lon : siteB.lon}
            onSelectSite={(site) => {
              if (mapTarget === 'A') setSiteA(site);
              else setSiteB(site);
              setShowMapPickerModal(false);
            }}
            onSelectCoordinates={handleApplyMapCoords}
            sites={LUNAR_SITES}
          />
        </DialogContent>
      )}

      {showLearnTourModal && (
        <LearnTourModal onClose={() => setShowLearnTourModal(false)} />
      )}

      {showExportModal && (
        <ExportModal
          scenario={scenarioConfigA}
          evaluation={evaluationA}
          site={siteA}
          onClose={() => setShowExportModal(false)}
        />
      )}

      {showMissionOverviewModal && (
        <MissionOverviewModal
          siteA={siteA}
          siteB={siteB}
          evaluationA={evaluationA}
          evaluationB={evaluationB}
          startDateIso={startDateIso}
          windowDays={windowDays}
          onSelectSiteA={handleSelectModalSiteA}
          onSelectSiteB={handleSelectModalSiteB}
          onClose={handleCloseMissionOverviewModal}
        />
      )}

      {/* Discovered Optimal ROI Site Result Modal */}
      {showRoiResultModal && optimalRoiResult && (
        <RoiSearchModal
          result={optimalRoiResult}
          uiMode={uiMode}
          onSetLocationA={handleApplyRoiSiteToA}
          onSetLocationB={handleApplyRoiSiteToB}
          onRedraw={handleRedrawRoi}
          onClose={() => setShowRoiResultModal(false)}
        />
      )}

      {/* Collectible Astronaut Commander Lunar Base Badge Modal */}
      {showBadgeModal && (
        <AstronautBadgeModal
          site={selectedBadgeSite}
          evaluation={selectedBadgeSite.id === siteB.id ? evaluationB : evaluationA}
          onClose={() => setShowBadgeModal(false)}
        />
      )}
    </div>
  );
};

export default App;
