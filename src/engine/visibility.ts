import { TopocentricCoords, HorizonMask, Vector3D } from '../types';
import { LocalFrame, computeTopocentric } from './local';
import { getHorizonElevation } from './horizon';

const RAD2DEG = 180 / Math.PI;
const DEG2RAD = Math.PI / 180;
const SUN_PHYSICAL_RADIUS_KM = 695700;
const EARTH_PHYSICAL_RADIUS_KM = 6371;

/**
 * Calculates topocentric coordinates, horizon clearance, and visibility
 * for both Sun and Earth at a single instant.
 */
export function evaluateVisibilityAtInstant(
  sunVecMoonFixed: Vector3D,
  earthVecMoonFixed: Vector3D,
  frame: LocalFrame,
  mask: HorizonMask | null | undefined,
  elevKm: number = 0
): {
  sun: TopocentricCoords;
  earth: TopocentricCoords;
  isBothUp: boolean;
  horizontalPowerFlux: number;
  trackingPowerFlux: number;
} {
  const sunTopo = computeTopocentric(sunVecMoonFixed, frame);
  const earthTopo = computeTopocentric(earthVecMoonFixed, frame);

  // Horizon elevations at respective azimuths
  const sunHorizonDeg = getHorizonElevation(sunTopo.azimuthDeg, mask, elevKm);
  const earthHorizonDeg = getHorizonElevation(earthTopo.azimuthDeg, mask, elevKm);

  // Angular radius of the Sun
  const sunRadiusDeg = Math.asin(Math.min(1, SUN_PHYSICAL_RADIUS_KM / sunTopo.distanceKm)) * RAD2DEG;
  // Sun is visible if its upper limb clears the local horizon
  const isSunVisible = (sunTopo.elevationDeg + sunRadiusDeg) > sunHorizonDeg;

  // Earth is visible if its center clears the local horizon (direct line-of-sight for antenna dish)
  const isEarthVisible = earthTopo.elevationDeg > earthHorizonDeg;

  const isBothUp = isSunVisible && isEarthVisible;

  // Power proxies:
  // Horizontal panel receives sin(el) when visible, clamped to >= 0
  let horizontalPowerFlux = 0;
  // Vertical tracking panel faces the sun azimuthally, receives cos(el) when visible
  let trackingPowerFlux = 0;

  if (isSunVisible) {
    const elRad = sunTopo.elevationDeg * DEG2RAD;
    horizontalPowerFlux = Math.max(0, Math.sin(elRad));
    trackingPowerFlux = Math.max(0, Math.cos(elRad));
  }

  const sunClearance = sunTopo.elevationDeg - sunHorizonDeg;
  const earthClearance = earthTopo.elevationDeg - earthHorizonDeg;

  const sun: TopocentricCoords = {
    ...sunTopo,
    horizonDeg: sunHorizonDeg,
    elevationAboveHorizon: sunClearance,
    clearanceDeg: sunClearance,
    geometricElevationDeg: sunTopo.elevationDeg,
    isVisible: isSunVisible,
  };

  const earth: TopocentricCoords = {
    ...earthTopo,
    horizonDeg: earthHorizonDeg,
    elevationAboveHorizon: earthClearance,
    clearanceDeg: earthClearance,
    geometricElevationDeg: earthTopo.elevationDeg,
    isVisible: isEarthVisible,
  };

  return {
    sun,
    earth,
    isBothUp,
    horizontalPowerFlux,
    trackingPowerFlux,
  };
}

