import React, { useState } from 'react';
import { Site, EphemerisPoint, Vector3D } from '../types';
import {
  ChevronLeft,
  ChevronRight,
  Compass,
  MapPin,
  Sun,
  Moon,
  Layers,
  Globe,
  Navigation,
  Crosshair,
  Check,
} from 'lucide-react';
import {
  Button,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Select,
  Switch,
  InfoTooltip,
} from '@/components/ui';

interface LeftControlPanelProps {
  activeTool: string;
  siteA: Site;
  siteB: Site;
  currentPointA?: EphemerisPoint;
  currentPointB?: EphemerisPoint;
  onSelectSiteA: (site: Site) => void;
  onSelectSiteB: (site: Site) => void;
  allSites: Site[];
  isSiteALit: boolean;
  isSiteBLit: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  showGraticule: boolean;
  onToggleGraticule: () => void;
  showSightlines: boolean;
  onToggleSightlines: () => void;
  showSunOrbit: boolean;
  onToggleSunOrbit: () => void;
  showSunHighlight?: boolean;
  onToggleSunHighlight?: () => void;
  showEarthHighlight?: boolean;
  onToggleEarthHighlight?: () => void;
  showIceOverlay?: boolean;
  onToggleIceOverlay?: () => void;
  showRockOverlay?: boolean;
  onToggleRockOverlay?: () => void;
  showSlopeOverlay?: boolean;
  onToggleSlopeOverlay?: () => void;
  onStart3DPicking?: () => void;
  sunVec?: Vector3D;
  earthVec?: Vector3D;
  onFlyToSite?: (site: Site) => void;
}

function calculateLunarDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 1737.4; // Lunar mean radius in km
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function calculateAzimuthDeg(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);
  const theta = (Math.atan2(y, x) * 180) / Math.PI;
  return (theta + 360) % 360;
}

function bodyVectorToLatLon(vec?: Vector3D) {
  if (!vec) return { lat: 0, lon: 0 };
  const r = Math.hypot(vec.x, vec.y, vec.z);
  if (r === 0) return { lat: 0, lon: 0 };
  const lat = (Math.asin(vec.z / r) * 180) / Math.PI;
  const lon = (Math.atan2(vec.y, vec.x) * 180) / Math.PI;
  return { lat, lon };
}

export const LeftControlPanel: React.FC<LeftControlPanelProps> = ({
  activeTool,
  siteA,
  siteB,
  onSelectSiteA,
  onSelectSiteB,
  allSites,
  isSiteALit,
  isSiteBLit,
  isCollapsed,
  onToggleCollapse,
  showGraticule,
  onToggleGraticule,
  showSightlines,
  onToggleSightlines,
  showSunOrbit,
  onToggleSunOrbit,
  showSunHighlight = true,
  onToggleSunHighlight,
  showEarthHighlight = true,
  onToggleEarthHighlight,
  showIceOverlay = false,
  onToggleIceOverlay,
  showRockOverlay = false,
  onToggleRockOverlay,
  showSlopeOverlay = false,
  onToggleSlopeOverlay,
  onStart3DPicking,
  sunVec,
  earthVec,
  onFlyToSite,
}) => {
  const [activeSiteTab, setActiveSiteTab] = useState<'A' | 'B'>('A');
  const [placemarkFilter, setPlacemarkFilter] = useState('');

  // Local visual overlay states
  const [activeBasemap, setActiveBasemap] = useState<'lroc' | 'lola'>('lroc');

  const activeSite = activeSiteTab === 'A' ? siteA : siteB;
  const isCurrentActiveLit = activeSiteTab === 'A' ? isSiteALit : isSiteBLit;

  // Measurements
  const distanceKm = calculateLunarDistanceKm(siteA.lat, siteA.lon, siteB.lat, siteB.lon);
  const azimuthAtoB = calculateAzimuthDeg(siteA.lat, siteA.lon, siteB.lat, siteB.lon);
  const elevDeltaKm = siteB.elevKm - siteA.elevKm;
  const subSolar = bodyVectorToLatLon(sunVec);
  const subEarth = bodyVectorToLatLon(earthVec);

  const filteredPlacemarks = allSites.filter(
    (s) =>
      s.name.toLowerCase().includes(placemarkFilter.toLowerCase()) ||
      (s.artemisRegionCode && s.artemisRegionCode.toLowerCase().includes(placemarkFilter.toLowerCase())) ||
      s.agency.toLowerCase().includes(placemarkFilter.toLowerCase())
  );

  // Determine current active section for Left Sidebar
  const isTargetMode = activeTool === 'landing-sites' || (!['layer-management', 'coordinates', 'placemarks', 'graticule'].includes(activeTool));
  const isLayerMode = activeTool === 'layer-management' || activeTool === 'graticule';
  const isCoordsMode = activeTool === 'coordinates';
  const isPlacemarksMode = activeTool === 'placemarks';

  const getSectionTitle = () => {
    if (isLayerMode) return 'Layer Management';
    if (isCoordsMode) return 'Coordinates';
    if (isPlacemarksMode) return 'Placemarks';
    return 'Landing Sites';
  };

  return (
    <div
      className="relative z-20 w-full h-full bg-space-950/95 backdrop-blur-md flex flex-col overflow-hidden select-none"
    >
      {/* Collapse/Expand Toggle Tab */}
      <Button
        variant="secondary"
        size="icon-sm"
        onClick={onToggleCollapse}
        className="absolute top-2.5 right-2 z-30 rounded-md border border-slate-700 shadow-md bg-space-900/90 text-slate-300 hover:text-white"
        title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
      >
        {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </Button>

      {isCollapsed ? (
        <div className="flex flex-col items-center pt-8 gap-6 text-slate-500 font-mono text-[11px] tracking-widest uppercase">
          <span className="rotate-90 origin-center whitespace-nowrap text-cyan-400 font-bold">
            {getSectionTitle().toUpperCase()}
          </span>
        </div>
      ) : (
        <div className="flex-1 flex flex-col p-3 gap-3 overflow-y-auto no-scrollbar">
          {/* Minimalist Section Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-1.5">
              {isLayerMode && <Layers className="w-3.5 h-3.5 text-cyan-400" />}
              {isCoordsMode && <Crosshair className="w-3.5 h-3.5 text-cyan-400" />}
              {isPlacemarksMode && <MapPin className="w-3.5 h-3.5 text-cyan-400" />}
              {isTargetMode && <Compass className="w-3.5 h-3.5 text-cyan-400" />}
              <span className="text-xs font-bold font-mono uppercase tracking-wider text-slate-200">
                {getSectionTitle()}
              </span>
              <InfoTooltip
                text={
                  isLayerMode
                    ? 'Manage LROC WAC/NAC global mosaic and scientific surface hazard overlays.'
                    : isCoordsMode
                    ? 'Selenocentric coordinates, inter-site distance, azimuth heading, and sub-celestial points.'
                    : isPlacemarksMode
                    ? 'Surface catalog of Artemis III candidate regions and commercial CLPS landers.'
                    : 'Target selection and landing site terrain safety parameters.'
                }
              />
            </div>
          </div>

          {/* ============================================================== */}
          {/* ONLY DISPLAY LANDING SITES WHEN ACTIVE                          */}
          {/* ============================================================== */}
          {isTargetMode && (
            <div className="flex flex-col gap-3 animate-fade-in">
              {/* Site A / Site B Target Switcher */}
              <div className="grid grid-cols-2 gap-1 p-0.5 bg-space-900 rounded-lg border border-slate-800 text-xs font-mono">
                <Button
                  variant={activeSiteTab === 'A' ? 'nasa' : 'ghost'}
                  size="xs"
                  onClick={() => setActiveSiteTab('A')}
                  className="gap-1.5 h-7"
                >
                  <span className="w-2 h-2 rounded-full bg-cyan-300 inline-block" />
                  <span>Site A</span>
                </Button>

                <Button
                  variant={activeSiteTab === 'B' ? 'solar' : 'ghost'}
                  size="xs"
                  onClick={() => setActiveSiteTab('B')}
                  className="gap-1.5 h-7"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                  <span>Site B</span>
                </Button>
              </div>

              {/* Site Selector Dropdown */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span className="flex items-center gap-1">
                    TARGET {activeSiteTab}
                    <InfoTooltip text="Choose one of the 9 official NASA Artemis III candidate landing regions or historical lunar landing sites." />
                  </span>
                  <Badge variant={isCurrentActiveLit ? 'optimal' : 'destructive'} className="gap-1 py-0 h-4 text-[9px]">
                    {isCurrentActiveLit ? (
                      <>
                        <Sun className="w-2.5 h-2.5 text-emerald-300" />
                        <span>LIT</span>
                      </>
                    ) : (
                      <>
                        <Moon className="w-2.5 h-2.5 text-red-300" />
                        <span>SHADOW</span>
                      </>
                    )}
                  </Badge>
                </div>

                <Select
                  value={activeSite.id}
                  onChange={(e) => {
                    const s = allSites.find((item) => item.id === e.target.value);
                    if (s) {
                      if (activeSiteTab === 'A') onSelectSiteA(s);
                      else onSelectSiteB(s);
                    }
                  }}
                  className="h-8 text-xs font-mono"
                >
                  <optgroup label="NASA Artemis III Official 9 Candidate Regions">
                    {allSites
                      .filter((s) => s.artemisRegionCode && s.artemisRegionCode !== 'OTHER')
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          [{s.artemisRegionCode}] {s.name}
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="South Pole Candidate Features">
                    {allSites
                      .filter((s) => s.region === 'south_pole' && (!s.artemisRegionCode || s.artemisRegionCode === 'OTHER'))
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="Historical Lunar Missions (Archive)">
                    {allSites
                      .filter((s) => s.region !== 'south_pole')
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.agency})
                        </option>
                      ))}
                  </optgroup>
                </Select>

                {onStart3DPicking && (
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={onStart3DPicking}
                    className="w-full gap-1.5 h-7 text-[10px] text-cyan-300 border-cyan-500/40 bg-cyan-950/20 hover:bg-cyan-950/50 font-mono shadow-sm transition-all"
                  >
                    <Crosshair className="w-3 h-3 text-cyan-400" />
                    <span>Pick Target Directly on 3D Moon</span>
                  </Button>
                )}
              </div>

              {/* Compact Metrics Card */}
              <Card className="bg-space-900/80 border-slate-800">
                <CardHeader className="p-2.5 pb-1">
                  <CardTitle className="text-[10px] text-slate-400 flex items-center justify-between font-mono">
                    <span className="flex items-center gap-1">
                      COORDINATES
                      <InfoTooltip text="Latitude and Longitude in Selenocentric IAU reference system." />
                    </span>
                    <span className="text-cyan-300 font-bold">
                      {Math.abs(activeSite.lat).toFixed(3)}°S, {activeSite.lon.toFixed(3)}°E
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2.5 pt-1 flex flex-col gap-1.5 text-xs font-mono">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 flex items-center gap-1">
                      ELEVATION
                      <InfoTooltip text="Height relative to lunar mean spherical radius 1,737.4 km." />
                    </span>
                    <span className="text-slate-200">
                      {activeSite.elevKm >= 0 ? '+' : ''}{activeSite.elevKm.toFixed(2)} km
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 flex items-center gap-1">
                      TERRAIN SLOPE
                      <InfoTooltip text="Surface tilt derived from LOLA DEM. Artemis III HLS constraint: <5° optimal, <8° maximum limit." />
                    </span>
                    <Badge
                      variant={activeSite.slopeDeg <= 5.0 ? 'optimal' : activeSite.slopeDeg <= 8.0 ? 'constrained' : 'critical'}
                      className="text-[9px] py-0 h-4"
                    >
                      {activeSite.slopeDeg.toFixed(1)}°
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 flex items-center gap-1">
                      &gt;8° SLOPE BUFFER
                      <InfoTooltip text="Minimum safety distance to nearest slopes exceeding 8°. HLS requirement: ≥100 m." />
                    </span>
                    <span className={`font-bold ${activeSite.distanceToSteepTerrainM >= 100 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {activeSite.distanceToSteepTerrainM} m
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 flex items-center gap-1">
                      NEAREST PSR WALK
                      <InfoTooltip text="Walking distance to nearest Permanently Shadowed Region cold trap for volatile ice sampling. Target: ≤2.0 km." />
                    </span>
                    <span className={`font-bold ${activeSite.nearestPsrDistanceKm <= 2.0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {activeSite.nearestPsrDistanceKm.toFixed(1)} km
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800">
                    <span className="text-slate-400 flex items-center gap-1">
                      VOLATILE POTENTIAL
                      <InfoTooltip text="Hydrogen abundance detected by LRO LEND neutron spectrometer." />
                    </span>
                    <span className="text-teal-300 font-bold">{activeSite.volatileIceScore}%</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 flex items-center gap-1">
                      ROCKINESS HAZARD
                      <InfoTooltip text="Rock fraction abundance from LRO Diviner radiometer. Safe landing goal: <15%." />
                    </span>
                    <span className="text-pink-300 font-bold">{activeSite.rockAbundance}%</span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                    <span className="truncate max-w-[190px]">{activeSite.regionName || activeSite.agency}</span>
                    <InfoTooltip text={activeSite.note} />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ============================================================== */}
          {/* ONLY DISPLAY LAYER MANAGEMENT WHEN ACTIVE                      */}
          {/* ============================================================== */}
          {isLayerMode && (
            <div className="flex flex-col gap-3 animate-fade-in font-mono">
              {/* Basemap Selection */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] text-slate-400 uppercase flex items-center gap-1">
                  BASEMAP
                  <InfoTooltip text="Select global mosaic surface layer streamed from NASA planetary servers." />
                </span>
                <div className="grid grid-cols-2 gap-1">
                  <Button
                    variant={activeBasemap === 'lroc' ? 'nasa' : 'outline'}
                    size="xs"
                    onClick={() => setActiveBasemap('lroc')}
                    className="h-7 text-[10px] justify-between"
                  >
                    <span>LROC WAC</span>
                    {activeBasemap === 'lroc' && <Check className="w-3 h-3 text-cyan-400" />}
                  </Button>
                  <Button
                    variant={activeBasemap === 'lola' ? 'nasa' : 'outline'}
                    size="xs"
                    onClick={() => setActiveBasemap('lola')}
                    className="h-7 text-[10px] justify-between"
                  >
                    <span>LOLA DEM</span>
                    {activeBasemap === 'lola' && <Check className="w-3 h-3 text-cyan-400" />}
                  </Button>
                </div>
              </div>

              {/* Scientific Hazards Switch List */}
              <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase pt-1">SCIENTIFIC HAZARDS</span>

                {/* LEND Ice Traps (Cyan) - Disabled by default */}
                <Card className="p-2 bg-space-900/60 border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-200 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-sm" />
                    <span>LEND Ice Traps (Cyan)</span>
                    <InfoTooltip text="Water-equivalent hydrogen cold traps in Permanently Shadowed Regions (PSRs) at polar latitudes." />
                  </span>
                  <Switch checked={showIceOverlay} onCheckedChange={() => onToggleIceOverlay?.()} />
                </Card>

                {/* Diviner Rock Hazard (Amber) - Disabled by default */}
                <Card className="p-2 bg-space-900/60 border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-200 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 shadow-sm" />
                    <span>Diviner Rock Hazard (Amber)</span>
                    <InfoTooltip text="Surface rock fraction abundance hazard heat map from LRO Diviner." />
                  </span>
                  <Switch checked={showRockOverlay} onCheckedChange={() => onToggleRockOverlay?.()} />
                </Card>

                {/* LOLA Slope Hazard (Magenta) - Disabled by default */}
                <Card className="p-2 bg-space-900/60 border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-200 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-fuchsia-400 shadow-sm" />
                    <span>LOLA Steep Slope (Magenta)</span>
                    <InfoTooltip text="Terrain slopes > 15° exceeding lander tipping safety limits." />
                  </span>
                  <Switch checked={showSlopeOverlay} onCheckedChange={() => onToggleSlopeOverlay?.()} />
                </Card>

                <span className="text-[10px] text-slate-400 uppercase pt-1">GEOMETRIC GUIDES</span>

                <Card className="p-2 bg-space-900/60 border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-200 flex items-center gap-1">
                    Polar Graticule
                    <InfoTooltip text="Latitude rings -90° to -50°S and longitude meridians with degree labels." />
                  </span>
                  <Switch checked={showGraticule} onCheckedChange={onToggleGraticule} />
                </Card>

                <Card className="p-2 bg-space-900/60 border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-200 flex items-center gap-1">
                    3D Sightlines
                    <InfoTooltip text="Physical geometric rays connecting landing sites directly to Sun and Earth." />
                  </span>
                  <Switch checked={showSightlines} onCheckedChange={onToggleSightlines} />
                </Card>

                <Card className="p-2 bg-space-900/60 border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-200 flex items-center gap-1">
                    Sun & Earth Trails
                    <InfoTooltip text="Apparent ephemeris orbit trajectories in lunar sky." />
                  </span>
                  <Switch checked={showSunOrbit} onCheckedChange={onToggleSunOrbit} />
                </Card>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* ONLY DISPLAY COORDINATES WHEN ACTIVE                           */}
          {/* ============================================================== */}
          {isCoordsMode && (
            <div className="flex flex-col gap-2.5 animate-fade-in font-mono">
              {/* Site A Specs */}
              <Card className="p-2.5 bg-space-900/80 border-slate-800 flex flex-col gap-1 text-[11px]">
                <div className="flex items-center justify-between font-bold text-cyan-300">
                  <span>SITE A: {siteA.name.split('(')[0].trim()}</span>
                  <InfoTooltip text="Target A selenocentric coordinates." />
                </div>
                <div className="grid grid-cols-2 gap-1 text-slate-300 pt-1 border-t border-slate-800">
                  <div>LAT: {Math.abs(siteA.lat).toFixed(4)}°S</div>
                  <div>LON: {siteA.lon.toFixed(4)}°E</div>
                  <div>ELEV: {siteA.elevKm >= 0 ? '+' : ''}{siteA.elevKm.toFixed(2)} km</div>
                  <div>SLOPE: {siteA.slopeDeg.toFixed(1)}°</div>
                </div>
              </Card>

              {/* Site B Specs */}
              <Card className="p-2.5 bg-space-900/80 border-slate-800 flex flex-col gap-1 text-[11px]">
                <div className="flex items-center justify-between font-bold text-amber-300">
                  <span>SITE B: {siteB.name.split('(')[0].trim()}</span>
                  <InfoTooltip text="Target B selenocentric coordinates." />
                </div>
                <div className="grid grid-cols-2 gap-1 text-slate-300 pt-1 border-t border-slate-800">
                  <div>LAT: {Math.abs(siteB.lat).toFixed(4)}°S</div>
                  <div>LON: {siteB.lon.toFixed(4)}°E</div>
                  <div>ELEV: {siteB.elevKm >= 0 ? '+' : ''}{siteB.elevKm.toFixed(2)} km</div>
                  <div>SLOPE: {siteB.slopeDeg.toFixed(1)}°</div>
                </div>
              </Card>

              {/* Inter-Site Geodesics */}
              <Card className="p-2.5 bg-space-900/90 border-cyan-500/30 flex flex-col gap-1.5 text-xs">
                <div className="flex items-center justify-between text-cyan-400 font-bold text-[10px]">
                  <span>GEODESIC MEASUREMENTS</span>
                  <InfoTooltip text="Great circle arc distance on lunar sphere (R = 1737.4 km) and bearing from Site A to Site B." />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-[11px]">DISTANCE</span>
                  <span className="font-bold text-emerald-400">{distanceKm.toFixed(2)} km</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-[11px]">BEARING (A&rarr;B)</span>
                  <span className="font-bold text-cyan-300">{azimuthAtoB.toFixed(1)}°</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-[11px]">&Delta;ELEVATION</span>
                  <span className="font-bold text-amber-300">
                    {elevDeltaKm >= 0 ? '+' : ''}{(elevDeltaKm * 1000).toFixed(0)} m
                  </span>
                </div>
              </Card>

              {/* Sub-Celestial Points */}
              <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-slate-800 text-[10px]">
                <Card className="p-2 bg-space-900/60 border-slate-800">
                  <div className="flex items-center justify-between font-bold text-solar-gold mb-0.5">
                    <span>SUB-SOLAR</span>
                    <InfoTooltip text="Lunar point directly under the Sun." />
                  </div>
                  <div>{subSolar.lat.toFixed(1)}°N/S</div>
                  <div>{subSolar.lon.toFixed(1)}°E</div>
                </Card>

                <Card className="p-2 bg-space-900/60 border-slate-800">
                  <div className="flex items-center justify-between font-bold text-cyan-400 mb-0.5">
                    <span>SUB-EARTH</span>
                    <InfoTooltip text="Lunar point directly under Earth." />
                  </div>
                  <div>{subEarth.lat.toFixed(1)}°N/S</div>
                  <div>{subEarth.lon.toFixed(1)}°E</div>
                </Card>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* ONLY DISPLAY PLACEMARKS WHEN ACTIVE                            */}
          {/* ============================================================== */}
          {isPlacemarksMode && (
            <div className="flex flex-col gap-2 animate-fade-in font-mono">
              <input
                type="text"
                placeholder="Filter placemarks..."
                value={placemarkFilter}
                onChange={(e) => setPlacemarkFilter(e.target.value)}
                className="w-full bg-space-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />

              <div className="flex flex-col gap-1.5 max-h-[500px] overflow-y-auto pr-1">
                {filteredPlacemarks.map((site) => {
                  const isA = siteA.id === site.id;
                  const isB = siteB.id === site.id;

                  return (
                    <Card
                      key={site.id}
                      className={`p-2 transition-all duration-150 ${
                        isA
                          ? 'border-cyan-500/80 bg-cyan-950/30'
                          : isB
                          ? 'border-amber-500/80 bg-amber-950/30'
                          : 'border-slate-800/80 bg-space-900/50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-xs font-bold text-slate-200 truncate max-w-[170px]">
                          {site.artemisRegionCode ? `[${site.artemisRegionCode}] ` : ''}
                          {site.name}
                        </span>
                        <div className="flex items-center gap-1">
                          {isA && <Badge variant="cyan" className="text-[8px] py-0 h-4">A</Badge>}
                          {isB && <Badge variant="amber" className="text-[8px] py-0 h-4">B</Badge>}
                          <InfoTooltip text={`${site.agency} • ${Math.abs(site.lat).toFixed(2)}°S, ${site.lon.toFixed(2)}°E`} />
                        </div>
                      </div>

                      <div className="flex items-center gap-1 pt-1 border-t border-slate-800/60">
                        {onFlyToSite && (
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => onFlyToSite(site)}
                            className="text-[9px] h-5 px-1.5 text-cyan-300 gap-1"
                          >
                            <Navigation className="w-2.5 h-2.5" />
                            <span>Fly</span>
                          </Button>
                        )}
                        <Button
                          variant={isA ? 'nasa' : 'ghost'}
                          size="xs"
                          onClick={() => onSelectSiteA(site)}
                          className="text-[9px] h-5 px-1.5 ml-auto"
                        >
                          Set A
                        </Button>
                        <Button
                          variant={isB ? 'solar' : 'ghost'}
                          size="xs"
                          onClick={() => onSelectSiteB(site)}
                          className="text-[9px] h-5 px-1.5"
                        >
                          Set B
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
