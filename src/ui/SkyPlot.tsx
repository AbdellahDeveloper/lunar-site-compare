import React, { useRef, useEffect } from 'react';
import { EphemerisPoint } from '../types';
import { Sun, Radio } from 'lucide-react';

interface SkyPlotProps {
  currentPoint: EphemerisPoint;
  allPoints: EphemerisPoint[];
  siteName: string;
}

export const SkyPlot: React.FC<SkyPlotProps> = React.memo(({
  currentPoint,
  allPoints,
  siteName,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Pre-render static dome background, grid spokes, and trajectories into an offscreen canvas
  useEffect(() => {
    const size = 340;
    if (!bgCanvasRef.current) {
      bgCanvasRef.current = document.createElement('canvas');
      bgCanvasRef.current.width = size;
      bgCanvasRef.current.height = size;
    }
    const bg = bgCanvasRef.current;
    const ctx = bg.getContext('2d');
    if (!ctx) return;

    const cx = size / 2;
    const cy = size / 2;
    const maxRadius = cx - 28;

    ctx.clearRect(0, 0, size, size);

    const topoToXY = (elDeg: number, azDeg: number) => {
      const clampedEl = Math.max(-10, Math.min(90, elDeg));
      const r = maxRadius * (1 - clampedEl / 90);
      const rad = ((azDeg - 90) * Math.PI) / 180;
      return {
        x: cx + r * Math.cos(rad),
        y: cy + r * Math.sin(rad),
        r,
      };
    };

    // 1. Draw Sky Dome Background
    const domeGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxRadius);
    domeGrad.addColorStop(0, '#090d16');
    domeGrad.addColorStop(0.75, '#0e1524');
    domeGrad.addColorStop(1, '#161f36');

    ctx.beginPath();
    ctx.arc(cx, cy, maxRadius, 0, Math.PI * 2);
    ctx.fillStyle = domeGrad;
    ctx.fill();

    // 2. Grazing Zone ring (0° to 5° elevation) highlight
    const r5 = maxRadius * (1 - 5 / 90);
    ctx.beginPath();
    ctx.arc(cx, cy, maxRadius, 0, Math.PI * 2);
    ctx.arc(cx, cy, r5, 0, Math.PI * 2, true);
    ctx.fillStyle = 'rgba(245, 158, 11, 0.05)';
    ctx.fill();

    // 3. Draw Concentric Elevation Rings
    const elevationRings = [0, 15, 30, 60, 90];
    for (const el of elevationRings) {
      const r = maxRadius * (1 - el / 90);
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = el === 0 ? 'rgba(56, 189, 248, 0.6)' : 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = el === 0 ? 2 : 1;
      ctx.setLineDash(el === 0 ? [] : [3, 4]);
      ctx.stroke();

      if (el > 0 && el < 90) {
        ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${el}°`, cx, cy - r + 11);
      }
    }
    ctx.setLineDash([]);

    // 4. Draw Cardinal Spoke Lines & Labels
    const cardinals = [
      { label: 'N (0°)', az: 0 },
      { label: 'NE', az: 45 },
      { label: 'E (90°)', az: 90 },
      { label: 'SE', az: 135 },
      { label: 'S (180°)', az: 180 },
      { label: 'SW', az: 225 },
      { label: 'W (270°)', az: 270 },
      { label: 'NW', az: 315 },
    ];

    for (const card of cardinals) {
      const rad = ((card.az - 90) * Math.PI) / 180;
      const xOuter = cx + maxRadius * Math.cos(rad);
      const yOuter = cy + maxRadius * Math.sin(rad);

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(xOuter, yOuter);
      ctx.strokeStyle = card.az % 90 === 0 ? 'rgba(255, 255, 255, 0.18)' : 'rgba(255, 255, 255, 0.06)';
      ctx.lineWidth = card.az % 90 === 0 ? 1.5 : 1;
      ctx.stroke();

      const labelDist = maxRadius + 14;
      const lx = cx + labelDist * Math.cos(rad);
      const ly = cy + labelDist * Math.sin(rad);

      ctx.fillStyle = card.az % 90 === 0 ? '#38bdf8' : '#94a3b8';
      ctx.font = card.az % 90 === 0 ? 'bold 11px Inter, sans-serif' : '9px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(card.label, lx, ly);
    }

    // Center Zenith Mark
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillText('Zenith (90°)', cx, cy + 12);

    // 5. Draw Celestial Trajectory Arcs
    if (allPoints.length > 1) {
      // Sun Trajectory
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
      ctx.lineWidth = 2.0;
      for (let i = 0; i < allPoints.length; i++) {
        const pt = allPoints[i];
        const pos = topoToXY(pt.sun.elevationDeg, pt.sun.azimuthDeg);
        if (i === 0) ctx.moveTo(pos.x, pos.y);
        else ctx.lineTo(pos.x, pos.y);
      }
      ctx.stroke();

      // Earth Libration Loop
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.5)';
      ctx.lineWidth = 2.2;
      for (let i = 0; i < allPoints.length; i++) {
        const pt = allPoints[i];
        const pos = topoToXY(pt.earth.elevationDeg, pt.earth.azimuthDeg);
        if (i === 0) ctx.moveTo(pos.x, pos.y);
        else ctx.lineTo(pos.x, pos.y);
      }
      ctx.stroke();
    }
  }, [allPoints, siteName]);

  // Fast 60 FPS live scrub blit
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    const cx = size / 2;
    const cy = size / 2;
    const maxRadius = cx - 28;

    ctx.clearRect(0, 0, size, size);

    // Draw pre-rendered background in O(1)
    if (bgCanvasRef.current) {
      ctx.drawImage(bgCanvasRef.current, 0, 0);
    }

    const topoToXY = (elDeg: number, azDeg: number) => {
      const clampedEl = Math.max(-10, Math.min(90, elDeg));
      const r = maxRadius * (1 - clampedEl / 90);
      const rad = ((azDeg - 90) * Math.PI) / 180;
      return {
        x: cx + r * Math.cos(rad),
        y: cy + r * Math.sin(rad),
        r,
      };
    };

    // 6. Draw Live Sun Marker
    const sunPos = topoToXY(currentPoint.sun.elevationDeg, currentPoint.sun.azimuthDeg);

    const sunGlow = ctx.createRadialGradient(sunPos.x, sunPos.y, 2, sunPos.x, sunPos.y, 18);
    sunGlow.addColorStop(0, 'rgba(254, 240, 138, 0.95)');
    sunGlow.addColorStop(0.4, 'rgba(245, 158, 11, 0.6)');
    sunGlow.addColorStop(1, 'rgba(245, 158, 11, 0)');
    ctx.fillStyle = sunGlow;
    ctx.beginPath();
    ctx.arc(sunPos.x, sunPos.y, 18, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fffbeb';
    ctx.beginPath();
    ctx.arc(sunPos.x, sunPos.y, 5.5, 0, Math.PI * 2);
    ctx.fill();

    // 7. Draw Live Earth Marker
    const earthPos = topoToXY(currentPoint.earth.elevationDeg, currentPoint.earth.azimuthDeg);

    const earthGlow = ctx.createRadialGradient(earthPos.x, earthPos.y, 2, earthPos.x, earthPos.y, 16);
    earthGlow.addColorStop(0, 'rgba(186, 230, 253, 0.9)');
    earthGlow.addColorStop(0.4, 'rgba(56, 189, 248, 0.5)');
    earthGlow.addColorStop(1, 'rgba(2, 132, 199, 0)');
    ctx.fillStyle = earthGlow;
    ctx.beginPath();
    ctx.arc(earthPos.x, earthPos.y, 16, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(earthPos.x, earthPos.y, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(earthPos.x - 1.5, earthPos.y - 1.5, 2, 0, Math.PI * 2);
    ctx.fill();
  }, [currentPoint]);

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-slate-700/60 bg-space-900/90 shadow-2xl p-3 flex flex-col items-center">
      <div className="w-full flex items-center justify-between pb-2 border-b border-slate-700/50 text-xs mb-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-solar-gold" />
          <span className="font-semibold text-slate-200 uppercase tracking-wider">
            Polar Radar Sky Plot
          </span>
          <span className="text-slate-400">({siteName})</span>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
          <span className="text-solar-gold flex items-center gap-1">
            <Sun className="w-3 h-3 text-solar-gold" />
            <span>Sun Trail</span>
          </span>
          <span className="text-comm-cyan flex items-center gap-1">
            <Radio className="w-3 h-3 text-comm-cyan" />
            <span>Earth Libration</span>
          </span>
        </div>
      </div>

      <div className="relative w-full max-w-[340px] aspect-square flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={400}
          height={400}
          className="w-full h-full block"
        />
      </div>

      <div className="w-full flex items-center justify-around pt-2 border-t border-slate-700/40 text-xs font-mono text-slate-300">
        <div className="text-center">
          <div className="text-slate-500 text-[10px]">SUN AZ / EL</div>
          <div className="text-solar-gold font-bold">
            {currentPoint.sun.azimuthDeg.toFixed(1)}° / {currentPoint.sun.elevationDeg.toFixed(1)}°
          </div>
        </div>
        <div className="text-center">
          <div className="text-slate-500 text-[10px]">EARTH AZ / EL</div>
          <div className="text-comm-cyan font-bold">
            {currentPoint.earth.azimuthDeg.toFixed(1)}° / {currentPoint.earth.elevationDeg.toFixed(1)}°
          </div>
        </div>
      </div>
    </div>
  );
});

