import React from 'react';
import { Play, Pause, RotateCcw, FastForward, SkipBack, SkipForward, Clock } from 'lucide-react';

interface ScrubberBarProps {
  currentScrubMs: number;
  windowStartMs: number;
  windowEndMs: number;
  isPlaying: boolean;
  playbackSpeed: number;
  onTogglePlay: () => void;
  onSetSpeed: (speed: number) => void;
  onScrub: (timeMs: number) => void;
  onStepTime: (deltaHours: number) => void;
  onResetToStart: () => void;
}

export const ScrubberBar: React.FC<ScrubberBarProps> = ({
  currentScrubMs,
  windowStartMs,
  windowEndMs,
  isPlaying,
  playbackSpeed,
  onTogglePlay,
  onSetSpeed,
  onScrub,
  onStepTime,
  onResetToStart,
}) => {
  const currentDate = new Date(currentScrubMs);
  const durationMs = windowEndMs - windowStartMs;
  const progressPercent = Math.max(0, Math.min(100, ((currentScrubMs - windowStartMs) / durationMs) * 100));

  const speedOptions = [1, 10, 60, 300, 1200];

  const formatUtc = (d: Date) => {
    return d.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
  };

  const elapsedHours = ((currentScrubMs - windowStartMs) / (3600 * 1000)).toFixed(1);
  const totalHours = (durationMs / (3600 * 1000)).toFixed(0);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-space-950/95 backdrop-blur-lg border-t border-slate-700/80 px-4 py-2.5 shadow-[0_-10px_25px_rgba(0,0,0,0.6)]">
      <div className="max-w-7xl mx-auto flex flex-col gap-2">
        {/* Progress Slider Bar */}
        <div className="relative w-full flex items-center group">
          <input
            type="range"
            min={windowStartMs}
            max={windowEndMs}
            step={15 * 60 * 1000} // 15 minute resolution
            value={currentScrubMs}
            onChange={(e) => onScrub(Number(e.target.value))}
            className="w-full h-2 bg-space-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none"
          />
        </div>

        {/* Controls and Timestamp Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Left: Playback & Step Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={onResetToStart}
              title="Reset to Window Start"
              className="p-2 rounded-lg bg-space-850 hover:bg-space-700 border border-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => onStepTime(-24)}
              title="Step -24h"
              className="px-2 py-1.5 rounded-lg bg-space-850 hover:bg-space-700 border border-slate-700 text-slate-300 font-mono text-[11px] transition-colors"
            >
              -1d
            </button>
            <button
              onClick={() => onStepTime(-1)}
              title="Step -1h"
              className="px-2 py-1.5 rounded-lg bg-space-850 hover:bg-space-700 border border-slate-700 text-slate-300 font-mono text-[11px] transition-colors"
            >
              -1h
            </button>

            <button
              onClick={onTogglePlay}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg font-semibold text-xs transition-colors shadow-lg ${
                isPlaying
                  ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/20'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-cyan-500/20'
              }`}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4 fill-black" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-black" />
                  <span>Simulate</span>
                </>
              )}
            </button>

            <button
              onClick={() => onStepTime(1)}
              title="Step +1h"
              className="px-2 py-1.5 rounded-lg bg-space-850 hover:bg-space-700 border border-slate-700 text-slate-300 font-mono text-[11px] transition-colors"
            >
              +1h
            </button>
            <button
              onClick={() => onStepTime(24)}
              title="Step +24h"
              className="px-2 py-1.5 rounded-lg bg-space-850 hover:bg-space-700 border border-slate-700 text-slate-300 font-mono text-[11px] transition-colors"
            >
              +1d
            </button>
          </div>

          {/* Center: Live Timestamp Display */}
          <div className="flex items-center gap-3 bg-space-850/80 px-4 py-1.5 rounded-xl border border-slate-700/60 font-mono">
            <Clock className="w-4 h-4 text-cyan-400" />
            <div className="text-slate-100 font-bold tracking-wide">
              {formatUtc(currentDate)}
            </div>
            <div className="text-slate-500 text-[11px]">
              T+{elapsedHours}h / {totalHours}h ({progressPercent.toFixed(1)}%)
            </div>
          </div>

          {/* Right: Speed Multiplier */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px] mr-1">Speed:</span>
            {speedOptions.map((spd) => (
              <button
                key={spd}
                onClick={() => onSetSpeed(spd)}
                className={`px-2 py-1 rounded-md text-[11px] font-mono transition-colors ${
                  playbackSpeed === spd
                    ? 'bg-cyan-500/20 border border-cyan-400 text-cyan-300 font-bold'
                    : 'bg-space-850 border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
