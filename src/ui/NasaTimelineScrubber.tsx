import React, { useState, useEffect } from 'react';
import { TimeInterval, Site } from '../types';
import {
  Play,
  Pause,
  RotateCcw,
  Clock,
  Sun,
  Radio,
} from 'lucide-react';
import { Button, Slider } from '@/components/ui';

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
}) => {
  const currentDate = new Date(currentScrubMs);
  const durationMs = windowEndMs - windowStartMs;
  const progressFrac = Math.max(0, Math.min(1, (currentScrubMs - windowStartMs) / durationMs));

  // Direct text entry state
  const [utcText, setUtcText] = useState(currentDate.toISOString().replace('.000', ''));

  useEffect(() => {
    setUtcText(new Date(currentScrubMs).toISOString().replace('.000', ''));
  }, [currentScrubMs]);

  const handleUtcSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = new Date(utcText).getTime();
    if (!isNaN(parsed) && parsed >= windowStartMs && parsed <= windowEndMs) {
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
    <div className="z-30 w-full bg-space-950/95 backdrop-blur-lg border-t border-slate-800 px-4 py-2 shadow-2xl flex flex-col gap-2">
      {/* Dual-Location Telemetry Tracks (Location A on top, Location B below) */}
      <div className="relative w-full flex flex-col gap-2 bg-space-900/95 rounded-xl p-2.5 border border-slate-800/90 shadow-inner font-mono">
        {/* Red Laser Time Needle passing through all tracks */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-30 pointer-events-none shadow-sm shadow-red-500"
          style={{ left: `calc(${progressFrac * 100}% + 2px)` }}
        >
          <div className="w-2.5 h-2.5 -ml-1 -top-1 bg-red-500 rounded-full shadow-md shadow-red-500/80" />
        </div>

        {/* GROUP 1: LOCATION A */}
        <div className="flex flex-col gap-1">
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
          <div className="flex flex-col gap-1 pt-1.5 border-t border-slate-800/70">
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

      {/* Primary Fluid Time Slider using shadcn Slider */}
      <Slider
        min={windowStartMs}
        max={windowEndMs}
        step={15 * 60 * 1000} // 15 minute step resolution
        value={currentScrubMs}
        onValueChange={onScrub}
      />

      {/* Controls & Direct UTC Timestamp Entry Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Playback Controls & Steps */}
        <div className="flex items-center gap-1.5">
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

        {/* Center: Direct Timestamp Text Entry */}
        <form
          onSubmit={handleUtcSubmit}
          className="flex items-center gap-2 bg-space-900 px-3 py-1 rounded-xl border border-slate-700 font-mono"
        >
          <Clock className="w-4 h-4 text-cyan-400" />
          <input
            type="text"
            value={utcText}
            onChange={(e) => setUtcText(e.target.value)}
            className="bg-transparent text-slate-100 font-bold tracking-wide w-48 text-xs focus:outline-none"
          />
          <span className="text-[10px] text-slate-500">UTC</span>
          <Button
            type="submit"
            size="xs"
            variant="secondary"
            className="text-[10px] text-cyan-300 font-bold"
          >
            Jump
          </Button>
        </form>

        {/* Right: Simulation Speed Multiplier */}
        <div className="flex items-center gap-1">
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
