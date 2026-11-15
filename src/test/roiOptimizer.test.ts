import { describe, it, expect } from 'vitest';
import { isPointInPolygon, findOptimalSiteInPolygon, RoiPoint } from '../engine/roiOptimizer';
import { LUNAR_SITES } from '../data/sites';

describe('ROI Site Search & Optimization Engine', () => {
  it('correctly determines whether coordinates are inside or outside a drawn polygon', () => {
    // Triangular polygon around South Pole (-85° to -89°)
    const polygon: RoiPoint[] = [
      { lat: -85.0, lon: 0.0 },
      { lat: -88.0, lon: 90.0 },
      { lat: -88.0, lon: -90.0 },
    ];

    // Inside point
    expect(isPointInPolygon(-87.0, 0.0, polygon)).toBe(true);

    // Outside point (further north)
    expect(isPointInPolygon(-80.0, 0.0, polygon)).toBe(false);

    // Outside point (outside longitude wing)
    expect(isPointInPolygon(-88.0, 150.0, polygon)).toBe(false);
  });

  it('optimizes and selects the best location within the user-drawn polygon', () => {
    // Polygon around Shackleton and Malapert region
    const polygon: RoiPoint[] = [
      { lat: -84.0, lon: 0.0 },
      { lat: -84.0, lon: 60.0 },
      { lat: -89.5, lon: 60.0 },
      { lat: -89.5, lon: 0.0 },
    ];

    const windowStartMs = new Date('2026-11-14T00:00:00Z').getTime();
    const windowEndMs = new Date('2026-11-21T00:00:00Z').getTime(); // 7-day window

    const result = findOptimalSiteInPolygon(polygon, windowStartMs, windowEndMs, LUNAR_SITES);

    expect(result).toBeDefined();
    expect(result.bestSite).toBeDefined();
    expect(result.bestSite.lat).toBeLessThanOrEqual(-84.0);
    expect(result.bestSite.lat).toBeGreaterThanOrEqual(-89.5);
    expect(result.score).toBeGreaterThan(0);
    expect(result.longestSunHours).toBeGreaterThan(0);
    expect(result.longestEarthHours).toBeGreaterThan(0);
    expect(result.sunlightPercent).toBeGreaterThan(0);
    expect(result.avgPowerFlux).toBeGreaterThan(0);
    expect(result.avgTrackingFlux).toBeGreaterThan(0);
    expect(result.evaluatedCandidatesCount).toBeGreaterThan(3);
  });
});

