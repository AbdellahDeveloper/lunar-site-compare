export type SiteKind = 'past' | 'planned' | 'candidate';
export type SiteRegion = 'south_pole' | 'equatorial' | 'farside' | 'mid_latitude';

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

export type AppMode = 'planner' | 'explorer' | 'learn';
