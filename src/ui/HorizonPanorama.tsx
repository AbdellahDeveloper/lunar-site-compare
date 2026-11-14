import React, { useRef, useEffect, useState } from 'react';
import { EphemerisPoint, HorizonMask, TopocentricCoords } from '../types';

interface HorizonPanoramaProps {
  currentPoint: EphemerisPoint;
  allPoints: EphemerisPoint[];
  mask: HorizonMask | null;
  siteName: string;
  useTerrain: boolean;
  elevKm: number;
}

export const HorizonPanorama: React.FC<HorizonPanoramaProps> = ({
  currentPoint,
  allPoints,
  mask,
  siteName,
  useTerrain,
  elevKm,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hoverAz, setHoverAz] = useState<number | null>(null);
  const [hoverEl, setHoverEl] = useState<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Elevation range displayed: -6° to +20° (or wider if objects rise higher)
    const maxObjectEl = Math.max(
      currentPoint.sun.elevationDeg,
      currentPoint.earth.elevationDeg,
      15
    );
    const minEl = -6;
    const maxEl = Math.max(20, Math.ceil(maxObjectEl + 5));

    const elToY = (el: number) => {
      return height - ((el - minEl) / (maxEl - minEl)) * height;
    };

    const azToX = (az: number) => {
      let normalized = az % 360;
      if (normalized < 0) normalized += 360;
      return (normalized / 360) * width;
    };

    // 1. Draw Starry Space Sky (Dark Gradient)
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
    skyGrad.addColorStop(0, '#03050a');
    skyGrad.addColorStop(0.65, '#0b0f19');
    skyGrad.addColorStop(1, '#111827');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);

    // Stars background (deterministic based on seed)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    for (let i = 0; i < 90; i++) {
      const sx = ((i * 137.5) % width);
      const sy = ((i * 83.1) % (height * 0.7));
      const sRadius = (i % 5 === 0) ? 1.5 : 0.8;
      ctx.beginPath();
      ctx.arc(sx, sy, sRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Draw Elevation Grid Lines
    ctx.lineWidth = 1;
    const elSteps = [-5, 0, 5, 10, 15, 20, 30, 45, 60].filter((e) => e >= minEl && e <= maxEl);

    for (const el of elSteps) {
      const y = elToY(el);
      ctx.strokeStyle = el === 0 ? 'rgba(56, 189, 248, 0.4)' : 'rgba(255, 255, 255, 0.08)';
      ctx.setLineDash(el === 0 ? [] : [4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();

      // Label
      ctx.fillStyle = el === 0 ? '#38bdf8' : 'rgba(148, 163, 184, 0.6)';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillText(`${el > 0 ? '+' : ''}${el}°`, 8, y - 3);
    }
    ctx.setLineDash([]);

    // 3. Draw Azimuth Cardinal Markers
    const cardinals = [
      { az: 0, label: 'N (0°)' },
      { az: 45, label: 'NE' },
      { az: 90, label: 'E (90°)' },
      { az: 135, label: 'SE' },
      { az: 180, label: 'S (180°)' },
      { az: 225, label: 'SW' },
      { az: 270, label: 'W (270°)' },
      { az: 315, label: 'NW' },
      { az: 360, label: 'N (360°)' },
    ];

    for (const card of cardinals) {
      const x = azToX(card.az);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();

      ctx.fillStyle = card.az % 90 === 0 ? '#e2e8f0' : '#94a3b8';
      ctx.font = card.az % 90 === 0 ? 'bold 11px Inter, sans-serif' : '10px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(card.label, x, height - 8);
    }

    // 4. Draw Trajectory Paths for Sun and Earth over the window
    if (allPoints.length > 1) {
      // Sun Path
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      let started = false;
      for (const pt of allPoints) {
        const px = azToX(pt.sun.azimuthDeg);
        const py = elToY(pt.sun.elevationDeg);
        if (!started) {
          ctx.moveTo(px, py);
          started = true;
        } else {
          // Avoid wrapping glitch across 0/360 boundary
          ctx.lineTo(px, py);
        }
      }
      ctx.stroke();

      // Earth Libration Path
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      started = false;
      for (const pt of allPoints) {
        const px = azToX(pt.earth.azimuthDeg);
        const py = elToY(pt.earth.elevationDeg);
        if (!started) {
          ctx.moveTo(px, py);
          started = true;
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.stroke();
    }

    // 5. Draw Terrain Profile & Ground
    ctx.beginPath();
    ctx.moveTo(0, height);

    if (useTerrain && mask && mask.elevations.length > 0) {
      // Connect LOLA elevations
      const N = mask.elevations.length;
      for (let i = 0; i <= N; i++) {
        const az = (i / N) * 360;
        const el = mask.elevations[i % N];
        const x = azToX(az);
        const y = elToY(el);
        if (i === 0) ctx.lineTo(x, y);
        else ctx.lineTo(x, y);
      }
    } else {
      // Flat horizon with spherical dip
      const dipEl = -Math.acos(1737.4 / (1737.4 + Math.max(0, elevKm))) * (180 / Math.PI);
      const y = elToY(dipEl);
      ctx.lineTo(0, y);
      ctx.lineTo(width, y);
    }

    ctx.lineTo(width, height);
    ctx.closePath();

    // Lunar ground fill (textured gradient)
    const groundGrad = ctx.createLinearGradient(0, height * 0.5, 0, height);
    groundGrad.addColorStop(0, '#1c2438');
    groundGrad.addColorStop(0.3, '#141a29');
    groundGrad.addColorStop(1, '#0c101c');
    ctx.fillStyle = groundGrad;
    ctx.fill();

    // Terrain outline rim
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = useTerrain ? '#94a3b8' : '#38bdf8';
    ctx.stroke();

    // 6. Draw Sun
    const sunX = azToX(currentPoint.sun.azimuthDeg);
    const sunY = elToY(currentPoint.sun.elevationDeg);

    // Sun Glow
    const sunGlow = ctx.createRadialGradient(sunX, sunY, 3, sunX, sunY, 32);
    sunGlow.addColorStop(0, 'rgba(254, 240, 138, 0.95)');
    sunGlow.addColorStop(0.3, 'rgba(245, 158, 11, 0.6)');
    sunGlow.addColorStop(0.7, 'rgba(245, 158, 11, 0.15)');
    sunGlow.addColorStop(1, 'rgba(245, 158, 11, 0)');
    ctx.fillStyle = sunGlow;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 32, 0, Math.PI * 2);
    ctx.fill();

    // Sun Core Disc
    ctx.fillStyle = '#fffbeb';
    ctx.beginPath();
    ctx.arc(sunX, sunY, 6.5, 0, Math.PI * 2);
    ctx.fill();

    // Sun Label Tag
    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 11px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    const sunLabel = `SUN ${currentPoint.sun.elevationDeg >= 0 ? '+' : ''}${currentPoint.sun.elevationDeg.toFixed(1)}° (${currentPoint.sun.isVisible ? 'VISIBLE' : 'OCCULTED'})`;
    ctx.fillText(sunLabel, sunX + 12, sunY - 4);

    // 7. Draw Earth
    const earthX = azToX(currentPoint.earth.azimuthDeg);
    const earthY = elToY(currentPoint.earth.elevationDeg);

    // Earth Atmosphere Glow
    const earthGlow = ctx.createRadialGradient(earthX, earthY, 3, earthX, earthY, 26);
    earthGlow.addColorStop(0, 'rgba(186, 230, 253, 0.9)');
    earthGlow.addColorStop(0.4, 'rgba(56, 189, 248, 0.5)');
    earthGlow.addColorStop(0.8, 'rgba(2, 132, 199, 0.15)');
    earthGlow.addColorStop(1, 'rgba(2, 132, 199, 0)');
    ctx.fillStyle = earthGlow;
    ctx.beginPath();
    ctx.arc(earthX, earthY, 26, 0, Math.PI * 2);
    ctx.fill();

    // Earth Core Disc (Blue Marble)
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(earthX, earthY, 7.5, 0, Math.PI * 2);
    ctx.fill();

    // Earth Cloud details
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.beginPath();
    ctx.arc(earthX - 2, earthY - 2, 3, 0, Math.PI * 2);
    ctx.arc(earthX + 2, earthY + 1, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Earth Label Tag
    ctx.fillStyle = '#7dd3fc';
    ctx.font = 'bold 11px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    const earthLabel = `EARTH ${currentPoint.earth.elevationDeg >= 0 ? '+' : ''}${currentPoint.earth.elevationDeg.toFixed(1)}° (${currentPoint.earth.isVisible ? 'DIRECT DTE' : 'BLOCKED'})`;
    ctx.fillText(earthLabel, earthX + 13, earthY + 12);

    // 8. Draw Mouse Hover Crosshair if active
    if (hoverAz !== null && hoverEl !== null) {
      const hx = azToX(hoverAz);
      const hy = elToY(hoverEl);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);

      ctx.beginPath();
      ctx.moveTo(hx, 0);
      ctx.lineTo(hx, height);
      ctx.moveTo(0, hy);
      ctx.lineTo(width, hy);
      ctx.stroke();
      ctx.setLineDash([]);

      // Tooltip pill
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1;
      const text = `Az: ${hoverAz.toFixed(1)}° | El: ${hoverEl.toFixed(1)}°`;
      ctx.font = '11px "JetBrains Mono", monospace';
      const textW = ctx.measureText(text).width;
      const pillX = Math.min(width - textW - 20, Math.max(10, hx + 10));
      const pillY = Math.max(25, hy - 10);

      ctx.beginPath();
      ctx.roundRect(pillX, pillY - 16, textW + 16, 22, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#f8fafc';
      ctx.fillText(text, pillX + 8, pillY - 2);
    }
  }, [currentPoint, allPoints, mask, useTerrain, elevKm, hoverAz, hoverEl]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const width = canvas.width;
    const height = canvas.height;

    const az = (x / width) * 360;
    const maxObjectEl = Math.max(
      currentPoint.sun.elevationDeg,
      currentPoint.earth.elevationDeg,
      15
    );
    const minEl = -6;
    const maxEl = Math.max(20, Math.ceil(maxObjectEl + 5));

    const el = minEl + ((height - y) / height) * (maxEl - minEl);

    setHoverAz(az);
    setHoverEl(el);
  };

  const handleMouseLeave = () => {
    setHoverAz(null);
    setHoverEl(null);
  };

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-slate-700/60 bg-space-900/90 shadow-2xl">
      <div className="flex items-center justify-between px-3 py-2 bg-space-850/80 border-b border-slate-700/50 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="font-semibold text-slate-200 uppercase tracking-wider">
            360° Horizon Panorama
          </span>
          <span className="text-slate-400">({siteName})</span>
        </div>
        <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-solar-gold inline-block" />
            Sun {currentPoint.sun.elevationDeg.toFixed(1)}°
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-comm-cyan inline-block" />
            Earth {currentPoint.earth.elevationDeg.toFixed(1)}°
          </span>
          <span className="text-slate-400">
            Terrain: <span className={useTerrain ? "text-emerald-400" : "text-amber-400"}>
              {useTerrain ? (mask ? "LOLA Mask" : "Synthetic LOLA") : "Flat Horizon"}
            </span>
          </span>
        </div>
      </div>

      <div className="relative w-full aspect-[21/9] sm:aspect-[24/8] min-h-[220px]">
        <canvas
          ref={canvasRef}
          width={1000}
          height={340}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="w-full h-full block cursor-crosshair"
        />
      </div>
    </div>
  );
};

