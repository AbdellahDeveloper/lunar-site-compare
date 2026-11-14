import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import * as Cesium from 'cesium';
import {
  ComparisonViewMode,
  EphemerisPoint,
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

// Procedural point light source canvas with radiant corona & diffraction spikes
function createPointLightCanvas(mode: 'dual' | 'sun' | 'earth' | 'dormant'): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const cx = 64;
  const cy = 64;

  if (mode === 'dual') {
    // Both Sun (Gold) and Earth (Cyan) active: brilliant energetic fusion
    const grad = ctx.createRadialGradient(cx, cy, 3, cx, cy, 60);
    grad.addColorStop(0, '#ffffff'); // blinding hot center
    grad.addColorStop(0.2, '#fef08a'); // golden solar inner halo
    grad.addColorStop(0.5, 'rgba(34, 211, 238, 0.7)'); // cyan comms mid-halo
    grad.addColorStop(0.85, 'rgba(6, 182, 212, 0.25)');
    grad.addColorStop(1, 'rgba(6, 182, 212, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, 60, 0, Math.PI * 2);
    ctx.fill();

    // 4-point star specular flare spikes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 32, cy); ctx.lineTo(cx + 32, cy);
    ctx.moveTo(cx, cy - 32); ctx.lineTo(cx, cy + 32);
    ctx.stroke();
  } else if (mode === 'sun') {
    // Sun LIT: Warm Radiant Gold / Amber
    const grad = ctx.createRadialGradient(cx, cy, 3, cx, cy, 54);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.25, '#fbbf24');
    grad.addColorStop(0.65, 'rgba(245, 158, 11, 0.6)');
    grad.addColorStop(1, 'rgba(245, 158, 11, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, 54, 0, Math.PI * 2);
    ctx.fill();

    // Specular flare
    ctx.strokeStyle = 'rgba(254, 240, 138, 0.85)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(cx - 26, cy); ctx.lineTo(cx + 26, cy);
    ctx.moveTo(cx, cy - 26); ctx.lineTo(cx, cy + 26);
    ctx.stroke();
  } else if (mode === 'earth') {
    // Earth LINK: Vibrant Electric Sky Blue / Cyan
    const grad = ctx.createRadialGradient(cx, cy, 3, cx, cy, 54);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.25, '#38bdf8');
    grad.addColorStop(0.65, 'rgba(34, 211, 238, 0.6)');
    grad.addColorStop(1, 'rgba(34, 211, 238, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, 54, 0, Math.PI * 2);
    ctx.fill();

    // Concentric radar wave ring
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, 26, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    // Dormant: In Shadow & Radio Blackout
    const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, 32);
    grad.addColorStop(0, '#cbd5e1');
    grad.addColorStop(0.4, 'rgba(100, 116, 139, 0.45)');
    grad.addColorStop(1, 'rgba(100, 116, 139, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, 32, 0, Math.PI * 2);
    ctx.fill();
  }

  return canvas;
}

export interface CesiumViewportHandle {
  flyToSouthPole: () => void;
  flyToSiteA: () => void;
  flyToSiteB: () => void;
  flyToOrbitalVista: () => void;
  handleFitMoon: () => void;
  handleZoomIn: () => void;
  handleZoomOut: () => void;
}

export interface CesiumLunarViewportProps {
  viewMode: ComparisonViewMode;
  siteA: Site;
  siteB?: Site;
  currentPointA: EphemerisPoint;
  currentPointB?: EphemerisPoint;
  allPointsA: EphemerisPoint[];
  allPointsB?: EphemerisPoint[];
  sunVec: Vector3D;
  earthVec: Vector3D;
  currentTimeMs: number;
  showSightlines: boolean;
  showSunOrbit: boolean;
  showEarthOrbit: boolean;
  autoSpin: boolean;
  spinSpeedIndex: number;
}

export const CesiumLunarViewport = forwardRef<CesiumViewportHandle, CesiumLunarViewportProps>(({
  viewMode,
  siteA,
  siteB,
  currentPointA,
  currentPointB,
  allPointsA,
  allPointsB,
  sunVec,
  earthVec,
  currentTimeMs,
  showSightlines,
  showSunOrbit,
  showEarthOrbit,
  autoSpin,
  spinSpeedIndex,
}, ref) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const containerBRef = useRef<HTMLDivElement | null>(null);

  const viewerARef = useRef<Cesium.Viewer | null>(null);
  const viewerBRef = useRef<Cesium.Viewer | null>(null);

  // Live Camera Altitude state
  const [altitudeKm, setAltitudeKm] = useState<number>(850);

  // Auto-Spin Turntable state (3D Moon rotation)
  const isInteractingRef = useRef<boolean>(false);
  const interactionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const spinSpeeds = [0.25, 0.55, 1.15];

  // Dynamic 3D celestial positions in Moon-fixed frame (evaluated at 60fps)
  const sunPosRef = useRef<Cesium.Cartesian3>(new Cesium.Cartesian3(14000000, 0, 0));
  const earthPosRef = useRef<Cesium.Cartesian3>(new Cesium.Cartesian3(9000000, 0, 0));

  // Procedural celestial glow textures
  const sunCanvasRef = useRef<HTMLCanvasElement>(createSunCanvas());
  const earthCanvasRef = useRef<HTMLCanvasElement>(createEarthCanvas());

  // Dynamic Ephemeris points refs for instantaneous 60fps callback properties
  const currentPointARef = useRef<EphemerisPoint>(currentPointA);
  currentPointARef.current = currentPointA;
  const currentPointBRef = useRef<EphemerisPoint | undefined>(currentPointB);
  currentPointBRef.current = currentPointB;

  // Procedural point light textures
  const pointLightTexturesRef = useRef({
    dual: createPointLightCanvas('dual'),
    sun: createPointLightCanvas('sun'),
    earth: createPointLightCanvas('earth'),
    dormant: createPointLightCanvas('dormant'),
  });

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
      mapProjection: new Cesium.GeographicProjection(Cesium.Ellipsoid.MOON),
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

    // Disable legacy Cesium GIS camera controller inputs to avoid deadzones and stuck rotation
    const ssc = viewer.scene.screenSpaceCameraController;
    ssc.enableRotate = false;
    ssc.enableTranslate = false;
    ssc.enableTilt = false;
    ssc.enableLook = false;
    ssc.enableZoom = false;

    // Track user interaction to seamlessly yield turntable rotation
    const canvas = viewer.canvas;
    canvas.style.touchAction = 'none';

    const notifyInteraction = () => {
      isInteractingRef.current = true;
      if (interactionTimeoutRef.current) clearTimeout(interactionTimeoutRef.current);
      interactionTimeoutRef.current = setTimeout(() => {
        isInteractingRef.current = false;
      }, 3000);
    };

    // --- Direct High-Precision Trackball Orbit & Drag Controller (Zero Deadzone) ---
    let isDragging = false;
    let dragMode: 'orbit' | 'zoom' = 'orbit';
    let lastX = 0;
    let lastY = 0;
    let activePointerId = -1;
    let velX = 0;
    let velY = 0;
    let lastMoveTime = performance.now();
    let momentumAnimId: number | null = null;

    const stopInertia = () => {
      if (momentumAnimId !== null) {
        cancelAnimationFrame(momentumAnimId);
        momentumAnimId = null;
      }
      velX = 0;
      velY = 0;
    };

    const applyInertia = () => {
      if (Math.hypot(velX, velY) < 0.005 || isDragging) {
        stopInertia();
        return;
      }
      if (viewer.isDestroyed()) return;

      const camera = viewer.scene.camera;
      camera.rotate(camera.up, -velX * 0.035);
      camera.rotate(camera.right, -velY * 0.035);
      viewer.scene.requestRender();

      velX *= 0.91; // Smooth aerospace friction
      velY *= 0.91;

      momentumAnimId = requestAnimationFrame(applyInertia);
    };

    const handlePointerDown = (e: PointerEvent) => {
      // Ignore if multi-touch pinch is active
      if (e.pointerType === 'touch' && lastPinchDist > 0) return;

      stopInertia();
      notifyInteraction();

      isDragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      activePointerId = e.pointerId;
      dragMode = e.button === 2 ? 'zoom' : 'orbit';
      lastMoveTime = performance.now();
      velX = 0;
      velY = 0;

      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {}
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging || e.pointerId !== activePointerId) return;
      notifyInteraction();

      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;

      if (dx === 0 && dy === 0) return;

      const now = performance.now();
      const dt = Math.max(1, now - lastMoveTime);
      lastMoveTime = now;

      // Track movement velocity for inertia glide
      velX = dx / dt;
      velY = dy / dt;

      const scene = viewer.scene;
      const camera = scene.camera;

      if (dragMode === 'zoom') {
        // Right-drag zoom
        const currentHeight = camera.positionCartographic?.height || 1000000;
        const zoomDelta = -dy * 0.004;
        if (zoomDelta > 0) {
          camera.zoomIn(Math.max(300, currentHeight * Math.min(0.25, zoomDelta)));
        } else {
          camera.zoomOut(Math.max(500, currentHeight * Math.min(0.25, -zoomDelta)));
        }
      } else {
        // Left-drag / single-touch trackball orbit around the Moon
        // Immediate response on even 1-pixel movement
        const sensitivity = 0.0035;
        const angleH = -dx * sensitivity;
        const angleV = -dy * sensitivity;

        if (Math.abs(angleH) > 0.000001) {
          camera.rotate(camera.up, angleH);
        }
        if (Math.abs(angleV) > 0.000001) {
          camera.rotate(camera.right, angleV);
        }
      }

      scene.requestRender();
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (e.pointerId === activePointerId) {
        isDragging = false;
        try {
          canvas.releasePointerCapture(e.pointerId);
        } catch {}

        // Launch smooth glide if released with motion
        if (dragMode === 'orbit' && Math.hypot(velX, velY) > 0.06) {
          momentumAnimId = requestAnimationFrame(applyInertia);
        }
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // Universal cursor-centric mouse wheel & two-finger trackpad pinch zoom
    const handleCanvasWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (viewer.isDestroyed()) return;

      notifyInteraction();

      const scene = viewer.scene;
      const camera = scene.camera;
      const rect = canvas.getBoundingClientRect();
      const mousePos = new Cesium.Cartesian2(e.clientX - rect.left, e.clientY - rect.top);

      // Distinguish two-finger trackpad pinch (ctrlKey is true) from standard wheel scroll
      const isTrackpadPinch = e.ctrlKey;
      const rawDelta = e.deltaY;
      const clampedDelta = Math.sign(rawDelta) * Math.min(Math.abs(rawDelta), 100);
      const sensitivity = isTrackpadPinch ? 0.012 : 0.0022;
      // factor < 1.0 zooms in, factor > 1.0 zooms out
      const factor = Math.exp(clampedDelta * sensitivity);

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
        if (currentHeight > 400) {
          const moveDistance = distanceToTarget * (1.0 - factor);
          Cesium.Cartesian3.normalize(toTarget, toTarget);
          camera.move(toTarget, moveDistance);
        }
      } else {
        // Zooming OUT, or zooming when cursor is in space around the Moon
        if (factor < 1.0) {
          if (currentHeight > 400) {
            const moveAmount = Math.max(250, currentHeight * (1.0 - factor));
            camera.zoomIn(moveAmount);
          }
        } else {
          if (currentHeight < 55000000) {
            const moveAmount = Math.max(500, currentHeight * (factor - 1.0));
            camera.zoomOut(moveAmount);
          }
        }
      }

      scene.requestRender();
    };

    // --- Two-Finger Touch Pinch-to-Zoom (Touchscreens, Tablets, Mobile) ---
    let lastPinchDist = 0;

    const getTouchDist = (t0: Touch, t1: Touch) => {
      return Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
    };

    const getTouchMidpoint = (t0: Touch, t1: Touch) => {
      return {
        x: (t0.clientX + t1.clientX) / 2,
        y: (t0.clientY + t1.clientY) / 2,
      };
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        notifyInteraction();
        const dist = getTouchDist(e.touches[0], e.touches[1]);
        lastPinchDist = dist;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        if (viewer.isDestroyed()) return;
        notifyInteraction();

        const dist = getTouchDist(e.touches[0], e.touches[1]);
        if (lastPinchDist <= 0) {
          lastPinchDist = dist;
          return;
        }

        // scale > 1 = spreading fingers (zoom in), scale < 1 = pinching fingers (zoom out)
        const scale = dist / lastPinchDist;
        lastPinchDist = dist;

        if (Math.abs(scale - 1) < 0.001) return;

        const mid = getTouchMidpoint(e.touches[0], e.touches[1]);
        const rect = canvas.getBoundingClientRect();
        const mousePos = new Cesium.Cartesian2(mid.x - rect.left, mid.y - rect.top);

        const scene = viewer.scene;
        const camera = scene.camera;
        const ray = camera.getPickRay(mousePos);

        let targetPoint: Cesium.Cartesian3 | undefined;
        if (ray) {
          const intersection = Cesium.IntersectionTests.rayEllipsoid(ray, Cesium.Ellipsoid.MOON);
          if (intersection && intersection.start > 0) {
            targetPoint = Cesium.Ray.getPoint(ray, intersection.start, new Cesium.Cartesian3());
          }
        }

        const factor = 1 / scale;
        const currentHeight = camera.positionCartographic?.height || 1000000;

        if (targetPoint && factor < 1.0) {
          // Pinching outward: Zoom in toward the crater/feature between the two fingers
          const toTarget = Cesium.Cartesian3.subtract(targetPoint, camera.position, new Cesium.Cartesian3());
          const distanceToTarget = Cesium.Cartesian3.magnitude(toTarget);
          if (currentHeight > 400) {
            const moveDistance = distanceToTarget * (1.0 - factor);
            Cesium.Cartesian3.normalize(toTarget, toTarget);
            camera.move(toTarget, moveDistance);
          }
        } else {
          if (factor < 1.0) {
            if (currentHeight > 400) {
              const moveAmount = Math.max(250, currentHeight * (1.0 - factor));
              camera.zoomIn(moveAmount);
            }
          } else {
            if (currentHeight < 55000000) {
              const moveAmount = Math.max(500, currentHeight * (factor - 1.0));
              camera.zoomOut(moveAmount);
            }
          }
        }

        scene.requestRender();
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        lastPinchDist = 0;
      }
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

    // Attach high-precision trackball, wheel, touch & gesture listeners
    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('pointercancel', handlePointerUp);
    canvas.addEventListener('contextmenu', handleContextMenu);
    canvas.addEventListener('wheel', handleCanvasWheel, { passive: false });
    canvas.addEventListener('touchstart', handleTouchStart, { passive: true });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: true });
    canvas.addEventListener('touchcancel', handleTouchEnd, { passive: true });
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

  // Keep point light states and directional swaths reactive at 60fps
  useEffect(() => {
    currentPointARef.current = currentPointA;
    currentPointBRef.current = currentPointB;
    viewerARef.current?.scene.requestRender();
    if (viewerBRef.current) {
      viewerBRef.current.scene.requestRender();
    }
  }, [currentPointA, currentPointB, currentTimeMs]);

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

    // 3. Site A: Dynamic Physical Lights on the Moon (Replacing static point marker)

    // 3a. Directional Solar Illumination Light Swath (Represents where sunlight is falling)
    viewer.entities.add({
      id: 'site_a_sun_light_swath',
      name: `${siteA.name} Solar Illumination`,
      position: siteAPos,
      ellipse: {
        semiMajorAxis: new Cesium.CallbackProperty(() => {
          const pt = currentPointARef.current;
          if (!pt || !pt.sun.isVisible) return 0.1;
          const elev = Math.max(0.5, pt.sun.elevationDeg);
          // Low grazing sunlight casts long grazing swaths across ridges
          const grazingStretch = Math.min(38000, 16000 / Math.tan(Cesium.Math.toRadians(Math.max(0.8, elev))));
          return Math.max(14000, grazingStretch);
        }, false),
        semiMinorAxis: new Cesium.CallbackProperty(() => {
          const pt = currentPointARef.current;
          if (!pt || !pt.sun.isVisible) return 0.1;
          return 7500;
        }, false),
        rotation: new Cesium.CallbackProperty(() => {
          const pt = currentPointARef.current;
          if (!pt) return 0;
          return Cesium.Math.toRadians(360 - pt.sun.azimuthDeg);
        }, false),
        material: Cesium.Color.fromCssColorString('rgba(245, 158, 11, 0.42)'),
        outline: true,
        outlineColor: Cesium.Color.fromCssColorString('#f59e0b'),
        outlineWidth: 1.5,
      },
    });

    // 3b. Directional Direct-to-Earth Comm Light Swath (Represents direct comm corridor)
    viewer.entities.add({
      id: 'site_a_earth_comm_swath',
      name: `${siteA.name} Earth Direct Link`,
      position: siteAPos,
      ellipse: {
        semiMajorAxis: new Cesium.CallbackProperty(() => {
          const pt = currentPointARef.current;
          if (!pt || !pt.earth.isVisible) return 0.1;
          return 26000;
        }, false),
        semiMinorAxis: new Cesium.CallbackProperty(() => {
          const pt = currentPointARef.current;
          if (!pt || !pt.earth.isVisible) return 0.1;
          return 9000;
        }, false),
        rotation: new Cesium.CallbackProperty(() => {
          const pt = currentPointARef.current;
          if (!pt) return 0;
          return Cesium.Math.toRadians(360 - pt.earth.azimuthDeg);
        }, false),
        material: Cesium.Color.fromCssColorString('rgba(34, 211, 238, 0.40)'),
        outline: true,
        outlineColor: Cesium.Color.fromCssColorString('#38bdf8'),
        outlineWidth: 1.5,
      },
    });

    // 3c. Site A Point Light Beacon (Glowing Physical Light Source on the Surface)
    viewer.entities.add({
      id: 'site_a_pin',
      name: siteA.name,
      position: siteAPos,
      billboard: {
        image: new Cesium.CallbackProperty(() => {
          const pt = currentPointARef.current;
          if (!pt) return pointLightTexturesRef.current.dormant;
          if (pt.sun.isVisible && pt.earth.isVisible) return pointLightTexturesRef.current.dual;
          if (pt.sun.isVisible) return pointLightTexturesRef.current.sun;
          if (pt.earth.isVisible) return pointLightTexturesRef.current.earth;
          return pointLightTexturesRef.current.dormant;
        }, false),
        width: new Cesium.CallbackProperty(() => {
          const pt = currentPointARef.current;
          if (!pt) return 20;
          if (pt.sun.isVisible && pt.earth.isVisible) return 42;
          if (pt.sun.isVisible || pt.earth.isVisible) return 35;
          return 20;
        }, false),
        height: new Cesium.CallbackProperty(() => {
          const pt = currentPointARef.current;
          if (!pt) return 20;
          if (pt.sun.isVisible && pt.earth.isVisible) return 42;
          if (pt.sun.isVisible || pt.earth.isVisible) return 35;
          return 20;
        }, false),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
      point: {
        pixelSize: new Cesium.CallbackProperty(() => {
          const pt = currentPointARef.current;
          if (!pt) return 6;
          if (pt.sun.isVisible || pt.earth.isVisible) return 9;
          return 5;
        }, false),
        color: new Cesium.CallbackProperty(() => {
          const pt = currentPointARef.current;
          if (!pt) return Cesium.Color.fromCssColorString('#64748b');
          if (pt.sun.isVisible && pt.earth.isVisible) return Cesium.Color.WHITE;
          if (pt.sun.isVisible) return Cesium.Color.fromCssColorString('#fef08a');
          if (pt.earth.isVisible) return Cesium.Color.fromCssColorString('#a5f3fc');
          return Cesium.Color.fromCssColorString('#64748b');
        }, false),
        outlineColor: new Cesium.CallbackProperty(() => {
          const pt = currentPointARef.current;
          if (!pt) return Cesium.Color.BLACK;
          if (pt.sun.isVisible) return Cesium.Color.fromCssColorString('#f59e0b');
          if (pt.earth.isVisible) return Cesium.Color.fromCssColorString('#0284c7');
          return Cesium.Color.BLACK;
        }, false),
        outlineWidth: 2,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
      label: {
        text: new Cesium.CallbackProperty(() => {
          const pt = currentPointARef.current;
          const siteName = siteA.name.split('(')[0].trim();
          if (!pt) return siteName;
          const sunTag = pt.sun.isVisible ? 'LIT' : 'SHADOW';
          const earthTag = pt.earth.isVisible ? 'LINK' : 'OCC';
          return `${siteName} [${sunTag} | ${earthTag}]`;
        }, false),
        font: 'bold 11px Inter, sans-serif',
        fillColor: new Cesium.CallbackProperty(() => {
          const pt = currentPointARef.current;
          if (!pt) return Cesium.Color.fromCssColorString('#38bdf8');
          if (pt.sun.isVisible && pt.earth.isVisible) return Cesium.Color.fromCssColorString('#67e8f9');
          if (pt.sun.isVisible) return Cesium.Color.fromCssColorString('#fde047');
          if (pt.earth.isVisible) return Cesium.Color.fromCssColorString('#38bdf8');
          return Cesium.Color.fromCssColorString('#94a3b8');
        }, false),
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -20),
      },
    });

    // 4. Directional Laser Rays from Site A (Dynamic CallbackProperty)
    viewer.entities.add({
      id: 'ray_sun_a',
      show: showSightlines,
      polyline: {
        positions: new Cesium.CallbackProperty(() => [siteAPos, sunPosRef.current], false),
        width: new Cesium.CallbackProperty(() => (currentPointARef.current?.sun.isVisible ? 2.5 : 0.8), false),
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
        width: new Cesium.CallbackProperty(() => (currentPointARef.current?.earth.isVisible ? 2.5 : 0.8), false),
        material: new Cesium.PolylineGlowMaterialProperty({
          glowPower: 0.3,
          color: Cesium.Color.fromCssColorString('#06b6d4'),
        }),
      },
    });

    // 5. Site B: Dynamic Physical Lights on the Moon (if comparing)
    if (secondarySite) {
      const siteBTarget = secondarySite.id === siteA.id ? primarySite : secondarySite;
      const siteBPos = Cesium.Cartesian3.fromDegrees(
        siteBTarget.lon,
        siteBTarget.lat,
        siteBTarget.elevKm * 1000,
        moon
      );

      // 5a. Site B Directional Solar Illumination Light Swath
      viewer.entities.add({
        id: 'site_b_sun_light_swath',
        name: `${siteBTarget.name} Solar Illumination`,
        position: siteBPos,
        ellipse: {
          semiMajorAxis: new Cesium.CallbackProperty(() => {
            const pt = currentPointBRef.current;
            if (!pt || !pt.sun.isVisible) return 0.1;
            const elev = Math.max(0.5, pt.sun.elevationDeg);
            const grazingStretch = Math.min(38000, 16000 / Math.tan(Cesium.Math.toRadians(Math.max(0.8, elev))));
            return Math.max(14000, grazingStretch);
          }, false),
          semiMinorAxis: new Cesium.CallbackProperty(() => {
            const pt = currentPointBRef.current;
            if (!pt || !pt.sun.isVisible) return 0.1;
            return 7500;
          }, false),
          rotation: new Cesium.CallbackProperty(() => {
            const pt = currentPointBRef.current;
            if (!pt) return 0;
            return Cesium.Math.toRadians(360 - pt.sun.azimuthDeg);
          }, false),
          material: Cesium.Color.fromCssColorString('rgba(245, 158, 11, 0.42)'),
          outline: true,
          outlineColor: Cesium.Color.fromCssColorString('#f59e0b'),
          outlineWidth: 1.5,
        },
      });

      // 5b. Site B Directional Direct-to-Earth Comm Light Swath
      viewer.entities.add({
        id: 'site_b_earth_comm_swath',
        name: `${siteBTarget.name} Earth Direct Link`,
        position: siteBPos,
        ellipse: {
          semiMajorAxis: new Cesium.CallbackProperty(() => {
            const pt = currentPointBRef.current;
            if (!pt || !pt.earth.isVisible) return 0.1;
            return 26000;
          }, false),
          semiMinorAxis: new Cesium.CallbackProperty(() => {
            const pt = currentPointBRef.current;
            if (!pt || !pt.earth.isVisible) return 0.1;
            return 9000;
          }, false),
          rotation: new Cesium.CallbackProperty(() => {
            const pt = currentPointBRef.current;
            if (!pt) return 0;
            return Cesium.Math.toRadians(360 - pt.earth.azimuthDeg);
          }, false),
          material: Cesium.Color.fromCssColorString('rgba(34, 211, 238, 0.40)'),
          outline: true,
          outlineColor: Cesium.Color.fromCssColorString('#38bdf8'),
          outlineWidth: 1.5,
        },
      });

      // 5c. Site B Point Light Beacon
      viewer.entities.add({
        id: 'site_b_pin',
        name: siteBTarget.name,
        position: siteBPos,
        billboard: {
          image: new Cesium.CallbackProperty(() => {
            const pt = currentPointBRef.current;
            if (!pt) return pointLightTexturesRef.current.dormant;
            if (pt.sun.isVisible && pt.earth.isVisible) return pointLightTexturesRef.current.dual;
            if (pt.sun.isVisible) return pointLightTexturesRef.current.sun;
            if (pt.earth.isVisible) return pointLightTexturesRef.current.earth;
            return pointLightTexturesRef.current.dormant;
          }, false),
          width: new Cesium.CallbackProperty(() => {
            const pt = currentPointBRef.current;
            if (!pt) return 20;
            if (pt.sun.isVisible && pt.earth.isVisible) return 42;
            if (pt.sun.isVisible || pt.earth.isVisible) return 35;
            return 20;
          }, false),
          height: new Cesium.CallbackProperty(() => {
            const pt = currentPointBRef.current;
            if (!pt) return 20;
            if (pt.sun.isVisible && pt.earth.isVisible) return 42;
            if (pt.sun.isVisible || pt.earth.isVisible) return 35;
            return 20;
          }, false),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        point: {
          pixelSize: new Cesium.CallbackProperty(() => {
            const pt = currentPointBRef.current;
            if (!pt) return 6;
            if (pt.sun.isVisible || pt.earth.isVisible) return 9;
            return 5;
          }, false),
          color: new Cesium.CallbackProperty(() => {
            const pt = currentPointBRef.current;
            if (!pt) return Cesium.Color.fromCssColorString('#64748b');
            if (pt.sun.isVisible && pt.earth.isVisible) return Cesium.Color.WHITE;
            if (pt.sun.isVisible) return Cesium.Color.fromCssColorString('#fef08a');
            if (pt.earth.isVisible) return Cesium.Color.fromCssColorString('#a5f3fc');
            return Cesium.Color.fromCssColorString('#64748b');
          }, false),
          outlineColor: new Cesium.CallbackProperty(() => {
            const pt = currentPointBRef.current;
            if (!pt) return Cesium.Color.BLACK;
            if (pt.sun.isVisible) return Cesium.Color.fromCssColorString('#f59e0b');
            if (pt.earth.isVisible) return Cesium.Color.fromCssColorString('#0284c7');
            return Cesium.Color.BLACK;
          }, false),
          outlineWidth: 2,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        label: {
          text: new Cesium.CallbackProperty(() => {
            const pt = currentPointBRef.current;
            const siteName = siteBTarget.name.split('(')[0].trim();
            if (!pt) return siteName;
            const sunTag = pt.sun.isVisible ? 'LIT' : 'SHADOW';
            const earthTag = pt.earth.isVisible ? 'LINK' : 'OCC';
            return `${siteName} [${sunTag} | ${earthTag}]`;
          }, false),
          font: 'bold 11px Inter, sans-serif',
          fillColor: new Cesium.CallbackProperty(() => {
            const pt = currentPointBRef.current;
            if (!pt) return Cesium.Color.fromCssColorString('#f59e0b');
            if (pt.sun.isVisible && pt.earth.isVisible) return Cesium.Color.fromCssColorString('#fbbf24');
            if (pt.sun.isVisible) return Cesium.Color.fromCssColorString('#fde047');
            if (pt.earth.isVisible) return Cesium.Color.fromCssColorString('#38bdf8');
            return Cesium.Color.fromCssColorString('#94a3b8');
          }, false),
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -20),
        },
      });

      // 5d. Directional Laser Rays from Site B
      viewer.entities.add({
        id: 'ray_sun_b',
        show: showSightlines,
        polyline: {
          positions: new Cesium.CallbackProperty(() => [siteBPos, sunPosRef.current], false),
          width: new Cesium.CallbackProperty(() => (currentPointBRef.current?.sun.isVisible ? 2.0 : 0.8), false),
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
          width: new Cesium.CallbackProperty(() => (currentPointBRef.current?.earth.isVisible ? 2.0 : 0.8), false),
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

    viewer.scene.requestRender();
  };

  // Re-build entities only when sites or trajectory toggles change
  useEffect(() => {
    updateViewerEntities(viewerARef.current, siteA, siteB);
    if (viewMode === 'split') {
      updateViewerEntities(viewerBRef.current, siteB || siteA, siteA);
    }
  }, [
    siteA,
    siteB,
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

  // Expose Camera and Navigation API to parent/right-panel
  useImperativeHandle(ref, () => ({
    flyToSouthPole,
    flyToSiteA,
    flyToSiteB,
    flyToOrbitalVista,
    handleFitMoon,
    handleZoomIn,
    handleZoomOut,
  }));

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden bg-space-950 select-none">
      {/* Main 3D Cesium Viewports */}
      <div className="w-full flex-1 flex relative">
        {viewMode === 'overlapped' ? (
          // OVERLAPPED MODE: Single Wide Cesium Viewer (100% clean, unobstructed lunar view)
          <div ref={containerRef} className="w-full h-full block" style={{ touchAction: 'none' }} />
        ) : (
          // SPLIT MODE: Dual Cesium Viewers side-by-side
          <div className="w-full h-full flex divide-x divide-slate-800">
            <div className="relative w-1/2 h-full flex flex-col">
              <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-md bg-space-950/85 backdrop-blur-sm border border-cyan-500/40 text-[11px] font-mono text-cyan-300 font-bold shadow-md">
                LOCATION A: {siteA.name.split('(')[0].trim()}
              </div>
              <div ref={containerRef} className="w-full h-full block" style={{ touchAction: 'none' }} />
            </div>

            <div className="relative w-1/2 h-full flex flex-col">
              <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-md bg-space-950/85 backdrop-blur-sm border border-amber-500/40 text-[11px] font-mono text-amber-300 font-bold shadow-md">
                LOCATION B: {siteB ? siteB.name.split('(')[0].trim() : 'Site B'}
              </div>
              <div ref={containerBRef} className="w-full h-full block" style={{ touchAction: 'none' }} />
            </div>
          </div>
        )}

        {/* Floating NASA Camera HUD & Zoom Controls Widget (Right Corner of Viewport) */}
        <div className="absolute right-4 top-4 z-20 flex flex-col items-end gap-2 font-mono">
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

          {/* Mouse & Trackpad Navigation Quick Guide Pill */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-space-950/85 backdrop-blur-sm border border-slate-800 text-[10px] text-slate-300 shadow-md">
            <span className="text-cyan-400 font-semibold">2-Finger / Wheel:</span>
            <span>Zoom</span>
            <span className="text-slate-600">•</span>
            <span>Drag: Orbit</span>
            <span className="text-slate-600">•</span>
            <span>Dbl-Click: Focus</span>
          </div>
        </div>
      </div>
    </div>
  );
});
