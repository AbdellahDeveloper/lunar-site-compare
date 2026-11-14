#!/usr/bin/env python3
"""
fetch_ephemeris.py

Offline tool to fetch and cache lunar ephemeris from satview / JPL Horizons
and convert to binary format specified in SPECS.md Section 4.1:
Header 32 bytes:
  - magic: b'LEPH' (4 bytes)
  - version: u32 (4 bytes)
  - startUnixMs: f64 (8 bytes)
  - stepSec: u32 (4 bytes)
  - count: u32 (4 bytes)
  - flags: u32 (4 bytes)
Body:
  - 6 x int32 per sample: [Sun_X, Sun_Y, Sun_Z, Earth_X, Earth_Y, Earth_Z]
    in units of 0.001 km (millimeters / milli-km scale) in Moon-fixed coordinates.
"""

import sys
import struct
import argparse
import datetime
import urllib.request
import json

def fetch_horizons_observer(lat: float, lon: float, start_date: str, stop_date: str, step_min: int = 30):
    """
    Fetches apparent Az/El from JPL Horizons API (Observer mode: CENTER='coord@301').
    """
    base_url = "https://ssd.jpl.nasa.gov/api/horizons.api"
    # Command 10 = Sun, 399 = Earth
    params = {
        "format": "json",
        "COMMAND": "'10'",
        "CENTER": "'coord@301'",
        "COORD_TYPE": "GEODETIC",
        "SITE_COORD": f"'{lon},{lat},0'",
        "START_TIME": f"'{start_date}'",
        "STOP_TIME": f"'{stop_date}'",
        "STEP_SIZE": f"'{step_min}m'",
        "QUANTITIES": "'4'", # Apparent Az/El
    }
    query = "&".join(f"{k}={v}" for k, v in params.items())
    url = f"{base_url}?{query}"
    print(f"Requesting JPL Horizons API: {url[:100]}...")
    req = urllib.request.Request(url, headers={"User-Agent": "LunarSiteCompare/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            return data.get("result", "")
    except Exception as e:
        print(f"Failed to fetch Horizons data: {e}", file=sys.stderr)
        return None

def write_binary_ephemeris(out_path: str, start_unix_ms: float, step_sec: int, samples: list):
    """
    Writes binary ephemeris file matching SPECS.md Section 4.1
    """
    magic = b'LEPH'
    version = 1
    count = len(samples)
    flags = 0

    header = struct.pack('<4sIdIII', magic, version, start_unix_ms, step_sec, count, flags)

    with open(out_path, 'wb') as f:
        f.write(header)
        for s in samples:
            # 6 x int32: sun_x, sun_y, sun_z, earth_x, earth_y, earth_z in 0.001 km
            # Convert km to milli-km
            sun_xyz = [int(v * 1000) for v in s['sun']]
            earth_xyz = [int(v * 1000) for v in s['earth']]
            f.write(struct.pack('<6i', *sun_xyz, *earth_xyz))

    print(f"Wrote {count} samples to {out_path} ({count * 24 + 32} bytes)")

def main():
    parser = argparse.ArgumentParser(description="Fetch and format lunar ephemeris")
    parser.add_argument("--start", default="2026-11-01", help="Start date YYYY-MM-DD")
    parser.add_argument("--stop", default="2027-01-01", help="Stop date YYYY-MM-DD")
    parser.add_argument("--step-min", type=int, default=30, help="Step in minutes")
    parser.add_argument("--out", default="ephemeris.bin", help="Output binary file")
    args = parser.parse_args()

    print(f"Lunar Ephemeris Pipeline initialized for window {args.start} to {args.stop} (step: {args.step_min}m)")

if __name__ == "__main__":
    main()

