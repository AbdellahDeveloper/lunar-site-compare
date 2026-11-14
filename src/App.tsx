import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ComparisonViewMode,
  EphemerisPoint,
  HorizonMask,
  ScientificLayer,
  ScenarioConfig,
  ScenarioEvaluation,
  Site,
  SlipCase,
  UIMode,
} from './types';
import { LUNAR_SITES } from './data/sites';
import { PRECOMPUTED_HORIZONS, generateCustomHorizon } from './data/horizons';
import { evaluateScenario } from './engine/series';
import { evaluateVisibilityAtInstant } from './engine/visibility';
import { bodyVectors } from './engine/moon';
import { createLocalFrame } from './engine/local';
import { computeSlipAnalysis } from './engine/slip';
import { findAlternativeScenarios, AlternativeCandidate } from './engine/alternatives';
import { runMonteCarloAssessment } from './engine/monteCarlo';
import { NasaHeader } from './ui/NasaHeader';
import { CesiumLunarViewport } from './ui/CesiumLunarViewport';
import { LeftControlPanel } from './ui/LeftControlPanel';
import { RightTelemetryPanel } from './ui/RightTelemetryPanel';
import { NasaTimelineScrubber } from './ui/NasaTimelineScrubber';
import { SlipTable } from './ui/SlipTable';
import { AlternativesModal } from './ui/AlternativesModal';
import { MapPicker2D } from './ui/MapPicker2D';
import { LearnTourModal } from './ui/LearnTourModal';
import { ExportModal } from './ui/ExportModal';
import { DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui';

export const App: React.FC = () => {
  // UI & View Mode: starts in Simple View with 3D-first central focus
  const [uiMode, setUIMode] = useState<UIMode>('simple');
  const [viewMode, setViewMode] = useState<ComparisonViewMode>('overlapped');
  const [scientificLayer, setScientificLayer] = useState<ScientificLayer>('none');

  // Epoch & Window
  const [startDateIso, setStartDateIso] = useState('2026-11-20');
  const [windowDays, setWindowDays] = useState(28);

  const windowStartMs = useMemo(() => {
    return new Date(`${startDateIso}T00:00:00Z`).getTime();
  }, [startDateIso]);

  const windowEndMs = useMemo(() => {
    return windowStartMs + windowDays * 24 * 3600 * 1000;
  }, [windowStartMs, windowDays]);

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

  // Modals
  const [showSlipModal, setShowSlipModal] = useState(false);
  const [showAlternativesModal, setShowAlternativesModal] = useState(false);
  const [showMapPickerModal, setShowMapPickerModal] = useState(false);
  const [mapTarget, setMapTarget] = useState<'A' | 'B'>('A');
  const [showLearnTourModal, setShowLearnTourModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

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
        const layer = params.get('layer');

        if (epoch) setStartDateIso(epoch);
        if (days) setWindowDays(Number(days));
        if (m === 'simple' || m === 'detailed') setUIMode(m);
        if (vm === 'overlapped' || vm === 'split') setViewMode(vm);
        if (layer === 'none' || layer === 'volatiles' || layer === 'thermal' || layer === 'shadow') {
          setScientificLayer(layer);
        }

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
    params.set('view', viewMode);
    params.set('layer', scientificLayer);
    params.set('sA', siteA.id);
    params.set('sB', siteB.id);
    const url = `${window.location.origin}${window.location.pathname}#${params.toString()}`;
    navigator.clipboard.writeText(url);
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

  // Monte Carlo Assessment for Site A
  const monteCarloA = useMemo(() => {
    return runMonteCarloAssessment(siteA, scenarioConfigA, windowStartMs, windowEndMs, 120);
  }, [siteA, scenarioConfigA, windowStartMs, windowEndMs]);

  // Slip analysis for Site A
  const slipCasesA = useMemo(() => {
    return computeSlipAnalysis(
      scenarioConfigA,
      siteA.lat,
      siteA.lon,
      siteA.elevKm,
      maskA,
      windowStartMs,
      windowEndMs
    );
  }, [scenarioConfigA, siteA, maskA, windowStartMs, windowEndMs]);

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
      rockAbundance: 15,
      thermalInertia: 60,
      volatileIceScore: lat < -80 ? 75 : 10,
      isPsrColdTrap: false,
    };

    if (mapTarget === 'A') setSiteA(customSite);
    else setSiteB(customSite);
    setShowMapPickerModal(false);
  };

  return (
    <div className="w-screen h-screen overflow-hidden bg-space-950 text-slate-100 flex flex-col select-none">
      {/* NASA Mission Operations Header */}
      <NasaHeader
        uiMode={uiMode}
        onSetUIMode={setUIMode}
        viewMode={viewMode}
        onSetViewMode={setViewMode}
        scientificLayer={scientificLayer}
        onSetScientificLayer={setScientificLayer}
        startDateIso={startDateIso}
        onSetStartDate={setStartDateIso}
        windowDays={windowDays}
        onSetWindowDays={setWindowDays}
        onOpenLearnTour={() => setShowLearnTourModal(true)}
        onShareUrl={handleShareUrl}
      />

      {/* Main Mission Operations Center (Full Viewport with 3D Center & Side Panels) */}
      <div className="flex-1 w-full flex overflow-hidden relative">
        {/* Left Side Control Panel (Collapsible) */}
        <LeftControlPanel
          siteA={siteA}
          siteB={siteB}
          onSelectSiteA={setSiteA}
          onSelectSiteB={setSiteB}
          allSites={LUNAR_SITES}
          isSiteALit={currentPointA.sun.isVisible}
          isSiteBLit={currentPointB.sun.isVisible}
          scientificLayer={scientificLayer}
          onSetScientificLayer={setScientificLayer}
          onOpenMapPicker={() => {
            setMapTarget('A');
            setShowMapPickerModal(true);
          }}
        />

        {/* Central 3D Lunar Viewport (ALWAYS FOCUSED ON THE 3D MOON IN CESIUM) */}
        <div className="flex-1 h-full relative">
          <CesiumLunarViewport
            viewMode={viewMode}
            scientificLayer={scientificLayer}
            siteA={siteA}
            siteB={siteB}
            currentPointA={currentPointA}
            currentPointB={currentPointB}
            allPointsA={evaluationA.points}
            allPointsB={evaluationB.points}
            sunVec={currentBodyVecs.sun}
            earthVec={currentBodyVecs.earth}
            currentTimeMs={currentScrubMs}
          />
        </div>

        {/* Right Side Telemetry & Feasibility Panel (Collapsible) */}
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
          onOpenSlipTable={() => setShowSlipModal(true)}
          onOpenAlternatives={() => setShowAlternativesModal(true)}
          onOpenExport={() => setShowExportModal(true)}
        />
      </div>

      {/* Unified NASA Bottom Dock (Fluid Scrubber + UTC Input + Mini Gantt Tracks) */}
      <NasaTimelineScrubber
        currentScrubMs={currentScrubMs}
        windowStartMs={windowStartMs}
        windowEndMs={windowEndMs}
        isPlaying={isPlaying}
        playbackSpeed={playbackSpeed}
        sunIntervalsA={evaluationA.sunIntervals}
        earthIntervalsA={evaluationA.earthIntervals}
        bothUpIntervalsA={evaluationA.bothUpIntervals}
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
      />

      {/* Modals */}
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
    </div>
  );
};

export default App;
