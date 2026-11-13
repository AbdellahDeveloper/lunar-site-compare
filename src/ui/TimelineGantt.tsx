import React, { useRef, useEffect } from 'react';
import { EphemerisPoint, TimeInterval } from '../types';

interface TimelineGanttProps {
  windowStartMs: number;
  windowEndMs: number;
  currentScrubMs: number;
  sunIntervals: TimeInterval[];
  earthIntervals: TimeInterval[];
  bothUpIntervals: TimeInterval[];
  onScrub: (timeMs: number) => void;
}

export const TimelineGantt: React.FC<TimelineGanttProps> = ({
  windowStartMs,
  windowEndMs,
  currentScrubMs,
  sunIntervals,
  earthIntervals,
  bothUpIntervals,
  onScrub,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDraggingRef = useRef(false);

  const durationMs = windowEndMs - windowStartMs;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const timeToX = (t: number) => {
      const frac = (t - windowStartMs) / durationMs;
      return Math.max(0, Math.min(width, frac * width));
    };

    // Background
    ctx.fillStyle = '#0b0f19';
    ctx.fillRect(0, 0, width, height);

    // Track geometry
    const trackHeight = 18;
    const trackGap = 6;
    const topMargin = 28;

    const track1Y = topMargin; // Sun
    const track2Y = topMargin + trackHeight + trackGap; // Earth
    const track3Y = topMargin + (trackHeight + trackGap) * 2; // Both Up

    // Track backgrounds (dark slate rails)
    ctx.fillStyle = '#161e31';
    ctx.fillRect(0, track1Y, width, trackHeight);
    ctx.fillRect(0, track2Y, width, trackHeight);
    ctx.fillRect(0, track3Y, width, trackHeight);

    // 1. Draw Sun Intervals (Amber / Gold)
    ctx.fillStyle = '#f59e0b';
    for (const inv of sunIntervals) {
      const x0 = timeToX(inv.startMs);
      const x1 = timeToX(inv.endMs);
      const w = Math.max(2, x1 - x0);
      ctx.fillRect(x0, track1Y, w, trackHeight);
    }

    // 2. Draw Earth Intervals (Cyan)
    ctx.fillStyle = '#06b6d4';
    for (const inv of earthIntervals) {
      const x0 = timeToX(inv.startMs);
      const x1 = timeToX(inv.endMs);
      const w = Math.max(2, x1 - x0);
      ctx.fillRect(x0, track2Y, w, trackHeight);
    }

    // 3. Draw Both-Up Intervals (Emerald Green)
    ctx.fillStyle = '#10b981';
    for (const inv of bothUpIntervals) {
      const x0 = timeToX(inv.startMs);
      const x1 = timeToX(inv.endMs);
      const w = Math.max(2, x1 - x0);
      ctx.fillRect(x0, track3Y, w, trackHeight);
    }

    // 4. Draw Date / Time Ticks along the top
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';

    const dayMs = 24 * 3600 * 1000;
    // Step size based on window length
    let tickStepMs = dayMs;
    const totalDays = durationMs / dayMs;
    if (totalDays > 35) tickStepMs = 7 * dayMs;
    else if (totalDays > 14) tickStepMs = 2 * dayMs;

    for (let t = windowStartMs; t <= windowEndMs; t += tickStepMs) {
      const x = timeToX(t);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();

      const d = new Date(t);
      const dateStr = `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
      ctx.fillStyle = 'rgba(148, 163, 184, 0.8)';
      ctx.fillText(dateStr, x + 3, 14);
    }

    // 5. Draw Track Labels on left
    ctx.font = 'bold 9px Inter, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';

    // 6. Draw Current Scrub Needle (Laser line)
    const needleX = timeToX(currentScrubMs);

    // Glowing shadow
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.35)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(needleX, 0);
    ctx.lineTo(needleX, height);
    ctx.stroke();

    // Sharp line
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(needleX, 0);
    ctx.lineTo(needleX, height);
    ctx.stroke();

    // Top needle handle badge
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(needleX - 5, 0);
    ctx.lineTo(needleX + 5, 0);
    ctx.lineTo(needleX, 8);
    ctx.closePath();
    ctx.fill();
  }, [windowStartMs, windowEndMs, currentScrubMs, sunIntervals, earthIntervals, bothUpIntervals]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    handlePointerMove(e);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current && e.type !== 'pointerdown') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const frac = x / rect.width;
    const scrubMs = windowStartMs + frac * durationMs;
    onScrub(scrubMs);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignore
    }
  };

  return (
    <div className="w-full flex flex-col gap-1 select-none">
      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-1">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-amber-500 inline-block" />
            <span className="text-slate-200">Sunlight</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-cyan-500 inline-block" />
            <span className="text-slate-200">Direct Earth DTE</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block" />
            <span className="text-slate-200">Both-Up Window</span>
          </span>
        </div>
        <div className="text-slate-400">
          Click or drag across timeline to scrub
        </div>
      </div>

      <div className="relative w-full h-[105px] rounded-lg overflow-hidden border border-slate-700/60 bg-space-950">
        <canvas
          ref={canvasRef}
          width={900}
          height={105}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="w-full h-full block cursor-ew-resize"
        />
      </div>
    </div>
  );
};
