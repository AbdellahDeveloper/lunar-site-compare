import React, { useRef, useEffect, useState } from 'react';
import * as Cesium from 'cesium';
import {
  ComparisonViewMode,
  EphemerisPoint,
  ScientificLayer,
  Site,
  Vector3D,
} from '../types';
import { Eye, Compass, Sun, Radio, Maximize2, Zap, Layers, Sparkles } from 'lucide-react';

interface CesiumLunarViewportProps {
  viewMode: ComparisonViewMode;
  scientificLayer: ScientificLayer;
  siteA: Site;
  siteB?: Site;
  currentPointA: EphemerisPoint;
  currentPointB?: EphemerisPoint;
  allPointsA: EphemerisPoint[];
  allPointsB?: EphemerisPoint[];
  sunVec: Vector3D;
  earthVec: Vector3D;
  currentTimeMs: number;
}

export const CesiumLunarViewport: React.FC<CesiumLunarViewportProps> = ({
  viewMode,
  scientificLayer,
  siteA,
  siteB,
  currentPointA,
  currentPointB,
  allPointsA,
  allPointsB,
  sunVec,
  earthVec,
  currentTimeMs,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const containerBRef = useRef<HTMLDivElement | null>(null);

  const viewerARef = useRef<Cesium.Viewer | null>(null);
  const viewerBRef = useRef<Cesium.Viewer | null>(null);

  // Trajectory toggles
  const [showSunOrbit, setShowSunOrbit] = useState(true);
  const [showEarthOrbit, setShowEarthOrbit] = useState(true);
  const [showSightlines, setShowSightlines] = useState(true);

  // Initialize Cesium with Moon Ellipsoid
  const createCesiumMoonViewer = (
    container: HTMLDivElement,
    primarySite: Site,
    secondarySite?: Site
  ): Cesium.Viewer => {
    // Disable default Ion token requirement for public lunar basemaps
    Cesium.Ion.defaultAccessToken = '';

    const viewer = new Cesium.Viewer(container, {
      globe: new Cesium.Globe(Cesium.Ellipsoid.MOON),
      baseLayerPicker: false,
      geocoder: false,
      homeButton: false,
      infoBox: false,
      sceneModePicker: false,
      selectionIndicator: false,
      timeline: false,
      animation: false,
      navigationHelpButton: false,
      fullscreenButton: false,
      vrButton: false,
      shouldAnimate: false,
    });

    viewer.scene.globe.enableLighting = true;
    viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString('#242b38');
    viewer.scene.backgroundColor = Cesium.Color.fromCssColorString('#05070d');

    // Add High-Resolution LROC Global Moon Imagery
    try {
      const moonImagery = new Cesium.UrlTemplateImageryProvider({
        url: 'https://cartocdn-gusc.global.ssl.fastly.net/opmbuilder/api/v1/map/named/opm-moon-basemap-v0-1/all/{z}/{x}/{y}.png',
        ellipsoid: Cesium.Ellipsoid.MOON,
        maximumLevel: 9,
      });
      viewer.imageryLayers.addImageryProvider(moonImagery);
    } catch {
      // Fallback to base color if network blocked
    }

    // Initial Camera View: South Pole
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(
        primarySite.lon,
        primarySite.lat < -70 ? -88.5 : primarySite.lat,
        850000,
        Cesium.Ellipsoid.MOON
      ),
      duration: 0,
    });

    return viewer;
  };

  // Mount Viewport A
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const viewer = createCesiumMoonViewer(el, siteA, siteB);
    viewerARef.current = viewer;

    return () => {
      viewer.destroy();
      viewerARef.current = null;
    };
  }, []);

  // Mount Viewport B if in Split View
  useEffect(() => {
    if (viewMode !== 'split') {
      if (viewerBRef.current) {
        viewerBRef.current.destroy();
        viewerBRef.current = null;
      }
      return;
    }

    const el = containerBRef.current;
    if (!el || !siteB) return;

    const viewer = createCesiumMoonViewer(el, siteB, siteA);
    viewerBRef.current = viewer;

    return () => {
      viewer.destroy();
      viewerBRef.current = null;
    };
  }, [viewMode]);

  // Update Entities (Sun Model, Earth Model, Site Pins, Laser Sightlines, Trajectories)
  const updateViewerEntities = (
    viewer: Cesium.Viewer | null,
    primarySite: Site,
    secondarySite?: Site
  ) => {
    if (!viewer || viewer.isDestroyed()) return;

    viewer.entities.removeAll();

    const moon = Cesium.Ellipsoid.MOON;

    // 1. Calculate Real Solar & Earth Positions in Cesium Space
    const sLen = Math.hypot(sunVec.x, sunVec.y, sunVec.z) || 1;
    // Normalized direction in Moon-fixed frame
    const sunDir = new Cesium.Cartesian3(sunVec.x / sLen, sunVec.y / sLen, sunVec.z / sLen);
    // Scaled position for 3D model visibility in lunar orbit
    const sunPos = Cesium.Cartesian3.multiplyByScalar(sunDir, 14000000.0, new Cesium.Cartesian3());

    const eLen = Math.hypot(earthVec.x, earthVec.y, earthVec.z) || 1;
    const earthDir = new Cesium.Cartesian3(earthVec.x / eLen, earthVec.y / eLen, earthVec.z / eLen);
    const earthPos = Cesium.Cartesian3.multiplyByScalar(earthDir, 9000000.0, new Cesium.Cartesian3());

    // Update Real Directional Sunlight illuminating the Moon
    viewer.scene.light = new Cesium.DirectionalLight({
      direction: Cesium.Cartesian3.negate(sunDir, new Cesium.Cartesian3()),
      color: Cesium.Color.fromCssColorString('#fffdf5'),
      intensity: 3.5,
    });

    // 2. Real 3D Sun Model with Glowing Corona
    viewer.entities.add({
      name: 'Sun Model',
      position: sunPos,
      ellipsoid: {
        radii: new Cesium.Cartesian3(850000, 850000, 850000),
        material: Cesium.Color.fromCssColorString('#fef08a'),
        outline: true,
        outlineColor: Cesium.Color.fromCssColorString('#f59e0b'),
      },
      label: {
        text: 'SUN',
        font: 'bold 12px "JetBrains Mono", monospace',
        fillColor: Cesium.Color.fromCssColorString('#fef08a'),
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        pixelOffset: new Cesium.Cartesian2(0, -32),
      },
    });

    // 3. Real 3D Earth Model with Atmosphere Halo
    viewer.entities.add({
      name: 'Earth Model',
      position: earthPos,
      ellipsoid: {
        radii: new Cesium.Cartesian3(637100, 637100, 637100),
        material: Cesium.Color.fromCssColorString('#0284c7'),
        outline: true,
        outlineColor: Cesium.Color.fromCssColorString('#38bdf8'),
      },
      label: {
        text: 'EARTH',
        font: 'bold 12px "JetBrains Mono", monospace',
        fillColor: Cesium.Color.fromCssColorString('#38bdf8'),
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        pixelOffset: new Cesium.Cartesian2(0, -28),
      },
    });

    // 4. Site A Landing Pin
    const siteAPos = Cesium.Cartesian3.fromDegrees(
      primarySite.lon,
      primarySite.lat,
      primarySite.elevKm * 1000,
      moon
    );

    viewer.entities.add({
      name: primarySite.name,
      position: siteAPos,
      point: {
        pixelSize: 13,
        color: Cesium.Color.fromCssColorString('#38bdf8'),
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 2.5,
      },
      label: {
        text: primarySite.name.split('(')[0].trim(),
        font: 'bold 11px Inter, sans-serif',
        fillColor: Cesium.Color.fromCssColorString('#38bdf8'),
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        pixelOffset: new Cesium.Cartesian2(0, -18),
      },
    });

    // 5. Site B Landing Pin (if available)
    if (secondarySite) {
      const siteBPos = Cesium.Cartesian3.fromDegrees(
        secondarySite.lon,
        secondarySite.lat,
        secondarySite.elevKm * 1000,
        moon
      );

      viewer.entities.add({
        name: secondarySite.name,
        position: siteBPos,
        point: {
          pixelSize: 13,
          color: Cesium.Color.fromCssColorString('#f59e0b'),
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2.5,
        },
        label: {
          text: secondarySite.name.split('(')[0].trim(),
          font: 'bold 11px Inter, sans-serif',
          fillColor: Cesium.Color.fromCssColorString('#f59e0b'),
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cesium.Cartesian2(0, -18),
        },
      });

      // Directional Laser Rays from Site B if enabled
      if (showSightlines) {
        viewer.entities.add({
          polyline: {
            positions: [siteBPos, sunPos],
            width: 2.0,
            material: new Cesium.PolylineGlowMaterialProperty({
              glowPower: 0.25,
              color: Cesium.Color.fromCssColorString('#f59e0b'),
            }),
          },
        });
        viewer.entities.add({
          polyline: {
            positions: [siteBPos, earthPos],
            width: 2.0,
            material: new Cesium.PolylineGlowMaterialProperty({
              glowPower: 0.25,
              color: Cesium.Color.fromCssColorString('#06b6d4'),
            }),
          },
        });
      }
    }

    // Directional Laser Rays from Site A
    if (showSightlines) {
      viewer.entities.add({
        polyline: {
          positions: [siteAPos, sunPos],
          width: 2.5,
          material: new Cesium.PolylineGlowMaterialProperty({
            glowPower: 0.3,
            color: Cesium.Color.fromCssColorString('#f59e0b'),
          }),
        },
      });
      viewer.entities.add({
        polyline: {
          positions: [siteAPos, earthPos],
          width: 2.5,
          material: new Cesium.PolylineGlowMaterialProperty({
            glowPower: 0.3,
            color: Cesium.Color.fromCssColorString('#06b6d4'),
          }),
        },
      });
    }

    // 6. Apparent Trajectory Orbits in 3D Lunar Sky
    if (showSunOrbit && allPointsA.length > 2) {
      const sunArcPositions: Cesium.Cartesian3[] = [];
      const orbitRadius = 7500000.0;

      for (const pt of allPointsA) {
        const azRad = (pt.sun.azimuthDeg * Math.PI) / 180;
        const elRad = (pt.sun.elevationDeg * Math.PI) / 180;
        const x = orbitRadius * Math.cos(elRad) * Math.sin(azRad);
        const y = orbitRadius * Math.cos(elRad) * Math.cos(azRad);
        const z = orbitRadius * Math.sin(elRad);
        sunArcPositions.push(new Cesium.Cartesian3(x, y, z));
      }

      viewer.entities.add({
        polyline: {
          positions: sunArcPositions,
          width: 2.0,
          material: new Cesium.PolylineGlowMaterialProperty({
            glowPower: 0.2,
            color: Cesium.Color.fromCssColorString('#f59e0b'),
          }),
        },
      });
    }

    if (showEarthOrbit && allPointsA.length > 2) {
      const earthArcPositions: Cesium.Cartesian3[] = [];
      const orbitRadius = 6000000.0;

      for (const pt of allPointsA) {
        const azRad = (pt.earth.azimuthDeg * Math.PI) / 180;
        const elRad = (pt.earth.elevationDeg * Math.PI) / 180;
        const x = orbitRadius * Math.cos(elRad) * Math.sin(azRad);
        const y = orbitRadius * Math.cos(elRad) * Math.cos(azRad);
        const z = orbitRadius * Math.sin(elRad);
        earthArcPositions.push(new Cesium.Cartesian3(x, y, z));
      }

      viewer.entities.add({
        polyline: {
          positions: earthArcPositions,
          width: 2.2,
          material: new Cesium.PolylineGlowMaterialProperty({
            glowPower: 0.25,
            color: Cesium.Color.fromCssColorString('#06b6d4'),
          }),
        },
      });
    }

    // 7. Scientific Exploration Overlays (LRO LEND Volatiles / Diviner Rockiness / PSRs)
    if (scientificLayer === 'volatiles') {
      // Permanently Shadowed Regions (PSRs) Cold Traps in Electric Teal
      const psrs = [
        { name: 'Shackleton PSR', lat: -89.78, lon: 129.5, rMeters: 10500 },
        { name: 'Haworth PSR', lat: -87.4, lon: -5.1, rMeters: 25000 },
        { name: 'Shoemaker PSR', lat: -88.1, lon: 45.0, rMeters: 24000 },
        { name: 'Faustini PSR', lat: -87.3, lon: 77.0, rMeters: 19000 },
      ];

      for (const psr of psrs) {
        viewer.entities.add({
          position: Cesium.Cartesian3.fromDegrees(psr.lon, psr.lat, 0, moon),
          ellipse: {
            semiMinorAxis: psr.rMeters,
            semiMajorAxis: psr.rMeters,
            material: Cesium.Color.fromCssColorString('rgba(45, 212, 191, 0.65)'),
            outline: true,
            outlineColor: Cesium.Color.fromCssColorString('#38bdf8'),
            outlineWidth: 2,
          },
        });
      }
    } else if (scientificLayer === 'thermal') {
      // Diviner Thermal Inertia / Rockiness Zones
      const thermalZones = [
        { lat: -84.9, lon: 12.9, rMeters: 35000, color: 'rgba(236, 72, 153, 0.55)' },
        { lat: -85.2, lon: 35.8, rMeters: 28000, color: 'rgba(249, 115, 22, 0.55)' },
      ];
      for (const tz of thermalZones) {
        viewer.entities.add({
          position: Cesium.Cartesian3.fromDegrees(tz.lon, tz.lat, 0, moon),
          ellipse: {
            semiMinorAxis: tz.rMeters,
            semiMajorAxis: tz.rMeters,
            material: Cesium.Color.fromCssColorString(tz.color),
          },
        });
      }
    }
  };

  // Sync Entities when coordinates or ephemeris changes
  useEffect(() => {
    updateViewerEntities(viewerARef.current, siteA, siteB);
    if (viewMode === 'split') {
      updateViewerEntities(viewerBRef.current, siteB || siteA, siteA);
    }
  }, [
    siteA,
    siteB,
    sunVec,
    earthVec,
    scientificLayer,
    showSightlines,
    showSunOrbit,
    showEarthOrbit,
    allPointsA,
  ]);

  // Quick Camera Presets
  const flyToSouthPole = () => {
    const moon = Cesium.Ellipsoid.MOON;
    viewerARef.current?.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(siteA.lon, -89.2, 550000, moon),
      duration: 1.5,
    });
    if (viewerBRef.current && siteB) {
      viewerBRef.current.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(siteB.lon, -89.2, 550000, moon),
        duration: 1.5,
      });
    }
  };

  const flyToSiteA = () => {
    const moon = Cesium.Ellipsoid.MOON;
    viewerARef.current?.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(siteA.lon, siteA.lat, 180000, moon),
      duration: 1.5,
    });
  };

  const flyToSiteB = () => {
    const moon = Cesium.Ellipsoid.MOON;
    if (siteB) {
      const target = viewMode === 'split' ? viewerBRef.current : viewerARef.current;
      target?.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(siteB.lon, siteB.lat, 180000, moon),
        duration: 1.5,
      });
    }
  };

  const flyToOrbitalVista = () => {
    const moon = Cesium.Ellipsoid.MOON;
    viewerARef.current?.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(siteA.lon, 0, 4800000, moon),
      duration: 1.5,
    });
    viewerBRef.current?.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(siteB?.lon || 0, 0, 4800000, moon),
      duration: 1.5,
    });
  };

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden bg-space-950 select-none">
      {/* Top NASA Mission Telemetry HUD */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between pointer-events-none gap-3">
        {/* Left Telemetry Card: Site A */}
        <div className="pointer-events-auto flex items-center gap-3 bg-space-900/85 backdrop-blur-md px-3.5 py-2 rounded-xl border border-cyan-500/40 shadow-xl shadow-cyan-950/20">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider">
                {viewMode === 'split' ? 'LOCATION 1 (LEFT)' : 'LOCATION A'}
              </span>
            </div>
            <span className="text-sm font-bold text-slate-100 max-w-[200px] truncate">
              {siteA.name}
            </span>
          </div>

          <div className="h-8 w-px bg-slate-700/60" />

          {/* Power HUD */}
          <div className="flex flex-col text-xs font-mono">
            <span className="text-slate-400 text-[10px]">SOLAR POWER</span>
            <span
              className={`font-bold flex items-center gap-1 ${
                currentPointA.sun.isVisible ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              {currentPointA.sun.isVisible
                ? `LIT (${currentPointA.sun.elevationDeg.toFixed(1)}°)`
                : 'SHADOW'}
            </span>
          </div>

          <div className="h-8 w-px bg-slate-700/60" />

          {/* DTE Comm HUD */}
          <div className="flex flex-col text-xs font-mono">
            <span className="text-slate-400 text-[10px]">EARTH DTE</span>
            <span
              className={`font-bold flex items-center gap-1 ${
                currentPointA.earth.isVisible ? 'text-cyan-400' : 'text-slate-400'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              {currentPointA.earth.isVisible
                ? `LINK (${currentPointA.earth.elevationDeg.toFixed(1)}°)`
                : 'OCCULTED'}
            </span>
          </div>
        </div>

        {/* Right Telemetry Card: Site B (when comparing) */}
        {siteB && currentPointB && (
          <div className="pointer-events-auto flex items-center gap-3 bg-space-900/85 backdrop-blur-md px-3.5 py-2 rounded-xl border border-amber-500/40 shadow-xl shadow-amber-950/20">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-xs font-mono font-bold text-amber-300 uppercase tracking-wider">
                  {viewMode === 'split' ? 'LOCATION 2 (RIGHT)' : 'LOCATION B'}
                </span>
              </div>
              <span className="text-sm font-bold text-slate-100 max-w-[200px] truncate">
                {siteB.name}
              </span>
            </div>

            <div className="h-8 w-px bg-slate-700/60" />

            {/* Power HUD */}
            <div className="flex flex-col text-xs font-mono">
              <span className="text-slate-400 text-[10px]">SOLAR POWER</span>
              <span
                className={`font-bold flex items-center gap-1 ${
                  currentPointB.sun.isVisible ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                {currentPointB.sun.isVisible
                  ? `LIT (${currentPointB.sun.elevationDeg.toFixed(1)}°)`
                  : 'SHADOW'}
              </span>
            </div>

            <div className="h-8 w-px bg-slate-700/60" />

            {/* DTE Comm HUD */}
            <div className="flex flex-col text-xs font-mono">
              <span className="text-slate-400 text-[10px]">EARTH DTE</span>
              <span
                className={`font-bold flex items-center gap-1 ${
                  currentPointB.earth.isVisible ? 'text-cyan-400' : 'text-slate-400'
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
                {currentPointB.earth.isVisible
                  ? `LINK (${currentPointB.earth.elevationDeg.toFixed(1)}°)`
                  : 'OCCULTED'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Main 3D Cesium Viewports */}
      <div className="w-full flex-1 flex relative">
        {viewMode === 'overlapped' ? (
          // OVERLAPPED MODE: Single Wide Cesium Viewer
          <div ref={containerRef} className="w-full h-full block" />
        ) : (
          // SPLIT MODE: Dual Cesium Viewers side-by-side
          <div className="w-full h-full flex divide-x divide-slate-800">
            <div className="relative w-1/2 h-full flex flex-col">
              <div className="absolute top-16 left-4 z-10 px-2.5 py-1 rounded-md bg-space-950/80 border border-cyan-500/40 text-[11px] font-mono text-cyan-300 font-bold">
                VIEWPORT 1: {siteA.name}
              </div>
              <div ref={containerRef} className="w-full h-full block" />
            </div>

            <div className="relative w-1/2 h-full flex flex-col">
              <div className="absolute top-16 left-4 z-10 px-2.5 py-1 rounded-md bg-space-950/80 border border-amber-500/40 text-[11px] font-mono text-amber-300 font-bold">
                VIEWPORT 2: {siteB?.name ?? 'Site B'}
              </div>
              <div ref={containerBRef} className="w-full h-full block" />
            </div>
          </div>
        )}

        {/* Camera Quick Presets (Bottom Left of 3D Viewport) */}
        <div className="absolute bottom-4 left-4 z-20 flex flex-wrap items-center gap-2 bg-space-900/85 backdrop-blur-md p-1.5 rounded-xl border border-slate-700/70 text-xs">
          <button
            onClick={flyToSouthPole}
            className="px-2.5 py-1 rounded-lg bg-space-800 hover:bg-space-700 border border-slate-700 text-slate-200 text-[11px] font-mono transition-colors"
          >
            South Pole (85°-90°S)
          </button>
          <button
            onClick={flyToSiteA}
            className="px-2.5 py-1 rounded-lg bg-space-800 hover:bg-space-700 border border-slate-700 text-cyan-300 text-[11px] font-mono transition-colors"
          >
            Site A Zoom
          </button>
          {siteB && (
            <button
              onClick={flyToSiteB}
              className="px-2.5 py-1 rounded-lg bg-space-800 hover:bg-space-700 border border-slate-700 text-amber-300 text-[11px] font-mono transition-colors"
            >
              Site B Zoom
            </button>
          )}
          <button
            onClick={flyToOrbitalVista}
            className="px-2.5 py-1 rounded-lg bg-space-800 hover:bg-space-700 border border-slate-700 text-slate-200 text-[11px] font-mono transition-colors"
          >
            Orbital Vista
          </button>

          <div className="h-4 w-px bg-slate-700 mx-1" />

          {/* Toggle Sightlines & Trajectories */}
          <button
            onClick={() => setShowSightlines(!showSightlines)}
            className={`px-2 py-1 rounded-md text-[10px] font-mono transition-colors ${
              showSightlines
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Laser Rays
          </button>
          <button
            onClick={() => setShowSunOrbit(!showSunOrbit)}
            className={`px-2 py-1 rounded-md text-[10px] font-mono transition-colors ${
              showSunOrbit
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sun Orbit
          </button>
          <button
            onClick={() => setShowEarthOrbit(!showEarthOrbit)}
            className={`px-2 py-1 rounded-md text-[10px] font-mono transition-colors ${
              showEarthOrbit
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Earth Libration
          </button>
        </div>

        {/* 3D Legend & Scientific Layer Indicator (Bottom Right of Viewport) */}
        <div className="absolute bottom-4 right-4 z-20 flex items-center gap-3 bg-space-900/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/70 text-[11px] font-mono text-slate-400">
          <span className="flex items-center gap-1.5 text-solar-gold">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block shadow-sm shadow-amber-400/50" />
            Cesium Sun Model
          </span>
          <span className="flex items-center gap-1.5 text-comm-cyan">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block shadow-sm shadow-cyan-400/50" />
            Cesium Earth Model
          </span>
          {scientificLayer !== 'none' && (
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold border-l border-slate-700 pl-3">
              <Sparkles className="w-3.5 h-3.5" />
              {scientificLayer === 'volatiles'
                ? 'LEND Volatiles / Ice'
                : scientificLayer === 'thermal'
                ? 'Diviner Rock Hazard'
                : 'Shadow Density'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
