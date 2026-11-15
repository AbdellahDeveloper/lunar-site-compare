import React, { useRef, useEffect, useState, useCallback } from 'react';
import { EphemerisPoint } from '../types';
import { Sun, Radio, Compass, Clock, Maximize2, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui';

interface ElevationProfileChartProps {
  points: EphemerisPoint[];
  currentScrubMs: number;
  onScrub: (timeMs: number) => void;
  siteName: string;
  windowStartMs: number;
  windowEndMs: number;
  height?: number;
}

export const ElevationProfileChart: React.FC<ElevationProfileChartProps> = ({
  points,
  currentScrubMs,
  onScrub,
  siteName,
  windowStartMs,
  windowEndMs,
  height = 220,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<EphemerisPoint | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Compute dynamic elevation bounds
  let minEl = -4;
  let maxEl = 12;
  if (points.length > 0) {
    let pMin = 999;
    let pMax = -999;
    for (const pt of points) {
      if (pt.sun.elevationDeg < pMin) pMin = pt.sun.elevationDeg;
      if (pt.sun.elevationDeg > pMax) pMax = pt.sun.elevationDeg;
      if (pt.earth.elevationDeg < pMin) pMin = pt.earth.elevationDeg;
      if (pt.earth.elevationDeg > pMax) pMax = pt.earth.elevationDeg;
      if (pt.sun.horizonDeg < pMin) pMin = pt.sun.horizonDeg;
      if (pt.sun.horizonDeg > pMax) pMax = pt.sun.horizonDeg;
    }
    minEl = Math.min(-3, Math.floor(pMin - 1.5));
    maxEl = Math.max(8, Math.ceil(pMax + 2.0));
  }

  // Draw chart onto Canvas
  const renderChart = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, width, h);

    const padLeft = 46;
    const padRight = 16;
    const padTop = 20;
    const padBottom = 26;

    const chartW = width - padLeft - padRight;
    const chartH = h - padTop - padBottom;

    if (chartW <= 0 || chartH <= 0 || points.length === 0) return;

    const timeToX = (t: number) => {
      const frac = (t - windowStartMs) / (windowEndMs - windowStartMs);
      return padLeft + Math.max(0, Math.min(1, frac)) * chartW;
    };

    const elToY = (el: number) => {
      const frac = (el - minEl) / (maxEl - minEl);
      return padTop + chartH - frac * chartH;
    };

    // 1. Background Fill
    ctx.fillStyle = '#060a12';
    ctx.fillRect(padLeft, padTop, chartW, chartH);

    // 2. Sub-zero / Night Shading
    const zeroY = elToY(0);
    if (zeroY < padTop + chartH) {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
      ctx.fillRect(padLeft, zeroY, chartW, padTop + chartH - zeroY);
    }

    // 3. Horizontal Grid Lines & Elevation Labels
    ctx.font = '10px ui-monospace, monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    const step = (maxEl - minEl) > 20 ? 5 : (maxEl - minEl) > 10 ? 2 : 1;
    const startStep = Math.ceil(minEl / step) * step;

    for (let el = startStep; el <= maxEl; el += step) {
      const y = elToY(el);
      const isZero = Math.abs(el) < 0.001;

      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(padLeft + chartW, y);
      ctx.strokeStyle = isZero ? 'rgba(239, 68, 68, 0.65)' : 'rgba(51, 65, 85, 0.4)';
      ctx.lineWidth = isZero ? 1.5 : 1;
      if (!isZero) ctx.setLineDash([3, 4]);
      else ctx.setLineDash([]);
      ctx.stroke();

      // Elevation text
      ctx.fillStyle = isZero ? '#f87171' : '#64748b';
      ctx.fillText(`${el > 0 ? '+' : ''}${el}°`, padLeft - 6, y);
    }
    ctx.setLineDash([]);

    // 4. Time Axis Grid Lines
    const totalDays = (windowEndMs - windowStartMs) / (86400 * 1000);
    const dayStep = totalDays <= 3 ? 0.5 : totalDays <= 7 ? 1 : totalDays <= 14 ? 2 : 7;
    const stepMs = dayStep * 86400 * 1000;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#64748b';

    for (let t = windowStartMs; t <= windowEndMs; t += stepMs) {
      const x = timeToX(t);
      ctx.beginPath();
      ctx.moveTo(x, padTop);
      ctx.lineTo(x, padTop + chartH);
      ctx.strokeStyle = 'rgba(51, 65, 85, 0.35)';
      ctx.setLineDash([2, 4]);
      ctx.stroke();

      const d = new Date(t);
      const label = dayStep < 1 
        ? `${d.getUTCHours()}:00` 
        : `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
      ctx.fillText(label, x, padTop + chartH + 6);
    }
    ctx.setLineDash([]);

    // 5. Draw Sun Terrain Horizon Skyline (H_sun(t))
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(202, 138, 4, 0.4)';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([3, 3]);
    for (let i = 0; i < points.length; i++) {
      const pt = points[i];
      const x = timeToX(pt.timeMs);
      const y = elToY(pt.sun.horizonDeg);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // 6. Draw Earth Terrain Horizon Skyline (H_earth(t))
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(8, 145, 178, 0.35)';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([3, 3]);
    for (let i = 0; i < points.length; i++) {
      const pt = points[i];
      const x = timeToX(pt.timeMs);
      const y = elToY(pt.earth.horizonDeg);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // 7. Draw Earth Elevation Curve
    ctx.beginPath();
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2.0;
    for (let i = 0; i < points.length; i++) {
      const pt = points[i];
      const x = timeToX(pt.timeMs);
      const y = elToY(pt.earth.elevationDeg);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // 8. Draw Sun Elevation Curve
    ctx.beginPath();
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 2.2;
    for (let i = 0; i < points.length; i++) {
      const pt = points[i];
      const x = timeToX(pt.timeMs);
      const y = elToY(pt.sun.elevationDeg);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // 9. Current Scrub Timestamp Vertical Indicator Line
    const scrubX = timeToX(currentScrubMs);
    ctx.beginPath();
    ctx.moveTo(scrubX, padTop);
    ctx.lineTo(scrubX, padTop + chartH);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.0;
    ctx.stroke();

    // Scrub head indicator
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(scrubX, padTop, 4, 0, Math.PI * 2);
    ctx.fill();

    // Current scrub Sun point dot
    const currentPt = points.find((p) => Math.abs(p.timeMs - currentScrubMs) < 30 * 60 * 1000) || points[0];
    if (currentPt) {
      const sunY = elToY(currentPt.sun.elevationDeg);
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(scrubX, sunY, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      const earthY = elToY(currentPt.earth.elevationDeg);
      ctx.fillStyle = '#67e8f9';
      ctx.beginPath();
      ctx.arc(scrubX, earthY, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0891b2';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Outer chart border
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.strokeRect(padLeft, padTop, chartW, chartH);
  }, [points, currentScrubMs, minEl, maxEl, windowStartMs, windowEndMs]);

  useEffect(() => {
    const handleResize = () => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (container && canvas) {
        canvas.width = container.clientWidth;
        canvas.height = height;
        renderChart();
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [renderChart, height]);

  useEffect(() => {
    renderChart();
  }, [renderChart]);

  // Pointer interactions for scrubbing
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);
    setIsDragging(true);
    handlePointerMove(e);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const padLeft = 46;
    const padRight = 16;
    const chartW = canvas.width - padLeft - padRight;
    if (chartW <= 0) return;

    const frac = Math.max(0, Math.min(1, (x - padLeft) / chartW));
    const targetMs = windowStartMs + frac * (windowEndMs - windowStartMs);

    // Find closest point for hover tooltip
    let closest = points[0];
    let minDist = Infinity;
    for (const p of points) {
      const dist = Math.abs(p.timeMs - targetMs);
      if (dist < minDist) {
        minDist = dist;
        closest = p;
      }
    }
    setHoveredPoint(closest);

    if (isDragging) {
      onScrub(targetMs);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas && canvas.hasPointerCapture(e.pointerId)) {
      canvas.releasePointerCapture(e.pointerId);
    }
    setIsDragging(false);
  };

  const displayPoint = hoveredPoint || points.find((p) => Math.abs(p.timeMs - currentScrubMs) < 30 * 60 * 1000) || points[0];

  return (
    <div ref={containerRef} className="w-full flex flex-col bg-space-950 rounded-xl border border-slate-800 p-3 select-none">
      {/* Chart Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 mb-2">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-solar-gold" />
          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
            Elevation Profile & Terrain Skyline [h(t)]
          </h4>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-mono">
          <div className="flex items-center gap-1.5 text-solar-gold">
            <span className="w-3 h-0.5 bg-solar-gold inline-block" />
            <span>Sun Elevation</span>
          </div>
          <div className="flex items-center gap-1.5 text-comm-cyan">
            <span className="w-3 h-0.5 bg-comm-cyan inline-block" />
            <span>Earth Elevation</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="w-3 h-0.5 border-t border-dashed border-amber-600/70 inline-block" />
            <span>Terrain Horizon</span>
          </div>
        </div>
      </div>

      {/* Main Canvas Viewport */}
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={() => setHoveredPoint(null)}
        className="w-full cursor-crosshair rounded-lg block touch-none"
        style={{ height }}
      />

      {/* Real-time Telemetry Readout Strip at Selected / Hovered Timestamp */}
      {displayPoint && (
        <div className="grid grid-cols-4 gap-2 pt-2.5 mt-2 border-t border-slate-800/80 text-xs font-mono bg-space-900/60 p-2 rounded-lg">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 uppercase flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              EPOCH (UTC)
            </span>
            <span className="text-slate-200 font-bold mt-0.5">
              {new Date(displayPoint.timeMs).toISOString().replace('T', ' ').slice(0, 19)}Z
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] text-solar-gold uppercase flex items-center gap-1">
              <Sun className="w-3 h-3" />
              SUN GEOMETRIC / CLEARANCE
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="font-bold text-slate-100">
                {displayPoint.sun.elevationDeg >= 0 ? '+' : ''}{displayPoint.sun.elevationDeg.toFixed(1)}°
              </span>
              <span className={`text-[11px] font-bold ${displayPoint.sun.clearanceDeg >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                ({displayPoint.sun.clearanceDeg >= 0 ? '+' : ''}{displayPoint.sun.clearanceDeg.toFixed(1)}° C)
              </span>
              <Badge variant={displayPoint.sun.isVisible ? 'emerald' : 'critical'} className="text-[9px] py-0 px-1">
                {displayPoint.sun.isVisible ? 'LIT' : 'OCC'}
              </Badge>
            </div>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] text-comm-cyan uppercase flex items-center gap-1">
              <Radio className="w-3 h-3" />
              EARTH DTE / CLEARANCE
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="font-bold text-slate-100">
                {displayPoint.earth.elevationDeg >= 0 ? '+' : ''}{displayPoint.earth.elevationDeg.toFixed(1)}°
              </span>
              <span className={`text-[11px] font-bold ${displayPoint.earth.clearanceDeg >= 0 ? 'text-cyan-400' : 'text-red-400'}`}>
                ({displayPoint.earth.clearanceDeg >= 0 ? '+' : ''}{displayPoint.earth.clearanceDeg.toFixed(1)}° C)
              </span>
              <Badge variant={displayPoint.earth.isVisible ? 'cyan' : 'critical'} className="text-[9px] py-0 px-1">
                {displayPoint.earth.isVisible ? 'VIS' : 'OCC'}
              </Badge>
            </div>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] text-emerald-400 uppercase flex items-center gap-1">
              <Compass className="w-3 h-3" />
              TERRAIN SKYLINE
            </span>
            <div className="flex items-center gap-2 mt-0.5 text-slate-300">
              <span>H(Sun): {displayPoint.sun.horizonDeg.toFixed(1)}°</span>
              <span>H(Earth): {displayPoint.earth.horizonDeg.toFixed(1)}°</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

