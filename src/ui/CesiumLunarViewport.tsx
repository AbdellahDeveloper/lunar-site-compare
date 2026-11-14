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

// Procedural high-resolution radiant solar disk with corona
function createSunCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(64, 64, 12, 64, 64, 64);
    grad.addColorStop(0, '#ffffff'); // bright core
    grad.addColorStop(0.25, '#fef08a'); // golden photosphere
    grad.addColorStop(0.55, '#f59e0b'); // amber chromosphere
    grad.addColorStop(0.85, 'rgba(245, 158, 11, 0.45)'); // coronal flare
    grad.addColorStop(1, 'rgba(245, 158, 11, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(64, 64, 64, 0, Math.PI * 2);
    ctx.fill();
  }
  return canvas;
}

// Procedural high-resolution Earth model with atmosphere
function createEarthCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Atmospheric blue halo
    const halo = ctx.createRadialGradient(64, 64, 36, 64, 64, 64);
    halo.addColorStop(0, 'rgba(56, 189, 248, 0.85)');
    halo.addColorStop(0.7, 'rgba(56, 189, 248, 0.35)');
    halo.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(64, 64, 64, 0, Math.PI * 2);
    ctx.fill();

    // Ocean sphere
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(64, 64, 40, 0, Math.PI * 2);
    ctx.fill();

    // Continents
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(55, 58, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(74, 70, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(72, 50, 9, 0, Math.PI * 2);
    ctx.fill();

    // Clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.beginPath();
    ctx.arc(60, 68, 18, 0, Math.PI);
    ctx.fill();
  }
  return canvas;
}

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

  // Auto-Spin Turntable state (3D Moon rotation)
  const [autoSpin, setAutoSpin] = useState<boolean>(false);
  const isInteractingRef = useRef<boolean>(false);
  const interactionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [spinSpeedIndex, setSpinSpeedIndex] = useState<number>(1); // 0 = 1x (~15°/s), 1 = 2x (~32°/s), 2 = 4x (~65°/s)
  const spinSpeeds = [0.25, 0.55, 1.15];

  // Dynamic 3D celestial positions in Moon-fixed frame (evaluated at 60fps)
  const sunPosRef = useRef<Cesium.Cartesian3>(new Cesium.Cartesian3(14000000, 0, 0));
  const earthPosRef = useRef<Cesium.Cartesian3>(new Cesium.Cartesian3(9000000, 0, 0));

  // Procedural celestial glow textures
  const sunCanvasRef = useRef<HTMLCanvasElement>(createSunCanvas());
  const earthCanvasRef = useRef<HTMLCanvasElement>(createEarthCanvas());

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

    // Configure screen space camera controller for smooth & responsive navigation
    const ssc = viewer.scene.screenSpaceCameraController;
    ssc.enableZoom = true;
    ssc.enableRotate = true;
    ssc.enableTilt = true;
    ssc.enableTranslate = false;
    ssc.minimumZoomDistance = 400.0; // 400 meters above surface
    ssc.maximumZoomDistance = 50000000.0; // 50,000 km deep space
    ssc.zoomFactor = 8.0;
    ssc.inertiaZoom = 0.5;
    ssc.inertiaSpin = 0.5;

    // Use Cesium native handlers for Right-Drag zoom and Touch Pinch
    ssc.zoomEventTypes = [
      Cesium.CameraEventType.RIGHT_DRAG,
      Cesium.CameraEventType.PINCH,
    ];

    // Track user interaction to seamlessly yield turntable rotation
    const canvas = viewer.canvas;
    const notifyInteraction = () => {
      isInteractingRef.current = true;
      if (interactionTimeoutRef.current) clearTimeout(interactionTimeoutRef.current);
      interactionTimeoutRef.current = setTimeout(() => {
        isInteractingRef.current = false;
      }, 3000);
    };

    // Universal cursor-centric mouse wheel / trackpad zoom (Google Earth / CAD standard)
    const handleCanvasWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (viewer.isDestroyed()) return;

      notifyInteraction();

      const scene = viewer.scene;
      const camera = scene.camera;
      const rect = canvas.getBoundingClientRect();
      const mousePos = new Cesium.Cartesian2(e.clientX - rect.left, e.clientY - rect.top);

      // Normalize wheel delta across mice, trackpads, and operating systems
      const rawDelta = e.deltaY;
      const clampedDelta = Math.sign(rawDelta) * Math.min(Math.abs(rawDelta), 100);
      // factor < 1.0 zooms in, factor > 1.0 zooms out
      const factor = Math.exp(clampedDelta * 0.0022);

      // Raycast against Moon ellipsoid to find exact lunar terrain point under cursor
      const ray = camera.getPickRay(mousePos);
      let targetPoint: Cesium.Cartesian3 | undefined;
      if (ray) {
        const intersection = Cesium.IntersectionTests.rayEllipsoid(ray, Cesium.Ellipsoid.MOON);
        if (intersection && intersection.start > 0) {
          targetPoint = Cesium.Ray.getPoint(ray, intersection.start, new Cesium.Cartesian3());
        }
      }

      const currentHeight = camera.positionCartographic?.height || 1000000;

      if (targetPoint && factor < 1.0) {
        // Zooming IN directly toward the crater or surface feature under the cursor
        const toTarget = Cesium.Cartesian3.subtract(targetPoint, camera.position, new Cesium.Cartesian3());
        const distanceToTarget = Cesium.Cartesian3.magnitude(toTarget);
        if (currentHeight > 500) {
          const moveDistance = distanceToTarget * (1.0 - factor);
          Cesium.Cartesian3.normalize(toTarget, toTarget);
          camera.move(toTarget, moveDistance);
        }
      } else {
        // Zooming OUT, or zooming when cursor is in space around the Moon
        if (factor < 1.0) {
          if (currentHeight > 500) {
            const moveAmount = Math.max(300, currentHeight * (1.0 - factor));
            camera.zoomIn(moveAmount);
          }
        } else {
          if (currentHeight < 50000000) {
            const moveAmount = Math.max(600, currentHeight * (factor - 1.0));
            camera.zoomOut(moveAmount);
          }
        }
      }

      scene.requestRender();
    };

    const handlePointerDown = () => {
      notifyInteraction();
    };

    // Double-click to fly smoothly into clicked crater/location
    const handleDoubleClick = (e: MouseEvent) => {
      if (viewer.isDestroyed()) return;
      notifyInteraction();
      const rect = canvas.getBoundingClientRect();
      const mousePos = new Cesium.Cartesian2(e.clientX - rect.left, e.clientY - rect.top);
      const ray = viewer.camera.getPickRay(mousePos);
      if (ray) {
        const intersection = Cesium.IntersectionTests.rayEllipsoid(ray, Cesium.Ellipsoid.MOON);
        if (intersection && intersection.start > 0) {
          const target = Cesium.Ray.getPoint(ray, intersection.start, new Cesium.Cartesian3());
          const carto = Cesium.Cartographic.fromCartesian(target, Cesium.Ellipsoid.MOON);
          viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromRadians(
              carto.longitude,
              carto.latitude,
              Math.max(25000, (viewer.camera.positionCartographic?.height || 500000) * 0.35),
              Cesium.Ellipsoid.MOON
            ),
            duration: 1.0,
          });
        }
      }
    };

    canvas.addEventListener('wheel', handleCanvasWheel, { passive: false });
    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('dblclick', handleDoubleClick);

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

  // Keep sunPosRef, earthPosRef, and directional sunlight in sync at 60fps
  useEffect(() => {
    const sLen = Math.hypot(sunVec.x, sunVec.y, sunVec.z) || 1;
    const sunDir = new Cesium.Cartesian3(sunVec.x / sLen, sunVec.y / sLen, sunVec.z / sLen);
    sunPosRef.current = Cesium.Cartesian3.multiplyByScalar(sunDir, 14000000.0, new Cesium.Cartesian3());

    const eLen = Math.hypot(earthVec.x, earthVec.y, earthVec.z) || 1;
    const earthDir = new Cesium.Cartesian3(earthVec.x / eLen, earthVec.y / eLen, earthVec.z / eLen);
    earthPosRef.current = Cesium.Cartesian3.multiplyByScalar(earthDir, 9000000.0, new Cesium.Cartesian3());

    const updateLight = (viewer: Cesium.Viewer | null) => {
      if (!viewer || viewer.isDestroyed()) return;
      viewer.scene.light = new Cesium.DirectionalLight({
        direction: Cesium.Cartesian3.negate(sunDir, new Cesium.Cartesian3()),
        color: Cesium.Color.fromCssColorString('#fffdf5'),
        intensity: 3.5,
      });
      viewer.scene.requestRender();
    };

    updateLight(viewerARef.current);
    if (viewMode === 'split') {
      updateLight(viewerBRef.current);
    }
  }, [sunVec, earthVec, viewMode]);

  // Update Entities (Sun Model, Earth Model, Site Pins, Laser Sightlines, Trajectories)
  const updateViewerEntities = (
    viewer: Cesium.Viewer | null,
    primarySite: Site,
    secondarySite?: Site
  ) => {
    if (!viewer || viewer.isDestroyed()) return;

    viewer.entities.removeAll();

    const moon = Cesium.Ellipsoid.MOON;

    // Site A Landing Pin Position
    const siteAPos = Cesium.Cartesian3.fromDegrees(
      primarySite.lon,
      primarySite.lat,
      primarySite.elevKm * 1000,
      moon
    );

    // 1. Dynamic 3D Sun Model (Sphere + Radiant Corona Billboard + Core Point + Label)
    // Using CallbackPositionProperty ensures all 4 representations move in exact lockstep
    viewer.entities.add({
      id: 'sun_model',
      name: 'Sun Model',
      position: new Cesium.CallbackPositionProperty(() => sunPosRef.current, false),
      billboard: {
        image: sunCanvasRef.current,
        width: 80,
        height: 80,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
      point: {
        pixelSize: 34,
        color: Cesium.Color.fromCssColorString('#ffffff'),
        outlineColor: Cesium.Color.fromCssColorString('#f59e0b'),
        outlineWidth: 3.5,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
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
        pixelOffset: new Cesium.Cartesian2(0, -48),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
    });

    // 2. Dynamic 3D Earth Model (Atmosphere Halo Billboard + Core Point + Ellipsoid + Label)
    viewer.entities.add({
      id: 'earth_model',
      name: 'Earth Model',
      position: new Cesium.CallbackPositionProperty(() => earthPosRef.current, false),
      billboard: {
        image: earthCanvasRef.current,
        width: 68,
        height: 68,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
      point: {
        pixelSize: 26,
        color: Cesium.Color.fromCssColorString('#0284c7'),
        outlineColor: Cesium.Color.fromCssColorString('#38bdf8'),
        outlineWidth: 3,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
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
        pixelOffset: new Cesium.Cartesian2(0, -40),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
    });

    // 3. Site A Landing Pin
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

    // 4. Directional Laser Rays from Site A (Dynamic CallbackProperty)
    viewer.entities.add({
      id: 'ray_sun_a',
      show: showSightlines,
      polyline: {
        positions: new Cesium.CallbackProperty(() => [siteAPos, sunPosRef.current], false),
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
        positions: new Cesium.CallbackProperty(() => [siteAPos, earthPosRef.current], false),
        width: 2.5,
        material: new Cesium.PolylineGlowMaterialProperty({
          glowPower: 0.3,
          color: Cesium.Color.fromCssColorString('#06b6d4'),
        }),
      },
    });

    // 5. Site B Landing Pin and Rays (if available)
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

      viewer.entities.add({
        id: 'ray_sun_b',
        show: showSightlines,
        polyline: {
          positions: new Cesium.CallbackProperty(() => [siteBPos, sunPosRef.current], false),
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
          positions: new Cesium.CallbackProperty(() => [siteBPos, earthPosRef.current], false),
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

  // Re-build entities only when sites, layers, or trajectory toggles change
  useEffect(() => {
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

  // High-Speed Auto-Spin Turntable Loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const spinLoop = (now: number) => {
      const dt = Math.min(0.1, (now - lastTime) / 1000);
      lastTime = now;

      if (autoSpin && !isInteractingRef.current) {
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

        {/* Floating NASA Camera HUD & Zoom Controls Widget (Right Side of Viewport) */}
        <div className="absolute right-4 top-20 z-20 flex flex-col items-end gap-2 font-mono">
          {/* Live Altitude Telemetry Badge */}
          <div className="bg-space-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/80 shadow-xl flex flex-col items-end text-right">
            <span className="text-[9px] font-bold text-cyan-400 uppercase tracking-wider">
              ALTITUDE
            </span>
            <span className="text-xs font-bold text-slate-100">
              {altitudeKm >= 1000 ? `${(altitudeKm / 1000).toFixed(1)}k` : altitudeKm} km
            </span>
          </div>

          {/* Quick Zoom Buttons & Reset */}
          <div className="flex flex-col items-center bg-space-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-700/80 shadow-2xl gap-1">
            <Button
              variant="default"
              size="icon"
              onClick={handleZoomIn}
              title="Zoom In (or scroll mouse wheel forward)"
              className="text-cyan-300 hover:text-white h-8 w-8"
            >
              <Plus className="w-4 h-4" />
            </Button>

            <Button
              variant="default"
              size="icon"
              onClick={handleZoomOut}
              title="Zoom Out (or scroll mouse wheel backward)"
              className="text-cyan-300 hover:text-white h-8 w-8"
            >
              <Minus className="w-4 h-4" />
            </Button>

            <div className="h-px w-5 bg-slate-700/80 my-0.5" />

            <Button
              variant="secondary"
              size="icon-sm"
              onClick={handleFitMoon}
              title="Fit Moon / Reset Orbital Vista (Double-click any crater to zoom into it)"
              className="h-7 w-7 text-slate-300 hover:text-cyan-300"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* Mouse Navigation Quick Guide Pill */}
          <div className="hidden lg:flex items-center gap-1.5 px-2 py-1 rounded-md bg-space-950/80 border border-slate-800 text-[10px] text-slate-400 shadow-md">
            <span>Scroll Wheel: Zoom</span>
            <span className="text-slate-600">•</span>
            <span>Drag: Orbit</span>
            <span className="text-slate-600">•</span>
            <span>Dbl-Click: Focus</span>
          </div>
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
