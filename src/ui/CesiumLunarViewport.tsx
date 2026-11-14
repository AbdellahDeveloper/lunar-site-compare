import React, { useRef, useEffect, useState } from 'react';
import * as Cesium from 'cesium';
import {
  ComparisonViewMode,
  EphemerisPoint,
  ScientificLayer,
  Site,
  Vector3D,
} from '../types';
import { Eye, Compass, Sun, Radio, Maximize2, Zap, Layers, Sparkles, Plus, Minus, RotateCcw, RotateCw } from 'lucide-react';
import { Button, Badge } from '@/components/ui';

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

  // Live Camera Altitude state
  const [altitudeKm, setAltitudeKm] = useState<number>(850);

  // Auto-Spin Turntable state (Fast 3D Moon rotation)
  const [autoSpin, setAutoSpin] = useState<boolean>(true);
  const [spinSpeedIndex, setSpinSpeedIndex] = useState<number>(1); // 0 = 1x (~15°/s), 1 = 2x (~32°/s), 2 = 4x (~65°/s)
  const spinSpeeds = [0.25, 0.55, 1.15];

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

    // Configure screen space camera controller for smooth & extreme zoom
    viewer.scene.screenSpaceCameraController.enableZoom = true;
    viewer.scene.screenSpaceCameraController.minimumZoomDistance = 1500.0; // 1.5 km above surface (crater rim)
    viewer.scene.screenSpaceCameraController.maximumZoomDistance = 45000000.0; // 45,000 km (deep space orbital view)

    // Listen to camera movements to update altitude HUD
    viewer.camera.changed.addEventListener(() => {
      const carto = viewer.camera.positionCartographic;
      if (carto) {
        setAltitudeKm(Math.max(1, Math.round(carto.height / 1000)));
      }
    });

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

    const siteAPos = Cesium.Cartesian3.fromDegrees(
      primarySite.lon,
      primarySite.lat,
      primarySite.elevKm * 1000,
      moon
    );

    // Update Real Directional Sunlight illuminating the Moon
    viewer.scene.light = new Cesium.DirectionalLight({
      direction: Cesium.Cartesian3.negate(sunDir, new Cesium.Cartesian3()),
      color: Cesium.Color.fromCssColorString('#fffdf5'),
      intensity: 3.5,
    });

    // Check if dynamic entities already exist for in-place 60fps update
    const sunEntity = viewer.entities.getById('sun_model');
    const earthEntity = viewer.entities.getById('earth_model');

    if (sunEntity && earthEntity) {
      sunEntity.position = new Cesium.ConstantPositionProperty(sunPos);
      earthEntity.position = new Cesium.ConstantPositionProperty(earthPos);

      const raySunA = viewer.entities.getById('ray_sun_a');
      if (raySunA && raySunA.polyline) {
        raySunA.polyline.positions = new Cesium.ConstantProperty([siteAPos, sunPos]);
        raySunA.show = showSightlines;
      }
      const rayEarthA = viewer.entities.getById('ray_earth_a');
      if (rayEarthA && rayEarthA.polyline) {
        rayEarthA.polyline.positions = new Cesium.ConstantProperty([siteAPos, earthPos]);
        rayEarthA.show = showSightlines;
      }

      if (secondarySite) {
        const siteBPos = Cesium.Cartesian3.fromDegrees(
          secondarySite.lon,
          secondarySite.lat,
          secondarySite.elevKm * 1000,
          moon
        );
        const raySunB = viewer.entities.getById('ray_sun_b');
        if (raySunB && raySunB.polyline) {
          raySunB.polyline.positions = new Cesium.ConstantProperty([siteBPos, sunPos]);
          raySunB.show = showSightlines;
        }
        const rayEarthB = viewer.entities.getById('ray_earth_b');
        if (rayEarthB && rayEarthB.polyline) {
          rayEarthB.polyline.positions = new Cesium.ConstantProperty([siteBPos, earthPos]);
          rayEarthB.show = showSightlines;
        }
      }

      viewer.scene.requestRender();
      return;
    }

    // Full creation if first load or after clear
    viewer.entities.removeAll();

    // 2. Real 3D Sun Model with Glowing Corona
    viewer.entities.add({
      id: 'sun_model',
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
      id: 'earth_model',
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
    viewer.entities.add({
      id: 'site_a_pin',
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

    // Directional Laser Rays from Site A
    viewer.entities.add({
      id: 'ray_sun_a',
      show: showSightlines,
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
      id: 'ray_earth_a',
      show: showSightlines,
      polyline: {
        positions: [siteAPos, earthPos],
        width: 2.5,
        material: new Cesium.PolylineGlowMaterialProperty({
          glowPower: 0.3,
          color: Cesium.Color.fromCssColorString('#06b6d4'),
        }),
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
        id: 'site_b_pin',
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

      // Directional Laser Rays from Site B
      viewer.entities.add({
        id: 'ray_sun_b',
        show: showSightlines,
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
        id: 'ray_earth_b',
        show: showSightlines,
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

    viewer.scene.requestRender();
  };

  // Re-build entities when sites, layers, or trajectory toggles change
  useEffect(() => {
    viewerARef.current?.entities.removeAll();
    viewerBRef.current?.entities.removeAll();
    updateViewerEntities(viewerARef.current, siteA, siteB);
    if (viewMode === 'split') {
      updateViewerEntities(viewerBRef.current, siteB || siteA, siteA);
    }
  }, [
    siteA,
    siteB,
    scientificLayer,
    showSightlines,
    showSunOrbit,
    showEarthOrbit,
    allPointsA,
  ]);

  // Fast 60fps in-place update for Sun, Earth, Rays, Light
  useEffect(() => {
    updateViewerEntities(viewerARef.current, siteA, siteB);
    if (viewMode === 'split') {
      updateViewerEntities(viewerBRef.current, siteB || siteA, siteA);
    }
  }, [sunVec, earthVec]);

  // High-Speed Auto-Spin Turntable Loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const spinLoop = (now: number) => {
      const dt = Math.min(0.1, (now - lastTime) / 1000);
      lastTime = now;

      if (autoSpin) {
        const radPerSec = spinSpeeds[spinSpeedIndex] || 0.55;
        const angle = radPerSec * dt;
        const rotMat = Cesium.Matrix3.fromRotationZ(angle);

        const rotateViewer = (viewer: Cesium.Viewer | null) => {
          if (!viewer || viewer.isDestroyed()) return;
          const cam = viewer.camera;
          Cesium.Matrix3.multiplyByVector(rotMat, cam.position, cam.position);
          Cesium.Matrix3.multiplyByVector(rotMat, cam.direction, cam.direction);
          Cesium.Matrix3.multiplyByVector(rotMat, cam.up, cam.up);
          Cesium.Matrix3.multiplyByVector(rotMat, cam.right, cam.right);
          viewer.scene.requestRender();
        };

        rotateViewer(viewerARef.current);
        if (viewMode === 'split') {
          rotateViewer(viewerBRef.current);
        }
      }

      animId = requestAnimationFrame(spinLoop);
    };

    animId = requestAnimationFrame(spinLoop);
    return () => cancelAnimationFrame(animId);
  }, [autoSpin, spinSpeedIndex, viewMode]);

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

  // Dedicated Zoom Controls
  const handleZoomIn = () => {
    const v = viewerARef.current;
    if (!v) return;
    const height = v.camera.positionCartographic?.height || 1000000;
    const moveAmount = Math.max(3000, height * 0.35);
    v.camera.zoomIn(moveAmount);
    if (viewMode === 'split' && viewerBRef.current) {
      viewerBRef.current.camera.zoomIn(moveAmount);
    }
  };

  const handleZoomOut = () => {
    const v = viewerARef.current;
    if (!v) return;
    const height = v.camera.positionCartographic?.height || 1000000;
    const moveAmount = Math.max(5000, height * 0.45);
    v.camera.zoomOut(moveAmount);
    if (viewMode === 'split' && viewerBRef.current) {
      viewerBRef.current.camera.zoomOut(moveAmount);
    }
  };

  const handleFitMoon = () => {
    const moon = Cesium.Ellipsoid.MOON;
    viewerARef.current?.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(siteA.lon, siteA.lat, 2400000, moon),
      duration: 1.2,
    });
    if (viewMode === 'split' && viewerBRef.current && siteB) {
      viewerBRef.current.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(siteB.lon, siteB.lat, 2400000, moon),
        duration: 1.2,
      });
    }
  };

  // Keyboard shortcut listener for +/- zoom
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-' || e.key === '_') {
        handleZoomOut();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode]);

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

        {/* Floating NASA Zoom Controls Widget (Right Side of Viewport) using shadcn Button */}
        <div className="absolute right-4 top-20 z-20 flex flex-col items-center bg-space-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-700/80 shadow-2xl gap-1.5 font-mono">
          <Button
            variant="default"
            size="icon"
            onClick={handleZoomIn}
            title="Zoom In (+) [Keyboard: +]"
            className="text-cyan-300 hover:text-white"
          >
            <Plus className="w-4 h-4" />
          </Button>

          <div className="py-1 px-1.5 text-center flex flex-col items-center">
            <span className="text-[9px] text-slate-500 uppercase">ALT</span>
            <span className="text-[10px] font-bold text-slate-200">
              {altitudeKm >= 1000 ? `${(altitudeKm / 1000).toFixed(1)}k` : altitudeKm} km
            </span>
          </div>

          <Button
            variant="default"
            size="icon"
            onClick={handleZoomOut}
            title="Zoom Out (-) [Keyboard: -]"
            className="text-cyan-300 hover:text-white"
          >
            <Minus className="w-4 h-4" />
          </Button>

          <Button
            variant="secondary"
            size="icon-sm"
            onClick={handleFitMoon}
            title="Fit Moon / Reset Zoom [Keyboard: 0]"
            className="mt-0.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Camera Quick Presets (Bottom Left of 3D Viewport) using shadcn Button */}
        <div className="absolute bottom-4 left-4 z-20 flex flex-wrap items-center gap-1.5 bg-space-900/85 backdrop-blur-md p-1.5 rounded-xl border border-slate-700/70 text-xs">
          <Button
            variant="secondary"
            size="xs"
            onClick={flyToSouthPole}
            className="font-mono"
          >
            South Pole (85°-90°S)
          </Button>
          <Button
            variant="cyanPill"
            size="xs"
            onClick={flyToSiteA}
            className="font-mono"
          >
            Site A Zoom
          </Button>
          {siteB && (
            <Button
              variant="amberPill"
              size="xs"
              onClick={flyToSiteB}
              className="font-mono"
            >
              Site B Zoom
            </Button>
          )}
          <Button
            variant="secondary"
            size="xs"
            onClick={flyToOrbitalVista}
            className="font-mono"
          >
            Orbital Vista
          </Button>

          <div className="h-4 w-px bg-slate-700 mx-1" />

          {/* Toggle Sightlines & Trajectories */}
          <Button
            variant={showSightlines ? 'cyanPill' : 'ghost'}
            size="xs"
            onClick={() => setShowSightlines(!showSightlines)}
            className="font-mono"
          >
            Laser Rays
          </Button>
          <Button
            variant={showSunOrbit ? 'amberPill' : 'ghost'}
            size="xs"
            onClick={() => setShowSunOrbit(!showSunOrbit)}
            className="font-mono"
          >
            Sun Orbit
          </Button>
          <Button
            variant={showEarthOrbit ? 'cyanPill' : 'ghost'}
            size="xs"
            onClick={() => setShowEarthOrbit(!showEarthOrbit)}
            className="font-mono"
          >
            Earth Libration
          </Button>

          <div className="h-4 w-px bg-slate-700 mx-1" />

          {/* Auto-Spin Moon Turntable Controls */}
          <Button
            variant={autoSpin ? 'nasa' : 'secondary'}
            size="xs"
            onClick={() => setAutoSpin(!autoSpin)}
            className="font-mono gap-1"
            title="Toggle fast 3D rotation of the Moon"
          >
            <RotateCw className={`w-3 h-3 ${autoSpin ? 'animate-spin' : ''}`} />
            <span>{autoSpin ? 'Auto-Spin' : 'Spin Paused'}</span>
          </Button>

          {autoSpin && (
            <Button
              variant="secondary"
              size="xs"
              onClick={() => setSpinSpeedIndex((prev) => (prev + 1) % spinSpeeds.length)}
              title="Click to cycle spin speed (1x, 2x, 4x)"
              className="font-mono text-[10px] px-1.5 text-cyan-300 font-bold"
            >
              {['1x', '2x', '4x'][spinSpeedIndex]}
            </Button>
          )}
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
            <Badge variant="optimal" className="gap-1 border-l border-slate-700 pl-2">
              <Sparkles className="w-3.5 h-3.5" />
              {scientificLayer === 'volatiles'
                ? 'LEND Volatiles / Ice'
                : scientificLayer === 'thermal'
                ? 'Diviner Rock Hazard'
                : 'Shadow Density'}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
};
