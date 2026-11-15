import { Badge, Button } from '@/components/ui';
import { RotateCcw, Sparkles, X } from 'lucide-react';
import React from 'react';

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
      <div className="bg-space-950/95 backdrop-blur-md border border-cyan-500/40 rounded-xl px-3.5 py-2 shadow-2xl flex items-center gap-3 text-xs font-mono text-slate-100 ring-1 ring-cyan-500/20 max-w-lg">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center text-cyan-400 shrink-0">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-cyan-300 text-xs">
                ROI Search
              </span>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-cyan-950/50 text-cyan-400 border-cyan-500/30">
                {pointsCount} {pointsCount === 1 ? 'pt' : 'pts'}
              </Badge>
            </div>
            <p className="text-slate-400 text-[10px] leading-tight">
              {pointsCount === 0 && 'Click Moon surface to outline area.'}
              {pointsCount > 0 && pointsCount < 3 && `Add ${3 - pointsCount} more pt${3 - pointsCount > 1 ? 's' : ''}.`}
              {canOptimize && 'Polygon closed. Ready to search.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
          <Button
            size="xs"
            onClick={onOptimize}
            disabled={!canOptimize || isOptimizing}
            className={`font-semibold text-xs h-7 px-2.5 transition-all ${canOptimize
                ? 'bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white shadow-md shadow-cyan-900/30'
                : 'bg-slate-800/80 text-slate-500 border border-slate-700/50'
              }`}
          >
            {isOptimizing ? (
              <>
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin mr-1" />
                Searching...
              </>
            ) : (
              <>
                <Sparkles className="w-3 h-3 mr-1 text-cyan-200" />
                Search Site
              </>
            )}
          </Button>

          {pointsCount > 0 && (
            <Button
              size="xs"
              variant="outline"
              onClick={onClear}
              disabled={isOptimizing}
              className="text-slate-400 hover:text-slate-200 hover:bg-slate-800 border-slate-700 text-xs h-7 px-2"
              title="Reset points"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Reset
            </Button>
          )}

          <Button
            size="xs"
            variant="ghost"
            onClick={onCancel}
            disabled={isOptimizing}
            className="text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 text-xs h-7 px-1.5"
            title="Cancel (Esc)"
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

