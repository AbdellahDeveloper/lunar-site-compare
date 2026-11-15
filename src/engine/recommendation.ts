import { MissionCriteriaWeights, Site, SiteScoreResult } from '../types';

export const DEFAULT_MISSION_WEIGHTS: MissionCriteriaWeights = {
  solar: 0.25,             // Sunlight duration & continuity
  earth: 0.25,             // Direct-to-Earth link duration
  jointBothUp: 0.20,       // Simultaneous Power + Comm overlap
  landingSlope: 0.15,      // Slope safety (< 5° goal, < 8° limit)
  terrainConfidence: 0.05, // LOLA data coverage & elevation certainty
  psrAccessibility: 0.10,  // Proximity to Permanently Shadowed Region (< 2 km)
};

export const MISSION_PRESET_PROFILES: Record<string, { name: string; description: string; weights: MissionCriteriaWeights }> = {
  balanced: {
    name: 'Standard Artemis HLS Profile',
    description: 'Balanced weights across solar power, direct Earth communications, and crew traverse safety.',
    weights: { ...DEFAULT_MISSION_WEIGHTS },
  },
  solarPriority: {
    name: 'Solar-Powered Science Platform',
    description: 'Prioritizes maximum continuous daylight and solar flux for stationary landers with minimal battery mass.',
    weights: {
      solar: 0.45,
      earth: 0.15,
      jointBothUp: 0.15,
      landingSlope: 0.15,
      terrainConfidence: 0.05,
      psrAccessibility: 0.05,
    },
  },
  commPriority: {
    name: 'Continuous Direct-to-Earth (DTE)',
    description: 'Demands uninterrupted high-bandwidth link to Earth without relay satellites for video and live teleoperation.',
    weights: {
      solar: 0.20,
      earth: 0.45,
      jointBothUp: 0.15,
      landingSlope: 0.10,
      terrainConfidence: 0.05,
      psrAccessibility: 0.05,
    },
  },
  psrProspector: {
    name: 'Volatile & Ice Prospecting Rover',
    description: 'Focuses on landing close (< 1 km) to volatile-rich Permanently Shadowed Regions while maintaining safe slopes.',
    weights: {
      solar: 0.15,
      earth: 0.15,
      jointBothUp: 0.15,
      landingSlope: 0.20,
      terrainConfidence: 0.05,
      psrAccessibility: 0.30,
    },
  },
};

/**
 * Normalizes user weights so their sum equals 1.0.
 */
function normalizeWeights(weights: MissionCriteriaWeights): MissionCriteriaWeights {
  const sum =
    weights.solar +
    weights.earth +
    weights.jointBothUp +
    weights.landingSlope +
    weights.terrainConfidence +
    weights.psrAccessibility;
  if (sum <= 0) return { ...DEFAULT_MISSION_WEIGHTS };
  return {
    solar: weights.solar / sum,
    earth: weights.earth / sum,
    jointBothUp: weights.jointBothUp / sum,
    landingSlope: weights.landingSlope / sum,
    terrainConfidence: weights.terrainConfidence / sum,
    psrAccessibility: weights.psrAccessibility / sum,
  };
}

/**
 * Computes individual criteria scores (0 to 100) and weighted composite score S.
 * S = w1*P + w2*E + w3*O + w4*L + w5*C + w6*R
 */
export function scoreSite(
  site: Site,
  sunPercent: number,
  earthPercent: number,
  bothUpHours: number,
  windowHours: number,
  weights: MissionCriteriaWeights
): SiteScoreResult {
  const nw = normalizeWeights(weights);

  // 1. Solar Opportunity Score (P): 0 - 100
  const solarScore = Math.min(100, Math.max(0, sunPercent));

  // 2. Earth Visibility Score (E): 0 - 100
  const earthScore = Math.min(100, Math.max(0, earthPercent));

  // 3. Simultaneous Availability Score (O): 0 - 100
  const bothUpPercent = windowHours > 0 ? (bothUpHours / windowHours) * 100 : 0;
  const jointScore = Math.min(100, Math.max(0, bothUpPercent));

  // 4. Landing Slope Score (L): 0 - 100
  // Slope < 5°: 100 points
  // Slope 5° to 8°: linear degradation 100 -> 50
  // Slope 8° to 12°: 50 -> 0
  // Slope > 12°: 0 points
  let slopeScore = 0;
  if (site.slopeDeg <= 5.0) {
    slopeScore = 100 - (site.slopeDeg / 5.0) * 10; // 100 down to 90
  } else if (site.slopeDeg <= 8.0) {
    slopeScore = 90 - ((site.slopeDeg - 5.0) / 3.0) * 40; // 90 down to 50
  } else if (site.slopeDeg <= 12.0) {
    slopeScore = 50 - ((site.slopeDeg - 8.0) / 4.0) * 50; // 50 down to 0
  } else {
    slopeScore = 0;
  }
  // Buffer deduction if < 100m from steep terrain
  if (site.distanceToSteepTerrainM < 100) {
    slopeScore = Math.max(0, slopeScore * 0.6);
  }

  // 5. Terrain Confidence Score (C): 0 - 100
  let confidenceScore = 60;
  if (site.terrainConfidence === 'high') confidenceScore = 95;
  else if (site.terrainConfidence === 'moderate') confidenceScore = 70;
  else confidenceScore = 40;

  // 6. PSR Accessibility Score (R): 0 - 100
  // Distance <= 1.0 km: 100 -> 90
  // 1.0 - 2.0 km (walking limit): 90 -> 50
  // 2.0 - 5.0 km (rover required): 50 -> 10
  // > 5.0 km: 0
  let psrScore = 0;
  if (site.nearestPsrDistanceKm <= 1.0) {
    psrScore = 100 - site.nearestPsrDistanceKm * 10;
  } else if (site.nearestPsrDistanceKm <= 2.0) {
    psrScore = 90 - (site.nearestPsrDistanceKm - 1.0) * 40;
  } else if (site.nearestPsrDistanceKm <= 5.0) {
    psrScore = 50 - ((site.nearestPsrDistanceKm - 2.0) / 3.0) * 40;
  } else {
    psrScore = 5;
  }

  // Weighted composite score (0 to 100)
  const totalScore = Number(
    (
      nw.solar * solarScore +
      nw.earth * earthScore +
      nw.jointBothUp * jointScore +
      nw.landingSlope * slopeScore +
      nw.terrainConfidence * confidenceScore +
      nw.psrAccessibility * psrScore
    ).toFixed(1)
  );

  // Pareto status description
  let paretoStatus = 'Balanced Trade-off';
  if (solarScore >= 80 && earthScore < 40) {
    paretoStatus = 'High Solar / Comm Blackout Risk (Pareto Solar Front)';
  } else if (earthScore >= 90 && solarScore < 40) {
    paretoStatus = 'High Earth Link / Low Solar (Pareto Comm Front)';
  } else if (solarScore >= 75 && earthScore >= 75) {
    paretoStatus = 'Pareto Optimal (Dominant Dual Exposure)';
  } else if (slopeScore < 40) {
    paretoStatus = 'Constrained Terrain (Slope Hazard)';
  }

  return {
    site,
    totalScore,
    rank: 1,
    breakdown: {
      solarScore: Math.round(solarScore),
      earthScore: Math.round(earthScore),
      jointScore: Math.round(jointScore),
      slopeScore: Math.round(slopeScore),
      confidenceScore: Math.round(confidenceScore),
      psrScore: Math.round(psrScore),
    },
    paretoStatus,
  };
}

/**
 * Evaluates and ranks multiple sites under given criteria weights.
 */
export function rankSitesUnderCriteria(
  sitesWithMetrics: {
    site: Site;
    sunPercent: number;
    earthPercent: number;
    bothUpHours: number;
    windowHours: number;
  }[],
  weights: MissionCriteriaWeights
): SiteScoreResult[] {
  const scored = sitesWithMetrics.map((item) =>
    scoreSite(
      item.site,
      item.sunPercent,
      item.earthPercent,
      item.bothUpHours,
      item.windowHours,
      weights
    )
  );

  scored.sort((a, b) => b.totalScore - a.totalScore);
  return scored.map((item, idx) => ({
    ...item,
    rank: idx + 1,
  }));
}

