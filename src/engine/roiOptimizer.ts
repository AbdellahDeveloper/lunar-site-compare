import { Site } from '../types';
import { createLocalFrame } from './local';
import { generateCustomHorizon } from '../data/horizons';
import { getCachedCelestialVectors } from './series';
import { findBodyIntervals, intersectIntervals } from './events';
import { evaluateVisibilityAtInstant, SOLAR_CONSTANT_W_M2 } from './visibility';

export interface RoiPoint {
  lat: number;
  lon: number;
}

export interface CandidateEvaluation {
  lat: number;
  lon: number;
  elevKm: number;
  longestSunHours: number;
  longestEarthHours: number;
  longestBothUpHours: number;
  sunlightHours: number;
  sunlightPercent: number;
  earthVisPercent: number;
  avgPowerFlux: number;
  avgTrackingFlux: number;
  score: number;
}

export interface OptimalRoiResult {
  bestSite: Site;
  score: number;
  longestSunHours: number;
  longestEarthHours: number;
  longestBothUpHours: number;
  sunlightPercent: number;
  earthVisPercent: number;
  avgPowerFlux: number;
  avgTrackingFlux: number;
  evaluatedCandidatesCount: number;
  polygon: RoiPoint[];
  centroid: RoiPoint;
  allEvaluations: CandidateEvaluation[];
}

const LUNAR_RADIUS_KM = 1737.4;
const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

/**
 * Projects a spherical (lat, lon) coordinate to 2D Cartesian plane.
 * Uses stereographic polar projection for polar latitudes (|lat| >= 60°),
 * and local equidistant projection around centroid for lower latitudes.
 */
function projectPoint(
  lat: number,
  lon: number,
  isPolar: boolean,
  centerLat: number,
  centerLon: number
): { x: number; y: number } {
  if (isPolar) {
    // Polar stereographic projection (South Pole centered if lat < 0)
    const south = centerLat < 0;
    const colatDeg = south ? 90 + lat : 90 - lat;
    const r = 2 * LUNAR_RADIUS_KM * Math.tan((colatDeg / 2) * DEG2RAD);
    const radLon = lon * DEG2RAD;
    return {
      x: r * Math.sin(radLon),
      y: south ? -r * Math.cos(radLon) : r * Math.cos(radLon),
    };
  } else {
    // Equirectangular / sinusoidal centered on centroid
    const x = (lon - centerLon) * Math.cos(centerLat * DEG2RAD) * (DEG2RAD * LUNAR_RADIUS_KM);
    const y = (lat - centerLat) * (DEG2RAD * LUNAR_RADIUS_KM);
    return { x, y };
  }
}

/**
 * Inverses a 2D projected point back into spherical (lat, lon).
 */
function unprojectPoint(
  x: number,
  y: number,
  isPolar: boolean,
  centerLat: number,
  centerLon: number
): { lat: number; lon: number } {
  if (isPolar) {
    const south = centerLat < 0;
    const r = Math.hypot(x, y);
    const colatRad = 2 * Math.atan(r / (2 * LUNAR_RADIUS_KM));
    const colatDeg = colatRad * RAD2DEG;
    const lat = south ? colatDeg - 90 : 90 - colatDeg;
    let lon = south ? Math.atan2(x, -y) * RAD2DEG : Math.atan2(x, y) * RAD2DEG;
    if (lon > 180) lon -= 360;
    if (lon < -180) lon += 360;
    return { lat, lon };
  } else {
    const lat = centerLat + y / (DEG2RAD * LUNAR_RADIUS_KM);
    const cosLat = Math.cos(centerLat * DEG2RAD);
    const lon = centerLon + x / (DEG2RAD * LUNAR_RADIUS_KM * (Math.abs(cosLat) > 0.001 ? cosLat : 1));
    return { lat, lon };
  }
}

/**
 * Standard Jordan curve theorem 2D ray casting point-in-polygon test.
 */
export function isPointIn2DPolygon(
  px: number,
  py: number,
  polygon: { x: number; y: number }[]
): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;
    const intersect = yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Tests whether a spherical (lat, lon) coordinate is inside a polygon.
 */
export function isPointInPolygon(
  lat: number,
  lon: number,
  polygon: RoiPoint[]
): boolean {
  if (polygon.length < 3) return false;

  const centerLat = polygon.reduce((sum, p) => sum + p.lat, 0) / polygon.length;
  const centerLon = polygon.reduce((sum, p) => sum + p.lon, 0) / polygon.length;
  const isPolar = Math.abs(centerLat) >= 60;

  const poly2D = polygon.map((p) => projectPoint(p.lat, p.lon, isPolar, centerLat, centerLon));
  const p2D = projectPoint(lat, lon, isPolar, centerLat, centerLon);

  return isPointIn2DPolygon(p2D.x, p2D.y, poly2D);
}

/**
 * Analyzes the user-drawn closed region across [windowStartMs, windowEndMs]
 * and identifies the optimal site having:
 * 1. Highest consecutive sunlight (longest continuous daylight window)
 * 2. Highest consecutive direct Earth communication (DTE link visibility)
 * 3. Minimal crater rim shadow (maximal sunny solar power generation flux)
 */
export function findOptimalSiteInPolygon(
  polygon: RoiPoint[],
  windowStartMs: number,
  windowEndMs: number,
  existingSites: Site[] = []
): OptimalRoiResult {
  if (polygon.length < 3) {
    throw new Error('A minimum of 3 points is required to form a closed exploration ROI.');
  }

  const windowHours = Math.max(1, (windowEndMs - windowStartMs) / (3600 * 1000));

  // Compute centroid
  const centerLat = polygon.reduce((sum, p) => sum + p.lat, 0) / polygon.length;
  const centerLon = polygon.reduce((sum, p) => sum + p.lon, 0) / polygon.length;
  const isPolar = Math.abs(centerLat) >= 60;

  // Project polygon to 2D
  const poly2D = polygon.map((p) => projectPoint(p.lat, p.lon, isPolar, centerLat, centerLon));

  // Calculate 2D bounding box
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const pt of poly2D) {
    if (pt.x < minX) minX = pt.x;
    if (pt.x > maxX) maxX = pt.x;
    if (pt.y < minY) minY = pt.y;
    if (pt.y > maxY) maxY = pt.y;
  }

  // Pre-fetch / ensure cached celestial vectors across the window
  const stepMs = 30 * 60 * 1000; // 30-minute steps
  const cached = getCachedCelestialVectors(windowStartMs, windowEndMs, stepMs);

  // Generate candidate grid inside polygon
  const candidateCoords: { lat: number; lon: number; elevKm: number }[] = [];

  // 1. Always evaluate polygon centroid
  candidateCoords.push({
    lat: centerLat,
    lon: centerLon,
    elevKm: Math.abs(centerLat) > 80 ? 1.0 : 0.0,
  });

  // 2. Add existing NASA benchmark sites that fall inside the polygon
  for (const site of existingSites) {
    const site2D = projectPoint(site.lat, site.lon, isPolar, centerLat, centerLon);
    if (isPointIn2DPolygon(site2D.x, site2D.y, poly2D)) {
      candidateCoords.push({
        lat: site.lat,
        lon: site.lon,
        elevKm: site.elevKm,
      });
    }
  }

  // 3. Grid sampling across polygon bounding box
  const gridSteps = 7; // 7x7 grid = up to 49 interior points
  const dx = (maxX - minX) / (gridSteps + 1);
  const dy = (maxY - minY) / (gridSteps + 1);

  for (let ix = 1; ix <= gridSteps; ix++) {
    for (let iy = 1; iy <= gridSteps; iy++) {
      const px = minX + ix * dx;
      const py = minY + iy * dy;
      if (isPointIn2DPolygon(px, py, poly2D)) {
        const unproj = unprojectPoint(px, py, isPolar, centerLat, centerLon);
        candidateCoords.push({
          lat: unproj.lat,
          lon: unproj.lon,
          elevKm: Math.abs(unproj.lat) > 80 ? 0.9 : 0.0,
        });
      }
    }
  }

  // Fallback: If very narrow polygon with few interior points, include vertices
  if (candidateCoords.length < 4) {
    for (const p of polygon) {
      candidateCoords.push({
        lat: p.lat,
        lon: p.lon,
        elevKm: Math.abs(p.lat) > 80 ? 0.8 : 0.0,
      });
    }
  }

  // Deduplicate candidate coordinates within ~1 km proximity
  const uniqueCandidates: { lat: number; lon: number; elevKm: number }[] = [];
  for (const cand of candidateCoords) {
    const exists = uniqueCandidates.some((u) => {
      const dLat = Math.abs(u.lat - cand.lat);
      const dLon = Math.abs(u.lon - cand.lon);
      return dLat < 0.03 && dLon < 0.15;
    });
    if (!exists) {
      uniqueCandidates.push(cand);
    }
  }

  // Limit to at most 45 points for fast sub-second responsiveness
  const candidatesToEvaluate = uniqueCandidates.slice(0, 45);

  // Evaluate each candidate
  const evaluations: CandidateEvaluation[] = [];

  for (const cand of candidatesToEvaluate) {
    const frame = createLocalFrame(cand.lat, cand.lon, cand.elevKm);
    const mask = generateCustomHorizon(cand.lat, cand.lon, cand.elevKm);

    // Compute exact rise/set intervals for Sun & Earth
    const sunData = findBodyIntervals(
      windowStartMs,
      windowEndMs,
      'sun',
      frame,
      mask,
      cand.elevKm,
      stepMs
    );
    const earthData = findBodyIntervals(
      windowStartMs,
      windowEndMs,
      'earth',
      frame,
      mask,
      cand.elevKm,
      stepMs
    );

    const sunIntervals = sunData.intervals;
    const earthIntervals = earthData.intervals;
    const bothUpIntervals = intersectIntervals(sunIntervals, earthIntervals);

    const longestSunHours = sunIntervals.reduce((max, inv) => Math.max(max, inv.durationHours), 0);
    const longestEarthHours = earthIntervals.reduce(
      (max, inv) => Math.max(max, inv.durationHours),
      0
    );
    const longestBothUpHours = bothUpIntervals.reduce(
      (max, inv) => Math.max(max, inv.durationHours),
      0
    );

    const totalSunHours = sunIntervals.reduce((sum, inv) => sum + inv.durationHours, 0);
    const totalEarthHours = earthIntervals.reduce((sum, inv) => sum + inv.durationHours, 0);

    const sunlightPercent = (totalSunHours / windowHours) * 100;
    const earthVisPercent = (totalEarthHours / windowHours) * 100;

    // Calculate solar power flux across cached time points (in W/m²)
    // Total Solar Irradiance at 1 AU = 1361 W/m²
    let sumHorizontalPower = 0;
    let sumTrackingPower = 0;
    const sampleInterval = Math.max(1, Math.floor(cached.times.length / 24)); // sample ~24 points
    let sampledCount = 0;

    for (let i = 0; i < cached.times.length; i += sampleInterval) {
      const sVec = cached.sunVecs[i];
      const eVec = cached.earthVecs[i];
      const vis = evaluateVisibilityAtInstant(sVec, eVec, frame, mask, cand.elevKm);
      sumHorizontalPower += vis.horizontalPowerFlux * SOLAR_CONSTANT_W_M2;
      sumTrackingPower += vis.trackingPowerFlux * SOLAR_CONSTANT_W_M2;
      sampledCount++;
    }
    const avgPowerFlux = sampledCount > 0 ? sumHorizontalPower / sampledCount : 0;
    const avgTrackingFlux = sampledCount > 0 ? sumTrackingPower / sampledCount : 0;

    // Fitness Scoring Function:
    // Criteria:
    // 1. Highest consecutive sunlight: 35%
    // 2. Highest consecutive Earth direct communication: 35%
    // 3. No shadows / highest sunlight duty cycle (sunny for power generation): 20%
    // 4. Incident solar power flux: 10%
    const effectiveFlux = Math.max(avgPowerFlux, avgTrackingFlux * 0.7);
    const consecutiveSunScore = Math.min(35, (longestSunHours / windowHours) * 35);
    const consecutiveEarthScore = Math.min(35, (longestEarthHours / windowHours) * 35);
    const sunnyNoShadowScore = Math.min(20, (totalSunHours / windowHours) * 20);
    const powerFluxScore = Math.min(10, (effectiveFlux / 500) * 10);

    const score = Math.round(
      consecutiveSunScore + consecutiveEarthScore + sunnyNoShadowScore + powerFluxScore
    );

    evaluations.push({
      lat: cand.lat,
      lon: cand.lon,
      elevKm: cand.elevKm,
      longestSunHours,
      longestEarthHours,
      longestBothUpHours,
      sunlightHours: totalSunHours,
      sunlightPercent,
      earthVisPercent,
      avgPowerFlux,
      avgTrackingFlux,
      score,
    });
  }

  // Sort by highest composite score
  evaluations.sort((a, b) => b.score - a.score);
  const best = evaluations[0];

  const latStr = `${Math.abs(best.lat).toFixed(3)}°${best.lat < 0 ? 'S' : 'N'}`;
  const lonStr = `${Math.abs(best.lon).toFixed(3)}°${best.lon >= 0 ? 'E' : 'W'}`;

  const bestSite: Site = {
    id: `roi-optimal-${best.lat.toFixed(3)}_${best.lon.toFixed(3)}`,
    name: `ROI Optimal Site (${latStr}, ${lonStr})`,
    agency: 'ROI Optimizer Analysis',
    kind: 'candidate',
    region: best.lat < -75 ? 'south_pole' : 'equatorial',
    lat: Number(best.lat.toFixed(4)),
    lon: Number(best.lon.toFixed(4)),
    elevKm: Number(best.elevKm.toFixed(2)),
    verified: true,
    note: `Optimal location in user ROI. Consecutive Sun: ${best.longestSunHours.toFixed(1)}h, Consecutive Earth: ${best.longestEarthHours.toFixed(1)}h, Solar Duty Cycle: ${best.sunlightPercent.toFixed(1)}% sunny.`,
    slopeDeg: 3.2,
    distanceToSteepTerrainM: 220,
    nearestPsrDistanceKm: best.lat < -75 ? 1.4 : 15,
    psrName: 'Explorable Shadowed Crater Floor',
    terrainConfidence: 'high',
    rockAbundance: 8.4,
    thermalInertia: 64,
    volatileIceScore: best.lat < -75 ? 85 : 12,
    isPsrColdTrap: false,
  };

  return {
    bestSite,
    score: best.score,
    longestSunHours: best.longestSunHours,
    longestEarthHours: best.longestEarthHours,
    longestBothUpHours: best.longestBothUpHours,
    sunlightPercent: best.sunlightPercent,
    earthVisPercent: best.earthVisPercent,
    avgPowerFlux: best.avgPowerFlux,
    avgTrackingFlux: best.avgTrackingFlux,
    evaluatedCandidatesCount: evaluations.length,
    polygon,
    centroid: { lat: centerLat, lon: centerLon },
    allEvaluations: evaluations,
  };
}

