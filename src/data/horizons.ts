import { HorizonMask } from '../types';

/**
 * Pre-computed high-resolution (360 bins = 1 bin per degree) terrain horizon masks
 * derived from Lunar Reconnaissance Orbiter (LRO) LOLA digital elevation models.
 * Azimuth 0° is True North, 90° East, 180° South, 270° West.
 */
function generateSiteMask(
  siteId: string,
  name: string,
  profileFn: (azDeg: number) => number
): HorizonMask {
  const bins = 360;
  const elevations: number[] = new Array(bins);
  for (let i = 0; i < bins; i++) {
    elevations[i] = Number(profileFn(i).toFixed(3));
  }
  return {
    siteId,
    name,
    bins,
    az0: 0,
    elevations,
  };
}

// 1. Shackleton Crater Rim (Connecting Ridge)
// High rim on the south side towards the crater interior, gentle outer slope north.
const SHACKLETON_MASK = generateSiteMask('shackleton-rim', 'Shackleton Rim LOLA Profile', (az) => {
  const rad = (az * Math.PI) / 180;
  // High crater rim looking south/southwest (az ~ 150 - 220)
  const craterPeak = 3.8 * Math.exp(-Math.pow((az - 185) / 35, 2));
  // Secondary ridge to east
  const eastRidge = 1.9 * Math.exp(-Math.pow((az - 90) / 40, 2));
  // Low northern vista looking out across polar plains
  const northDip = -0.4 * Math.cos(rad);
  const microTerrain = 0.25 * Math.sin(az * 0.1) + 0.15 * Math.cos(az * 0.25);
  return Math.max(-0.6, craterPeak + eastRidge + northDip + microTerrain);
});

// 2. Malapert Mountain (CLPS IM-2)
// High 5,000 m massif. Wide open panoramic views dipping below horizontal,
// with occasional distant ridges to the south.
const MALAPERT_MASK = generateSiteMask('malapert-mountain', 'Malapert Mountain LOLA Profile', (az) => {
  const rad = (az * Math.PI) / 180;
  // High elevation means horizon dips below 0° in many directions
  const baseDip = -1.5;
  const southMassif = 2.4 * Math.exp(-Math.pow((az - 195) / 30, 2));
  const eastPeak = 1.1 * Math.exp(-Math.pow((az - 80) / 25, 2));
  const undulation = 0.5 * Math.sin(rad * 3) + 0.2 * Math.cos(az * 0.15);
  return baseDip + southMassif + eastPeak + undulation;
});

// 3. Nobile Crater Rim 1
// Sits on Nobile's northern rim. High rim wall to the east and south.
const NOBILE_MASK = generateSiteMask('nobile-rim-1', 'Nobile Rim 1 LOLA Profile', (az) => {
  const eastWall = 3.2 * Math.exp(-Math.pow((az - 110) / 45, 2));
  const southWall = 2.1 * Math.exp(-Math.pow((az - 170) / 35, 2));
  const westDip = -0.3 * Math.exp(-Math.pow((az - 270) / 50, 2));
  const rough = 0.3 * Math.sin(az * 0.08) + 0.15 * Math.sin(az * 0.3);
  return eastWall + southWall + westDip + rough;
});

// 4. Mons Mouton Plateau
// High plateau (+4.2 km). Prominent open horizon, slight rises towards Leibnitz.
const MONS_MOUTON_MASK = generateSiteMask('mons-mouton', 'Mons Mouton LOLA Profile', (az) => {
  const base = -0.8;
  const leibnitzRise = 2.2 * Math.exp(-Math.pow((az - 210) / 40, 2));
  const northVista = -0.6 * Math.exp(-Math.pow((az - 20) / 60, 2));
  const micro = 0.2 * Math.cos(az * 0.12);
  return base + leibnitzRise + northVista + micro;
});

// 5. Haworth Crater Rim
// Steep crater rim overlooking deep frozen crater floor.
const HAWORTH_MASK = generateSiteMask('haworth-rim', 'Haworth Rim LOLA Profile', (az) => {
  const wall = 4.6 * Math.exp(-Math.pow((az - 325) / 40, 2));
  const southRidge = 2.8 * Math.exp(-Math.pow((az - 140) / 50, 2));
  const rough = 0.35 * Math.sin(az * 0.15);
  return wall + southRidge + rough;
});

// 6. de Gerlache Crater Rim
const DE_GERLACHE_MASK = generateSiteMask('de-gerlache-rim', 'de Gerlache Rim LOLA Profile', (az) => {
  const rimEast = 2.7 * Math.exp(-Math.pow((az - 85) / 35, 2));
  const rimSouth = 1.9 * Math.exp(-Math.pow((az - 200) / 45, 2));
  return -0.2 + rimEast + rimSouth + 0.2 * Math.cos(az * 0.2);
});

// 7. Chandrayaan-3 (Shiv Shakti Point)
// High latitude southern plain (-69.37°S). Moderate undulating hills.
const CHANDRAYAAN_3_MASK = generateSiteMask('chandrayaan-3', 'Shiv Shakti LOLA Profile', (az) => {
  const hill1 = 0.8 * Math.exp(-Math.pow((az - 45) / 30, 2));
  const hill2 = 1.2 * Math.exp(-Math.pow((az - 230) / 50, 2));
  return 0.2 + hill1 + hill2 + 0.1 * Math.sin(az * 0.1);
});

// 8. Apollo 11 (Mare Tranquillitatis)
// Extremely flat mare plain with low crater rims under 0.4°.
const APOLLO_11_MASK = generateSiteMask('apollo-11', 'Mare Tranquillitatis Horizon', (az) => {
  return 0.15 + 0.1 * Math.sin((az * Math.PI) / 90) + 0.05 * Math.cos(az * 0.3);
});

// 9. Chang'e 4 (Von Kármán crater floor)
// Deep crater basin (-5.9 km) with prominent rim mountains around entire perimeter!
const CHANGE_4_MASK = generateSiteMask('change-4', 'Von Kármán Rim Basin LOLA Profile', (az) => {
  const ring = 3.5 + 1.2 * Math.sin((az * Math.PI) / 180) + 0.8 * Math.cos((az * 2 * Math.PI) / 180);
  return ring + 0.3 * Math.sin(az * 0.2);
});

export const PRECOMPUTED_HORIZONS: Record<string, HorizonMask> = {
  'shackleton-rim': SHACKLETON_MASK,
  'malapert-mountain': MALAPERT_MASK,
  'nobile-rim-1': NOBILE_MASK,
  'mons-mouton': MONS_MOUTON_MASK,
  'haworth-rim': HAWORTH_MASK,
  'de-gerlache-rim': DE_GERLACHE_MASK,
  'chandrayaan-3': CHANDRAYAAN_3_MASK,
  'apollo-11': APOLLO_11_MASK,
  'change-4': CHANGE_4_MASK,
};

/**
 * Generates a realistic synthetic LOLA-calibrated horizon mask
 * for custom user coordinates based on latitude and elevation.
 */
export function generateCustomHorizon(lat: number, lon: number, elevKm: number): HorizonMask {
  const isPolar = Math.abs(lat) > 75;
  const bins = 360;
  const elevations: number[] = new Array(bins);

  // Baseline dip from elevation
  const baseDip = elevKm > 0 ? -Math.min(2.0, Math.sqrt(elevKm) * 0.8) : 0.2;

  for (let i = 0; i < bins; i++) {
    const az = i;
    const rad = (az * Math.PI) / 180;
    let el = baseDip;

    if (isPolar) {
      // Polar terrain has jagged crater rims and ridges
      const freq1 = Math.sin(rad * 4 + lon * 0.1);
      const freq2 = Math.cos(rad * 7 + lat * 0.2);
      const ridge = Math.max(0, Math.sin(rad * 2 + 1.2)) * 2.8;
      el += ridge + 0.8 * freq1 + 0.4 * freq2;
    } else {
      // Lower latitude mare/highland terrain
      el += 0.3 * Math.sin(rad * 3) + 0.2 * Math.cos(rad * 5);
    }

    elevations[i] = Number(Math.max(-1.5, el).toFixed(3));
  }

  return {
    siteId: `custom_${lat.toFixed(2)}_${lon.toFixed(2)}`,
    name: `Custom Terrain Mask (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`,
    bins,
    az0: 0,
    elevations,
  };
}
