import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  AppMode,
  EphemerisPoint,
  HorizonMask,
  ScenarioConfig,
  ScenarioEvaluation,
  Site,
  SlipCase,
} from './types';
import { LUNAR_SITES } from './data/sites';
import { PRECOMPUTED_HORIZONS, generateCustomHorizon } from './data/horizons';
import { evaluateScenario } from './engine/series';
import { evaluateVisibilityAtInstant } from './engine/visibility';
import { bodyVectors } from './engine/moon';
import { createLocalFrame } from './engine/local';
import { computeSlipAnalysis } from './engine/slip';
import { findAlternativeScenarios, AlternativeCandidate } from './engine/alternatives';
import { Header } from './ui/Header';
import { ScenarioCard } from './ui/ScenarioCard';
import { ScrubberBar } from './ui/ScrubberBar';
import { SlipTable } from './ui/SlipTable';
import { AlternativesModal } from './ui/AlternativesModal';
import { MapPicker2D } from './ui/MapPicker2D';
import { LearnTourModal } from './ui/LearnTourModal';
import { ExportModal } from './ui/ExportModal';
import { ComparisonSummary } from './ui/ComparisonSummary';
import { X } from 'lucide-react';

const INITIAL_SCENARIOS: ScenarioConfig[] = [
  {
    id: 'sc-1',
    name: 'Scenario A: Shackleton Rim',
    siteId: 'shackleton-rim',
    customLat: -89.78,
    customLon: 129.5,
    customElevKm: 1.2,
    customName: 'Shackleton Rim (Connecting Ridge)',
    useTerrain: true,
  },
  {
    id: 'sc-2',
    name: 'Scenario B: Malapert Mountain',
    siteId: 'malapert-mountain',
    customLat: -84.9,
    customLon: 12.9,
    customElevKm: 5.0,
    customName: 'Malapert Mountain (CLPS IM-2)',
    useTerrain: true,
  },
];

export const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>('planner');
  const [startDateIso, setStartDateIso] = useState('2026-11-20');
  const [windowDays, setWindowDays] = useState(28);

  // Time boundaries
  const windowStartMs = useMemo(() => {
    return new Date(`${startDateIso}T00:00:00Z`).getTime();
  }, [startDateIso]);

  const windowEndMs = useMemo(() => {
    return windowStartMs + windowDays * 24 * 3600 * 1000;
  }, [windowStartMs, windowDays]);

  const [currentScrubMs, setCurrentScrubMs] = useState(windowStartMs);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(60); // 60x real-time

  const [scenarios, setScenarios] = useState<ScenarioConfig[]>(INITIAL_SCENARIOS);

  // Modals state
  const [showSlipModal, setShowSlipModal] = useState(false);
  const [showAlternativesModal, setShowAlternativesModal] = useState(false);
  const [showMapPickerModal, setShowMapPickerModal] = useState(false);
  const [mapTargetScenarioId, setMapTargetScenarioId] = useState<string>('sc-1');
  const [showLearnTourModal, setShowLearnTourModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportScenarioId, setExportScenarioId] = useState<string>('sc-1');

  // Reset scrub time when window boundaries change
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
        const s1 = params.get('s1');
        const s2 = params.get('s2');
        const m = params.get('mode');

        if (epoch) setStartDateIso(epoch);
        if (days) setWindowDays(Number(days));
        if (m === 'planner' || m === 'explorer' || m === 'learn') setMode(m);

        if (s1) {
          const newScenarios: ScenarioConfig[] = [
            {
              id: 'sc-1',
              name: 'Scenario A',
              siteId: s1,
              customLat: -89.78,
              customLon: 129.5,
              customElevKm: 1.2,
              customName: s1,
              useTerrain: true,
            },
          ];
          if (s2) {
            newScenarios.push({
              id: 'sc-2',
              name: 'Scenario B',
              siteId: s2,
              customLat: -84.9,
              customLon: 12.9,
              customElevKm: 5.0,
              customName: s2,
              useTerrain: true,
            });
          }
          setScenarios(newScenarios);
        }
      }
    } catch {
      // Ignore hash parse errors
    }
  }, []);

  // Update URL Hash on share
  const handleShareUrl = () => {
    const params = new URLSearchParams();
    params.set('epoch', startDateIso);
    params.set('days', windowDays.toString());
    params.set('mode', mode);
    scenarios.forEach((sc, idx) => {
      params.set(`s${idx + 1}`, sc.siteId);
    });
    const url = `${window.location.origin}${window.location.pathname}#${params.toString()}`;
    navigator.clipboard.writeText(url);
  };

  // Resolve Horizon Mask for each scenario
  const getScenarioMask = (sc: ScenarioConfig): HorizonMask | null => {
    if (sc.siteId === 'custom') {
      return generateCustomHorizon(sc.customLat, sc.customLon, sc.customElevKm);
    }
    const pre = PRECOMPUTED_HORIZONS[sc.siteId];
    if (pre) return pre;
    const site = LUNAR_SITES.find((s) => s.id === sc.siteId);
    if (site) {
      return generateCustomHorizon(site.lat, site.lon, site.elevKm);
    }
    return null;
  };

  // Evaluate all scenarios across window
  const evaluations = useMemo(() => {
    const map: Record<string, ScenarioEvaluation> = {};

    for (const sc of scenarios) {
      const site = LUNAR_SITES.find((s) => s.id === sc.siteId);
      const lat = sc.siteId === 'custom' ? sc.customLat : (site?.lat ?? 0);
      const lon = sc.siteId === 'custom' ? sc.customLon : (site?.lon ?? 0);
      const elev = sc.siteId === 'custom' ? sc.customElevKm : (site?.elevKm ?? 0);
      const mask = getScenarioMask(sc);

      map[sc.id] = evaluateScenario(
        sc,
        lat,
        lon,
        elev,
        mask,
        windowStartMs,
        windowEndMs,
        currentScrubMs,
        30 * 60 * 1000 // 30 min step
      );
    }

    return map;
  }, [scenarios, windowStartMs, windowEndMs]);

  // Compute live real-time point for each scenario at exact currentScrubMs (60 fps smooth)
  const currentPoints = useMemo(() => {
    const map: Record<string, EphemerisPoint> = {};
    const { sun, earth } = bodyVectors(currentScrubMs);

    for (const sc of scenarios) {
      const site = LUNAR_SITES.find((s) => s.id === sc.siteId);
      const lat = sc.siteId === 'custom' ? sc.customLat : (site?.lat ?? 0);
      const lon = sc.siteId === 'custom' ? sc.customLon : (site?.lon ?? 0);
      const elev = sc.siteId === 'custom' ? sc.customElevKm : (site?.elevKm ?? 0);
      const mask = sc.useTerrain ? getScenarioMask(sc) : null;

      const frame = createLocalFrame(lat, lon, elev);
      const vis = evaluateVisibilityAtInstant(sun, earth, frame, mask, elev);

      map[sc.id] = {
        timeMs: currentScrubMs,
        dateIso: new Date(currentScrubMs).toISOString(),
        sun: vis.sun,
        earth: vis.earth,
        isBothUp: vis.isBothUp,
        horizontalPowerFlux: vis.horizontalPowerFlux,
        trackingPowerFlux: vis.trackingPowerFlux,
      };
    }

    return map;
  }, [scenarios, currentScrubMs]);

  // Animation Playback Loop
  const lastTickRef = useRef<number>(performance.now());
  useEffect(() => {
    if (!isPlaying) return;

    let animId: number;
    lastTickRef.current = performance.now();

    const loop = (now: number) => {
      const dtSec = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;

      setCurrentScrubMs((prev) => {
        // Step forward in simulation time: dtSec * playbackSpeed * 1000 ms
        const next = prev + dtSec * playbackSpeed * 60 * 1000;
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

  // Scenario operations
  const handleUpdateScenario = (id: string, updated: Partial<ScenarioConfig>) => {
    setScenarios((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const newObj = { ...s, ...updated };
        if (updated.siteId && updated.siteId !== 'custom') {
          const site = LUNAR_SITES.find((si) => si.id === updated.siteId);
          if (site) {
            newObj.customLat = site.lat;
            newObj.customLon = site.lon;
            newObj.customElevKm = site.elevKm;
            newObj.customName = site.name;
          }
        }
        return newObj;
      })
    );
  };

  const handleDuplicateScenario = (sc: ScenarioConfig) => {
    if (scenarios.length >= 4) return;
    const nextLetter = String.fromCharCode(65 + scenarios.length);
    const newId = `sc-${Date.now()}`;
    const clone: ScenarioConfig = {
      ...sc,
      id: newId,
      name: `Scenario ${nextLetter}: Copy of ${sc.name.split(':')[1] || sc.name}`,
    };
    setScenarios((prev) => [...prev, clone]);
  };

  const handleRemoveScenario = (id: string) => {
    if (scenarios.length <= 1) return;
    setScenarios((prev) => prev.filter((s) => s.id !== id));
  };

  const handleAddScenario = () => {
    if (scenarios.length >= 4) return;
    const nextLetter = String.fromCharCode(65 + scenarios.length);
    const newId = `sc-${Date.now()}`;
    const availableSites = LUNAR_SITES.filter(
      (s) => !scenarios.some((sc) => sc.siteId === s.id)
    );
    const defaultSite = availableSites[0] || LUNAR_SITES[0];

    const newSc: ScenarioConfig = {
      id: newId,
      name: `Scenario ${nextLetter}: ${defaultSite.name.split('(')[0].trim()}`,
      siteId: defaultSite.id,
      customLat: defaultSite.lat,
      customLon: defaultSite.lon,
      customElevKm: defaultSite.elevKm,
      customName: defaultSite.name,
      useTerrain: true,
    };
    setScenarios((prev) => [...prev, newSc]);
  };

  // Slip analysis computation for Scenario 1
  const slipCases = useMemo(() => {
    if (!showSlipModal) return [];
    const sc1 = scenarios[0];
    const site = LUNAR_SITES.find((s) => s.id === sc1.siteId);
    const lat = sc1.siteId === 'custom' ? sc1.customLat : (site?.lat ?? 0);
    const lon = sc1.siteId === 'custom' ? sc1.customLon : (site?.lon ?? 0);
    const elev = sc1.siteId === 'custom' ? sc1.customElevKm : (site?.elevKm ?? 0);
    const mask = getScenarioMask(sc1);

    return computeSlipAnalysis(
      sc1,
      lat,
      lon,
      elev,
      mask,
      windowStartMs,
      windowEndMs
    );
  }, [showSlipModal, scenarios, windowStartMs, windowEndMs]);

  // Alternatives search for Scenario 1
  const alternativeCandidates = useMemo(() => {
    if (!showAlternativesModal) return [];
    const sc1 = scenarios[0];
    const site = LUNAR_SITES.find((s) => s.id === sc1.siteId) || LUNAR_SITES[0];
    const mask = getScenarioMask(sc1);

    return findAlternativeScenarios(
      sc1,
      site,
      LUNAR_SITES,
      windowStartMs,
      windowEndMs - windowStartMs,
      mask
    );
  }, [showAlternativesModal, scenarios, windowStartMs, windowEndMs]);

  const handleApplyAlternative = (cand: AlternativeCandidate) => {
    setShowAlternativesModal(false);
    if (cand.type === 'date_shift') {
      setStartDateIso(cand.startDateIso);
    } else {
      const matchSite = LUNAR_SITES.find((s) => s.name === cand.siteName);
      if (matchSite) {
        handleUpdateScenario(scenarios[0].id, {
          siteId: matchSite.id,
          name: `Scenario A: ${matchSite.name}`,
        });
      }
    }
  };

  const handleApplyMapCoordinates = (lat: number, lon: number, name: string) => {
    handleUpdateScenario(mapTargetScenarioId, {
      siteId: 'custom',
      customLat: lat,
      customLon: lon,
      customName: name,
      name: `${scenarios.find((s) => s.id === mapTargetScenarioId)?.name.split(':')[0] || 'Scenario'}: ${name}`,
    });
    setShowMapPickerModal(false);
  };

  return (
    <div className="min-h-screen bg-space-950 text-slate-100 flex flex-col pb-28">
      {/* Header */}
      <Header
        mode={mode}
        onSetMode={setMode}
        startDateIso={startDateIso}
        onSetStartDate={setStartDateIso}
        windowDays={windowDays}
        onSetWindowDays={setWindowDays}
        onAddScenario={handleAddScenario}
        canAddScenario={scenarios.length < 4}
        onOpenSlipTable={() => setShowSlipModal(true)}
        onOpenAlternatives={() => setShowAlternativesModal(true)}
        onOpenMapPicker={() => {
          setMapTargetScenarioId(scenarios[0].id);
          setShowMapPickerModal(true);
        }}
        onOpenLearnTour={() => setShowLearnTourModal(true)}
        onOpenExport={() => {
          setExportScenarioId(scenarios[0].id);
          setShowExportModal(true);
        }}
        onShareUrl={handleShareUrl}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto w-full px-4 pt-6 flex flex-col gap-6 flex-1">
        {/* Scenarios Grid: Responsive side-by-side comparison */}
        <div
          className={`grid gap-6 ${
            scenarios.length === 1
              ? 'grid-cols-1'
              : scenarios.length === 2
              ? 'grid-cols-1 lg:grid-cols-2'
              : 'grid-cols-1 lg:grid-cols-2'
          }`}
        >
          {scenarios.map((sc) => {
            const ev = evaluations[sc.id];
            const cp = currentPoints[sc.id];
            if (!ev || !cp) return null;

            return (
              <ScenarioCard
                key={sc.id}
                scenario={sc}
                evaluation={ev}
                currentPoint={cp}
                sites={LUNAR_SITES}
                currentScrubMs={currentScrubMs}
                windowStartMs={windowStartMs}
                windowEndMs={windowEndMs}
                mode={mode}
                onUpdateScenario={(upd) => handleUpdateScenario(sc.id, upd)}
                onDuplicateScenario={() => handleDuplicateScenario(sc)}
                onRemoveScenario={() => handleRemoveScenario(sc.id)}
                onScrub={setCurrentScrubMs}
                canRemove={scenarios.length > 1}
              />
            );
          })}
        </div>

        {/* Side-by-Side Scenario Decision Summary Matrix */}
        {scenarios.length > 1 && (
          <ComparisonSummary scenarios={scenarios} evaluations={evaluations} />
        )}
      </main>

      {/* Persistent Bottom Scrubber Bar */}
      <ScrubberBar
        currentScrubMs={currentScrubMs}
        windowStartMs={windowStartMs}
        windowEndMs={windowEndMs}
        isPlaying={isPlaying}
        playbackSpeed={playbackSpeed}
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
          slipCases={slipCases}
          scenarioName={scenarios[0].name}
          onClose={() => setShowSlipModal(false)}
        />
      )}

      {showAlternativesModal && (
        <AlternativesModal
          candidates={alternativeCandidates}
          currentScenarioName={scenarios[0].name}
          onApplyAlternative={handleApplyAlternative}
          onClose={() => setShowAlternativesModal(false)}
        />
      )}

      {showMapPickerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-2xl rounded-2xl border border-slate-700 bg-space-900 shadow-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h2 className="text-base font-bold text-slate-100 uppercase tracking-wide">
                Lunar Map Landing Site Picker
              </h2>
              <button
                onClick={() => setShowMapPickerModal(false)}
                className="p-1.5 rounded-lg bg-space-850 hover:bg-space-700 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <MapPicker2D
              selectedSiteId={scenarios.find((s) => s.id === mapTargetScenarioId)?.siteId ?? ''}
              currentLat={
                scenarios.find((s) => s.id === mapTargetScenarioId)?.customLat ?? -89.78
              }
              currentLon={
                scenarios.find((s) => s.id === mapTargetScenarioId)?.customLon ?? 129.5
              }
              onSelectSite={(site) => {
                handleUpdateScenario(mapTargetScenarioId, {
                  siteId: site.id,
                  name: `${scenarios.find((s) => s.id === mapTargetScenarioId)?.name.split(':')[0] || 'Scenario'}: ${site.name}`,
                });
                setShowMapPickerModal(false);
              }}
              onSelectCoordinates={handleApplyMapCoordinates}
              sites={LUNAR_SITES}
            />
          </div>
        </div>
      )}

      {showLearnTourModal && (
        <LearnTourModal onClose={() => setShowLearnTourModal(false)} />
      )}

      {showExportModal && (
        <ExportModal
          scenario={scenarios.find((s) => s.id === exportScenarioId) || scenarios[0]}
          evaluation={evaluations[exportScenarioId] || evaluations[scenarios[0].id]}
          site={LUNAR_SITES.find(
            (s) => s.id === (scenarios.find((sc) => sc.id === exportScenarioId)?.siteId)
          )}
          onClose={() => setShowExportModal(false)}
        />
      )}
    </div>
  );
};

export default App;
