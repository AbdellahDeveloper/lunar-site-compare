import React from 'react';
import { Sparkles, X, RotateCcw, Crosshair, CheckCircle2 } from 'lucide-react';
import { Button, Badge } from '@/components/ui';

interface RoiDrawingHudProps {
  pointsCount: number;
  isOptimizing: boolean;
  onOptimize: () => void;
  onClear: () => void;
  onCancel: () => void;
}

export const RoiDrawingHud: React.FC<RoiDrawingHudProps> = ({
  pointsCount,
  isOptimizing,
  onOptimize,
  onClear,
  onCancel,
}) => {
  const canOptimize = pointsCount >= 3;

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
      <div className="bg-space-950/95 backdrop-blur-md border border-cyan-500/40 rounded-xl px-5 py-3 shadow-2xl flex items-center gap-4 text-xs font-mono text-slate-100 ring-1 ring-cyan-500/20 max-w-xl">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center text-cyan-400 shrink-0 animate-pulse">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-cyan-300 text-sm tracking-wide">
                ROI Site Search & Optimizer
              </span>
              <Badge variant="outline" className="text-[10px] bg-cyan-950/50 text-cyan-400 border-cyan-500/30">
                {pointsCount} {pointsCount === 1 ? 'vertex' : 'vertices'}
              </Badge>
            </div>
            <p className="text-slate-400 text-[11px] mt-0.5">
              {pointsCount === 0 && 'Click directly on the Moon to outline your target area.'}
              {pointsCount > 0 && pointsCount < 3 && `Click on the Moon to add ${3 - pointsCount} more point${3 - pointsCount > 1 ? 's' : ''} to close polygon.`}
              {canOptimize && 'Boundary closed. Click below to analyze sunlight, comms & power generation.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
          <Button
            size="sm"
            onClick={onOptimize}
            disabled={!canOptimize || isOptimizing}
            className={`font-semibold text-xs transition-all ${
              canOptimize
                ? 'bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white shadow-lg shadow-cyan-900/30 ring-1 ring-cyan-400/50'
                : 'bg-slate-800/80 text-slate-500 border border-slate-700/50'
            }`}
          >
            {isOptimizing ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-1.5" />
                Analyzing ROI...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 mr-1 text-cyan-200" />
                Search Optimal Site
              </>
            )}
          </Button>

          {pointsCount > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={onClear}
              disabled={isOptimizing}
              className="text-slate-400 hover:text-slate-200 hover:bg-slate-800 border-slate-700 text-xs px-2.5"
              title="Clear drawn vertices"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Reset
            </Button>
          )}

          <Button
            size="sm"
            variant="ghost"
            onClick={onCancel}
            disabled={isOptimizing}
            className="text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 text-xs px-2"
            title="Cancel and exit drawing mode (Esc)"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

