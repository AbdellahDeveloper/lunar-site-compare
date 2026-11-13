import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { EphemerisPoint, Vector3D } from '../types';

interface LunarGlobe3DProps {
  lat: number;
  lon: number;
  siteName: string;
  currentPoint: EphemerisPoint;
  sunVec: Vector3D;
  earthVec: Vector3D;
}

export const LunarGlobe3D: React.FC<LunarGlobe3DProps> = ({
  lat,
  lon,
  siteName,
  currentPoint,
  sunVec,
  earthVec,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sitePinRef = useRef<THREE.Group | null>(null);
  const sunBeamRef = useRef<THREE.Line | null>(null);
  const earthBeamRef = useRef<THREE.Line | null>(null);
  const dirLightRef = useRef<THREE.DirectionalLight | null>(null);

  // Mouse interaction state
  const isDraggingRef = useRef(false);
  const prevMouseRef = useRef({ x: 0, y: 0 });
  const cameraAngleRef = useRef({ theta: Math.PI / 4, phi: Math.PI / 2.5, radius: 4.8 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Setup Three.js Scene, Camera, Renderer
    const width = container.clientWidth || 380;
    const height = container.clientHeight || 340;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060913);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 2. Procedural Lunar Surface Texture
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Base regolith grey
      ctx.fillStyle = '#475569';
      ctx.fillRect(0, 0, 1024, 512);

      // Lunar Maria (dark basaltic basalt plains on near side)
      ctx.fillStyle = '#1e293b';
      // Oceanus Procellarum / Mare Imbrium
      ctx.beginPath();
      ctx.arc(380, 200, 120, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(450, 180, 80, 0, Math.PI * 2);
      ctx.fill();
      // Mare Tranquillitatis & Serenitatis
      ctx.beginPath();
      ctx.arc(580, 220, 70, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(540, 170, 60, 0, Math.PI * 2);
      ctx.fill();
      // South Pole-Aitken Basin (farside south)
      ctx.beginPath();
      ctx.arc(880, 420, 95, 0, Math.PI * 2);
      ctx.fill();

      // Craters and Highlands
      for (let i = 0; i < 400; i++) {
        const cx = (i * 173.3) % 1024;
        const cy = (i * 97.7) % 512;
        const r = (i % 7) + 2;
        ctx.fillStyle = i % 3 === 0 ? '#334155' : '#64748b';
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
        // Bright crater rim
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
    const moonTexture = new THREE.CanvasTexture(canvas);

    // 3. Moon Sphere
    const moonRadius = 1.7374; // scaled
    const moonGeo = new THREE.SphereGeometry(moonRadius, 64, 64);
    const moonMat = new THREE.MeshStandardMaterial({
      map: moonTexture,
      roughness: 0.9,
      metalness: 0.05,
    });
    const moonMesh = new THREE.Mesh(moonGeo, moonMat);
    scene.add(moonMesh);

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0x1e293b, 0.45);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfffbeb, 2.4);
    scene.add(dirLight);
    dirLightRef.current = dirLight;

    // 5. Landing Site Beacon Pin
    const pinGroup = new THREE.Group();
    // Glowing sphere
    const beaconGeo = new THREE.SphereGeometry(0.06, 16, 16);
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
    pinGroup.add(beaconMesh);

    // Pin stem
    const stemGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.25, 8);
    const stemMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const stemMesh = new THREE.Mesh(stemGeo, stemMat);
    stemMesh.position.y = -0.12;
    pinGroup.add(stemMesh);

    scene.add(pinGroup);
    sitePinRef.current = pinGroup;

    // 6. Directional Beams (Sun gold ray, Earth cyan ray)
    const sunLineMat = new THREE.LineBasicMaterial({ color: 0xf59e0b, linewidth: 2 });
    const sunLineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(1, 0, 0),
    ]);
    const sunBeam = new THREE.Line(sunLineGeo, sunLineMat);
    scene.add(sunBeam);
    sunBeamRef.current = sunBeam;

    const earthLineMat = new THREE.LineBasicMaterial({ color: 0x06b6d4, linewidth: 2 });
    const earthLineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 1, 0),
    ]);
    const earthBeam = new THREE.Line(earthLineGeo, earthLineMat);
    scene.add(earthBeam);
    earthBeamRef.current = earthBeam;

    // Animation Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      // Pulse beacon scale
      const time = Date.now() * 0.005;
      const s = 1 + 0.2 * Math.sin(time);
      beaconMesh.scale.set(s, s, s);

      // Update camera from spherical coordinates
      const { theta, phi, radius } = cameraAngleRef.current;
      camera.position.x = radius * Math.sin(phi) * Math.sin(theta);
      camera.position.y = radius * Math.cos(phi);
      camera.position.z = radius * Math.sin(phi) * Math.cos(theta);
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      renderer.dispose();
      if (container) container.innerHTML = '';
    };
  }, []);

  // Update Pin and Vectors when coordinates or ephemeris change
  useEffect(() => {
    if (!sitePinRef.current || !dirLightRef.current || !sunBeamRef.current || !earthBeamRef.current) return;

    const moonRadius = 1.7374;
    const phi = (lat * Math.PI) / 180;
    const lambda = (lon * Math.PI) / 180;

    // Coordinate mapping:
    // In Three.js: +Y is North, -Y is South, +Z is Prime Meridian (facing Earth), +X is East 90°
    const px = moonRadius * Math.cos(phi) * Math.sin(lambda);
    const py = moonRadius * Math.sin(phi);
    const pz = moonRadius * Math.cos(phi) * Math.cos(lambda);

    sitePinRef.current.position.set(px, py, pz);
    sitePinRef.current.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(px, py, pz).normalize()
    );

    // Normalize Sun Vector
    const sLen = Math.hypot(sunVec.x, sunVec.y, sunVec.z) || 1;
    // Map Moon-fixed (x, y, z) to Three.js (x=y_moon, y=z_moon, z=x_moon)
    const sunDir = new THREE.Vector3(sunVec.y / sLen, sunVec.z / sLen, sunVec.x / sLen);

    // Position Directional Sun Light
    dirLightRef.current.position.copy(sunDir.clone().multiplyScalar(10));

    // Sun Vector Ray starting from site
    const sunBeamTarget = new THREE.Vector3(px, py, pz).add(sunDir.clone().multiplyScalar(1.4));
    sunBeamRef.current.geometry.setFromPoints([
      new THREE.Vector3(px, py, pz),
      sunBeamTarget,
    ]);

    // Earth Vector Ray starting from site
    const eLen = Math.hypot(earthVec.x, earthVec.y, earthVec.z) || 1;
    const earthDir = new THREE.Vector3(earthVec.y / eLen, earthVec.z / eLen, earthVec.x / eLen);
    const earthBeamTarget = new THREE.Vector3(px, py, pz).add(earthDir.clone().multiplyScalar(1.4));
    earthBeamRef.current.geometry.setFromPoints([
      new THREE.Vector3(px, py, pz),
      earthBeamTarget,
    ]);
  }, [lat, lon, sunVec, earthVec]);

  // Pointer drag to orbit camera
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    prevMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - prevMouseRef.current.x;
    const dy = e.clientY - prevMouseRef.current.y;
    prevMouseRef.current = { x: e.clientX, y: e.clientY };

    cameraAngleRef.current.theta += dx * 0.008;
    cameraAngleRef.current.phi = Math.max(
      0.1,
      Math.min(Math.PI - 0.1, cameraAngleRef.current.phi - dy * 0.008)
    );
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  const setSouthPoleView = () => {
    // Focus camera directly onto lunar south pole (looking up from -Y)
    cameraAngleRef.current = { theta: 0, phi: Math.PI - 0.25, radius: 4.2 };
  };

  const resetCamera = () => {
    cameraAngleRef.current = { theta: Math.PI / 4, phi: Math.PI / 2.5, radius: 4.8 };
  };

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-slate-700/60 bg-space-900/90 shadow-2xl p-2 flex flex-col items-center">
      <div className="w-full flex items-center justify-between pb-2 border-b border-slate-700/50 text-xs mb-1 px-1">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
          <span className="font-semibold text-slate-200 uppercase tracking-wider">
            3D Lunar Globe & Sun/Earth Vectors
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={setSouthPoleView}
            className="px-2 py-0.5 rounded bg-space-800 hover:bg-space-700 border border-slate-700 text-[10px] text-cyan-300 transition-colors"
          >
            South Pole Focus
          </button>
          <button
            onClick={resetCamera}
            className="px-2 py-0.5 rounded bg-space-800 hover:bg-space-700 border border-slate-700 text-[10px] text-slate-300 transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="w-full h-[280px] cursor-grab active:cursor-grabbing block select-none"
      />

      <div className="w-full flex items-center justify-between pt-1 px-2 text-[11px] font-mono text-slate-400 border-t border-slate-800">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
          Lander Pin ({lat.toFixed(2)}°, {lon.toFixed(2)}°)
        </span>
        <span className="flex items-center gap-1.5 text-solar-gold">
          <span className="w-2 h-2 rounded bg-solar-gold inline-block" />
          Sun Vector
        </span>
        <span className="flex items-center gap-1.5 text-comm-cyan">
          <span className="w-2 h-2 rounded bg-comm-cyan inline-block" />
          Earth Vector
        </span>
      </div>
    </div>
  );
};
