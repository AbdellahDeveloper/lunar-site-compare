import { Vector3D } from '../types';

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;
export const MOON_MEAN_RADIUS_KM = 1737.4;

export interface LocalFrame {
  up: [number, number, number];
  east: [number, number, number];
  north: [number, number, number];
  sitePosKm: [number, number, number];
}

/**
 * Constructs the local topocentric reference frame (Up, East, North)
 * for a site given latitude, longitude, and elevation.
 * Latitude: -90 to +90 (South negative)
 * Longitude: -180 to +180 (East positive)
 * ElevKm: elevation above mean lunar sphere (1737.4 km)
 */
export function createLocalFrame(latDeg: number, lonDeg: number, elevKm: number = 0): LocalFrame {
  const phi = latDeg * DEG2RAD;
  const lambda = lonDeg * DEG2RAD;
  const R_eff = MOON_MEAN_RADIUS_KM + elevKm;

  const cosPhi = Math.cos(phi);
  const sinPhi = Math.sin(phi);
  const cosLam = Math.cos(lambda);
  const sinLam = Math.sin(lambda);

  // Up: normal to the sphere at (lat, lon)
  const up: [number, number, number] = [
    cosPhi * cosLam,
    cosPhi * sinLam,
    sinPhi,
  ];

  // East: direction of increasing east longitude
  const east: [number, number, number] = [
    -sinLam,
    cosLam,
    0,
  ];

  // North: along local meridian toward north pole.
  // Handles singularity at poles smoothly.
  let north: [number, number, number];
  if (Math.abs(sinPhi) > 0.999999) {
    // Exactly or near pole:
    if (sinPhi < 0) {
      // South pole: horizontal direction pointing away from south pole along longitude
      north = [cosLam, sinLam, 0];
    } else {
      // North pole:
      north = [-cosLam, -sinLam, 0];
    }
  } else {
    north = [
      -sinPhi * cosLam,
      -sinPhi * sinLam,
      cosPhi,
    ];
  }

  // Site position in Moon-centered Moon-fixed frame (km)
  const sitePosKm: [number, number, number] = [
    R_eff * up[0],
    R_eff * up[1],
    R_eff * up[2],
  ];

  return { up, east, north, sitePosKm };
}

/**
 * Computes topocentric elevation and azimuth of a celestial body (Sun or Earth)
 * given its Moon-centered Moon-fixed position vector and the site's local frame.
 * Section 5.1 of SPECS.md
 */
export function computeTopocentric(
  bodyVec: Vector3D,
  frame: LocalFrame
): { elevationDeg: number; azimuthDeg: number; distanceKm: number } {
  // Topocentric vector: v' = v - R_eff * up (parallax correction)
  const dx = bodyVec.x - frame.sitePosKm[0];
  const dy = bodyVec.y - frame.sitePosKm[1];
  const dz = bodyVec.z - frame.sitePosKm[2];

  const distanceKm = Math.hypot(dx, dy, dz);
  if (distanceKm === 0) {
    return { elevationDeg: 0, azimuthDeg: 0, distanceKm: 0 };
  }

  // Unit vector toward body
  const ux = dx / distanceKm;
  const uy = dy / distanceKm;
  const uz = dz / distanceKm;

  // Dot products with Up, East, North
  const dotUp = ux * frame.up[0] + uy * frame.up[1] + uz * frame.up[2];
  const dotEast = ux * frame.east[0] + uy * frame.east[1] + uz * frame.east[2];
  const dotNorth = ux * frame.north[0] + uy * frame.north[1] + uz * frame.north[2];

  // Elevation: asin(u . up)
  const clampedDotUp = Math.max(-1, Math.min(1, dotUp));
  const elevationDeg = Math.asin(clampedDotUp) * RAD2DEG;

  // Azimuth: atan2(u . east, u . north) clockwise from north
  let azimuthDeg = Math.atan2(dotEast, dotNorth) * RAD2DEG;
  if (azimuthDeg < 0) azimuthDeg += 360;

  return {
    elevationDeg,
    azimuthDeg,
    distanceKm,
  };
}

