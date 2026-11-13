# Lunar Site Compare: Specification

Status legend: **[BUILT]** in this repo and tested, **[SPEC]** specified, not yet built, **[VERIFY]** a fact or URL taken from memory that must be checked before relying on it.

---

## 1. Purpose

Let mission planners, educators and the public compare Moon landing sites and dates quickly: where the Sun and Earth are relative to the local horizon, how long each is up, how much power and Earth contact a site-date gives, and what changes if the schedule slips.

Primary users: **Planner** (numbers, comparison), **Explorer** (plain-language verdicts), **Learner** (why the south pole is hard).

## 2. Scope and status

| Capability | Status |
|---|---|
| Curated site catalog + custom lat/lon | [BUILT] (catalog small, coordinates [VERIFY]) |
| Date/time + window length, scrubber, play | [BUILT] |
| Sun/Earth elevation + azimuth, topocentric parallax, libration via IAU rotation model | [BUILT] |
| Sunset/rise, Earthset/rise with sub-second edge refinement | [BUILT] |
| Metrics: light %, longest light/dark, power proxies, Earth windows, both-up windows | [BUILT] |
| Countdown chips (time to next sunset/Earthset) | [BUILT] |
| Horizon panorama, sky plot, Gantt timeline (canvas) | [BUILT] |
| Up to 4 side-by-side scenarios, URL-hash sharing | [BUILT] |
| "What if it slips?" delta table | [BUILT] |
| Planner / Explorer modes | [BUILT] (Learn mode: text only) |
| LOLA horizon masks | [BUILT] loader + Python generator; **no mask data shipped**, UI says "flat horizon" until you generate them |
| Ephemeris from satview/SPICE binary files | [SPEC] (app uses astronomy-engine now; provider interface ready) |
| 2D map picker, Cesium 3D, PSR overlay | [SPEC] |
| Sensitivity heatmap, alternatives finder, season ribbon, CSV/PDF export | [SPEC] |

## 3. Data to collect

### 3.1 Sun and Earth positions seen from the Moon

| Item | Detail |
|---|---|
| Need | Sun and Earth vectors from the Moon's center, in a Moon-fixed frame, 2026 to 2030 |
| Source A (implemented) | `astronomy-engine` (npm). Geometric J2000 vectors for Sun and Moon, rotated to the body-fixed frame with the IAU 2009 lunar rotation model (section 5.2) |
| Source B (team's URL) | `https://satview.actgate.com/fcgi-bin/fprovweb?...observer=MOON&bodies=SUN,EARTH&start_utc_time=...&end_utc_time=...&step_sec=...&enable_sub_observer_pos=EARTH&cmd_script=satview_get_bodies_position.msh` |
| Source C (most precise) | SPICE: `de440.bsp`, `moon_pa_de440_*.bpc`, `moon_de440_*.tf`, `pck*.tpc` from NAIF (`naif.jpl.nasa.gov/pub/naif/generic_kernels/`) [VERIFY filenames]. Use `spiceypy` and the `MOON_PA` frame |
| Validation | JPL Horizons API `https://ssd.jpl.nasa.gov/api/horizons.api`, observer table, `CENTER='coord@301'`, `SITE_COORD='lon,lat,alt_km'`, `COMMAND='10'` (Sun) and `'399'` (Earth), quantity 4 (apparent az/el) [VERIFY parameters] |

How to collect from satview (Phase 0, do this first):
1. Save one response with `curl -o sample.txt "<url>"` and open it.
2. Record: frame (Moon-fixed or inertial), units (km or AU), time scale (UTC/TDB), column layout, whether the sub-observer columns are sub-Earth lat/lon.
3. If the frame is inertial, rotate with section 5.2 before use. If it is MOON_ME or MOON_PA, use directly. Note MOON_PA vs MOON_ME differ by about 0.03 degrees, which is fine for planning, not for pointing.
4. Run `scripts/fetch_ephemeris.py` (saves raw quarterly chunks at 30 minute steps). The parser is deliberately left to you because the response format has not been verified here.
5. Convert to the binary format in 4.1, then compare against the app's astronomy-engine output; accept if max angular error is under 0.05 degrees.

Step size rule: 30 minutes for the detailed set. The sample URL step (22,340 s, about 6.2 h) is too coarse for sunset times.

### 3.2 Terrain horizon profiles

| Item | Detail |
|---|---|
| Need | Maximum terrain elevation angle versus azimuth (500 to 1000 bins) per site |
| Source | LOLA gridded south-polar DEMs (polar stereographic, 20 m/px for 80S to 90S) from the PDS Geosciences Node, `pds-geosciences.wustl.edu`, LRO LOLA GDR `polar/south_pole` [VERIFY path/filename]. Higher-resolution (about 5 m) site tiles from the LOLA team page for key sites [VERIFY] |
| Tool | `scripts/build_horizons.py` (numpy, rasterio): ray-march outward to 60 km, include curvature drop, output `public/horizons/{siteId}.json` |
| Format | `{ "bins": 720, "az0": 0, "el": [deg, ...] }`, azimuth clockwise from north |
| Quality check | Overlay on a Quickmap hillshade; Shackleton rim sites should show high ridges toward the crater |

### 3.3 Site catalog

Fields: `id, name, agency, kind (past|planned|candidate), lat, lon, elevKm?, verified, note`.
Collect from: NASA LRO/LROC landing-site pages and Apollo mission reports, mission press kits, CLPS provider pages, ISRO, CNSA, JAXA publications [VERIFY each]. Longitudes are **east positive**. Apollo coordinates in `sites.ts` are from memory and marked `verified: true` only where I am confident to roughly 0.01 degrees; south pole candidates are approximate and marked `verified: false`.

### 3.4 Map and 3D tiles (spec only)

- 2D: `https://lroc-tiles.quickmap.io/tiles/wac_nac_nacroi/lunar-polarshifted-eqc/{z}/{x}/{y}.jpg`
- 3D: `https://dem-tiles.b-cdn.net/lunar/qts_demstack/lunar-polarshifted-eqc/mesh/{z}/{x}/{y}.terrain` (Cesium quantized-mesh)
- First-hour tests: fetch `layer.json`, determine the tile extent and y direction of `polarshifted-eqc`, test CORS (`curl -I -H "Origin: http://localhost:5173"`), render one tile in the right place. Cache what the demo needs; check usage terms.
- The Cesium `IAU2006_XYS` files are Earth orientation data and are **not needed**.

### 3.5 Other optional data

- Permanently shadowed region masks (LOLA illumination products) for an overlay [SPEC].
- Average illumination maps for validating "near-permanent light" peaks [SPEC].

## 4. Data formats

### 4.1 Binary ephemeris (for SPICE/satview path) [SPEC]
Little-endian. Header 32 bytes: magic `LEPH`, u32 version, f64 startUnixMs, u32 stepSec, u32 count, u32 flags. Body: per sample 6 x int32 (Sun xyz, Earth xyz) in units of 0.001 km, Moon-fixed. Served brotli-compressed. 4 years at 30 min is about 70k samples, about 1.7 MB compressed.

### 4.2 Provider interface [BUILT]
`src/engine/moon.ts` exports `bodyVectors(t): {sun, earth}` (km, Moon-fixed). Replace its implementation with a decoder of 4.1 without touching anything else.

## 5. Algorithms

### 5.1 Local frame
Site latitude phi, east longitude lambda, radius R = 1737.4 km (plus elevation).
- up = (cos phi cos lambda, cos phi sin lambda, sin phi)
- east = (-sin lambda, cos lambda, 0)
- north = (-sin phi cos lambda, -sin phi sin lambda, cos phi)
- Topocentric vector: v' = v - R*up (this is the Earth parallax correction, up to 0.26 degrees)
- elevation = asin(v'.up / |v'|), azimuth = atan2(v'.east, v'.north), clockwise from north

### 5.2 Moon-fixed frame (IAU 2009 / Archinal 2011 model) [BUILT]
d = days since J2000.0 TT (UTC used; the difference is about 69 s, negligible), T = d/36525. With the 13 angles E1..E13 and the published series for alpha0, delta0 and W (see `moon.ts`):
body = Rz(W) Rx(90 - delta0) Rz(90 + alpha0) x v_J2000.
This is the mean-axis-like IAU frame, within about 0.01 to 0.05 degrees of MOON_ME for libration purposes. Test `moon.test.ts` compares against `astronomy-engine`'s libration.

### 5.3 Visibility
- Sun visible if elevation + angular radius (asin(695700/d), about 0.27 degrees) > horizon(azimuth)
- Earth visible if center elevation > horizon(azimuth) (comm needs the dish line of sight; radius about 0.95 degrees can be added later)
- Horizon = terrain mask if loaded, else 0 minus the dip for site elevation h: acos(R/(R+h))

### 5.4 Events
Sample every `stepMin` (default 30), find flips of the visibility flag, refine each by bisection on the margin (about 0.4 s precision after 12 iterations). Output intervals with `openStart/openEnd` flags when the window cuts them.

### 5.5 Metrics
- Light % = visible time / window. Longest light, longest dark, count of sunsets.
- Power proxies (fraction of one-sun normal flux): horizontal panel = mean(max(0, sin el) when sun visible); vertical azimuth-tracking panel = mean(cos el when visible). Not a power model: no panel efficiency, thermal limits or shadow from the lander.
- Earth: visible %, longest window, longest outage, next Earthset.
- Both-up: intersection of the two interval lists.
- Slip table: the same metrics at date offsets of -29.5, -7, +7, +29.5 days.

### 5.6 Viability verdict [BUILT, simple]
Plain-language rules: Sun mostly down / grazing (mean elevation under 3 degrees) / healthy; Earth link continuous / intermittent / none. Thresholds are constants in `verdict.ts` for the team to tune. Do not present as a mission decision.

## 6. Architecture

```
Browser only, static hosting
  engine/   pure TS: moon.ts (frames), local.ts (el/az), series.ts, events.ts, metrics.ts, horizon.ts, verdict.ts
  data/     sites.ts
  state/    store.ts (zustand + URL hash)
  ui/       App, ScenarioCard, Timeline, Panorama, SkyPlot, Controls, SlipTable
  scripts/  fetch_ephemeris.py, build_horizons.py (offline)
```
Performance: body vectors for a window are computed once and shared by all scenarios (cache by start, length, step). Per-site work is trig on arrays. Canvas drawing only; no SVG node trees. [SPEC] move the series computation into a Web Worker (Comlink) once windows exceed a few months.
Budgets: 4 scenarios, 30 day window recompute under 250 ms; scrub at 60 fps (scrub only recomputes one state per scenario).

## 7. UI specification

- Top bar: mode (Planner/Explorer), UTC start, window days, terrain toggle, share link.
- Scenario row: up to 4 cards. Each card: site picker or custom lat/lon, verdict, countdown chips (Sun, Earth), metric table (Planner) or sentences (Explorer), panorama, sky plot, timeline.
- Bottom scrubber: time within the window, play/pause, speed.
- Slip panel: delta table for scenario 1.
- Accessibility: all controls keyboard reachable with visible focus, canvases have text equivalents (the metric table and chips), colors distinguishable by lightness not only hue, reduced-motion stops autoplay.

## 8. Testing and validation

- `npm test`: IAU frame vs libration (under 0.1 degree), Apollo 11 landing-time sun elevation sanity range, interval edge logic.
- Manual: compare 5 site-date points against JPL Horizons and Quickmap; record the max error in the README.
- Known-physics checks: polar sites show Sun elevation never above about 1.5 degrees plus the sub-solar latitude (within +/-1.54 degrees); sites on the near side see Earth almost fixed in the sky.

## 9. Delivery roadmap (remaining)

1. Phase 0 spikes: satview sample, tile CORS and tiling scheme.
2. Generate LOLA horizons for 5 to 10 sites; ship them in `public/horizons`.
3. Swap the ephemeris provider to the binary SPICE set if astronomy-engine accuracy is not enough.
4. 2D map picker, then lazy-loaded Cesium 3D.
5. Sensitivity heatmap and alternatives finder (ring of points x date offsets, scored by metrics).
6. Exports (CSV, PNG/PDF), Learn-mode tour, i18n.

## 10. Risks

| Risk | Mitigation |
|---|---|
| satview frame or format differs from assumption | Phase 0 spike; astronomy-engine path already works |
| Polar-shifted tiles not compatible with stock map/Cesium tilers | Spike first; fallback to a heightmap mesh from LOLA GeoTIFF |
| Third-party endpoints rate-limit or go down | Self-host everything needed for the demo |
| Wrong site coordinates | `verified` flag, source link per site, cross-check on Quickmap |
| Flat horizon misleads at the pole | UI states when no mask is loaded; terrain toggle disabled |

## 11. Attribution

NASA/LRO/LOLA, LROC (ASU), Quickmap, JPL Horizons/NAIF, `astronomy-engine` (MIT, Don Cross). Check each service's terms before hotlinking.
