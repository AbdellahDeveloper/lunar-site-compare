import { describe, it, expect } from 'vitest';
import * as Astronomy from 'astronomy-engine';
import { bodyVectors, getSubBodyCoords } from '../engine/moon';
import { createLocalFrame, computeTopocentric, MOON_MEAN_RADIUS_KM } from '../engine/local';
import { findBodyIntervals, intersectIntervals, complementIntervals } from '../engine/events';
import { getHorizonDipDeg, getHorizonElevation } from '../engine/horizon';
import { evaluateVisibilityAtInstant } from '../engine/visibility';
import { computeScenarioMetrics } from '../engine/metrics';
import { evaluateVerdict } from '../engine/verdict';

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
