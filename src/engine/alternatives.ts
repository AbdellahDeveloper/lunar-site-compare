import { Site, ScenarioConfig, HorizonMask, ScenarioMetrics, Verdict } from '../types';
import { evaluateScenario } from './series';

export interface AlternativeCandidate {
  type: 'date_shift' | 'nearby_site';
  label: string;
  startDateIso: string;
  siteName: string;
  lat: number;
  lon: number;
  elevKm: number;
  metrics: ScenarioMetrics;
  verdict: Verdict;
  score: number; // 0 to 100
  deltaBothUpHours: number;
  recommendation: string;
}

/**
 * Searches alternative launch dates and alternative landing sites to find
 * the optimal mission feasibility window.
 */
export function findAlternativeScenarios(
  targetScenario: ScenarioConfig,
  currentSite: Site,
  allSites: Site[],
  windowStartMs: number,
  windowDurationMs: number,
  mask: HorizonMask | null
): AlternativeCandidate[] {
  const candidates: AlternativeCandidate[] = [];

  // Evaluate baseline
  const baseline = evaluateScenario(
    targetScenario,
    currentSite.lat,
    currentSite.lon,
    currentSite.elevKm,
    mask,
    windowStartMs,
    windowStartMs + windowDurationMs,
    windowStartMs,
    60 * 60 * 1000
  );

  const baseBothUp = baseline.metrics.bothUpHours;

  // 1. Date shifts: -14d to +14d in 2-day steps
  const dayOffsets = [-14, -10, -7, -4, -2, 2, 4, 7, 10, 14, 29.5];
  for (const days of dayOffsets) {
    const startMs = windowStartMs + days * 86400 * 1000;
    const endMs = startMs + windowDurationMs;

    const res = evaluateScenario(
      targetScenario,
      currentSite.lat,
      currentSite.lon,
      currentSite.elevKm,
      mask,
      startMs,
      endMs,
      startMs,
      60 * 60 * 1000
    );

    // Score based on both-up percentage (40%), sunlight % (35%), Earth comm % (25%)
    const score = Math.min(
      100,
      Math.round(
        res.metrics.bothUpPercent * 0.4 +
          res.metrics.sunlightPercent * 0.35 +
          res.metrics.earthVisPercent * 0.25
      )
    );

    const deltaBothUp = res.metrics.bothUpHours - baseBothUp;

    let rec = 'Comparable to baseline';
    if (deltaBothUp > 20) rec = `Strong upgrade: +${deltaBothUp.toFixed(1)}h combined power & comms`;
    else if (deltaBothUp < -20) rec = `Degraded: ${deltaBothUp.toFixed(1)}h less power & comms`;

    candidates.push({
      type: 'date_shift',
      label: `${days > 0 ? '+' : ''}${days}d Date Shift`,
      startDateIso: new Date(startMs).toISOString().split('T')[0],
      siteName: currentSite.name,
      lat: currentSite.lat,
      lon: currentSite.lon,
      elevKm: currentSite.elevKm,
      metrics: res.metrics,
      verdict: res.verdict,
      score,
      deltaBothUpHours: deltaBothUp,
      recommendation: rec,
    });
  }

  // 2. Alternative sites in same region (South Pole)
  const polarSites = allSites.filter(
    (s) => s.id !== currentSite.id && s.region === currentSite.region
  );

  for (const altSite of polarSites) {
    const res = evaluateScenario(
      { ...targetScenario, siteId: altSite.id },
      altSite.lat,
      altSite.lon,
      altSite.elevKm,
      null, // standard horizon for comparison unless custom
      windowStartMs,
      windowStartMs + windowDurationMs,
      windowStartMs,
      60 * 60 * 1000
    );

    const score = Math.min(
      100,
      Math.round(
        res.metrics.bothUpPercent * 0.4 +
          res.metrics.sunlightPercent * 0.35 +
          res.metrics.earthVisPercent * 0.25
      )
    );

    const deltaBothUp = res.metrics.bothUpHours - baseBothUp;

    let rec = `${altSite.name} provides ${res.metrics.sunlightPercent.toFixed(0)}% sun and ${res.metrics.earthVisPercent.toFixed(0)}% Earth contact`;
    if (deltaBothUp > 15) rec = `Recommended alternative: +${deltaBothUp.toFixed(1)}h both-up operations`;

    candidates.push({
      type: 'nearby_site',
      label: `Site: ${altSite.name}`,
      startDateIso: new Date(windowStartMs).toISOString().split('T')[0],
      siteName: altSite.name,
      lat: altSite.lat,
      lon: altSite.lon,
      elevKm: altSite.elevKm,
      metrics: res.metrics,
      verdict: res.verdict,
      score,
      deltaBothUpHours: deltaBothUp,
      recommendation: rec,
    });
  }

  // Sort descending by score
  candidates.sort((a, b) => b.score - a.score);
  return candidates;
}

