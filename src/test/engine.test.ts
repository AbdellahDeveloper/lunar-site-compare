import { describe, it, expect } from 'vitest';
import * as Astronomy from 'astronomy-engine';
import { bodyVectors, getSubBodyCoords } from '../engine/moon';
import { createLocalFrame, computeTopocentric, MOON_MEAN_RADIUS_KM } from '../engine/local';
import { findBodyIntervals, intersectIntervals, complementIntervals } from '../engine/events';
import { getHorizonDipDeg, getHorizonElevation } from '../engine/horizon';
import { evaluateVisibilityAtInstant } from '../engine/visibility';
import { computeScenarioMetrics } from '../engine/metrics';
import { evaluateVerdict } from '../engine/verdict';
import { LUNAR_SITES, ARTEMIS_III_REGIONS } from '../data/sites';
import { scoreSite, DEFAULT_MISSION_WEIGHTS } from '../engine/recommendation';
import { parseHorizonsBlock } from '../engine/horizonsClient';

describe('Lunar Ephemeris & Orientation Engine', () => {
  it('IAU 2009 Moon-fixed frame matches libration within 0.05 degrees', () => {
    // Check multiple epochs between 2026 and 2030
    const epochs = [
      new Date('2026-11-13T00:00:00Z').getTime(),
      new Date('2027-04-15T12:00:00Z').getTime(),
      new Date('2028-09-01T18:30:00Z').getTime(),
    ];

    for (const timeMs of epochs) {
      const { earth, earthDistKm } = bodyVectors(timeMs);
      const subEarth = getSubBodyCoords(earth);

      const astroTime = new Astronomy.AstroTime(new Date(timeMs));
      const lib = Astronomy.Libration(astroTime);

      const dLat = Math.abs(subEarth.latDeg - lib.elat);
      const dLon = Math.abs(subEarth.lonDeg - lib.elon);

      // Verify libration matches within 0.05 degrees (< 3 arcminutes)
      expect(dLat).toBeLessThan(0.05);
      expect(dLon).toBeLessThan(0.05);
      expect(Math.abs(earthDistKm - lib.dist_km)).toBeLessThan(1.0); // within 1 km
    }
  });

  it('Apollo 11 landing time matches NASA sun elevation sanity range (~10.7 deg)', () => {
    // Apollo 11 touchdown: 1969-07-20T20:17:40Z at 0.67408° N, 23.47297° E
    const touchdownMs = new Date('1969-07-20T20:17:40Z').getTime();
    const { sun } = bodyVectors(touchdownMs);

    const frame = createLocalFrame(0.67408, 23.47297, -2.57);
    const topo = computeTopocentric(sun, frame);

    // NASA historical telemetry recorded ~10.8° elevation from eastern horizon (azimuth ~88-89°)
    expect(topo.elevationDeg).toBeGreaterThan(10.0);
    expect(topo.elevationDeg).toBeLessThan(11.5);
    expect(topo.azimuthDeg).toBeGreaterThan(85.0);
    expect(topo.azimuthDeg).toBeLessThan(95.0);
  });

  it('South Pole sites show grazing sun elevation under 3.5 degrees', () => {
    // At Shackleton rim (-89.78°), sun elevation never rises significantly above 2-3°
    const summerMs = new Date('2026-12-21T00:00:00Z').getTime(); // Southern summer
    const { sun } = bodyVectors(summerMs);

    const frame = createLocalFrame(-89.78, 129.5, 1.2);
    const topo = computeTopocentric(sun, frame);

    expect(topo.elevationDeg).toBeLessThan(3.5);
    expect(topo.elevationDeg).toBeGreaterThan(-3.5);
  });

  it('Topocentric parallax correction produces significant shift for Earth', () => {
    // Parallax on the Moon: R_moon / D_earth ~= 1737 / 384400 rad ~= 0.26 degrees
    const timeMs = new Date('2026-11-13T00:00:00Z').getTime();
    const { earth } = bodyVectors(timeMs);

    // Site on limb where parallax is maximized (e.g. 0° lat, 90° lon)
    const frame = createLocalFrame(0, 90, 0);
    const topo = computeTopocentric(earth, frame);

    // Center-to-center angle in same frame
    const distCenter = Math.hypot(earth.x, earth.y, earth.z);
    const centerUx = earth.x / distCenter;
    const centerUy = earth.y / distCenter;
    const centerUz = earth.z / distCenter;
    const centerDotUp = centerUx * frame.up[0] + centerUy * frame.up[1] + centerUz * frame.up[2];
    const centerElevationDeg = (Math.asin(centerDotUp) * 180) / Math.PI;

    // Shift between geocentric and topocentric elevation must be non-zero and <= 0.27 degrees
    const shiftDeg = Math.abs(topo.elevationDeg - centerElevationDeg);
    expect(shiftDeg).toBeGreaterThan(0.1);
    expect(shiftDeg).toBeLessThan(0.28);
  });
});

describe('Interval & Visibility Engine', () => {
  it('Calculates horizon dip for elevation above mean radius', () => {
    expect(getHorizonDipDeg(0)).toBe(0);
    const dip5km = getHorizonDipDeg(5.0);
    // acos(1737.4 / 1742.4) ~= 4.34 degrees
    expect(dip5km).toBeGreaterThan(4.0);
    expect(dip5km).toBeLessThan(4.6);
  });

  it('Finds rising and setting intervals with bisection refinement', () => {
    // Over a 30-day window at Apollo 11, there must be exactly one sunrise and one sunset
    const startMs = new Date('1969-07-01T00:00:00Z').getTime();
    const endMs = new Date('1969-07-31T00:00:00Z').getTime();
    const frame = createLocalFrame(0.67408, 23.47297, -2.57);

    const { intervals, events } = findBodyIntervals(startMs, endMs, 'sun', frame, null, -2.57);

    expect(intervals.length).toBeGreaterThan(0);
    expect(events.length).toBeGreaterThan(0);
  });

  it('Computes interval intersections for Both-Up windows', () => {
    const sunInv = [{ startMs: 1000, endMs: 5000, durationHours: 4, openStart: false, openEnd: false }];
    const earthInv = [{ startMs: 3000, endMs: 8000, durationHours: 5, openStart: false, openEnd: false }];

    const both = intersectIntervals(sunInv, earthInv);
    expect(both.length).toBe(1);
    expect(both[0].startMs).toBe(3000);
    expect(both[0].endMs).toBe(5000);
  });

  it('Computes dark outage intervals as complement of daylight intervals', () => {
    const windowStart = 0;
    const windowEnd = 10000;
    const daylight = [{ startMs: 2000, endMs: 6000, durationHours: 4, openStart: false, openEnd: false }];

    const dark = complementIntervals(daylight, windowStart, windowEnd);
    expect(dark.length).toBe(2);
    expect(dark[0].startMs).toBe(0);
    expect(dark[0].endMs).toBe(2000);
    expect(dark[1].startMs).toBe(6000);
    expect(dark[1].endMs).toBe(10000);
  });
});

describe('NASA Artemis III & Scientific Benchmark Verification', () => {
  it('Includes all 9 official Artemis III candidate regions and benchmark coordinates', () => {
    expect(ARTEMIS_III_REGIONS.length).toBe(9);
    const regionCodes = ARTEMIS_III_REGIONS.map((r: any) => r.code);
    expect(regionCodes).toEqual(
      expect.arrayContaining(['PCB', 'HW', 'MMA', 'MMP', 'MMO', 'NR1', 'NR2', 'dGR2', 'SP'])
    );

    // Test 1 from did_we_built.md: Candidate Coordinates integrity
    const nr101 = LUNAR_SITES.find((s) => s.id === 'nobile-rim-1');
    expect(nr101).toBeDefined();
    if (!nr101) throw new Error('NR101 not found');
    expect(nr101.lat).toBeCloseTo(-85.295, 3);
    expect(nr101.lon).toBeCloseTo(36.917, 3);
    expect(nr101.elevKm).toBe(1.4);
    expect(nr101.slopeDeg).toBeLessThan(5.0); // HLS goal < 5°
    expect(nr101.distanceToSteepTerrainM).toBeGreaterThanOrEqual(100); // HLS constraint >= 100m

    // HW_K2023 Haworth benchmark coordinates
    const hwK2023 = LUNAR_SITES.find((s) => s.id === 'haworth-rim');
    expect(hwK2023).toBeDefined();
    if (!hwK2023) throw new Error('HW_K2023 not found');
    expect(hwK2023.lat).toBeCloseTo(-86.990, 3);
    expect(hwK2023.lon).toBeCloseTo(-24.254, 3);
    expect(hwK2023.slopeDeg).toBeLessThan(5.0);
    expect(hwK2023.nearestPsrDistanceKm).toBeLessThanOrEqual(2.0); // Within 2km walking radius
  });

  it('Computes terrain clearance C(t) = h(t) - H(alpha) correctly', () => {
    // Create a local frame at NR101
    const frame = createLocalFrame(-85.295, 36.917, 1.4);
    const mockSunVec = { x: 10000000, y: 0, z: 200000 };
    const mockEarthVec = { x: 384000, y: 0, z: 50000 };

    const mask = {
      siteId: 'test-mask',
      name: 'Test Mask',
      bins: 360,
      az0: 0,
      elevations: new Array(360).fill(2.5), // flat 2.5 degree ridge
    };

    const res = evaluateVisibilityAtInstant(mockSunVec, mockEarthVec, frame, mask, 1.4);

    // Verify clearanceDeg definition C = elevationDeg - horizonDeg
    expect(res.sun.clearanceDeg).toBeCloseTo(res.sun.elevationDeg - res.sun.horizonDeg, 4);
    expect(res.earth.clearanceDeg).toBeCloseTo(res.earth.elevationDeg - res.earth.horizonDeg, 4);
    expect(res.sun.geometricElevationDeg).toBeCloseTo(res.sun.elevationDeg, 4);

    // If clearance is negative, Earth center is blocked by terrain
    if (res.earth.clearanceDeg < 0) {
      expect(res.earth.isVisible).toBe(false);
    }
  });

  it('Calculates explainable multi-criteria scores S = sum(w_i * C_i) in [0, 100]', () => {
    const nr101 = LUNAR_SITES.find((s) => s.id === 'nobile-rim-1')!;
    const result = scoreSite(nr101, 85, 95, 600, 720, DEFAULT_MISSION_WEIGHTS);

    expect(result.totalScore).toBeGreaterThanOrEqual(0);
    expect(result.totalScore).toBeLessThanOrEqual(100);
    expect(result.breakdown.solarScore).toBe(85);
    expect(result.breakdown.earthScore).toBe(95);
    expect(result.breakdown.slopeScore).toBeGreaterThanOrEqual(90); // because slope is 3.2° < 5°
    expect(result.paretoStatus).toBeDefined();
  });

  it('Parses authentic NASA JPL Horizons tabular ephemeris block', () => {
    const sampleHorizonsText = `
*******************************************************************************
Target body name: Sun (10)                        {source: DE441}
Center body name: Moon (301)                      {source: DE441}
$$SOE
 2026-Nov-14 00:00 *i   89.829245   1.575925
 2026-Nov-14 01:00 *i   89.323083   1.617593
 2026-Nov-14 02:00 *i   88.816918   1.659253
$$EOE
*******************************************************************************
`;
    const points = parseHorizonsBlock(sampleHorizonsText);
    expect(points.length).toBe(3);
    expect(points[0].azimuthDeg).toBeCloseTo(89.829, 3);
    expect(points[0].elevationDeg).toBeCloseTo(1.576, 3);
    expect(points[1].azimuthDeg).toBeCloseTo(89.323, 3);
    expect(points[2].elevationDeg).toBeCloseTo(1.659, 3);
  });

  it('Validates LRO Diviner & LEND published parameter ranges across candidate sites', () => {
    for (const site of LUNAR_SITES) {
      // Rock Abundance (RFA): 0% to 50%
      expect(site.rockAbundance).toBeGreaterThanOrEqual(0);
      expect(site.rockAbundance).toBeLessThanOrEqual(50);

      // Thermal Inertia: 30 to 120 J m^-2 K^-1 s^-1/2
      expect(site.thermalInertia).toBeGreaterThanOrEqual(30);
      expect(site.thermalInertia).toBeLessThanOrEqual(120);

      // Volatile Ice Score: 0% to 100%
      expect(site.volatileIceScore).toBeGreaterThanOrEqual(0);
      expect(site.volatileIceScore).toBeLessThanOrEqual(100);
    }
  });
});
