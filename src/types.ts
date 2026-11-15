export type SiteKind = 'past' | 'planned' | 'candidate';
export type SiteRegion = 'south_pole' | 'equatorial' | 'farside' | 'mid_latitude';
export type ArtemisRegionCode = 'PCB' | 'HW' | 'MMA' | 'MMP' | 'MMO' | 'NR1' | 'NR2' | 'dGR2' | 'SP' | 'OTHER';

export type ScientificLayer = 'none' | 'volatiles' | 'thermal' | 'shadow';
export type ComparisonViewMode = 'overlapped' | 'split';
export type UIMode = 'simple' | 'detailed';

export interface Site {
  id: string;
  name: string;
  agency: string;
  kind: SiteKind;
  region: SiteRegion;
  lat: number;          // degrees, -90 to +90 (South negative)
  lon: number;          // degrees, East positive (-180 to +180)
  elevKm: number;       // relative to 1737.4 km mean sphere
  verified: boolean;
  note: string;
  targetDate?: string;  // e.g. '2026-11-15'
  hasCustomHorizon?: boolean;

  // Artemis III Official Region & Wueller et al. 2026 Research Catalog
  artemisRegionCode?: ArtemisRegionCode;
  regionName?: string;
  slopeDeg: number;                  // surface slope in degrees (constraint < 8°, goal < 5°)
  distanceToSteepTerrainM: number;   // meters to terrain steeper than 8° (constraint >= 100 m)
  nearestPsrDistanceKm: number;      // km to nearest permanently shadowed region (walk radius <= 2.0 km)
  psrName?: string;
  terrainConfidence: 'high' | 'moderate' | 'low';
  lolaObsDensity?: number;           // observations per pixel (data coverage)
  elevationUncertaintyM?: number;    // height uncertainty in meters (LOLA RMS ~0.3 - 0.5 m)
  slopeUncertaintyDeg?: number;      // slope uncertainty in degrees (~1.5 - 2.5°)
  
  // Scientific exploration layers (LRO Diviner & LEND)
  rockAbundance: number;      // 0-100% surface rockiness / thermal inertia hazard
  thermalInertia: number;     // J m^-2 K^-1 s^-1/2 (nighttime cooling rate)
  volatileIceScore: number;   // 0-100% epithermal neutron suppression / water ice index
  isPsrColdTrap: boolean;     // Permanently Shadowed Region flag
}

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface BodyPositions {
  sun: Vector3D;       // km, Moon-fixed frame
  earth: Vector3D;     // km, Moon-fixed frame
  sunDistKm: number;
  earthDistKm: number;
}

export interface TopocentricCoords {
  elevationDeg: number;  // degrees above local horizontal (-90 to +90)
  azimuthDeg: number;    // degrees clockwise from True North (0 to 360)
  distanceKm: number;
  horizonDeg: number;    // terrain horizon elevation at this azimuth
  elevationAboveHorizon: number; // elevationDeg - horizonDeg
  clearanceDeg: number;  // C(t) = elevationDeg - horizonDeg
  geometricElevationDeg: number; // elevation relative to spherical lunar datum
  isVisible: boolean;    // accounting for disk radius or center line-of-sight
}

export interface EphemerisPoint {
  timeMs: number;
  dateIso: string;
  sun: TopocentricCoords;
  earth: TopocentricCoords;
  isBothUp: boolean;
  horizontalPowerFlux: number;   // 0 to 1 normalized solar flux on flat plate
  trackingPowerFlux: number;     // 0 to 1 normalized solar flux on vertical tracking panel
}

export interface TimeInterval {
  startMs: number;
  endMs: number;
  durationHours: number;
  openStart: boolean; // interval extends before window start
  openEnd: boolean;   // interval extends after window end
}

export interface ScenarioMetrics {
  windowHours: number;
  sunlightHours: number;
  sunlightPercent: number;
  longestLightHours: number;
  longestDarkHours: number;
  sunsetCount: number;
  sunriseCount: number;
  
  earthVisHours: number;
  earthVisPercent: number;
  longestEarthWindowHours: number;
  longestEarthOutageHours: number;
  earthsetCount: number;
  earthriseCount: number;

  bothUpHours: number;
  bothUpPercent: number;
  longestBothUpHours: number;

  avgPowerHorizontal: number; // 0 to 1
  avgPowerTracking: number;   // 0 to 1
  peakSunElevation: number;
  minSunElevation: number;
  meanSunElevationWhenUp: number;
  peakEarthElevation: number;
  minEarthElevation: number;

  // Real-time countdowns from current scrub time
  currentSunStatus: 'up' | 'down';
  currentEarthStatus: 'up' | 'down';
  timeToNextSunsetMs: number | null;
  timeToNextSunriseMs: number | null;
  timeToNextEarthsetMs: number | null;
  timeToNextEarthriseMs: number | null;
}

export type ViabilityTier = 'optimal' | 'viable' | 'constrained' | 'critical';

export interface Verdict {
  tier: ViabilityTier;
  title: string;
  summary: string;
  sunStatus: 'healthy' | 'grazing' | 'dark';
  sunDetail: string;
  earthStatus: 'continuous' | 'intermittent' | 'occulted';
  earthDetail: string;
  operationalSummary: string;
}

export interface HorizonMask {
  siteId: string;
  name: string;
  bins: number;
  az0: number; // usually 0
  elevations: number[]; // degrees elevation per azimuth bin (0 to 360)
}

export interface ScenarioConfig {
  id: string;
  name: string;
  siteId: string; // matches Site.id or 'custom'
  customLat: number;
  customLon: number;
  customElevKm: number;
  customName: string;
  useTerrain: boolean;
}

export interface ScenarioEvaluation {
  points: EphemerisPoint[];
  sunIntervals: TimeInterval[];
  earthIntervals: TimeInterval[];
  bothUpIntervals: TimeInterval[];
  metrics: ScenarioMetrics;
  verdict: Verdict;
  frame: {
    up: [number, number, number];
    east: [number, number, number];
    north: [number, number, number];
    sitePosKm: [number, number, number];
  };
  horizonMaskUsed: HorizonMask | null;
}

export interface SlipCase {
  offsetDays: number;
  label: string;
  startDateIso: string;
  metrics: ScenarioMetrics;
  deltaSunHours: number;
  deltaEarthHours: number;
  deltaBothUpHours: number;
  deltaSunPercent: number;
  verdict: Verdict;
}

export interface MonteCarloResult {
  trialsCount: number;
  successProbability: number; // % trials meeting min sunlight requirement
  dteProbability: number;     // % trials meeting min DTE requirement
  avgSunlightHours: number;
  avgDarkHours: number;
  maxConsecutiveDarkHours: number;
  darknessHistogram: { binHours: string; count: number }[];
  riskRating: 'Low' | 'Moderate' | 'High' | 'Severe';
  recommendation: string;
}

export interface MissionCriteriaWeights {
  solar: number;             // w1 (0 to 1)
  earth: number;             // w2 (0 to 1)
  jointBothUp: number;       // w3 (0 to 1)
  landingSlope: number;      // w4 (0 to 1)
  terrainConfidence: number; // w5 (0 to 1)
  psrAccessibility: number;  // w6 (0 to 1)
}

export interface SiteScoreResult {
  site: Site;
  totalScore: number; // 0 to 100
  rank: number;
  breakdown: {
    solarScore: number;
    earthScore: number;
    jointScore: number;
    slopeScore: number;
    confidenceScore: number;
    psrScore: number;
  };
  paretoStatus: string;
}

export type AppMode = 'planner' | 'explorer' | 'learn';
