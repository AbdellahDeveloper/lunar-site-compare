import {
  EphemerisPoint,
  HorizonMask,
  ScenarioConfig,
  ScenarioEvaluation,
  ScenarioMetrics,
  TimeInterval,
  Vector3D,
  Verdict,
} from '../types';
import { LocalFrame, createLocalFrame } from './local';
import { bodyVectors } from './moon';
import { evaluateVisibilityAtInstant } from './visibility';
import { findBodyIntervals, intersectIntervals } from './events';
import { computeScenarioMetrics } from './metrics';
import { evaluateVerdict } from './verdict';

export interface CelestialCacheItem {
  key: string;
  times: number[];
  sunVecs: Vector3D[];
  earthVecs: Vector3D[];
}

const celestialCache = new Map<string, CelestialCacheItem>();

/**
 * Gets or computes body vectors (Sun and Earth in Moon-fixed coordinates)
 * for a sequence of timestamps across a window. Shared by all scenarios!
 */
export function getCachedCelestialVectors(
  startMs: number,
  endMs: number,
  stepMs: number = 30 * 60 * 1000
): CelestialCacheItem {
  const key = `${startMs}_${endMs}_${stepMs}`;
  const existing = celestialCache.get(key);
  if (existing) return existing;

  const times: number[] = [];
  const sunVecs: Vector3D[] = [];
  const earthVecs: Vector3D[] = [];

  for (let t = startMs; t <= endMs; t += stepMs) {
    const { sun, earth } = bodyVectors(t);
    times.push(t);
    sunVecs.push(sun);
    earthVecs.push(earth);
  }

  // Ensure endMs is included
  if (times[times.length - 1] < endMs) {
    const { sun, earth } = bodyVectors(endMs);
    times.push(endMs);
    sunVecs.push(sun);
    earthVecs.push(earth);
  }

  const item: CelestialCacheItem = { key, times, sunVecs, earthVecs };
  // Limit cache size
  if (celestialCache.size > 20) {
    const firstKey = celestialCache.keys().next().value;
    if (firstKey) celestialCache.delete(firstKey);
  }
  celestialCache.set(key, item);
  return item;
}

/**
 * Evaluates an entire scenario over the given time window:
 * 1. Reuses shared celestial body vectors
 * 2. Computes topocentric series & power flux
 * 3. Identifies precise rise/set intervals
 * 4. Calculates aggregate metrics & operational verdict
 */
export function evaluateScenario(
  scenario: ScenarioConfig,
  siteLat: number,
  siteLon: number,
  siteElevKm: number,
  mask: HorizonMask | null,
  windowStartMs: number,
  windowEndMs: number,
  currentScrubMs: number,
  stepMs: number = 30 * 60 * 1000 // 30 minutes
): ScenarioEvaluation {
  const frame = createLocalFrame(siteLat, siteLon, siteElevKm);
  const effectiveMask = scenario.useTerrain ? mask : null;

  // Retrieve cached celestial vectors
  const cached = getCachedCelestialVectors(windowStartMs, windowEndMs, stepMs);

  // Compute ephemeris points
  const points: EphemerisPoint[] = new Array(cached.times.length);

  for (let i = 0; i < cached.times.length; i++) {
    const t = cached.times[i];
    const sVec = cached.sunVecs[i];
    const eVec = cached.earthVecs[i];

    const vis = evaluateVisibilityAtInstant(sVec, eVec, frame, effectiveMask, siteElevKm);

    points[i] = {
      timeMs: t,
      dateIso: new Date(t).toISOString(),
      sun: vis.sun,
      earth: vis.earth,
      isBothUp: vis.isBothUp,
      horizontalPowerFlux: vis.horizontalPowerFlux,
      trackingPowerFlux: vis.trackingPowerFlux,
    };
  }

  // Refine exact sunrise/sunset & earthrise/earthset intervals
  const sunData = findBodyIntervals(windowStartMs, windowEndMs, 'sun', frame, effectiveMask, siteElevKm, stepMs);
  const earthData = findBodyIntervals(windowStartMs, windowEndMs, 'earth', frame, effectiveMask, siteElevKm, stepMs);

  const sunIntervals = sunData.intervals;
  const earthIntervals = earthData.intervals;
  const bothUpIntervals = intersectIntervals(sunIntervals, earthIntervals);

  // Aggregate metrics
  const metrics = computeScenarioMetrics(
    points,
    sunIntervals,
    earthIntervals,
    windowStartMs,
    windowEndMs,
    currentScrubMs
  );

  // Viability verdict
  const verdict = evaluateVerdict(metrics);

  return {
    points,
    sunIntervals,
    earthIntervals,
    bothUpIntervals,
    metrics,
    verdict,
    frame,
    horizonMaskUsed: effectiveMask,
  };
}
