import { HorizonMask } from '../types';
import { MOON_MEAN_RADIUS_KM } from './local';

const RAD2DEG = 180 / Math.PI;

/**
 * Calculates horizon dip angle (in degrees) for a site at elevation h (km)
 * over a smooth lunar sphere without terrain obstacles.
 * acos(R / (R + h))
 */
export function getHorizonDipDeg(elevKm: number): number {
  if (elevKm <= 0) return 0;
  const ratio = MOON_MEAN_RADIUS_KM / (MOON_MEAN_RADIUS_KM + elevKm);
  const clampedRatio = Math.max(0, Math.min(1, ratio));
  return Math.acos(clampedRatio) * RAD2DEG;
}

/**
 * Gets the horizon elevation angle (in degrees) at a given azimuth.
 * If a terrain mask is provided, interpolates between azimuth bins.
 * Otherwise returns the geometric sphere horizon dip (-dipDeg).
 */
export function getHorizonElevation(
  azimuthDeg: number,
  mask: HorizonMask | null | undefined,
  elevKm: number = 0
): number {
  if (!mask || !mask.elevations || mask.elevations.length === 0) {
    // Flat horizon with spherical dip
    return -getHorizonDipDeg(elevKm);
  }

  // Normalize azimuth to [0, 360)
  let az = azimuthDeg % 360;
  if (az < 0) az += 360;

  const N = mask.elevations.length;
  const step = 360 / N;
  const indexFloat = az / step;
  const idx0 = Math.floor(indexFloat) % N;
  const idx1 = (idx0 + 1) % N;
  const frac = indexFloat - Math.floor(indexFloat);

  const el0 = mask.elevations[idx0];
  const el1 = mask.elevations[idx1];

  return el0 + frac * (el1 - el0);
}

