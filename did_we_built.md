1. What NASA is actually asking you to build
The official challenge is Lunar Landing Site Navigator.

NASA wants a tool that lets mission planners, educators, and the public compare potential lunar south-pole landing sites across different dates. Its central purpose is to make two questions easy to answer:
1. Power: When will the Sun be above the horizon, and for how long could a lander receive sunlight?
2. Communications: When will Earth be visible above the horizon, allowing a lander to communicate directly with Earth?
The app should let someone change the location and date, see the positions of the Sun and Earth relative to the horizon, and compare the resulting opportunities.

This is important: a general Moon explorer, a 3D model of the lunar surface, or an AI chatbot about Artemis would not adequately answer the challenge. Your central product must be a useful landing-site and time-window comparison tool. 
spaceappschallenge.org+1

2. A research finding that could give your team an advantage
I found a particularly relevant scientific paper published on February 27, 2026:

Assessing Potential Landing Sites With Favorable Illumination and Accessible, Potentially Volatile-Rich Permanently Shadowed Regions Within Artemis Candidate Landing Regions.

It identifies 130 representative candidate landing sites across 16 Artemis candidate regions. These sites were selected to meet Human Landing System landing constraints and provide access to permanently shadowed regions (PSRs) within a 2 km walking radius. The study evaluates illumination and simultaneous Sun/Earth visibility across the 2025–2032 midsummers. 
Wiley Online Library+1


Some particularly useful engineering constraints from the research:
- Landing slope should be less than 8° (with less than 5° being the stated goal).
- Suitable areas should be at least 100 m away from terrain steeper than 8°.
- 125 of the 130 selected sites had slopes below 5°.
- A 2 km radius was used for astronaut exploration without a rover.

Wiley Online Library+1
My recommendation: build a tool that answers the NASA challenge first, but design its site comparison around actual mission constraints. Then add one carefully selected extra dimension: access to nearby permanently shadowed regions. This could make your work more scientifically meaningful than a basic Sun/Earth visualization.

3. Important: use NASA's updated nine landing regions
There is a detail that could easily cause your team to use outdated information.

NASA originally announced 13 Artemis III candidate regions in 2022. It subsequently narrowed the list to nine regions, announced on October 28, 2024.

The current nine are:








spaceconnectonline.com.au


Region	Code
Peak near Cabeus B	PCB
Haworth	HW
Malapert Massif	MMA
Mons Mouton Plateau	MMP
Mons Mouton	MMO
Nobile Rim 1	NR1
Nobile Rim 2	NR2
de Gerlache Rim 2	dGR2
Slater Plain	SP

These are the regions NASA currently identifies for Artemis III. They are not ranked in order of preference. 
NASA+1


What this means for your implementation:

The 2026 research dataset contains 130 candidate landing points across 16 regions. Some correspond to older candidate regions that were removed from the Artemis III shortlist.

I recommend filtering the 130 points to the 78 points belonging to the nine current regions for the main Artemis III interface. Keep the other research locations as an optional archive for future exploration.

That is a much more defensible approach than presenting all 130 as current Artemis III candidates. 
luna-nav---7e811dd3.base44.app+1

4. Dataset investigation: what you should actually use
I have identified five particularly useful data sources. These are not all equivalent: some provide live calculations, others provide terrain, and others contain precomputed scientific results.
A. JPL Horizons — the calculation engine










JPL Horizons
Free API · No API key
NASA Jet Propulsion Laboratory

API endpoint · Documentation


This should be the mathematical foundation of your project.

It can calculate apparent positions of astronomical objects from a specified observer location, including a location on the lunar surface.

The three object identifiers you need are:
Object	Horizons identifier
Moon (observer's central body)	301
Sun (target)	10
Earth (target)	399

The critical part is the observer configuration.

Use:
CENTER       = coord@301
COORD_TYPE   = GEODETIC
SITE_COORD   = longitude,latitude,altitude
EPHEM_TYPE   = OBSERVER
QUANTITIES   = 4


The coordinates are in degrees, with east longitude positive, and altitude in kilometres.

For example, the NASA Space Data Atlas starter uses longitude 0°, latitude −89.5°, and altitude 0 km.

Quantity 4 returns:
- Azimuth: clockwise from local north.
- Elevation: angle above or below the geometric local horizon.
- The two values are in degrees.
You make two requests, one for the Sun and another for Earth, over the same selected time range. You can request samples every 15 minutes, 30 minutes, or one hour. 
ssd-api.jpl.nasa.gov+3


What you get: a table of time, azimuth and elevation for the Sun and Earth.

What you do with it: calculate when each object is visible, plot its trajectory across the sky, calculate lighting and communication opportunities, and compare landing sites.

One important limitation: Horizons provides the position relative to a geometric horizon. It does not automatically determine whether an actual mountain ridge blocks the object.
B. NASA LOLA — the terrain database










LOLA
Public data · GeoTIFF
NASA Goddard Planetary Geodesy Data Archive
High-resolution terrain archive

This is one of the most important sources I found.

NASA provides high-resolution digital elevation models for south-pole landing regions.






















7











The archive contains multiple products for each region:
Data product	What it contains	How you can use it
LDEM	Elevation	Calculate terrain horizon
Slope	Surface inclination in degrees	Identify steep terrain
LDEC	Number of LOLA observations per pixel	Assess data coverage
Total Z uncertainty	Elevation uncertainty	Display confidence
Slope uncertainty	Slope uncertainty	Avoid false precision
Clones	100 alternative terrain realizations	Test sensitivity to elevation errors
XYZI	Adjusted elevation point cloud	Additional terrain analysis

The principal products are 5 m/pixel GeoTIFFs in south-polar stereographic coordinates, using the lunar mean-Earth reference frame and DE421 ephemeris. 
pgda.gsfc.nasa.gov+1


There is an important scientific caveat: approximately 90% of the interpolated 5 m pixels in these DEMs are filled through interpolation between laser-altimeter observations. The nominal raster pixel size should not be mistaken for a uniformly measured 5 m terrain resolution.

The published median RMS height uncertainty is approximately 0.30–0.50 m, while median RMS slope uncertainty is approximately 1.5–2.5°. 
pgda.gsfc.nasa.gov+1


My recommendation: use these DEMs to build a small, genuine terrain-horizon model for two or three candidate locations. Do not attempt to process every region's full-resolution terrain during the hackathon.
C. NASA polar illumination and Earth-visibility products










NASA PGDA — Lunar Polar Illumination
Public GeoTIFF / COG
NASA Goddard
Dataset and downloads

This dataset answers a different question from Horizons.

Instead of calculating what the Sun is doing at one exact date, NASA provides average visibility information over a lunar nutation cycle of approximately 18.6 years.

The available southern-polar map resolutions include:
Latitude coverage	Resolution
65°S–90°S	240 m/pixel
75°S–90°S	120 m/pixel
85°S–90°S	60 m/pixel

There are separate maps for average solar illumination, permanent shadow, average Earth visibility, and sky visibility. GeoTIFF and Cloud-Optimized GeoTIFF formats are available. 
Lunar Polar Illumination+1









space.com


This is a useful type of visualization to reproduce.

You can immediately identify areas where solar visibility is consistently better, compare them with candidate regions, and overlay your landing points.

Important limitation: these are long-term average products. Do not use them to claim that a location will receive sunlight at a particular hour on a particular date.
D. The 2026 research dataset on Zenodo










Wueller et al. (2026) — complementary research data
Open research dataset
University of Münster / Zenodo
Open the dataset

I inspected the published file inventory and its documented structure.
File	Published size	Contents
Landing_Sites.zip	11.9 MB	Candidate-site shapefile and suitable-landing-area raster
Illumination_Modeling.zip	10.7 MB	Illumination rasters for 16 regions and 2025–2032
PSR_Volatile_Estimates.zip	43.9 kB	Permanently shadowed region data and volatile estimates
Diffusion_Modeling_Crater_Ages_Soderblom.xlsx	19.9 kB	Modeled crater ages

The landing-site and illumination archives also include ArcGIS layer files for retaining the original visualization styles. The PSR data identifies accessible permanently shadowed regions and their estimated volatile abundance. 
Zenodo+2


This is particularly valuable because you can obtain:
- Real candidate-site coordinates.
- Areas satisfying landing constraints.
- Year-dependent illumination maps.
- Locations of potentially interesting permanently shadowed regions.
- Estimates of volatile abundance and crater age where available.
My advice is to download these archives before doing any advanced calculations. The candidate-site dataset alone could save your team several hours.
E. Moon Trek — the visual data interface










NASA Moon Trek
Public mapping platform
NASA / JPL
Open Moon Trek

Moon Trek has a lunar south-pole projection, LRO WAC mosaics, terrain-related layers and other scientific tools.

Two useful map layers identified for this challenge are:
WAC_POLE_ILL_PCT_SOUTH_100M
AVGVISIB_85S_060M_201608_EARTH_SP


The first is the south-polar illumination layer; the second represents average Earth visibility. They can be accessed through NASA's WMTS tile service. 
trek.nasa.gov+1


I would use Moon Trek data for the application's visual geographic context, but not make your application dependent on Moon Trek's entire interface.

5. Competitive research: what already exists?
This is probably the most important strategic discovery of the research.

I found two publicly indexed projects working in the same challenge space. This does not prove they are registered competitors at your local event, but it tells us which ideas are already being explored.










1. LunaNav
Explore LunaNavIt uses the 78-site shortlist, eight midsummer periods from 2025 to 2032, and published Sun/Sun-plus-Earth visibility statistics. It also ranks sites using a weighted scoring method.

Its apparent gap: it does not calculate actual local terrain obstruction, detailed arbitrary-date sky geometry, equipment-dependent power or communication performance.

Sources: 
luna-nav---7e811dd3.base44.app+1














2. SYNEXIS
Explore SYNEXISIt uses Horizons to display Sun and Earth azimuth/elevation for a selected lunar location and date, with hourly samples across a 24-hour window. It also explores normalized solar incidence and an idealized communication link-budget calculation.

Its apparent gap: the displayed geometry does not account for local ridges, antenna constraints or terrain-obstructed visibility. Its communication estimate is not a guarantee of a real radio connection.

Sources: 
Lunar Landing Site Navigator+1




What I would take from this
Do not spend your weekend making another ranking dashboard with colored pins.

Do not spend your weekend making another Sun/Earth elevation graph.

Those are already represented in the publicly indexed prototypes.

Instead, combine their strongest ideas and solve the gap between them:
LunaSight
Terrain-aware lunar mission window planner

The central idea:

Don't just calculate whether the Sun and Earth are above the Moon's mathematical horizon. Determine whether the lander can actually see them from its location.








svs.gsfc.nasa.gov


Live astronomy

Date-specific Sun and Earth position from JPL Horizons.

Real terrain

LOLA elevation data to calculate the local skyline.

Mission windows

Actual time intervals for sunlight and Earth visibility.

Explainable selection

Recommend sites according to mission constraints, not an opaque AI score.



That is the direction I would choose.
6. The scientific feature that could distinguish your project
Terrain-aware visibility
Imagine the Sun is at an elevation of 4°.

Horizons tells you that it is above the mathematical horizon.

But suppose there is a nearby mountain ridge in that direction whose apparent elevation is 6°.

The Sun is geometrically above the horizon, but the lander cannot see it.

Your application should recognize this.








spektrum.de


For every direction, calculate the highest apparent terrain angle from the observer:
\[
H(\alpha)=\max_d\left[
\tan^{-1}\left(\frac{z(d,\alpha)-z_0}{d}\right)
\right]
\]

Where:
- \(\alpha\) is the azimuth direction.
- \(d\) is the distance along that direction.
- \(z_0\) is the observer's elevation.
- \(z(d,\alpha)\) is the terrain elevation at that distance.
Then compare the celestial body's elevation with that terrain skyline:
\[
C(t)=h_{\text{object}}(t)-H(\alpha(t))
\]

Here, \(C\) is terrain clearance.
Condition	Interpretation
\(C>0\)	Object is above the terrain skyline
\(C=0\)	Object is on the terrain skyline
\(C<0\)	Object is blocked by terrain

In the interface, show both values separately:
- Geometric Sun elevation.
- Terrain-adjusted Sun clearance.
- Geometric Earth elevation.
- Terrain-adjusted Earth clearance.
That distinction is the heart of your application.

One scientific improvement: consider the apparent size of the Sun and Earth rather than treating them as dimensionless points. For example, part of the Sun's disc might be visible while its centre is still below a ridge. This can be an optional stretch feature, not a requirement for the MVP.
Add uncertainty instead of pretending the model is perfect
This is another opportunity to demonstrate scientific maturity.

The LOLA archive provides terrain uncertainty, slope uncertainty, observation-density information and 100 alternative terrain realizations.

Your app could display something like:
Terrain visibility assessment
Geometric visibility
Visible

Nominal terrain clearance

+2.4°

Terrain confidence
Moderate


Illustrative interface values, not actual measurements from a LOLA site.

"The object is visible in the nominal terrain model, but terrain uncertainty means the clearance should not be treated as definitive."

You do not need to calculate a sophisticated probability of visibility during the hackathon. Even showing data coverage and terrain uncertainty alongside the nominal result is a strong improvement.

pgda.gsfc.nasa.gov+1

7. What the finished application should look like
I would build a professional scientific dashboard rather than a conventional consumer application.

The user should be able to understand the landing-site situation within seconds.






















10














Screen 1 — Mission overview
This is the landing page after choosing a mission.
MISSION CONFIGURATION
Example layout

Landing regionNobile Rim 1

Candidate siteNR101

Analysis dateNovember 14, 2026

Mission duration6.5 days



Mission conditions
Sun visibility

Terrain checked

Earth visibility

Terrain checked

Landing slope

Checked against constraints


Mission summary
—
Sunlit hours
—
Earth-visible hours
—
Combined hours

The dashes are intentional placeholders: calculate and validate these values rather than inventing demonstration measurements.

Screen 2 — Interactive lunar map
Show the nine current NASA candidate regions, the available candidate landing points and relevant terrain layers.

The user should be able to:
- Select a region.
- Select a candidate site.
- See its coordinates and terrain.
- See nearby permanently shadowed regions, when supported by the research dataset.
- Switch between illumination, Earth visibility, slope and terrain.
- Compare nearby candidate points.
Avoid displaying 130 dots with no explanation. Start with the nine current regions and make the representative points selectable.
Screen 3 — Local sky visualization
This can be one of the most visually memorable parts of your demo.

Show the sky from the perspective of the selected landing site.








link.springer.com


The interface should show:
- North, East, South and West.
- The current Sun position.
- The current Earth position.
- Their azimuth and elevation.
- The local terrain skyline.
- Whether each object is geometrically visible or terrain-obstructed.
A user should be able to move the time slider and watch the Sun and Earth move across the sky.
Screen 4 — Timeline and mission windows
This is where the actual decision-making happens.
MISSION WINDOW ANALYSIS

Illustrative chart layout; actual chart values will come from the astronomy and terrain calculations.
Schematic example of Sun and Earth elevation changing over a lunar day. Values are illustrative, not an ephemeris.


Sun elevationEarth elevation

-5°0°5°10°15°00:0003:0006:0009:0012:0015:0018:0021:0024:00














Example geometric elevation curves; your implementation should add the terrain-adjusted curves.
The user should be able to inspect:
- How many hours the Sun is visible.
- How many hours Earth is visible.
- How many hours both are simultaneously visible.
- The longest continuous sunlight interval.
- The longest communication blackout.
- The start and end of each window.
This is much better than simply showing a total visibility percentage. A mission planner cares about the sequence and duration of opportunities, not just the aggregate.
Screen 5 — Compare landing sites
Allow the user to put two or three landing locations side by side.

For example:
Metric	Site A	Site B
Solar opportunity	Calculated	Calculated
Earth visibility	Calculated	Calculated
Combined window	Calculated	Calculated
Longest blackout	Calculated	Calculated
Maximum slope	Calculated	Calculated
PSR accessibility	Calculated	Calculated
Terrain confidence	Calculated	Calculated

Do not declare that one location is universally the best. The winner depends on the mission profile.

A solar-powered stationary lander may prioritize sunlight. A crewed mission with a strict communications requirement may prioritize different constraints.

8. The actual 48-hour build strategy
My recommendation is to resist the temptation to build everything.

You have a short hackathon. A complete lunar simulation is unrealistic. A scientifically defensible tool with three excellent features is much more competitive than an unfinished tool with ten features.

I would organize the product into three levels.
MVP — absolutely required
Build first

- Nine current Artemis III candidate regions.
- Candidate-site selection from the research data.
- JPL Horizons calculation of Sun and Earth azimuth/elevation.
- Date and time selection.
- An interactive sky diagram.
- A 24-hour visibility timeline.
- Site comparison with actual calculated metrics.
- Clear scientific methodology and source attribution.
  
  Differentiators — highest priority after MVP
  Build next
- Real LOLA terrain skyline for two or three locations.
- Terrain-obstructed versus geometric visibility.
- Mission-length analysis over 6.5 days.
- Simultaneous Sun and Earth visibility windows.
- Slope constraints and nearby PSR information.
  
  Stretch features
  Only with spare time
- Terrain sensitivity using the 100 LOLA clones.
- Apparent solar/Earth disc obstruction.
- More advanced communication link-budget estimates.
- A downloadable mission comparison report.
- Longer-term site analysis across 2025–2032.

The order matters. First get real astronomical results. Then build the interface around them. Then add terrain.

Do not build the beautiful map first and discover late on Sunday that your astronomy calculation is broken.
Phase 1 — Acquire and prepare the data
Start with the Zenodo archive:
Download the 2026 research datasetYour first job is to get these two archives:
Landing_Sites.zip
Illumination_Modeling.zip


The PSR archive is very small, so get that too.

The important files inside the archives are the georeferenced shapefile, suitable-landing-area raster, and illumination rasters. Preserve their original coordinate reference systems and attributes.

I recommend this initial project structure:
lunasight/
│
├── data/
│   ├── raw/
│   │   ├── landing_sites/
│   │   ├── illumination/
│   │   ├── psr/
│   │   └── lola/
│   │
│   └── processed/
│       ├── candidate_sites.geojson
│       ├── regions.geojson
│       └── site_metrics.json
│
├── backend/
│   ├── horizons/
│   │   ├── client.py
│   │   └── parser.py
│   │
│   ├── terrain/
│   │   ├── dem_loader.py
│   │   ├── skyline.py
│   │   └── visibility.py
│   │
│   └── analysis/
│       ├── windows.py
│       └── comparison.py
│
├── frontend/
│   ├── components/
│   ├── pages/
│   ├── charts/
│   └── maps/
│
└── README.md


Don't insist on this exact structure if it slows down your team. Its purpose is to prevent all the scientific calculations from becoming mixed into the frontend.
Phase 2 — Build the Horizons calculation service
I would use Python for this component, particularly if someone in your team is comfortable with scientific computing.

The requests you need are quite manageable.

For each selected location, make two queries:
Target: Sun  (10)
Target: Earth (399)
Observer: Lunar location
Output: Azimuth + elevation


A simplified Horizons request looks like this:
params = {    "format": "json",    "COMMAND": "'10'",    "MAKE_EPHEM": "'YES'",    "EPHEM_TYPE": "'OBSERVER'",    "OBJ_DATA": "'NO'",    "CENTER": "'coord@301'",    "COORD_TYPE": "'GEODETIC'",    "SITE_COORD": "'36.917,-85.295,0'",    "START_TIME": "'2026-11-14'",    "STOP_TIME": "'2026-11-15'",    "STEP_SIZE": "'15 min'",    "QUANTITIES": "'4'",}



This example requests the Sun for the NR101 location. The Earth request changes COMMAND to 399.

Pay attention to the coordinate order: SITE_COORD is longitude, latitude, altitude, not latitude, longitude.

Also make sure your actual request uses properly encoded API parameters. The example illustrates the configuration, not a complete production client. 
ssd-api.jpl.nasa.gov+2


Important implementation details:
1. Parse the returned $$SOE to $$EOE ephemeris block.
2. Store timestamps in UTC internally.
3. Convert to the viewer's selected time convention only for presentation.
4. Validate that both Sun and Earth requests use identical observer coordinates and time steps.
5. Interpolate threshold crossings rather than counting only samples.
6. Cache results by location, target, date range and sampling interval.
I would use 15-minute samples for a selected site's timeline. An hourly step is fine for initial exploration, but can miss short windows or make threshold crossing times inaccurate.

For the first version, request only one or two sites. Do not call Horizons for all 78 candidates every time the user moves a slider.
Phase 3 — Calculate mission windows
The basic geometric visibility condition is:
\[
h_{\text{Sun}}(t)>0
\]

\[
h_{\text{Earth}}(t)>0
\]

The terrain-aware conditions become:
\[
h_{\text{Sun}}(t)>H(\alpha_{\text{Sun}}(t))
\]

\[
h_{\text{Earth}}(t)>H(\alpha_{\text{Earth}}(t))
\]

Then calculate the combined opportunity:
\[
V_{\text{combined}}(t)
=
V_{\text{Sun}}(t)\land V_{\text{Earth}}(t)
\]

You can calculate the following metrics by integrating the visibility functions over the analysis period.
Metric	Why it matters
Total Sun-visible duration	Solar opportunity
Total Earth-visible duration	Potential direct-to-Earth visibility
Simultaneous visibility	Times when both opportunities exist
Longest continuous sunlight	Power continuity
Longest continuous blackout	Operational risk
Number of visibility windows	Operational complexity
Duration of each individual window	Scheduling

There is a critical distinction here:

Sun visibility does not automatically mean sufficient electrical power.

For a horizontal panel, an idealized normalized incidence term can be:
\[
I_{\text{normalized}}=\max(0,\sin h_{\text{Sun}})
\]

But actual electrical power also depends on panel orientation, efficiency, temperature, degradation, shadows and other engineering variables.

Similarly, Earth being above the terrain skyline does not automatically mean a successful communications link. Antenna patterns, transmitter power, receiver sensitivity, frequency, obstruction, and network availability still matter.

Label the application's outputs accurately:
- "Potential solar illumination", not guaranteed power.
- "Geometric/terrain-checked Earth visibility", not guaranteed communications.
That kind of honest engineering will improve the credibility of your work.
Phase 4 — Implement terrain visibility selectively
Do not process every LOLA region.

Choose two or three representative locations:
- One site with strong illumination.
- One site where the published research demonstrates a significant Earth-visibility limitation.
- Optionally, one site with a useful terrain or slope challenge.
For each selected site:
1. Read the DEM and its CRS metadata.
2. Transform the candidate coordinates into the raster's actual projected coordinate system.
3. Extract the terrain around the observer.
4. Sample elevation along azimuth rays.
5. Compute the local horizon angle for each direction.
6. Interpolate the horizon angle for the Sun and Earth azimuths.
7. Compare the result with Horizons elevation.
Use the LOLA observation-density layer to understand data coverage. Don't interpret every interpolated pixel as an independently measured elevation.

This is one place where I would prioritize correctness over resolution. A terrain model for one location that actually works is worth much more than an entire map of questionable terrain predictions.

9. A particularly good scientific demonstration
I would prepare one comparison before the hackathon so your team knows what result you are trying to reproduce.

The 2026 Wueller research paper contains a useful comparison between candidate sites.
Candidate 1: NR101 — Nobile Rim 1
Strong published Sun + Earth availability
Coordinates: approximately 85.295°S, 36.917°E
30 / 30 days
2032 midsummer: longest consecutive days with Sun visibility / simultaneous Sun and Earth visibility, according to the research table.

Candidate 2: HW_K2023 — Haworth
Communication constraint example
Coordinates: approximately 86.990°S, 24.254°W
30 / 5 days
2032 midsummer: longest consecutive days with Sun visibility / simultaneous Sun and Earth visibility, according to the research table.

What this comparison demonstrates

Both have a 30-day maximum consecutive sunlight interval in the published model, but HW_K2023 has only five consecutive days with simultaneous Sun and Earth visibility. NR101 retains 30 days in both measures.

These figures are from the paper's published representative-site results; they are not new calculations performed by your app. They are a useful validation target and demonstration of why sunlight alone is insufficient. 
Wiley Online Library+1


The paper also indicates that NR101 and NR103 retain more than 17 consecutive days of sunlight in all the studied midsummers through 2032. 
Wiley Online Library


The demo story I would build around this:

"Two places on the Moon can appear equally attractive if we only consider sunlight. But when we examine their Earth visibility, the mission opportunities can be very different. And when we go one step further and include actual terrain, even geometrically visible objects may be obstructed."

That is a compelling explanation of the project's value.
An interesting date for the hackathon demo
The research paper identifies the 2026 lunar south-polar midsummer interval as approximately November 6–27, 2026.

Your hackathon takes place on November 14–15, right inside that interval. You can use November 14 as the default demonstration date, then let the judges change the date to explore different geometries.

This gives the product a nice real-world connection without claiming that the hackathon date is itself a recommended mission date. 
Wiley Online Library


10. Team organization: how I would divide the work
The official Space Apps event guidance indicates a maximum team size of six. If you have six people, I would give everyone an independent deliverable, with one person responsible for integrating the application. 
spaceappschallenge.org+1

Suggested six-person team
Parallel execution


1. Product lead / mission analyst

Owns the challenge requirements, defines the mission profile, chooses what the application must answer, coordinates integration, and prepares the final submission.

Deliverable: agreed MVP, user journey, mission assumptions, final product narrative.




2. Astronomy / backend engineer

Owns Horizons requests, coordinate configuration, ephemeris parsing, caching, time-series generation and visibility-window calculations.

Deliverable: reliable Sun/Earth position API and validated time-series data.




3. GIS / lunar terrain engineer

Owns the candidate-site data, GIS projections, LOLA DEM loading, slope information, terrain skyline and uncertainty handling.

Deliverable: valid candidate-site GeoJSON and terrain-visibility calculations for selected sites.




4. Frontend / visualization engineer

Owns the map, candidate selection, date/time controls, polar sky view, charts, comparison screen and API integration.

Deliverable: functional interactive dashboard.




5. Data validation / research engineer

Independently checks data provenance, reproduces known paper results, tests time calculations and verifies the charts.

Deliverable: test cases, source documentation and validation results.




6. UX / presentation / integration engineer

Owns interface consistency, deployment, user instructions, demo recording, slides or video, and final submission quality.

Deliverable: polished demo and working public project link.



What if you have fewer than six people?
Team size	Suggested combination
2	One full-stack developer; one science/data/research and presentation lead
3	Backend/astronomy; frontend; GIS/validation + presentation
4	Astronomy/backend; GIS; frontend; product/testing/presentation
5	Combine validation with GIS or presentation with product

One rule I would enforce:

Do not let the frontend and backend developers independently invent the API format.

Agree on the response structure early. For example:
{
  "site_id": "NR101",
  "time": "2026-11-14T12:00:00Z",
  "sun": {
    "azimuth_deg": 120.4,
    "elevation_deg": 8.6,
    "terrain_clearance_deg": 3.2
  },
  "earth": {
    "azimuth_deg": 210.1,
    "elevation_deg": 14.2,
    "terrain_clearance_deg": 11.5
  },
  "visibility": {
    "sun": true,
    "earth": true,
    "combined": true
  }
}


Those are example values and a proposed schema, not real ephemeris measurements.

Agree on the API contract before anyone spends hours styling the wrong data model.
11. Exact timetable for the hackathon
I would work with a very strict schedule. Your biggest enemy is spending too long on a feature that is not necessary for the final demo.
Friday, November 13 — tonight
Research and preparation
Your goal: begin tomorrow with no strategic ambiguity.
- Agree on the central product: terrain-aware lunar mission windows.
- Read the NASA challenge requirements together.
- Decide team roles and the technical stack.
- Download and inspect the research data.
- Create the repository and define the API contract.
- Assign the first candidate-site test.
- Prepare a short list of validation cases.
Do not prematurely build the whole product if your local event has rules restricting work before the official start. Use tonight for research, role allocation and permitted preparation.

Saturday, November 14 — 09:00–12:00
Foundation
- Test Horizons for one location and date.
- Parse the Sun and Earth positions.
- Verify candidate-site coordinates.
- Get the first actual time-series chart running.
- Establish the frontend/backend connection.
12:00 checkpoint: one selected lunar site must display genuine Sun and Earth calculations.

Saturday — 12:00–16:00
Functional application
- Build the map and site selector.
- Build the local sky diagram.
- Build the 24-hour time chart.
- Add date/time controls.
- Add visibility calculations and site comparisons.
16:00 checkpoint: a judge must be able to select a site and see a meaningful result without assistance.

Saturday — 16:00–21:00
Scientific differentiation
- Integrate terrain and slope data.
- Build the skyline calculation for the chosen sites.
- Display geometric and terrain-adjusted visibility separately.
- Add the 6.5-day mission analysis.
- Add the PSR layer and site details if stable.
21:00 checkpoint: you should have an end-to-end application, even if some terrain features are still limited.

Sunday, November 15 — 09:00–12:00
Validation and refinement
- Check the calculations against published research.
- Fix any coordinate or time-zone mistakes.
- Test more than one site.
- Improve the mission comparison interface.
- Add data sources and methodology.
12:00 checkpoint: no unexplained scientific numbers or fake demonstration data.

Sunday — 12:00–16:00
Final product
- Finish the map and charts.
- Improve the terrain visibility feature.
- Make errors and uncertainty understandable.
- Deploy a stable public version.
- Write the project description and user instructions.
16:00 checkpoint: feature freeze. No new major features after this point.

Sunday — 16:00–20:00
Presentation and submission
- Prepare the demonstration.
- Record the short demo or prepare the slides.
- Explain the science, innovation and impact.
- Test the deployment link from an incognito window.
- Check all data/source links.
- Submit well before the deadline.
The current event guidance indicates a Sunday, November 15, 11:59 PM local-time deadline. Verify the current submission portal and local organizer instructions; do not make 11:59 PM your planned submission time.

12. How to make the judges understand why it matters
This is not just a software competition. You need to explain why your tool could help someone make a better mission decision.

The previous published Space Apps judging guidance is useful as a reference. Its judging dimensions included:
Judging dimension	What you should demonstrate
Impact	How the tool helps mission planning and decision-making
Creativity	Why terrain-aware visibility goes beyond basic astronomy charts
Validity	Whether your science and calculations are defensible
Relevance	Whether you solve the actual NASA challenge
Presentation	Whether the product and its results are understandable

These are from the 2025 guidance, not a guarantee that the 2026 rubric is identical. 
spaceapps-v2-staging.s3.amazonaws.com+1


I would structure your presentation around five questions:

1. What is the problem?

Lunar landing locations need to be evaluated against illumination and Earth visibility. Simple geometric visibility can overestimate what is actually usable because of local terrain.

2. Why is it difficult?

The Sun and Earth move relative to the local horizon, terrain blocks low-elevation views, and favorable sunlight does not necessarily imply equally favorable communications opportunities.

3. What did you build?

A lunar mission-window planner that combines NASA candidate sites, JPL Horizons geometry, LOLA terrain analysis and operational comparisons.

4. What is your proof?

Show NR101 versus HW_K2023. Explain their published Sun-versus-Sun-and-Earth results, then show how your application goes further by computing date-specific windows and local terrain clearance.

5. Why should NASA care?

The application makes complex scientific information easier to compare, exposes constraints that can be missed by a basic geometric calculation, and makes the assumptions understandable to planners and non-specialists.
A demo script I would use
Keep the demonstration focused. Do not spend the first minute introducing every feature.
Suggested 60–90 second live demonstration
0–15 seconds — The problem

"When choosing a lunar landing location, sunlight is only part of the question. A location might have good solar conditions but poor direct visibility of Earth."

15–35 seconds — The comparison

Select Nobile Rim 1 and Haworth. Show the published research comparison, then move to the date-specific calculator.

35–55 seconds — The differentiator

Move the time slider. Show the Sun and Earth moving against the terrain skyline. Show an example where geometric visibility and terrain visibility disagree.

55–75 seconds — The operational result

Show the combined visibility windows and maximum blackout duration.

75–90 seconds — The conclusion

"LunaSight doesn't simply rank lunar sites. It shows when a mission can use them, what might block those opportunities, and why the recommendation changes with the mission."

A clear, reproducible result is more convincing than a cinematic 3D animation that is disconnected from the science.

13. Technical choices: keep the stack boring and reliable
You don't need an elaborate architecture.

I would use this:
Component	Recommendation	Reason
Frontend	React + TypeScript	Fast interactive dashboard
Styling	Tailwind CSS	Quick consistent interface
Charts	Plotly or Recharts	Time-series and sky visualizations
Geographic display	Leaflet or MapLibre	2D lunar map layers
Backend	Python + FastAPI	Astronomy and scientific calculations
Spatial analysis	Rasterio, GeoPandas, PyProj	DEM and GIS operations
Data	GeoJSON + GeoTIFF	Easy-to-use scientific formats
Deployment	Whatever your team can deploy reliably	No time lost to infrastructure

If your team is more experienced with a different stack, use that. The choice of framework is much less important than correctly handling lunar coordinates, time, terrain and calculations.
Suggested architecture
#chatgpt-mermaid-_r_24l_{font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";font-size:16px;fill:rgb(237, 237, 237);}@keyframes edge-animation-frame{from{stroke-dashoffset:0;}}@keyframes dash{to{stroke-dashoffset:0;}}#chatgpt-mermaid-_r_24l_ .edge-animation-slow{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 50s linear infinite;stroke-linecap:round;}#chatgpt-mermaid-_r_24l_ .edge-animation-fast{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 20s linear infinite;stroke-linecap:round;}#chatgpt-mermaid-_r_24l_ .error-icon{fill:rgb(48, 48, 48);}#chatgpt-mermaid-_r_24l_ .error-text{fill:rgb(237, 237, 237);stroke:rgb(237, 237, 237);}#chatgpt-mermaid-_r_24l_ .edge-thickness-normal{stroke-width:1px;}#chatgpt-mermaid-_r_24l_ .edge-thickness-thick{stroke-width:3.5px;}#chatgpt-mermaid-_r_24l_ .edge-pattern-solid{stroke-dasharray:0;}#chatgpt-mermaid-_r_24l_ .edge-thickness-invisible{stroke-width:0;fill:none;}#chatgpt-mermaid-_r_24l_ .edge-pattern-dashed{stroke-dasharray:3;}#chatgpt-mermaid-_r_24l_ .edge-pattern-dotted{stroke-dasharray:2;}#chatgpt-mermaid-_r_24l_ .marker{fill:rgb(175, 175, 175);stroke:rgb(175, 175, 175);}#chatgpt-mermaid-_r_24l_ .marker.cross{stroke:rgb(175, 175, 175);}#chatgpt-mermaid-_r_24l_ svg{font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";font-size:16px;}#chatgpt-mermaid-_r_24l_ p{margin:0;}#chatgpt-mermaid-_r_24l_ .label{font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";color:rgb(237, 237, 237);}#chatgpt-mermaid-_r_24l_ .cluster-label text{fill:rgb(237, 237, 237);}#chatgpt-mermaid-_r_24l_ .cluster-label span{color:rgb(237, 237, 237);}#chatgpt-mermaid-_r_24l_ .cluster-label span p{background-color:transparent;}#chatgpt-mermaid-_r_24l_ .label text,#chatgpt-mermaid-_r_24l_ span{fill:rgb(237, 237, 237);color:rgb(237, 237, 237);}#chatgpt-mermaid-_r_24l_ .node rect,#chatgpt-mermaid-_r_24l_ .node circle,#chatgpt-mermaid-_r_24l_ .node ellipse,#chatgpt-mermaid-_r_24l_ .node polygon,#chatgpt-mermaid-_r_24l_ .node path{fill:rgb(9, 23, 44);stroke:rgb(31, 78, 148);stroke-width:1px;}#chatgpt-mermaid-_r_24l_ .rough-node .label text,#chatgpt-mermaid-_r_24l_ .node .label text,#chatgpt-mermaid-_r_24l_ .image-shape .label,#chatgpt-mermaid-_r_24l_ .icon-shape .label{text-anchor:middle;}#chatgpt-mermaid-_r_24l_ .node .katex path{fill:#000;stroke:#000;stroke-width:1px;}#chatgpt-mermaid-_r_24l_ .rough-node .label,#chatgpt-mermaid-_r_24l_ .node .label,#chatgpt-mermaid-_r_24l_ .image-shape .label,#chatgpt-mermaid-_r_24l_ .icon-shape .label{text-align:center;}#chatgpt-mermaid-_r_24l_ .node.clickable{cursor:pointer;}#chatgpt-mermaid-_r_24l_ .root .anchor path{fill:rgb(175, 175, 175)!important;stroke-width:0;stroke:rgb(175, 175, 175);}#chatgpt-mermaid-_r_24l_ .arrowheadPath{fill:rgb(175, 175, 175);}#chatgpt-mermaid-_r_24l_ .edgePath .path{stroke:rgb(175, 175, 175);stroke-width:1px;}#chatgpt-mermaid-_r_24l_ .flowchart-link{stroke:rgb(175, 175, 175);fill:none;}#chatgpt-mermaid-_r_24l_ .edgeLabel{background-color:rgb(0, 0, 0);text-align:center;}#chatgpt-mermaid-_r_24l_ .edgeLabel p{background-color:rgb(0, 0, 0);}#chatgpt-mermaid-_r_24l_ .edgeLabel rect{opacity:0.5;background-color:rgb(0, 0, 0);fill:rgb(0, 0, 0);}#chatgpt-mermaid-_r_24l_ .labelBkg{background-color:rgba(0, 0, 0, 0.5);}#chatgpt-mermaid-_r_24l_ .cluster rect{fill:rgb(48, 48, 48);stroke:rgba(255, 255, 255, 0.15);stroke-width:1px;}#chatgpt-mermaid-_r_24l_ .cluster text{fill:rgb(237, 237, 237);}#chatgpt-mermaid-_r_24l_ .cluster span{color:rgb(237, 237, 237);}#chatgpt-mermaid-_r_24l_ div.mermaidTooltip{position:absolute;text-align:center;max-width:200px;padding:2px;font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";font-size:12px;background:rgb(48, 48, 48);border:1px solid rgba(255, 255, 255, 0.15);border-radius:2px;pointer-events:none;z-index:100;}#chatgpt-mermaid-_r_24l_ .flowchartTitleText{text-anchor:middle;font-size:18px;fill:rgb(237, 237, 237);}#chatgpt-mermaid-_r_24l_ rect.text{fill:none;stroke-width:0;}#chatgpt-mermaid-_r_24l_ .icon-shape,#chatgpt-mermaid-_r_24l_ .image-shape{background-color:rgb(0, 0, 0);text-align:center;}#chatgpt-mermaid-_r_24l_ .icon-shape p,#chatgpt-mermaid-_r_24l_ .image-shape p{background-color:rgb(0, 0, 0);padding:2px;}#chatgpt-mermaid-_r_24l_ .icon-shape .label rect,#chatgpt-mermaid-_r_24l_ .image-shape .label rect{opacity:0.5;background-color:rgb(0, 0, 0);fill:rgb(0, 0, 0);}#chatgpt-mermaid-_r_24l_ .label-icon{display:inline-block;height:1em;overflow:visible;vertical-align:-0.125em;}#chatgpt-mermaid-_r_24l_ .node .label-icon path{fill:currentColor;stroke:revert;stroke-width:revert;}#chatgpt-mermaid-_r_24l_ .node .neo-node{stroke:rgb(31, 78, 148);}#chatgpt-mermaid-_r_24l_ [data-look="neo"].node rect,#chatgpt-mermaid-_r_24l_ [data-look="neo"].cluster rect,#chatgpt-mermaid-_r_24l_ [data-look="neo"].node polygon{stroke:url(#chatgpt-mermaid-_r_24l_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-_r_24l_ [data-look="neo"].swimlane.cluster rect{filter:none;}#chatgpt-mermaid-_r_24l_ [data-look="neo"].node path{stroke:url(#chatgpt-mermaid-_r_24l_-gradient);stroke-width:1px;}#chatgpt-mermaid-_r_24l_ [data-look="neo"].node .outer-path{filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-_r_24l_ [data-look="neo"].node .neo-line path{stroke:rgb(31, 78, 148);filter:none;}#chatgpt-mermaid-_r_24l_ [data-look="neo"].node circle{stroke:url(#chatgpt-mermaid-_r_24l_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-_r_24l_ [data-look="neo"].node circle .state-start{fill:#000000;}#chatgpt-mermaid-_r_24l_ [data-look="neo"].icon-shape .icon{fill:url(#chatgpt-mermaid-_r_24l_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-_r_24l_ [data-look="neo"].icon-shape .icon-neo path{stroke:url(#chatgpt-mermaid-_r_24l_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-_r_24l_ .node text{font-size:14px;font-weight:600;letter-spacing:normal;fill:rgb(153, 206, 255);}#chatgpt-mermaid-_r_24l_ .edgeLabels text{font-size:13px;font-weight:600;letter-spacing:-0.08px;fill:rgb(153, 206, 255);}#chatgpt-mermaid-_r_24l_ .node tspan[font-weight="normal"],#chatgpt-mermaid-_r_24l_ .edgeLabels tspan[font-weight="normal"]{font-weight:600;}#chatgpt-mermaid-_r_24l_ .edgeLabel .label rect{opacity:1;rx:13px;ry:13px;fill:rgb(0, 14, 26);stroke:rgb(26, 62, 95);stroke-width:1px;}#chatgpt-mermaid-_r_24l_ .node rect,#chatgpt-mermaid-_r_24l_ .node circle,#chatgpt-mermaid-_r_24l_ .node ellipse,#chatgpt-mermaid-_r_24l_ .node polygon,#chatgpt-mermaid-_r_24l_ .node path{fill:rgb(0, 40, 77);stroke:rgba(255, 255, 255, 0.1);stroke-width:1px;}#chatgpt-mermaid-_r_24l_ .node rect{rx:16px;ry:16px;}#chatgpt-mermaid-_r_24l_ .mermaid-decision .label-container{fill:rgb(0, 14, 26);stroke:rgb(26, 62, 95);stroke-dasharray:2,2;}#chatgpt-mermaid-_r_24l_ .edgePaths .flowchart-link{stroke:rgb(175, 175, 175);stroke-width:1px;stroke-linecap:round;stroke-linejoin:round;}#chatgpt-mermaid-_r_24l_ .marker{fill:rgb(175, 175, 175);stroke:rgb(175, 175, 175);}#chatgpt-mermaid-_r_24l_ :root{--mermaid-font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";}User selects site and dateFrontend mission dashboardBackend APICandidate site databaseJPL HorizonsLOLA terrain and slopeNASA illumination and PSRdataSun / Earth azimuth andelevationLocal terrain skylineVisibility and time-windowengineSite constraints and contextMission comparison andrecommendation





One important engineering decision: cache your Horizons calculations. You should not make a new network request every time a user adjusts the visual time slider. Fetch the series once, cache it, then let the browser interpolate and animate locally.

I would also keep the raw scientific values separate from the user-facing recommendation. This makes it possible to change the scoring formula without accidentally changing the source measurements.
The recommendation model
Use an explainable decision model, not an AI-generated winner.

For example, let the mission profile define weights for:
- Solar opportunity.
- Earth visibility.
- Simultaneous availability.
- Landing-area suitability.
- Terrain confidence.
- PSR accessibility.
Then use normalized metrics to construct a score:
\[
S=w_1P+w_2E+w_3O+w_4L+w_5C+w_6R
\]

Where each input represents one of those factors.

However, do not make the score your primary scientific result. Show the underlying numbers and let the user change the weights.

Even better, display the Pareto trade-offs: a site may have better sunlight but worse Earth visibility, while another may have a more balanced profile. That is a more honest result than pretending every mission has one universally optimal location.

You do not need an LLM inside the application. The core problem is deterministic astronomy, geospatial analysis and engineering. AI can assist your development and documentation, but making it the central feature would add unnecessary complexity without solving the challenge better.

14. The biggest risks that could ruin the project
These are the things I would specifically assign someone to check.
Risk	Why it matters	What to do
Latitude/longitude swapped	Completely wrong lunar observation point	Validate against published site coordinates
Incorrect projection	Terrain samples land in the wrong place	Read CRS from GeoTIFF metadata and transform properly
UTC/local-time errors	Windows appear at the wrong hour	Store all calculations in UTC
Geometric visibility treated as terrain visibility	False sunlight or communication opportunities	Show both independently
Too few Horizons samples	Short windows can be missed	Start with 15-minute samples and interpolate crossings
Confusing sunlight with power	Overstated mission capabilities	Use normalized solar illumination unless panel specs exist
Confusing Earth visibility with communication availability	Overstated DTE performance	State antenna and network limitations
Incomplete terrain data	False precision	Include LOLA coverage and uncertainty indicators
Too many features	Product remains unfinished	Freeze scope on Saturday afternoon
Unstable external service	Demo breaks when internet is poor	Cache known demonstration calculations

Three validations I consider mandatory
Test 1: Published candidate coordinate

Check that NR101's location in your application matches the research coordinates, including the correct longitude sign.

Test 2: Known research result

Reproduce the published NR101 and HW_K2023 Sun/Sun-plus-Earth consecutive-day comparison for 2032, using the same definitions and assumptions.

Test 3: Terrain obstruction sanity check

Choose a time when Horizons says the Sun is geometrically visible at low elevation. Compare that with the DEM skyline. Confirm that the terrain algorithm correctly identifies a blocked direction when the skyline is higher.

If you fail these three, you should not trust your final site ranking.

15. What to discuss with the team tonight
I would make the meeting short and decision-oriented. Do not spend two hours brainstorming unrelated features.

Here is the agenda I would actually put on the table.
Tonight's decision checklist
0/8 decided



[ ] Define the product

We are building a terrain-aware lunar mission-window planner, not a generic Moon explorer.


[ ] Choose the first locations

Use NR101 and HW_K2023 as research-backed comparison examples.


[ ] Agree on the MVP

Horizons, site selection, Sun/Earth timeline, comparison, and one terrain-horizon demonstration.


[ ] Choose the technical stack

Use the frameworks everyone can already work with; agree on one API contract.


[ ] Divide the work

Give every member an independent deliverable and integration owner.


[ ] Decide the mission profile

Set a 6.5-day default and make operational constraints configurable.


[ ] Agree on scientific honesty

No invented measurements, no fake power estimates, no claims of guaranteed communication.


[ ] Prepare the demo

Choose one compelling comparison and decide who will explain the science.



Five decisions I would settle before ending the meeting
1. Are you committing to terrain-aware visibility as your defining feature?
2. Who owns the astronomy calculation and who owns the GIS calculation?
3. Which two candidate locations will be used in the initial demonstration?
4. What is the fallback if the LOLA terrain processing is not ready?
5. Who will be responsible for the final project submission and demo?
For the fallback, I would still launch the MVP with Horizons geometry and explicitly label terrain as unavailable for locations that have not been processed. A transparent limitation is better than a broken or misleading terrain model.

16. Submission and presentation details
The event's public guidance gives you some practical constraints to prepare for:
- Teams are limited to six members.
- All team members should follow the official registration and project association process.
- The submission period opens Saturday, November 14 at 09:00 local time.
- The stated submission deadline is Sunday, November 15 at 23:59 local time. 
  spaceappschallenge.org+2
A November 12 community response in the Space Apps discussion also describes a demo video of up to 30 seconds or a presentation of up to seven slides, a public-accessible project link, and an English project description. This is useful preparation, but confirm the exact requirements shown in your 2026 submission portal rather than relying only on community guidance. 
GitHub


I would prepare:
1. A public, working application link.
2. A GitHub repository with a good README.
3. A concise description of the problem, solution, innovation and scientific methods.
4. A source and data attribution section.
5. A short demonstration that works without signing in.
6. A clear explanation of any AI tools or AI-generated materials, following the actual submission rules.
Your README should describe the NASA datasets, how the calculations work, what the assumptions are, and what remains outside the model. That is much more valuable than simply listing the frameworks you used.

17. My final recommendation: what gives you the best chance?
I would rank the possible approaches like this:
Approach	My assessment
Beautiful 3D Moon explorer	Too much implementation effort; limited challenge value
AI chatbot about lunar landing sites	Weak scientific contribution
Static NASA illumination-map viewer	Useful, but insufficiently innovative
Site-ranking dashboard	Good, but already publicly explored
Horizons-based Sun/Earth calculator	Strong foundation, but not distinctive alone
Terrain-aware mission-window planner	My preferred direction

My recommended strategy
Build LunaSight.
Make the application answer three questions:

1. When can the lander see the Sun?

Calculate the actual time-dependent solar position.

2. When can the lander see Earth?

Calculate Earth visibility independently of solar illumination.

3. Can the lander actually see either one from its terrain position?

Compare both trajectories against the real lunar terrain.

Your competitive advantage: integrating published Artemis candidate data, live ephemerides and local terrain obstruction into one explainable mission-planning interface.

What I would prioritize, in this exact order
1. Make the Horizons calculations work for NR101 and HW_K2023.
2. Build the interactive Sun/Earth timeline and sky diagram.
3. Integrate the 2026 research's candidate-site and illumination datasets.
4. Add a real LOLA terrain skyline for at least one site, preferably two.
5. Add mission-length and simultaneous-visibility analysis.
6. Make the interface excellent and prepare a convincing scientific demonstration.
Do not sacrifice the first three to complete the last three.
Research verification and remaining limitations
One important distinction about the research I conducted: I verified the published data inventories, formats, scientific documentation, candidate-site information and relevant published research results, and examined the available NASA map imagery. I also checked the Horizons API configuration against JPL's documentation.

However, the binary Zenodo archives and LOLA GeoTIFFs were not successfully downloaded and numerically parsed in this environment, and I could not execute a live Horizons API request here. The official challenge page also intermittently returned a 502 error, so I corroborated its brief with the Space Apps challenge index and relevant NASA sources.

That means I have not independently validated every terrain pixel or reproduced every calculated ephemeris value. Your team should perform those first two live-data checks at the beginning of the event. The published reference values above are research results, not measurements generated during this investigation.
The three most important resources to keep open tomorrow

Candidate landing sites and research data
Wueller et al. 2026 — datasets



High-resolution lunar terrain
LOLA high-resolution terrain



Actual Sun and Earth calculations
JPL Horizons APIAPI documentation



My strongest advice: make the first successful demonstration tomorrow a comparison between two real NASA candidate locations where one appears attractive under sunlight alone but performs differently when Earth visibility is considered. Then show how terrain changes the result. That gives you a coherent story, real scientific evidence, a working product and a reason your solution deserves attention.

You should enter the hackathon with one clear objective: make a better lunar landing decision possible, not just make lunar data look impressive.

Si vous le souhaitez, je peux :
- Plan detailed UI for terrain-aware solar and Earth visibility
- Outline data processing steps for terrain horizon and visibility calculations
- Suggest advanced features for terrain uncertainty visualization