import * as Astronomy from 'astronomy-engine';
import { BodyPositions, Vector3D } from '../types';

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

// Passive rotation about Z (axis 3)
function R3(angleRad: number): number[][] {
  const c = Math.cos(angleRad);
  const s = Math.sin(angleRad);
  return [
    [c, s, 0],
    [-s, c, 0],
    [0, 0, 1],
  ];
}

// Passive rotation about X (axis 1)
function R1(angleRad: number): number[][] {
  const c = Math.cos(angleRad);
  const s = Math.sin(angleRad);
  return [
    [1, 0, 0],
    [0, c, s],
    [0, -s, c],
  ];
}

function matMul3x3(A: number[][], B: number[][]): number[][] {
  const res: number[][] = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      res[i][j] = A[i][0] * B[0][j] + A[i][1] * B[1][j] + A[i][2] * B[2][j];
    }
  }
  return res;
}

function matVecMul(M: number[][], v: [number, number, number]): [number, number, number] {
  return [
    M[0][0] * v[0] + M[0][1] * v[1] + M[0][2] * v[2],
    M[1][0] * v[0] + M[1][1] * v[1] + M[1][2] * v[2],
    M[2][0] * v[0] + M[2][1] * v[1] + M[2][2] * v[2],
  ];
}

/**
 * Computes the rotation matrix from ICRF / J2000 to the Moon body-fixed frame
 * according to the IAU 2009 / Archinal 2011 lunar orientation model.
 */
export function getMoonOrientationMatrix(astroTime: Astronomy.AstroTime): number[][] {
  const d = astroTime.tt; // days since J2000.0 TT
  const T = d / 36525.0;

  // Delaunay / fundamental angles in radians
  const E1 = (125.045 - 0.0529921 * d) * DEG2RAD;
  const E2 = (250.089 - 0.1059842 * d) * DEG2RAD;
  const E3 = (260.008 + 13.0120009 * d) * DEG2RAD;
  const E4 = (176.625 + 13.3407154 * d) * DEG2RAD;
  const E5 = (357.529 + 0.9856003 * d) * DEG2RAD;
  const E6 = (311.589 + 26.4057084 * d) * DEG2RAD;
  const E7 = (134.963 + 13.064993 * d) * DEG2RAD;
  const E8 = (276.617 - 12.5760105 * d) * DEG2RAD;
  const E9 = (34.853 - 0.0560886 * d) * DEG2RAD;
  const E10 = (51.958 + 0.0392226 * d) * DEG2RAD;
  const E11 = (82.740 + 0.0053322 * d) * DEG2RAD;
  const E12 = (347.341 - 0.0026638 * d) * DEG2RAD;
  const E13 = (122.149 + 0.051082 * d) * DEG2RAD;

  // Right ascension and declination of the lunar north pole (deg -> rad)
  const a0 =
    (269.9949 +
      0.0031 * T -
      3.8787 * Math.sin(E1) -
      0.1204 * Math.sin(E2) +
      0.07 * Math.sin(E3) -
      0.0172 * Math.sin(E4) +
      0.0072 * Math.sin(E6) -
      0.0052 * Math.sin(E10) +
      0.0043 * Math.sin(E13)) *
    DEG2RAD;

  const d0 =
    (66.5392 +
      0.013 * T +
      1.5419 * Math.cos(E1) +
      0.0239 * Math.cos(E2) -
      0.0278 * Math.cos(E3) +
      0.0068 * Math.cos(E4) -
      0.0029 * Math.cos(E6) +
      0.0009 * Math.cos(E7) +
      0.0008 * Math.cos(E10) -
      0.0009 * Math.cos(E13)) *
    DEG2RAD;

  // Prime meridian angle W (deg -> rad)
  let W_deg =
    (38.3213 +
      13.17635815 * d -
      1.4e-12 * d * d +
      3.561 * Math.sin(E1) +
      0.1208 * Math.sin(E2) -
      0.0642 * Math.sin(E3) +
      0.0158 * Math.sin(E4) +
      0.0252 * Math.sin(E5) -
      0.0066 * Math.sin(E6) -
      0.0047 * Math.sin(E7) -
      0.0046 * Math.sin(E8) +
      0.0028 * Math.sin(E9) +
      0.0052 * Math.sin(E10) +
      0.004 * Math.sin(E11) +
      0.0019 * Math.sin(E12) -
      0.0044 * Math.sin(E13)) %
    360;
  if (W_deg < 0) W_deg += 360;
  const W = W_deg * DEG2RAD;

  // M = R3(W) * R1(90° - d0) * R3(a0 + 90°)
  const r3_alpha = R3(a0 + Math.PI / 2);
  const r1_delta = R1(Math.PI / 2 - d0);
  const r3_w = R3(W);

  return matMul3x3(r3_w, matMul3x3(r1_delta, r3_alpha));
}

/**
 * Returns Sun and Earth vectors from the Moon's center in the Moon-fixed frame (km).
 * Section 4.2 / 5.2 compliant interface.
 */
export function bodyVectors(timeMs: number): BodyPositions {
  const date = new Date(timeMs);
  const astroTime = new Astronomy.AstroTime(date);

  // Rotation matrix from J2000 to Moon-fixed
  const M = getMoonOrientationMatrix(astroTime);

  // Vector from Earth to Moon (J2000, AU)
  const geoMoon = Astronomy.GeoVector(Astronomy.Body.Moon, astroTime, false);
  // Vector from Earth to Sun (J2000, AU)
  const geoSun = Astronomy.GeoVector(Astronomy.Body.Sun, astroTime, false);

  const kmPerAu = Astronomy.KM_PER_AU;

  // Moon -> Earth in J2000 km = - (Earth -> Moon)
  const moonToEarthJ2000: [number, number, number] = [
    -geoMoon.x * kmPerAu,
    -geoMoon.y * kmPerAu,
    -geoMoon.z * kmPerAu,
  ];

  // Moon -> Sun in J2000 km = (Earth -> Sun) - (Earth -> Moon)
  const moonToSunJ2000: [number, number, number] = [
    (geoSun.x - geoMoon.x) * kmPerAu,
    (geoSun.y - geoMoon.y) * kmPerAu,
    (geoSun.z - geoMoon.z) * kmPerAu,
  ];

  // Rotate to Moon-fixed coordinates
  const earthMoonFixed = matVecMul(M, moonToEarthJ2000);
  const sunMoonFixed = matVecMul(M, moonToSunJ2000);

  const earthDistKm = Math.hypot(earthMoonFixed[0], earthMoonFixed[1], earthMoonFixed[2]);
  const sunDistKm = Math.hypot(sunMoonFixed[0], sunMoonFixed[1], sunMoonFixed[2]);

  return {
    earth: { x: earthMoonFixed[0], y: earthMoonFixed[1], z: earthMoonFixed[2] },
    sun: { x: sunMoonFixed[0], y: sunMoonFixed[1], z: sunMoonFixed[2] },
    earthDistKm,
    sunDistKm,
  };
}

/**
 * Sub-solar and sub-Earth selenographic coordinates (latitude & east longitude in degrees).
 */
export function getSubBodyCoords(bodyVec: Vector3D): { latDeg: number; lonDeg: number } {
  const r = Math.hypot(bodyVec.x, bodyVec.y, bodyVec.z);
  const latDeg = Math.asin(Math.max(-1, Math.min(1, bodyVec.z / r))) * RAD2DEG;
  let lonDeg = Math.atan2(bodyVec.y, bodyVec.x) * RAD2DEG;
  if (lonDeg > 180) lonDeg -= 360;
  if (lonDeg < -180) lonDeg += 360;
  return { latDeg, lonDeg };
}
