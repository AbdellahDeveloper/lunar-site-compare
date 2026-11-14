# Functional & Technical Specification: Lunar Mission Feasibility & Visualization Tool

## 1. Product Vision & Scope

This specification defines an interactive 3D lunar mission feasibility, illumination, and scientific exploration tool (extending the **Lunar Site Compare** architecture). Unlike static 2D map viewers, the platform pairs real-time celestial mechanics and terrain-aware ray-tracing with distinct scientific exploration layers—surface rockiness via thermal inertia and potential water-ice deposits via volatile abundance—alongside machine-learning-accelerated shadow approximation and Monte Carlo risk assessment.

### Core Objectives
* **Intuitive Spatial Comprehension:** Combine a persistent 3D lunar globe with simplified orbital arcs and time-lapse shadow transitions so users immediately grasp how solar and terrestrial mechanics drive surface lighting.
* **Rigorous Mission Engineering:** Support exact UTC timestamp entry, terrain-accurate solar illumination and Direct-to-Earth (DTE) line-of-sight calculations, and side-by-side A/B landing site comparisons.
* **Distinct Scientific Value:** Elevate operational planning into an exploration resource by overlaying thermophysical rock-abundance hazards and polar volatile/ice indicators.
* **Fluid Interactivity:** Maintain responsive, real-time scrubbing across multi-day or multi-year lunar windows using pre-computed datasets and optional ML surrogate approximation.

---

## 2. Data Sources & Ingestion Pipeline

All external datasets are ingested via automated Python preprocessing pipelines and packaged into compact, client-ready formats.

| Domain | Dataset / Service | Primary Purpose | Source |
| :--- | :--- | :--- | :--- |
| **Surface Topography** | NASA LOLA Gridded Data (PDS / SLDEM2015 / `MOON_PA`) | High-resolution polar elevation grids for ray-tracing, slope/roughness, and 720-bin horizon masks | [LRO LOLA PDS Node](https://pds-geosciences.wustl.edu/missions/lro/lola.htm), [SLDEM2015](https://pgda.gsfc.nasa.gov/products/54) |
| **3D Globe & Terrain** | Cesium Moon 3D Tileset & CesiumJS (`Ellipsoid.MOON`, $R = 1,737.4\text{ km}$) | Persistent 3D lunar globe rendering, terrain streaming, and click-to-pick surface coordinates | [Cesium Moon](https://cesium.com/platform/cesium-ion/content/cesium-moon/), [CesiumJS](https://cesium.com/platform/cesiumjs/) |
| **Celestial Ephemeris** | NASA/JPL Horizons System & REST API | High-precision Sun and Earth state vectors for any mission epoch, packaged into compact binary (`LEPH`) chunks | [JPL Horizons System](https://ssd.jpl.nasa.gov/horizons/), [Horizons API](https://ssd-api.jpl.nasa.gov/doc/horizons.html) |
| **Thermal Inertia & Rockiness** | LRO Diviner Lunar Radiometer Experiment (`LRO-L-DLRE-5-GDR-V1.0` / GDR L3) | Nighttime regolith temperature and rock abundance mapping to assess landing/rover surface hazards | [LRO Diviner PDS](https://pds.nasa.gov/ds-view/pds/viewProfile.jsp?dsid=LRO-L-DLRE-5-GDR-V1.0), [Diviner Science](https://www.diviner.ucla.edu/science) |
| **Volatile Abundance & Ice** | LRO Lunar Exploration Neutron Detector (LEND) & PSR Cold-Trap Overlays | Epithermal/thermal neutron suppression mapping to highlight potential near-surface hydrogen and water-ice deposits | [NASA Moon Water & Ices](https://science.nasa.gov/moon/moon-water-and-ices/), [LEND South Pole](https://svs.gsfc.nasa.gov/4057/) |

### Coordinate & Reference Frame Pipeline
1. **Ephemeris Transformation:** Query J2000 solar and terrestrial vectors from [JPL Horizons](https://ssd.jpl.nasa.gov/horizons/) and transform them into the lunar body-fixed Mean Earth / Polar Axis (`MOON_ME`) frame using IAU 2009 orientation parameters.
2. **Topocentric Parallax Correction:** Adjust Sun and Earth apparent elevation and azimuth angles for the observer's exact selenographic latitude, longitude, and [LOLA](https://pds-geosciences.wustl.edu/missions/lro/lola.htm) surface elevation.
3. **Horizon Mask Pre-Computation:** Sample LOLA digital elevation models around candidate sites and grid cells to generate 720-bin ($0.5^\circ$ azimuthal resolution) topographic horizon elevation masks for instant ray-horizon intersection.

---

## 3. Functional Mechanics & Simulation Engine

### 3.1 Dynamic Ray-Tracing & Line-of-Sight Engine
* **Solar Illumination:** Evaluates solar disc visibility (0% to 100% fractional disc illumination, accounting for the Sun's $\sim 0.267^\circ$ angular radius) by ray-tracing / intersecting the topocentric solar vector against the local [LOLA](https://pds-geosciences.wustl.edu/missions/lro/lola.htm) terrain horizon.
* **Direct-to-Earth (DTE) Communication:** Computes Earth visibility and elevation angle above the local topographic horizon, factoring in lunar libration to identify communication blackouts and elevation margins.
* **Event Detection:** Uses iterative bisection (e.g., 12-iteration root finding) to pinpoint exact UTC timestamps for local sunrise, sunset, Earthrise, and Earthset events.

### 3.2 Machine Learning Shadow & LOS Approximation
While the physics engine computes exact ray-traced ground truth, an ML surrogate layer accelerates real-time exploration:
* **Purpose:** Rapidly approximate complex terrain shadow patterns and DTE line-of-sight across wide regions without stalling the browser UI during continuous timeline scrubbing or multi-site sweeps.
* **Training Data:** Trained offline on pre-computed ray-traced datasets generated from [LOLA](https://pds-geosciences.wustl.edu/missions/lro/lola.htm) elevation patches and [JPL Horizons](https://ssd.jpl.nasa.gov/horizons/) solar/Earth azimuth-elevation sweeps.
* **Hybrid Execution Mode:**
  * *Interactive Scrubbing:* Uses the ML surrogate or pre-computed grid interpolation for 60 fps visual feedback.
  * *Precision Verification:* Automatically snaps to or validates against exact ray-traced / horizon-mask physics when the user pauses on a timestamp or exports a mission report.

### 3.3 Pre-Computed Datasets
To eliminate runtime API bottlenecks, the build pipeline pre-generates:
* Compact binary ephemeris tables (`LEPH`) covering multi-year mission windows.
* 720-bin horizon masks for curated landing sites (e.g., Artemis South Pole candidates, CLPS targets, historic landing sites).
* Pre-baked cumulative illumination and shadow-density tiles for rapid heatmap rendering.

### 3.4 Predictive Analytics & Monte Carlo Risk Assessment
To move beyond static snapshots, the engine includes stochastic and long-term analysis tools:
* **Long-Term Lighting Trends:** Simulates illumination and DTE duty cycles across full lunar synodic and draconic cycles to identify seasonal peaks and worst-case winter eclipses.
* **Monte Carlo Risk Assessment:** Runs $N$ randomized trials perturbing mission parameters—such as launch/landing schedule slips ($\Delta t$), landing ellipse dispersion ($\Delta \text{lat}, \Delta \text{lon}$), and minimum power/comm elevation thresholds—to output:
  * Probability of meeting minimum continuous sunlight requirements.
  * Distribution of maximum consecutive darkness hours (thermal survival risk).
  * Probability of uninterrupted DTE communication during critical surface operations.
* **Optional Operational Window Constraints:** Allows users to filter or constrain surface zones and rover traverse corridors to areas with guaranteed simultaneous power and DTE coverage.

### 3.5 A/B Site Comparison Engine
Computes side-by-side deltas between **Point A** and **Point B** over any user-defined `[Start Time, End Time]` window:
* Total illuminated hours (%) and longest continuous sunlit / dark intervals.
* DTE visibility duration (%) and simultaneous Power + DTE overlap.
* Mean [Diviner](https://pds.nasa.gov/ds-view/pds/viewProfile.jsp?dsid=LRO-L-DLRE-5-GDR-V1.0) rock abundance / thermal inertia hazard score.
* Proximity to [LEND](https://svs.gsfc.nasa.gov/4057/) volatile/hydrogen anomalies and Permanently Shadowed Regions (PSRs).

---

## 4. User Interface (UI) & UX Architecture

The interface follows **layered progressive disclosure**: the 3D lunar globe and essential mission telemetry remain clean and unobstructed at all times, while advanced scientific overlays, ML controls, and risk-analysis panels expand on demand.

### 4.1 Primary Layout & Viewport Hierarchy
| Region | Component | Behavior & Disclosure Level |
| :--- | :--- | :--- |
| **Center Canvas (100% Viewport)** | [CesiumJS](https://cesium.com/platform/cesiumjs/) 3D Moon Globe | Persistent interactive 3D terrain, real-time directional sunlight, PSR polygons, and click-to-pick surface pins. |
| **3D Sky & Orbital Overlay** | Simplified Orbital Arcs | Lightweight, toggleable 3D arcs showing apparent Sun and Earth paths, libration bounds, and live directional ray polylines from the selected site. |
| **Top-Left / Top-Right HUD** | Color-Coded Power & Comm Status HUD | Always-visible compact telemetry badges showing live solar %, power state, DTE link status, and active scientific layer values. |
| **Bottom Dock** | Synchronized Timeline Scrubber | Unified playback bar with continuous time slider, time-lapse controls, and direct UTC timestamp text inputs. |
| **Left Collapsible Drawer** | Target Selector (A/B) & Layer Controls | Curated + free-form Point A/B pickers and progressive toggles for Thermal Inertia, Volatile Abundance, and Shadow Density overlays. |
| **Right Collapsible Drawer** | A/B Comparison, Skyplot & Monte Carlo | Expands on demand to show side-by-side comparison tables, 360° horizon panorama / polar skyplot, and Monte Carlo risk histograms. |

### 4.2 Synchronized Timeline Scrubber & Direct Text Entry
To balance exploratory browsing with rigorous mission planning, time selection unifies two synchronized controls:
* **Continuous Fluid Slider:** Dragging scrubs smoothly across the selected mission window, updating 3D shadows, orbital arcs, and HUD telemetry in real time (powered by pre-computed masks / ML approximation).
* **Time-Lapse Playback Controls:** Play/pause button with selectable speed multipliers (e.g., `1 hr/s`, `6 hr/s`, `1 Earth day/s`) to watch shadow transitions sweep across crater rims.
* **Direct Timestamp Text Entry:** Editable UTC input fields (`YYYY-MM-DDTHH:MM:SSZ`) for **Start Time**, **End Time**, and **Current Epoch**. Typing a timestamp immediately repositions the slider and triggers exact physics verification; dragging the slider updates the text fields live.

### 4.3 Point A & Point B Target Selection
Users can select targets for single-site inspection or A/B comparison via two complementary workflows:
1. **Curated Pre-Filtered List:** A searchable dropdown/list of notable landing sites (e.g., Artemis III/IV candidates, Shackleton Rim, Malapert Massif, Mons Mouton) dynamically tagged with a live status badge indicating whether each site is **currently illuminated**, **in partial penumbra**, or **in shadow** at the active timestamp—allowing users to filter specifically for "Lit Now" targets.
2. **Free-Form Selection:** Click-to-pick anywhere on the 3D [Cesium Moon](https://cesium.com/platform/cesium-ion/content/cesium-moon/) globe or enter exact selenographic coordinates (`Lat`, `Lon`) manually.

### 4.4 Shadow Transition Visualization
To turn static terrain geometry into dynamic operational insight, the tool provides two shadow-transition modes:
* **Time-Lapse Playback Overlays:** Real-time animated shadow casting across the 3D terrain as the scrubber advances, highlighting how specific ridges and crater walls block sunlight over a lunar day.
* **Cumulative Shadow Density Maps:** A 2D/3D heatmap draped over the terrain aggregating shadow frequency across the `[Start Time, End Time]` window. Areas in near-permanent light vs. transient shadow vs. Permanently Shadowed Regions (PSRs) are immediately distinguishable.

### 4.5 Color-Coded Power, Communication & Science HUD
All status indicators use high-contrast, color-blind-safe gradients with explicit numeric readouts:

| HUD Metric | Color Gradient / State | Meaning & Thresholds |
| :--- | :--- | :--- |
| **Power Status (Solar)** | **Emerald Green** (`> 75%` disc) $\rightarrow$ **Amber** (`10%–75%` partial) $\rightarrow$ **Crimson Red** (`< 10%` / eclipse) | Indicates real-time solar array generation potential and warning thresholds for battery-only survival. |
| **DTE Communication** | **Cyan / Sky Blue** (Clear LOS, $> 5^\circ$ elev.) $\rightarrow$ **Yellow** (Marginal, $0^\circ–5^\circ$) $\rightarrow$ **Slate Gray** (Occluded) | Shows Direct-to-Earth optical/RF link availability accounting for local terrain and lunar libration. |
| **Thermal Inertia / Rockiness** | **Cool Indigo** (Smooth regolith fines) $\rightarrow$ **Warm Orange / Magenta** (High [Diviner](https://pds.nasa.gov/ds-view/pds/viewProfile.jsp?dsid=LRO-L-DLRE-5-GDR-V1.0) rock abundance) | Highlights boulder-rich terrain and elevated thermal/landing hazards. |
| **Volatile / Ice Potential** | **Transparent** (Dry) $\rightarrow$ **Electric Teal / Ice Blue** (High [LEND](https://svs.gsfc.nasa.gov/4057/) hydrogen / PSR cold trap) | Flags scientifically high-value prospecting zones for ISRU and ice sampling. |

### 4.6 Simplified Orbital Arcs
* **Visual Design:** Thin, semi-transparent 3D arcs rendered above the lunar horizon in [CesiumJS](https://cesium.com/platform/cesiumjs/), tracing the Sun's ecliptic path and Earth's libration figure-eight box over the active time window.
* **Purpose:** Gives users an intuitive mental model of why illumination shifts and why DTE links dip behind specific terrain features, without cluttering the viewport with full-scale solar system orbits.

---

## 5. Technical Architecture & Non-Functional Requirements

### 5.1 System Stack
* **Frontend:** TypeScript, [CesiumJS](https://cesium.com/platform/cesiumjs/) (with `Cesium.Ellipsoid.MOON`), WebGL/HTML5 Canvas for polar skyplots, horizon panoramas, and cumulative shadow density overlays.
* **Simulation & ML Layer:** Client-side TypeScript physics engine (`moon.ts`, `local.ts`, `horizon.ts`, `events.ts`, `metrics.ts`) paired with an optional lightweight inference runtime (e.g., ONNX Runtime Web / WebGPU or FastAPI microservice) for ML shadow approximation and batched Monte Carlo trials.
* **Offline Data Pipeline (Python):** Automated ingestion scripts querying [NASA PDS](https://pds-geosciences.wustl.edu/missions/lro/lola.htm) ([LOLA](https://pds-geosciences.wustl.edu/missions/lro/lola.htm), [Diviner](https://pds.nasa.gov/ds-view/pds/viewProfile.jsp?dsid=LRO-L-DLRE-5-GDR-V1.0), [LEND](https://svs.gsfc.nasa.gov/4057/)) and [JPL Horizons](https://ssd-api.jpl.nasa.gov/doc/horizons.html) to build horizon masks, `LEPH` binary ephemeris files, and ML training datasets.

### 5.2 Performance & Reliability Targets
* **Scrubbing Frame Rate:** $\ge 60\text{ fps}$ during continuous timeline scrubbing and time-lapse playback using pre-computed horizon masks and ML shadow approximation.
* **Deterministic Physics:** Exact ray-traced / horizon-mask calculations must remain reproducible to within sub-minute precision for sunrise/sunset and Earthrise/Earthset events against [JPL Horizons](https://ssd.jpl.nasa.gov/horizons/) ephemerides.
* **Progressive Loading:** Core 3D globe and curated site data load first; high-resolution scientific overlays (thermal inertia, volatile abundance, cumulative shadow density) stream lazily when toggled on.
* **Accessibility:** All HUD gradients pair color with numeric percentages, status labels, and WCAG-compliant text contrast ($\ge 4.5:1$).
