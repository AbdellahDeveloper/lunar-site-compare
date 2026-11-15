import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as THREE from 'three';
import {
  ComparisonViewMode,
  EphemerisPoint,
  Site,
  Vector3D,
} from '../types';
import { getCachedCelestialVectors } from '../engine/series';
import { Eye, Compass, Sun, Radio, Maximize2, Zap, Layers, Sparkles } from 'lucide-react';

interface CentralLunarViewport3DProps {
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
}

export const CentralLunarViewport3D: React.FC<CentralLunarViewport3DProps> = ({
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
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const containerBRef = useRef<HTMLDivElement | null>(null);

  // Trajectory display options
  const [showSunOrbit, setShowSunOrbit] = useState(true);
  const [showEarthOrbit, setShowEarthOrbit] = useState(true);
  const [showSightlines, setShowSightlines] = useState(true);

  // Camera angles
  const cameraAngleA = useRef({ theta: Math.PI / 4, phi: Math.PI / 2.3, radius: 6.2 });
  const cameraAngleB = useRef({ theta: Math.PI / 4, phi: Math.PI / 2.3, radius: 6.2 });
  const isDraggingRef = useRef(false);
  const prevMouseRef = useRef({ x: 0, y: 0 });
  const activeViewportRef = useRef<'A' | 'B'>('A');

  // Procedural Lunar & Scientific Texture Generation
  const moonTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.Texture();

    // Base lunar regolith grey
    ctx.fillStyle = '#3a4454';
    ctx.fillRect(0, 0, 1024, 512);

    // Maria (basaltic plains on near side)
    ctx.fillStyle = '#1e2430';
    ctx.beginPath();
    ctx.arc(420, 220, 110, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(520, 190, 85, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(330, 200, 75, 0, Math.PI * 2);
    ctx.fill();
    // South Pole-Aitken basin
    ctx.beginPath();
    ctx.arc(880, 440, 95, 0, Math.PI * 2);
    ctx.fill();

    // Crater dots and ejecta rays
    for (let i = 0; i < 350; i++) {
      const cx = (i * 173.3) % 1024;
      const cy = (i * 97.7) % 512;
      const r = (i % 6) + 1.5;
      ctx.fillStyle = i % 2 === 0 ? '#1f2937' : '#525e75';
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, []);

  // Three.js Scene Setup Helper
  const setupThreeScene = (
    mountEl: HTMLDivElement,
    cameraAngle: React.MutableRefObject<{ theta: number; phi: number; radius: number }>,
    primarySite: Site,
    secondarySite?: Site
  ) => {
    const width = mountEl.clientWidth || 600;
    const height = mountEl.clientHeight || 500;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x05070d);

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountEl.innerHTML = '';
    mountEl.appendChild(renderer.domElement);

    // Starfield Background
    const starGeo = new THREE.BufferGeometry();
    const starCount = 600;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      const r = 80 + Math.random() * 40;
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      starPos[i] = r * Math.sin(phi) * Math.cos(theta);
      starPos[i + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPos[i + 2] = r * Math.cos(phi);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xcccccc, size: 0.8, sizeAttenuation: false });
    scene.add(new THREE.Points(starGeo, starMat));

    // Moon Sphere
    const moonRadius = 2.0;
    const moonGeo = new THREE.SphereGeometry(moonRadius, 64, 64);
    const moonMat = new THREE.MeshStandardMaterial({
      map: moonTexture,
      roughness: 0.88,
      metalness: 0.04,
    });
    const moonMesh = new THREE.Mesh(moonGeo, moonMat);
    scene.add(moonMesh);

    // Directional Sunlight
    const dirLight = new THREE.DirectionalLight(0xfffdf0, 3.2);
    scene.add(dirLight);

    const ambientLight = new THREE.AmbientLight(0x161e31, 0.4);
    scene.add(ambientLight);

    // Sun Sphere & Corona
    const sunGroup = new THREE.Group();
    const sunSphereGeo = new THREE.SphereGeometry(0.55, 32, 32);
    const sunSphereMat = new THREE.MeshBasicMaterial({ color: 0xfffbeb });
    sunGroup.add(new THREE.Mesh(sunSphereGeo, sunSphereMat));
    // Corona halo
    const coronaGeo = new THREE.SphereGeometry(0.85, 32, 32);
    const coronaMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.35,
      side: THREE.BackSide,
    });
    sunGroup.add(new THREE.Mesh(coronaGeo, coronaMat));
    scene.add(sunGroup);

    // Earth Sphere
    const earthGroup = new THREE.Group();
    const earthGeo = new THREE.SphereGeometry(0.48, 32, 32);
    const earthMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.6,
      metalness: 0.1,
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    earthGroup.add(earthMesh);
    // Earth Atmosphere Glow
    const earthAtmGeo = new THREE.SphereGeometry(0.56, 32, 32);
    const earthAtmMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.25,
      side: THREE.BackSide,
    });
    earthGroup.add(new THREE.Mesh(earthAtmGeo, earthAtmMat));
    scene.add(earthGroup);

    // Helper: Convert selenographic (lat, lon) to 3D Cartesian
    const latLonToVec3 = (latDeg: number, lonDeg: number, radius: number) => {
      const phi = (latDeg * Math.PI) / 180;
      const lam = (lonDeg * Math.PI) / 180;
      // In Three.js: +Y is North, -Y is South, +Z is prime meridian, +X is 90°E
      const x = radius * Math.cos(phi) * Math.sin(lam);
      const y = radius * Math.sin(phi);
      const z = radius * Math.cos(phi) * Math.cos(lam);
      return new THREE.Vector3(x, y, z);
    };

    // Site A Beacon Pin
    const pinAGroup = new THREE.Group();
    const beaconAMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    pinAGroup.add(new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 16), beaconAMat));
    const stemA = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.3, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    stemA.position.y = -0.15;
    pinAGroup.add(stemA);
    scene.add(pinAGroup);

    // Site B Beacon Pin (if available)
    const pinBGroup = new THREE.Group();
    const beaconBMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    pinBGroup.add(new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 16), beaconBMat));
    const stemB = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.3, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    stemB.position.y = -0.15;
    pinBGroup.add(stemB);
    scene.add(pinBGroup);

    // Directional Laser Sightlines (Site to Sun, Site to Earth)
    const sightlineSunMat = new THREE.LineBasicMaterial({ color: 0xf59e0b, linewidth: 2 });
    const sightlineSun = new THREE.Line(new THREE.BufferGeometry(), sightlineSunMat);
    scene.add(sightlineSun);

    const sightlineEarthMat = new THREE.LineBasicMaterial({ color: 0x06b6d4, linewidth: 2 });
    const sightlineEarth = new THREE.Line(new THREE.BufferGeometry(), sightlineEarthMat);
    scene.add(sightlineEarth);

    // Apparent Trajectory Orbits (Sun orbit ribbon, Earth libration loop)
    const sunOrbitMat = new THREE.LineBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.45 });
    const sunOrbit = new THREE.Line(new THREE.BufferGeometry(), sunOrbitMat);
    scene.add(sunOrbit);

    const earthOrbitMat = new THREE.LineBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.55 });
    const earthOrbit = new THREE.Line(new THREE.BufferGeometry(), earthOrbitMat);
    scene.add(earthOrbit);

    let animId: number;
    const renderLoop = () => {
      animId = requestAnimationFrame(renderLoop);

      // Update camera from spherical coords
      const { theta, phi, radius } = cameraAngle.current;
      camera.position.x = radius * Math.sin(phi) * Math.sin(theta);
      camera.position.y = radius * Math.cos(phi);
      camera.position.z = radius * Math.sin(phi) * Math.cos(theta);
      camera.lookAt(0, 0, 0);

      // Position Sun (distance = 15.0)
      const sDist = Math.hypot(sunVec.x, sunVec.y, sunVec.z) || 1;
      const sun3DPos = new THREE.Vector3((sunVec.y / sDist) * 15.0, (sunVec.z / sDist) * 15.0, (sunVec.x / sDist) * 15.0);
      sunGroup.position.copy(sun3DPos);
      dirLight.position.copy(sun3DPos);

      // Position Earth (distance = 11.0)
      const eDist = Math.hypot(earthVec.x, earthVec.y, earthVec.z) || 1;
      const earth3DPos = new THREE.Vector3((earthVec.y / eDist) * 11.0, (earthVec.z / eDist) * 11.0, (earthVec.x / eDist) * 11.0);
      earthGroup.position.copy(earth3DPos);

      // Position Site A Pin
      const posA = latLonToVec3(primarySite.lat, primarySite.lon, moonRadius);
      pinAGroup.position.copy(posA);
      pinAGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), posA.clone().normalize());

      // Position Site B Pin
      if (secondarySite) {
        const posB = latLonToVec3(secondarySite.lat, secondarySite.lon, moonRadius);
        pinBGroup.position.copy(posB);
        pinBGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), posB.clone().normalize());
        pinBGroup.visible = true;
      } else {
        pinBGroup.visible = false;
      }

      // Update Directional Sightlines
      if (showSightlines) {
        sightlineSun.geometry.setFromPoints([posA, sun3DPos]);
        sightlineEarth.geometry.setFromPoints([posA, earth3DPos]);
        sightlineSun.visible = true;
        sightlineEarth.visible = true;
      } else {
        sightlineSun.visible = false;
        sightlineEarth.visible = false;
      }

      // Update Trajectory Arcs if available (passing directly through celestial models)
      if ((showSunOrbit || showEarthOrbit) && allPointsA && allPointsA.length > 1) {
        const startMs = allPointsA[0].timeMs;
        const endMs = allPointsA[allPointsA.length - 1].timeMs;
        const stepMs =
          allPointsA.length > 1 && allPointsA[1].timeMs > allPointsA[0].timeMs
            ? allPointsA[1].timeMs - allPointsA[0].timeMs
            : 30 * 60 * 1000;
        const celestial = getCachedCelestialVectors(startMs, endMs, stepMs);

        if (showSunOrbit && celestial.sunVecs.length > 1) {
          const sunPts = celestial.sunVecs.map((v) => {
            const sDist = Math.hypot(v.x, v.y, v.z) || 1;
            return new THREE.Vector3((v.y / sDist) * 15.0, (v.z / sDist) * 15.0, (v.x / sDist) * 15.0);
          });
          sunOrbit.geometry.setFromPoints(sunPts);
          sunOrbit.visible = true;
        } else {
          sunOrbit.visible = false;
        }

        if (showEarthOrbit && celestial.earthVecs.length > 1) {
          const earthPts = celestial.earthVecs.map((v) => {
            const eDist = Math.hypot(v.x, v.y, v.z) || 1;
            return new THREE.Vector3((v.y / eDist) * 11.0, (v.z / eDist) * 11.0, (v.x / eDist) * 11.0);
          });
          earthOrbit.geometry.setFromPoints(earthPts);
          earthOrbit.visible = true;
        } else {
          earthOrbit.visible = false;
        }
      } else {
        sunOrbit.visible = false;
        earthOrbit.visible = false;
      }

      renderer.render(scene, camera);
    };
    renderLoop();

    const handleResize = () => {
      const w = mountEl.clientWidth || 600;
      const h = mountEl.clientHeight || 500;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      mountEl.innerHTML = '';
    };
  };

  // Mount Viewport A
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    return setupThreeScene(el, cameraAngleA, siteA, siteB);
  }, [moonTexture, siteA, siteB, sunVec, earthVec, showSightlines, showSunOrbit, showEarthOrbit]);

  // Mount Viewport B if in Split View
  useEffect(() => {
    if (viewMode !== 'split') return;
    const el = containerBRef.current;
    if (!el || !siteB) return;
    return setupThreeScene(el, cameraAngleB, siteB, siteA);
  }, [viewMode, moonTexture, siteA, siteB, sunVec, earthVec, showSightlines, showSunOrbit, showEarthOrbit]);

  // Interactive Orbit Controls (Pointer Drag)
  const handlePointerDown = (vp: 'A' | 'B', e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    activeViewportRef.current = vp;
    prevMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - prevMouseRef.current.x;
    const dy = e.clientY - prevMouseRef.current.y;
    prevMouseRef.current = { x: e.clientX, y: e.clientY };

    const targetRef = activeViewportRef.current === 'A' ? cameraAngleA : cameraAngleB;
    targetRef.current.theta += dx * 0.007;
    targetRef.current.phi = Math.max(0.1, Math.min(Math.PI - 0.1, targetRef.current.phi - dy * 0.007));

    // If overlapped or synchronized, apply to both
    if (viewMode === 'overlapped') {
      cameraAngleB.current = { ...cameraAngleA.current };
    }
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  const setSouthPoleFocus = () => {
    cameraAngleA.current = { theta: 0, phi: Math.PI - 0.28, radius: 5.2 };
    cameraAngleB.current = { theta: 0, phi: Math.PI - 0.28, radius: 5.2 };
  };

  const setEquatorialFarView = () => {
    cameraAngleA.current = { theta: Math.PI / 4, phi: Math.PI / 2.3, radius: 8.5 };
    cameraAngleB.current = { theta: Math.PI / 4, phi: Math.PI / 2.3, radius: 8.5 };
  };

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden bg-space-950 select-none">
      {/* 3D Viewport Area */}
      <div
        className="w-full flex-1 flex relative"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {viewMode === 'overlapped' ? (
          // OVERLAPPED MODE: Single Large Viewport
          <div
            ref={containerRef}
            onPointerDown={(e) => handlePointerDown('A', e)}
            className="w-full h-full cursor-grab active:cursor-grabbing block"
          />
        ) : (
          // SPLIT MODE: Dual Viewports side-by-side
          <div className="w-full h-full flex divide-x divide-slate-800">
            <div className="relative w-1/2 h-full flex flex-col">
              <div className="absolute top-16 left-4 z-10 px-2.5 py-1 rounded-md bg-space-950/80 border border-cyan-500/40 text-[11px] font-mono text-cyan-300 font-bold">
                VIEWPORT 1: {siteA.name}
              </div>
              <div
                ref={containerRef}
                onPointerDown={(e) => handlePointerDown('A', e)}
                className="w-full h-full cursor-grab active:cursor-grabbing block"
              />
            </div>

            <div className="relative w-1/2 h-full flex flex-col">
              <div className="absolute top-16 left-4 z-10 px-2.5 py-1 rounded-md bg-space-950/80 border border-amber-500/40 text-[11px] font-mono text-amber-300 font-bold">
                VIEWPORT 2: {siteB?.name ?? 'Site B'}
              </div>
              <div
                ref={containerBRef}
                onPointerDown={(e) => handlePointerDown('B', e)}
                className="w-full h-full cursor-grab active:cursor-grabbing block"
              />
            </div>
          </div>
        )}

        {/* Camera & Overlay Controls (Bottom Left of 3D Viewport) */}
        <div className="absolute bottom-4 left-4 z-20 flex flex-wrap items-center gap-2 bg-space-900/85 backdrop-blur-md p-1.5 rounded-xl border border-slate-700/70 text-xs">
          <button
            onClick={setSouthPoleFocus}
            className="px-2.5 py-1 rounded-lg bg-space-800 hover:bg-space-700 border border-slate-700 text-slate-200 text-[11px] font-mono transition-colors"
          >
            South Pole (85°-90°S)
          </button>
          <button
            onClick={setEquatorialFarView}
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
            Sun Trajectory
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

        {/* 3D Legend & Scientific Indicator (Bottom Right of 3D Viewport) */}
        <div className="absolute bottom-4 right-4 z-20 flex items-center gap-3 bg-space-900/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/70 text-[11px] font-mono text-slate-400">
          <span className="flex items-center gap-1.5 text-solar-gold">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block shadow-sm shadow-amber-400/50" />
            Sun Model
          </span>
          <span className="flex items-center gap-1.5 text-comm-cyan">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block shadow-sm shadow-cyan-400/50" />
            Earth Model
          </span>
        </div>
      </div>
    </div>
  );
};

