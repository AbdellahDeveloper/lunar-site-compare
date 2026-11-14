import { EphemerisPoint, ScenarioMetrics, TimeInterval } from '../types';
import { complementIntervals, intersectIntervals } from './events';

export function computeScenarioMetrics(
  points: EphemerisPoint[],
  sunIntervals: TimeInterval[],
  earthIntervals: TimeInterval[],
  windowStartMs: number,
  windowEndMs: number,
  currentScrubMs: number
): ScenarioMetrics {
  const windowHours = (windowEndMs - windowStartMs) / (3600 * 1000);

  // Sunlight metrics
  const sunlightHours = sunIntervals.reduce((acc, inv) => acc + inv.durationHours, 0);
  const sunlightPercent = windowHours > 0 ? (sunlightHours / windowHours) * 100 : 0;
  const longestLightHours = sunIntervals.reduce((max, inv) => Math.max(max, inv.durationHours), 0);

  const darkIntervals = complementIntervals(sunIntervals, windowStartMs, windowEndMs);
  const longestDarkHours = darkIntervals.reduce((max, inv) => Math.max(max, inv.durationHours), 0);

  // Earth metrics
  const earthVisHours = earthIntervals.reduce((acc, inv) => acc + inv.durationHours, 0);
  const earthVisPercent = windowHours > 0 ? (earthVisHours / windowHours) * 100 : 0;
  const longestEarthWindowHours = earthIntervals.reduce((max, inv) => Math.max(max, inv.durationHours), 0);

  const earthOutageIntervals = complementIntervals(earthIntervals, windowStartMs, windowEndMs);
  const longestEarthOutageHours = earthOutageIntervals.reduce((max, inv) => Math.max(max, inv.durationHours), 0);

  // Both-Up metrics
  const bothUpIntervals = intersectIntervals(sunIntervals, earthIntervals);
  const bothUpHours = bothUpIntervals.reduce((acc, inv) => acc + inv.durationHours, 0);
  const bothUpPercent = windowHours > 0 ? (bothUpHours / windowHours) * 100 : 0;
  const longestBothUpHours = bothUpIntervals.reduce((max, inv) => Math.max(max, inv.durationHours), 0);

  // Event counts (transitions)
  // Number of sunsets = count of sun intervals that end with openEnd = false
  const sunsetCount = sunIntervals.filter((i) => !i.openEnd).length;
  const sunriseCount = sunIntervals.filter((i) => !i.openStart).length;
  const earthsetCount = earthIntervals.filter((i) => !i.openEnd).length;
  const earthriseCount = earthIntervals.filter((i) => !i.openStart).length;

  // Power and elevation statistics from samples
  let sumPowerH = 0;
  let sumPowerT = 0;
  let peakSunElevation = -999;
  let minSunElevation = 999;
  let sumSunElWhenUp = 0;
  let countSunUp = 0;

  let peakEarthElevation = -999;
  let minEarthElevation = 999;

  for (const pt of points) {
    sumPowerH += pt.horizontalPowerFlux;
    sumPowerT += pt.trackingPowerFlux;

    if (pt.sun.elevationDeg > peakSunElevation) peakSunElevation = pt.sun.elevationDeg;
    if (pt.sun.elevationDeg < minSunElevation) minSunElevation = pt.sun.elevationDeg;

    if (pt.sun.isVisible) {
      sumSunElWhenUp += pt.sun.elevationDeg;
      countSunUp++;
    }

    if (pt.earth.elevationDeg > peakEarthElevation) peakEarthElevation = pt.earth.elevationDeg;
    if (pt.earth.elevationDeg < minEarthElevation) minEarthElevation = pt.earth.elevationDeg;
  }

  const pointCount = points.length || 1;
  const avgPowerHorizontal = sumPowerH / pointCount;
  const avgPowerTracking = sumPowerT / pointCount;
  const meanSunElevationWhenUp = countSunUp > 0 ? sumSunElWhenUp / countSunUp : 0;

  // Real-time countdowns relative to currentScrubMs
  let currentSunStatus: 'up' | 'down' = 'down';
  let timeToNextSunsetMs: number | null = null;
  let timeToNextSunriseMs: number | null = null;

  for (const inv of sunIntervals) {
    if (currentScrubMs >= inv.startMs && currentScrubMs < inv.endMs) {
      currentSunStatus = 'up';
      timeToNextSunsetMs = inv.endMs - currentScrubMs;
      break;
    }
  }

  if (currentSunStatus === 'down') {
    // Find next sunrise after currentScrubMs
    for (const inv of sunIntervals) {
      if (inv.startMs > currentScrubMs) {
        timeToNextSunriseMs = inv.startMs - currentScrubMs;
        break;
      }
    }
  }

  let currentEarthStatus: 'up' | 'down' = 'down';
  let timeToNextEarthsetMs: number | null = null;
  let timeToNextEarthriseMs: number | null = null;

  for (const inv of earthIntervals) {
    if (currentScrubMs >= inv.startMs && currentScrubMs < inv.endMs) {
      currentEarthStatus = 'up';
      timeToNextEarthsetMs = inv.endMs - currentScrubMs;
      break;
    }
  }

  if (currentEarthStatus === 'down') {
    for (const inv of earthIntervals) {
      if (inv.startMs > currentScrubMs) {
        timeToNextEarthriseMs = inv.startMs - currentScrubMs;
        break;
      }
    }
  }

  return {
    windowHours,
    sunlightHours,
    sunlightPercent,
    longestLightHours,
    longestDarkHours,
    sunsetCount,
    sunriseCount,
    earthVisHours,
    earthVisPercent,
    longestEarthWindowHours,
    longestEarthOutageHours,
    earthsetCount,
    earthriseCount,
    bothUpHours,
    bothUpPercent,
    longestBothUpHours,
    avgPowerHorizontal,
    avgPowerTracking,
    peakSunElevation: peakSunElevation === -999 ? 0 : peakSunElevation,
    minSunElevation: minSunElevation === 999 ? 0 : minSunElevation,
    meanSunElevationWhenUp,
    peakEarthElevation: peakEarthElevation === -999 ? 0 : peakEarthElevation,
    minEarthElevation: minEarthElevation === 999 ? 0 : minEarthElevation,
    currentSunStatus,
    currentEarthStatus,
    timeToNextSunsetMs,
    timeToNextSunriseMs,
    timeToNextEarthsetMs,
    timeToNextEarthriseMs,
  };
}

