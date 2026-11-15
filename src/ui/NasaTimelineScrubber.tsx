import React, { useState, useEffect, useRef } from 'react';
import { TimeInterval, Site } from '../types';
import {
  Play,
  Pause,
  RotateCcw,
  Sun,
  Radio,
} from 'lucide-react';
import { Button } from '@/components/ui';

interface NasaTimelineScrubberProps {
  currentScrubMs: number;
  windowStartMs: number;
  windowEndMs: number;
  isPlaying: boolean;
  playbackSpeed: number;
  siteA: Site;
  siteB?: Site;
  sunIntervalsA: TimeInterval[];
  earthIntervalsA: TimeInterval[];
  sunIntervalsB?: TimeInterval[];
  earthIntervalsB?: TimeInterval[];
  onTogglePlay: () => void;
  onSetSpeed: (speed: number) => void;
  onScrub: (timeMs: number) => void;
  onStepTime: (deltaHours: number) => void;
  onResetToStart: () => void;
  onUpdateWindow?: (startMs: number, endMs: number) => void;
}

export const NasaTimelineScrubber: React.FC<NasaTimelineScrubberProps> = ({
  currentScrubMs,
  windowStartMs,
  windowEndMs,
  isPlaying,
  playbackSpeed,
  siteA,
  siteB,
  sunIntervalsA,
  earthIntervalsA,
  sunIntervalsB,
  earthIntervalsB,
  onTogglePlay,
  onSetSpeed,
  onScrub,
  onStepTime,
  onResetToStart,
  onUpdateWindow,
}) => {
  const currentDate = new Date(currentScrubMs);
  const durationMs = Math.max(1, windowEndMs - windowStartMs);
  const progressFrac = Math.max(0, Math.min(1, (currentScrubMs - windowStartMs) / durationMs));

  // Interactive timeline track scrubber ref & state
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef(false);

  const scrubFromPointer = (clientX: number) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    if (rect.width <= 0) return;
    const x = clientX - rect.left;
    const frac = Math.max(0, Math.min(1, x / rect.width));
    const targetMs = Math.round(windowStartMs + frac * durationMs);
    onScrub(targetMs);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    isDraggingRef.current = true;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    scrubFromPointer(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingRef.current) {
      scrubFromPointer(e.clientX);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  // Direct text entry states for START and END
  const [startText, setStartText] = useState(new Date(windowStartMs).toISOString().replace('.000', ''));
  const [endText, setEndText] = useState(new Date(windowEndMs).toISOString().replace('.000', ''));

  useEffect(() => {
    setStartText(new Date(windowStartMs).toISOString().replace('.000', ''));
  }, [windowStartMs]);

  useEffect(() => {
    setEndText(new Date(windowEndMs).toISOString().replace('.000', ''));
  }, [windowEndMs]);

  const handleStartSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = new Date(startText).getTime();
    if (!isNaN(parsed)) {
      if (onUpdateWindow && parsed < windowEndMs) {
        onUpdateWindow(parsed, windowEndMs);
      }
      onScrub(parsed);
    }
  };

  const handleEndSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = new Date(endText).getTime();
    if (!isNaN(parsed)) {
      if (onUpdateWindow && parsed > windowStartMs) {
        onUpdateWindow(windowStartMs, parsed);
      }
      onScrub(parsed);
    }
  };

  const speedOptions = [
    { value: 1, label: '1h/s' },
    { value: 6, label: '6h/s' },
    { value: 24, label: '1d/s' },
    { value: 72, label: '3d/s' },
    { value: 168, label: '1w/s' },
    { value: 336, label: 'Turbo' },
  ];

  return (
    <div className="z-30 w-full h-full bg-space-950/95 backdrop-blur-lg px-4 py-2.5 shadow-2xl flex flex-col justify-between gap-2 select-none overflow-y-auto no-scrollbar">
      {/* Dual-Location Telemetry Tracks Container */}
      <div className="relative w-full flex flex-col gap-2 bg-space-900/95 rounded-xl p-3 border border-slate-800/90 shadow-inner font-mono">
        {/* Track Header showing Start Date, Scrub Guide, and End Date */}
        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pb-1 border-b border-slate-800/60 select-none">
          <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span>START: {new Date(windowStartMs).toISOString().replace('.000', '')}</span>
          </span>
          <span className="text-slate-400 uppercase tracking-widest text-[9px] font-semibold hidden md:inline">
            CLICK TIMELINE OR DRAG RED NEEDLE TO SCRUB TIME
          </span>
          <span className="flex items-center gap-1.5 text-amber-400 font-bold">
            <span>END: {new Date(windowEndMs).toISOString().replace('.000', '')}</span>
            <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
          </span>
        </div>

        {/* Interactive Telemetry Tracks Area — Click or Drag anywhere to scrub */}
        <div
          ref={timelineRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="relative w-full flex flex-col gap-2.5 py-1.5 cursor-ew-resize select-none"
        >
          {/* Red Laser Time Needle passing through all tracks (Interactive Scrubber Handle) */}
          <div
            className="absolute -top-3 bottom-0 z-30 pointer-events-none -translate-x-1/2 flex flex-col items-center"
            style={{ left: `${progressFrac * 100}%` }}
          >
            {/* Top Interactive Grip Handle & Time Tooltip */}
            <div className="relative flex flex-col items-center pointer-events-auto cursor-ew-resize group">
              <div className="mb-0.5 px-2 py-0.5 rounded bg-red-600 text-white text-[9px] font-mono font-bold tracking-tight shadow-xl border border-red-300 whitespace-nowrap">
                {currentDate.toISOString().replace('.000', '')}
              </div>
              <div className="w-3.5 h-3.5 bg-red-500 rounded-sm rotate-45 shadow-lg shadow-red-500/80 border border-white flex items-center justify-center -mt-1">
                <div className="w-1.5 h-1.5 bg-white rounded-full" />
              </div>
            </div>

            {/* Vertical Red Laser Beam passing through Location A & Location B tracks */}
            <div className="w-0.5 flex-1 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,1)]" />

            {/* Bottom Needle Notch */}
            <div className="w-2.5 h-1.5 bg-red-500 rounded-t shadow-md shadow-red-500" />
          </div>

          {/* GROUP 1: LOCATION A */}
          <div className="flex flex-col gap-1 pointer-events-none">
            <div className="flex items-center justify-between text-[11px] text-cyan-300 font-bold">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
                <span className="uppercase tracking-wider">LOCATION A:</span>
                <span className="text-slate-100 font-normal truncate max-w-[280px]">
                  {siteA.name}
                </span>
              </div>
              <div className="flex items-center gap-3 text-[9px] text-slate-400 font-normal shrink-0">
                <span className="flex items-center gap-1 text-amber-400">
                  <Sun className="w-2.5 h-2.5" />
                  <span>Sun Light</span>
                </span>
                <span className="flex items-center gap-1 text-cyan-400">
                  <Radio className="w-2.5 h-2.5" />
                  <span>Earth Link (Blue)</span>
                </span>
              </div>
            </div>

            {/* Location A: Sun Track (Gold / Amber) */}
            <div className="relative w-full h-2 rounded bg-space-950 border border-slate-800/80 overflow-hidden" title="Location A: Sunlight Power Windows">
              {sunIntervalsA.map((inv, idx) => {
                const x0 = ((inv.startMs - windowStartMs) / durationMs) * 100;
                const x1 = ((inv.endMs - windowStartMs) / durationMs) * 100;
                return (
                  <div
                    key={`sunA_${idx}`}
                    className="absolute top-0 bottom-0 bg-amber-500 shadow-xs shadow-amber-500/50"
                    style={{ left: `${Math.max(0, x0)}%`, width: `${Math.max(0.5, x1 - x0)}%` }}
                  />
                );
              })}
            </div>

            {/* Location A: Earth DTE Track (Sky Blue / Cyan) */}
            <div className="relative w-full h-2 rounded bg-space-950 border border-slate-800/80 overflow-hidden" title="Location A: Direct-to-Earth Comm Windows">
              {earthIntervalsA.map((inv, idx) => {
                const x0 = ((inv.startMs - windowStartMs) / durationMs) * 100;
                const x1 = ((inv.endMs - windowStartMs) / durationMs) * 100;
                return (
                  <div
                    key={`earthA_${idx}`}
                    className="absolute top-0 bottom-0 bg-cyan-400 shadow-xs shadow-cyan-400/50"
                    style={{ left: `${Math.max(0, x0)}%`, width: `${Math.max(0.5, x1 - x0)}%` }}
                  />
                );
              })}
            </div>
          </div>

          {/* GROUP 2: LOCATION B (when present) */}
          {siteB && sunIntervalsB && earthIntervalsB && (
            <div className="flex flex-col gap-1 pt-1.5 border-t border-slate-800/70 pointer-events-none">
              <div className="flex items-center justify-between text-[11px] text-amber-300 font-bold">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                  <span className="uppercase tracking-wider">LOCATION B:</span>
                  <span className="text-slate-100 font-normal truncate max-w-[280px]">
                    {siteB.name}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[9px] text-slate-400 font-normal shrink-0">
                  <span className="flex items-center gap-1 text-amber-400">
                    <Sun className="w-2.5 h-2.5" />
                    <span>Sun Light</span>
                  </span>
                  <span className="flex items-center gap-1 text-cyan-400">
                    <Radio className="w-2.5 h-2.5" />
                    <span>Earth Link (Blue)</span>
                  </span>
                </div>
              </div>

              {/* Location B: Sun Track (Gold / Amber) */}
              <div className="relative w-full h-2 rounded bg-space-950 border border-slate-800/80 overflow-hidden" title="Location B: Sunlight Power Windows">
                {sunIntervalsB.map((inv, idx) => {
                  const x0 = ((inv.startMs - windowStartMs) / durationMs) * 100;
                  const x1 = ((inv.endMs - windowStartMs) / durationMs) * 100;
                  return (
                    <div
                      key={`sunB_${idx}`}
                      className="absolute top-0 bottom-0 bg-amber-500 shadow-xs shadow-amber-500/50"
                      style={{ left: `${Math.max(0, x0)}%`, width: `${Math.max(0.5, x1 - x0)}%` }}
                    />
                  );
                })}
              </div>

              {/* Location B: Earth DTE Track (Sky Blue / Cyan) */}
              <div className="relative w-full h-2 rounded bg-space-950 border border-slate-800/80 overflow-hidden" title="Location B: Direct-to-Earth Comm Windows">
                {earthIntervalsB.map((inv, idx) => {
                  const x0 = ((inv.startMs - windowStartMs) / durationMs) * 100;
                  const x1 = ((inv.endMs - windowStartMs) / durationMs) * 100;
                  return (
                    <div
                      key={`earthB_${idx}`}
                      className="absolute top-0 bottom-0 bg-cyan-400 shadow-xs shadow-cyan-400/50"
                      style={{ left: `${Math.max(0, x0)}%`, width: `${Math.max(0.5, x1 - x0)}%` }}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Controls & START / CURRENT / END UTC Timestamps Row */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 text-xs">
        {/* Playback Controls & Steps */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={onResetToStart}
            title="Reset to Epoch Start"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onStepTime(-24)}
            title="Step -24h"
            className="font-mono text-[11px] px-2"
          >
            -1d
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onStepTime(-1)}
            title="Step -1h"
            className="font-mono text-[11px] px-2"
          >
            -1h
          </Button>

          {/* Primary Play/Pause Button */}
          <Button
            variant={isPlaying ? 'solar' : 'nasa'}
            size="sm"
            onClick={onTogglePlay}
            className="gap-1.5 px-3.5 font-bold"
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-black" />
                <span>PAUSE</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-black" />
                <span>SIMULATE</span>
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onStepTime(1)}
            title="Step +1h"
            className="font-mono text-[11px] px-2"
          >
            +1h
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onStepTime(24)}
            title="Step +24h"
            className="font-mono text-[11px] px-2"
          >
            +1d
          </Button>
        </div>

        {/* Center: START, CURRENT, and END UTC Timestamps */}
        <div className="flex flex-wrap items-center justify-center gap-2 font-mono text-xs">
          {/* START TIME */}
          <form
            onSubmit={handleStartSubmit}
            className="flex items-center gap-1.5 bg-space-900/90 px-2.5 py-1 rounded-xl border border-emerald-500/30 shadow-sm"
            title="Epoch Start Time (Edit and press Enter/Jump, or click Jump to scrub to Start)"
          >
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">START:</span>
            <input
              type="text"
              value={startText}
              onChange={(e) => setStartText(e.target.value)}
              className="bg-transparent text-slate-100 font-medium w-36 sm:w-40 text-[11px] focus:outline-none focus:text-white"
            />
            <Button
              type="submit"
              size="xs"
              variant="ghost"
              className="h-5 px-1.5 text-[10px] text-emerald-300 hover:text-white hover:bg-emerald-500/20 rounded font-bold"
            >
              Jump
            </Button>
          </form>

          {/* END TIME */}
          <form
            onSubmit={handleEndSubmit}
            className="flex items-center gap-1.5 bg-space-900/90 px-2.5 py-1 rounded-xl border border-amber-500/30 shadow-sm"
            title="Epoch End Time (Edit and press Enter/Jump, or click Jump to scrub to End)"
          >
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">END:</span>
            <input
              type="text"
              value={endText}
              onChange={(e) => setEndText(e.target.value)}
              className="bg-transparent text-slate-100 font-medium w-36 sm:w-40 text-[11px] focus:outline-none focus:text-white"
            />
            <Button
              type="submit"
              size="xs"
              variant="ghost"
              className="h-5 px-1.5 text-[10px] text-amber-300 hover:text-white hover:bg-amber-500/20 rounded font-bold"
            >
              Jump
            </Button>
          </form>
        </div>

        {/* Right: Simulation Speed Multipliers */}
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-slate-500 text-[11px] font-mono mr-1">Speed:</span>
          {speedOptions.map((opt) => (
            <Button
              key={opt.value}
              size="xs"
              variant={playbackSpeed === opt.value ? 'cyanPill' : 'secondary'}
              onClick={() => onSetSpeed(opt.value)}
              className="font-mono text-[10px] px-1.5"
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};
