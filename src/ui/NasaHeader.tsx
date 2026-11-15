import React from 'react';
import {
  UIMode,
} from '../types';
import {
  Sliders,
  BookOpen,
  Eye,
} from 'lucide-react';
import { Button, InfoTooltip } from '@/components/ui';

interface NasaHeaderProps {
  uiMode: UIMode;
  onSetUIMode: (mode: UIMode) => void;
  startDateIso?: string;
  onSetStartDate?: (dateIso: string) => void;
  windowDays?: number;
  onSetWindowDays?: (days: number) => void;
  onOpenLearnTour: () => void;
  onOpenMissionOverview?: () => void;
  onShareUrl?: () => void;
}

export const NasaHeader: React.FC<NasaHeaderProps> = React.memo(({
  uiMode,
  onSetUIMode,
  onOpenLearnTour,
}) => {
  return (
    <header className="z-30 w-full bg-space-950/98 border-b border-slate-700/80 px-4 py-2 shadow-2xl">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* NASA Mission Operations Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="relative w-8 h-8 rounded-full bg-gradient-to-tr from-blue-700 via-cyan-500 to-indigo-600 p-0.5 shadow-lg shadow-cyan-500/25">
            <div className="w-full h-full bg-space-950 rounded-full flex items-center justify-center font-bold text-xs text-cyan-300 font-mono">
              NASA
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-extrabold tracking-tight text-sm text-slate-100 font-mono uppercase">
              SELENE<span className="text-cyan-400">-COMPARE</span>
            </span>
            <InfoTooltip text="Lunar South Pole 3D Solar Illumination, Direct-to-Earth Communication, and Landing Site Feasibility Operations." />
          </div>
        </div>

        {/* View Mode Toggle: Simple vs Detailed using shadcn Button */}
        <div className="flex items-center gap-1 bg-space-900 p-0.5 rounded-lg border border-slate-700/70 text-xs">
          <Button
            size="xs"
            variant={uiMode === 'simple' ? 'nasa' : 'ghost'}
            onClick={() => onSetUIMode('simple')}
            className="gap-1 h-7 text-[11px]"
          >
            <Eye className="w-3 h-3" />
            <span>Simple</span>
          </Button>

          <Button
            size="xs"
            variant={uiMode === 'detailed' ? 'solar' : 'ghost'}
            onClick={() => onSetUIMode('detailed')}
            className="gap-1 h-7 text-[11px]"
          >
            <Sliders className="w-3 h-3" />
            <span>Detailed</span>
          </Button>
        </div>



        {/* Global Header Actions */}
        <div className="flex items-center gap-2">
          {/* Learn Tour Guide Button */}
          <Button
            variant="outline"
            size="xs"
            onClick={onOpenLearnTour}
            title="Science Guide"
            className="gap-1 h-7 text-xs"
          >
            <BookOpen className="w-3 h-3 text-cyan-400" />
            <span>Guide</span>
          </Button>
        </div>
      </div>
    </header>
  );
});
export default NasaHeader;
