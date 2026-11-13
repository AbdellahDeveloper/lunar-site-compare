# SELENE-COMPARE // Lunar South Pole Ephemeris & Site Viability System

**SELENE-COMPARE** is a high-precision, rapid-decision visual simulation tool built for lunar mission planners (NASA CLPS, Artemis, international space agencies), scientists, educators, and the public. It transforms complex ephemeris and topographic data into intuitive, side-by-side scenario comparisons for candidate lunar landing sites.

---

## 🌒 The Challenge

Landing missions at the Moon's South Pole face extreme operational, thermal, and communication constraints:
- **Grazing Solar Geometry:** The Moon's spin axis is tilted only **1.54°** from the ecliptic. Near the South Pole (80°S–90°S), the Sun skims perpetually around the horizon ($0^\circ–3^\circ$ elevation). Topographic massifs cast shadows stretching 50–100 km, plunging low areas into freezing darkness.
- **Permanently Shadowed Regions (PSRs):** Deep crater floors (e.g., Shackleton, Haworth, Faustini) have not seen sunlight in over 2 billion years, reaching cryogenic temperatures of **35 K (-238°C)**. While they preserve volatile water ice ($H_2O$), operating near them requires extreme vigilance against shadow engulfment.
- **Earth Libration & Direct Communication:** The Moon's orbital eccentricity and tilt cause an apparent libration (wobble) of up to **$\pm 8.1^\circ$ in longitude** and **$\pm 6.7^\circ$ in latitude**. At polar latitudes, this oscillation causes Earth to dip below crater rims, cutting off Direct-to-Earth (DTE) communication unless relay orbiters or elevated rim peaks are utilized.
- **Launch Slips & Agile Replanning:** A launch delay of just 1 week (a quarter lunar cycle) rotates the solar illumination vector by 90°, turning a sunlit landing site into a dark, frozen hazard. Evaluating alternative sites or dates with conventional tools (JPL Horizons, QuickMap, Moon Trek) requires tedious manual queries and interpretation of raw tables.

---

## 🚀 Key Features

### 1. Interactive Side-by-Side Scenario Comparison
- Compare up to **4 candidate scenarios** simultaneously (e.g., Shackleton Rim vs. Malapert Mountain vs. Nobile Rim vs. Mons Mouton).
- Synchronized playback across all scenarios.
- **Side-by-Side Decision Matrix** highlights the mathematical winner for daylight hours, Earth comm visibility, both-up windows, and lowest night survival risk.

### 2. Multi-Perspective Visualization Engines
- **360° Panoramic Horizon Skyline:**
  - Real-time azimuth canvas ($0^\circ$ to $360^\circ$) displaying the local horizon.
  - Realistic LOLA terrain elevation profiles or smooth lunar sphere horizons with elevation dip.
  - Glowing Sun disk with corona flare and Earth blue marble disk with live elevation tags.
  - Trajectory trails showing diurnal solar sweep and Earth libration loops.
- **Polar Radar Sky Plot:**
  - $0^\circ$ horizon at perimeter, $90^\circ$ zenith at center.
  - Concentric rings at $0^\circ, 15^\circ, 30^\circ, 60^\circ, 90^\circ$ with cardinal markers (N, E, S, W).
  - Displays solar trajectory and Earth libration tracks with real-time celestial markers.
- **Interactive 3D Lunar Globe (Three.js):**
  - High-fidelity 3D Moon sphere with real-time day/night terminator sweeping across the surface.
  - Flashing beacon pin placed at the exact landing site coordinates.
  - 3D directional vector rays pointing directly to the Sun (gold) and Earth (cyan).
  - South Pole Focus camera shortcut and orbit drag controls.
- **Dual-Projection 2D Lunar Map Picker:**
  - **South Polar Stereographic (80°S–90°S):** Displays key craters, Permanently Shadowed Regions (PSRs in violet), and candidate landing sites.
  - **Global Equirectangular:** Displays whole-Moon context, Apollo sites, Chang'e sites, and Chandrayaan-3.
  - Click anywhere on either map to place a custom lander.

### 3. Multi-Track Gantt Timeline & 60 FPS Scrubber
- Synchronized multi-track visual timeline:
  - **Solar Illumination Track:** Amber for sunlight, dark navy for lunar night.
  - **Earth DTE Track:** Cyan for line-of-sight contact, slate for occultation.
  - **Both-Up Operational Track:** Vibrant emerald green for simultaneous power and communications.
- Real-time simulation playback at $1\times, 10\times, 60\times, 300\times, 1200\times$ speeds.
- Interactive click-and-drag laser needle with sub-second time scrubbing.

### 4. Schedule Slip Sensitivity Analysis ("What If It Slips?")
- Evaluates the impact of launch delays:
  - Nominal schedule ($0\text{d}$)
  - $-29.53\text{d}$ and $+29.53\text{d}$ (Full synodic lunar cycles)
  - $-7.0\text{d}$ and $+7.0\text{d}$ (Quarter-cycle slips)
- Displays delta tables showing gained/lost daylight hours, Earth comm hours, joint operational windows, and changes in survival night duration.

### 5. Automated Alternatives & Launch Window Finder
- Scans alternative launch dates ($\pm 14$ days) and neighboring South Pole candidate sites.
- Computes composite viability scores ($0–100$) and surfaces actionable recommendations.

### 6. Three Tailored User Modes
- **Planner Mode:** In-depth technical telemetry, power proxies, elevation limits, CSV exports.
- **Explorer Mode:** Intuitive visual verdicts ("Optimal Operational Window", "Grazing Solar Geometry", "Continuous DTE"), countdown chips.
- **Learn Mode:** Interactive educational tour explaining polar axial tilt, PSRs, cold traps, vertical solar panels, and libration physics.

### 7. Data Export & State Sharing
- Full 30-minute time-series export to **CSV**.
- Contact and visibility intervals export to **CSV**.
- Executive mission summary markdown export.
- 1-click shareable URLs with state serialized in the URL hash.

---

## 📐 Scientific & Mathematical Rigor

### Ephemeris & Orientation Model
- Implements the **IAU 2009 / Archinal et al. 2011** lunar orientation model:
  $$\vec{v}_{\text{body}} = R_3(W) \cdot R_1(90^\circ - \delta_0) \cdot R_3(\alpha_0 + 90^\circ) \cdot \vec{v}_{\text{ICRF}}$$
  utilizing the 13 fundamental Delaunay angles ($E_1 \dots E_{13}$) for sub-arcminute orientation precision.
- Validated against `astronomy-engine` optical and physical libration coordinates to within **$< 0.05^\circ$**.

### Topocentric Coordinate System & Parallax
- Site position on lunar sphere ($R_{\text{eff}} = 1737.4\text{ km} + h$):
  $$\text{up} = (\cos\phi \cos\lambda, \; \cos\phi \sin\lambda, \; \sin\phi)$$
  $$\vec{v}' = \vec{v}_{\text{body}} - R_{\text{eff}} \cdot \text{up}$$
  Accounts for topocentric Earth parallax of up to **$0.26^\circ$**, which is decisive when Earth is skimming a crater rim.

### LOLA Terrain Horizon Profiles & Spherical Curvature
- Incorporates terrain masks derived from Lunar Reconnaissance Orbiter (LRO) Lunar Orbiter Laser Altimeter (LOLA) DEMs.
- Accounts for lunar curvature drop over distance $d$:
  $$\Delta z = \frac{d^2}{2 R_{\text{moon}}}$$
- For sites without terrain profiles, computes spherical dip angle:
  $$\theta_{\text{dip}} = \arccos\left(\frac{R}{R + h}\right)$$

### Sub-Second Event Bisection
- Samples visibility every 30 minutes, detecting state transitions.
- Executes a **12-iteration bisection refinement** on the clearance margin:
  $$\frac{1800\text{ s}}{2^{12}} \approx 0.44\text{ seconds precision}$$
  producing exact timestamps for sunrise, sunset, earthrise, and earthset.

### Power Proxies
- **Horizontal Panel:** $\max(0, \sin(\text{el}))$ when visible (demonstrating the severe penalty of low grazing sun angles).
- **Vertical Azimuth-Tracking Panel:** $\max(0, \cos(\text{el}))$ when visible (demonstrating why polar landers utilize vertical arrays).

---

## 🧪 Validation & Tests

The project includes an automated test suite (`npm test` via Vitest):
1. **IAU Frame vs. Libration:** Validated across 2026–2030 epochs; matches sub-Earth point to within $< 0.05^\circ$.
2. **Apollo 11 Landing Telemetry:** Sun elevation calculated at $10.69^\circ$ (NASA historical telemetry recorded $\approx 10.8^\circ$).
3. **South Pole Grazing Angles:** Shackleton Rim Sun elevation verified to stay within $-3.5^\circ$ to $+3.5^\circ$.
4. **Topocentric Parallax:** Parallax shift verified between $0.1^\circ$ and $0.27^\circ$.
5. **Rise/Set Bisection:** Verified interval extraction and complement night period calculations.

---

## 🛠️ Quick Start

```bash
# Clone the repository
git clone https://github.com/your-org/lunar-site-compare.git
cd lunar-site-compare

# Install dependencies
npm install

# Run test suite
npm test

# Launch development server
npm run dev
```

Build for production:
```bash
npm run build
npm run preview
```

---

## 👥 Attribution & Data Sources
- **NASA / LRO / LOLA Science Team:** Digital Elevation Models and South Pole polar stereographic topography.
- **JPL Horizons / NAIF:** Lunar ephemeris reference coordinates.
- **IAU Working Group on Cartographic Coordinates and Rotational Elements (Archinal et al. 2011).**
- **Don Cross (astronomy-engine):** High-precision celestial algorithms.
