import React, { useState, useEffect } from 'react';
import { TimeInterval } from '../types';
import {
  Play,
  Pause,
  RotateCcw,
  Clock,
  ChevronLeft,
  ChevronRight,
  Sun,
  Radio,
  Zap,
} from 'lucide-react';

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
  earthIntervalsA,
  bothUpIntervalsA,
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

  const speedOptions = [1, 10, 60, 300, 1200];

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

      {/* Primary Fluid Time Slider */}
      <div className="relative w-full flex items-center group">
        <input
          type="range"
          min={windowStartMs}
          max={windowEndMs}
          step={15 * 60 * 1000} // 15 minute step resolution
          value={currentScrubMs}
          onChange={(e) => onScrub(Number(e.target.value))}
          className="w-full h-2 bg-space-850 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none"
        />
      </div>

      {/* Controls & Direct UTC Timestamp Entry Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Playback Controls & Steps */}
        <div className="flex items-center gap-2">
          <button
            onClick={onResetToStart}
            title="Reset to Epoch Start"
            className="p-2 rounded-lg bg-space-900 hover:bg-space-800 border border-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => onStepTime(-24)}
            title="Step -24h"
            className="px-2 py-1.5 rounded-lg bg-space-900 hover:bg-space-800 border border-slate-700 text-slate-300 font-mono text-[11px] transition-colors"
          >
            -1d
          </button>
          <button
            onClick={() => onStepTime(-1)}
            title="Step -1h"
            className="px-2 py-1.5 rounded-lg bg-space-900 hover:bg-space-800 border border-slate-700 text-slate-300 font-mono text-[11px] transition-colors"
          >
            -1h
          </button>

          {/* Primary Play/Pause Button */}
          <button
            onClick={onTogglePlay}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg font-bold text-xs transition-all shadow-lg ${
              isPlaying
                ? 'bg-amber-400 hover:bg-amber-300 text-black shadow-amber-500/20'
                : 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-cyan-500/20'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-black" />
                <span>PAUSE</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-black" />
                <span>SIMULATE</span>
              </>
            )}
          </button>

          <button
            onClick={() => onStepTime(1)}
            title="Step +1h"
            className="px-2 py-1.5 rounded-lg bg-space-900 hover:bg-space-800 border border-slate-700 text-slate-300 font-mono text-[11px] transition-colors"
          >
            +1h
          </button>
          <button
            onClick={() => onStepTime(24)}
            title="Step +24h"
            className="px-2 py-1.5 rounded-lg bg-space-900 hover:bg-space-800 border border-slate-700 text-slate-300 font-mono text-[11px] transition-colors"
          >
            +1d
          </button>
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
          <button
            type="submit"
            className="px-2 py-0.5 rounded bg-space-800 hover:bg-space-700 text-[10px] text-cyan-300 transition-colors"
          >
            Jump
          </button>
        </form>

        {/* Right: Speed Multiplier */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500 text-[11px] font-mono mr-1">Speed:</span>
          {speedOptions.map((spd) => (
            <button
              key={spd}
              onClick={() => onSetSpeed(spd)}
              className={`px-2 py-1 rounded-md text-[11px] font-mono transition-colors ${
                playbackSpeed === spd
                  ? 'bg-cyan-500/20 border border-cyan-400 text-cyan-300 font-bold'
                  : 'bg-space-900 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {spd}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

