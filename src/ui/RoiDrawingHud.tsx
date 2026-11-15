import { Badge, Button } from '@/components/ui';
import { RotateCcw, Sparkles, X } from 'lucide-react';
import React from 'react';
import { UIMode } from '@/types';

interface RoiDrawingHudProps {
  pointsCount: number;
  isOptimizing: boolean;
  uiMode?: UIMode;
  onOptimize: () => void;
  onClear: () => void;
  onCancel: () => void;
}

export const RoiDrawingHud: React.FC<RoiDrawingHudProps> = React.memo(({
  pointsCount,
  isOptimizing,
  uiMode = 'detailed',
  onOptimize,
  onClear,
  onCancel,
}) => {
  const canOptimize = pointsCount >= 3;
  const isSimple = uiMode === 'simple';

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
      <div className="bg-space-950/95 backdrop-blur-md border border-cyan-500/40 rounded-xl px-3.5 py-1.5 shadow-2xl flex items-center gap-3 font-mono text-slate-100 ring-1 ring-cyan-500/20 w-max max-w-[90vw]">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-5 h-5 rounded-md bg-cyan-950/90 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0 shadow-sm">
            <Sparkles className="w-3 h-3" />
          </div>
          <div className="flex flex-col justify-center min-w-0">
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="font-bold text-cyan-300 text-[10.5px] tracking-tight whitespace-nowrap">
                {isSimple ? 'Zone Selection Tool' : 'ROI Search'}
              </span>
              <span className="text-[8.5px] px-1.5 py-0.5 rounded-full font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 whitespace-nowrap leading-none shrink-0 inline-flex items-center">
                {pointsCount} {pointsCount === 1 ? 'pt' : 'pts'}
              </span>
            </div>
            <p className="text-slate-400 text-[9.5px] leading-tight whitespace-nowrap mt-0.5">
              {pointsCount === 0 && (isSimple ? 'Click anywhere on Moon surface to outline your zone.' : 'Click Moon surface to outline area.')}
              {pointsCount > 0 && pointsCount < 3 && `Add ${3 - pointsCount} more point${3 - pointsCount > 1 ? 's' : ''} to complete boundary.`}
              {canOptimize && (isSimple ? 'Zone boundary complete! Click Search Zone to evaluate.' : 'Polygon closed. Ready to search.')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 pl-2.5 border-l border-slate-800 shrink-0 ml-auto">
          <Button
            size="xs"
            onClick={onOptimize}
            disabled={!canOptimize || isOptimizing}
            className={`font-semibold text-[10px] h-6 px-2.5 rounded-md whitespace-nowrap transition-all ${canOptimize
                ? 'bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white shadow-sm shadow-cyan-900/30'
                : 'bg-slate-800/80 text-slate-500 border border-slate-700/50'
              }`}
          >
            {isOptimizing ? (
              <>
                <div className="w-2.5 h-2.5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-1" />
                {isSimple ? 'Searching...' : 'Searching...'}
              </>
            ) : (
              <>
                <Sparkles className="w-2.5 h-2.5 mr-1 text-cyan-200" />
                {isSimple ? 'Search Zone' : 'Search Site'}
              </>
            )}
          </Button>

          {pointsCount > 0 && (
            <Button
              size="xs"
              variant="outline"
              onClick={onClear}
              disabled={isOptimizing}
              className="text-slate-400 hover:text-slate-200 hover:bg-slate-800 border-slate-700 text-[9.5px] h-6 px-2 rounded-md whitespace-nowrap"
              title="Reset points"
            >
              <RotateCcw className="w-2.5 h-2.5 mr-1" />
              Reset
            </Button>
          )}

          <Button
            size="xs"
            variant="ghost"
            onClick={onCancel}
            disabled={isOptimizing}
            className="text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 text-[9.5px] h-6 w-6 p-0 rounded-md"
            title="Cancel (Esc)"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
});

