/**
 * NASA JPL Horizons REST API Client
 *
 * Connects directly to the NASA Jet Propulsion Laboratory Solar System Dynamics (SSD)
 * Horizons API (https://ssd.jpl.nasa.gov/api/horizons.api) to retrieve high-precision
 * apparent topocentric azimuth and elevation for the Sun (10) and Earth (399) as viewed
 * from any selenographic coordinates on the lunar surface (Center: coord@301).
 *
 * Ephemeris Source: NASA DE441 / JPL Lunar Ephemeris.
 */

export interface HorizonsDataPoint {
  timeMs: number;
  dateStr: string;
  azimuthDeg: number;
  elevationDeg: number;
}

const HORIZONS_API_BASE = 'https://ssd.jpl.nasa.gov/api/horizons.api';

// In-memory cache key: `${body}_${lat.toFixed(3)}_${lon.toFixed(3)}_${startIso}_${endIso}_${stepMin}`
const horizonsCache = new Map<string, HorizonsDataPoint[]>();

/**
 * Parses the NASA Horizons $$SOE to $$EOE tabular output block.
 * Typical line format:
 * 2026-Nov-14 00:00 *i   89.829245   1.575925
 */
export function parseHorizonsBlock(responseText: string): HorizonsDataPoint[] {
  const points: HorizonsDataPoint[] = [];

  if (!responseText.includes('$$SOE') || !responseText.includes('$$EOE')) {
    return points;
  }

  const tableBlock = responseText.split('$$SOE')[1].split('$$EOE')[0];
  const lines = tableBlock.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Split on whitespace: Date, Time, Flags (optional), Azimuth, Elevation
    const parts = trimmed.split(/\s+/);
    if (parts.length >= 4) {
      // parts[0] = '2026-Nov-14', parts[1] = '00:00'
      const datePart = parts[0];
      const timePart = parts[1];
      const dateStr = `${datePart} ${timePart} UTC`;
      const timeMs = new Date(dateStr).getTime();

      // Find the last two numeric columns which correspond to Azimuth and Elevation (QUANTITIES='4')
      const numericParts = parts.filter((p) => !isNaN(Number(p)) && p !== '');
      if (numericParts.length >= 2) {
        const az = parseFloat(numericParts[numericParts.length - 2]);
        const el = parseFloat(numericParts[numericParts.length - 1]);

        if (!isNaN(timeMs) && !isNaN(az) && !isNaN(el)) {
          points.push({
            timeMs,
            dateStr,
            azimuthDeg: az,
            elevationDeg: el,
          });
        }
      }
    }
  }

  return points;
}

/**
 * Queries NASA JPL Horizons API for a specific target body seen from a lunar coordinate.
 * @param body '10' for Sun, '399' for Earth
 */
export async function queryHorizonsEphemeris(
  body: '10' | '399',
  lat: number,
  lon: number,
  elevKm: number,
  startIso: string,
  endIso: string,
  stepMin: number = 60
): Promise<HorizonsDataPoint[]> {
  const cacheKey = `${body}_${lat.toFixed(3)}_${lon.toFixed(3)}_${startIso}_${endIso}_${stepMin}`;
  if (horizonsCache.has(cacheKey)) {
    return horizonsCache.get(cacheKey)!;
  }

  // Format dates for Horizons: YYYY-MM-DD HH:MM
  const formatHorizonsDate = (iso: string) => {
    const d = new Date(iso);
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(d.getUTCDate()).padStart(2, '0');
    const hh = String(d.getUTCHours()).padStart(2, '0');
    const min = String(d.getUTCMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
  };

  const startStr = formatHorizonsDate(startIso);
  const endStr = formatHorizonsDate(endIso);

  // SITE_COORD format: 'lon,lat,elevKm' (East longitude positive)
  const siteCoord = `'${lon.toFixed(4)},${lat.toFixed(4)},${elevKm.toFixed(2)}'`;

  const params: Record<string, string> = {
    format: 'json',
    COMMAND: `'${body}'`,
    MAKE_EPHEM: "'YES'",
    EPHEM_TYPE: "'OBSERVER'",
    OBJ_DATA: "'NO'",
    CENTER: "'coord@301'", // Moon center-relative geodetic observer
    COORD_TYPE: "'GEODETIC'",
    SITE_COORD: siteCoord,
    START_TIME: `'${startStr}'`,
    STOP_TIME: `'${endStr}'`,
    STEP_SIZE: `'${stepMin}m'`,
    QUANTITIES: "'4'", // Apparent azimuth and elevation
  };

  const queryString = Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');

  const url = `${HORIZONS_API_BASE}?${queryString}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

    const resp = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });
    clearTimeout(timeoutId);

    if (!resp.ok) {
      throw new Error(`NASA Horizons HTTP ${resp.status}`);
    }

    const data = await resp.json();
    const rawResult = data.result || '';
    const points = parseHorizonsBlock(rawResult);

    if (points.length > 0) {
      horizonsCache.set(cacheKey, points);
      return points;
    }
    return [];
  } catch (err) {
    // Return empty on failure to allow seamless IAU fallback
    return [];
  }
}

