import React, { useState, useEffect } from 'react';
import { TimeInterval } from '../types';
import {
  Play,
  Pause,
  RotateCcw,
  Clock,
} from 'lucide-react';
import { Button, Slider } from '@/components/ui';

interface NasaTimelineScrubberProps {
  currentScrubMs: number;
  windowStartMs: number;
  windowEndMs: number;
  isPlaying: boolean;
  playbackSpeed: number;
  sunIntervalsA: TimeInterval[];
  earthIntervalsA: TimeInterval[];
  bothUpIntervalsA: TimeInterval[];
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
  sunIntervalsA,
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
    <div className="z-30 w-full bg-space-950/95 backdrop-blur-lg border-t border-slate-800 px-4 py-2.5 shadow-2xl flex flex-col gap-2">
      {/* Multi-Track Mini Gantt Ribbon */}
      <div className="relative w-full h-3 rounded bg-space-900 border border-slate-800 overflow-hidden">
        {/* Sunlight segments */}
        {sunIntervalsA.map((inv, idx) => {
          const x0 = ((inv.startMs - windowStartMs) / durationMs) * 100;
          const x1 = ((inv.endMs - windowStartMs) / durationMs) * 100;
          return (
            <div
              key={`sun_${idx}`}
              className="absolute top-0 bottom-0 bg-amber-500/80"
              style={{ left: `${Math.max(0, x0)}%`, width: `${Math.max(0.5, x1 - x0)}%` }}
            />
          );
        })}

        {/* Current Time Laser Needle */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-red-500 z-10 shadow-sm shadow-red-500/80"
          style={{ left: `${progressFrac * 100}%` }}
        />
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
