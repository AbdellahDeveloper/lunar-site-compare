import React, { useState } from 'react';
import {
  ComparisonViewMode,
  UIMode,
} from '../types';
import {
  Calendar,
  Sparkles,
  Share2,
  Check,
  Split,
  Sliders,
  BookOpen,
  Eye,
} from 'lucide-react';
import { Button, Badge, Separator } from '@/components/ui';

interface NasaHeaderProps {
  uiMode: UIMode;
  onSetUIMode: (mode: UIMode) => void;
  viewMode: ComparisonViewMode;
  onSetViewMode: (mode: ComparisonViewMode) => void;
  startDateIso: string;
  onSetStartDate: (dateIso: string) => void;
  windowDays: number;
  onSetWindowDays: (days: number) => void;
  onOpenLearnTour: () => void;
  onShareUrl: () => void;
}

export const NasaHeader: React.FC<NasaHeaderProps> = ({
  uiMode,
  onSetUIMode,
  viewMode,
  onSetViewMode,
  startDateIso,
  onSetStartDate,
  windowDays,
  onSetWindowDays,
  onOpenLearnTour,
  onShareUrl,
}) => {
  const [copiedShare, setCopiedShare] = useState(false);

  const handleShare = () => {
    onShareUrl();
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2500);
  };

  return (
    <header className="z-30 w-full bg-space-950/95 backdrop-blur-md border-b border-slate-700/80 px-4 py-2.5 shadow-2xl">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* NASA Mission Operations Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9 rounded-full bg-gradient-to-tr from-blue-700 via-cyan-500 to-indigo-600 p-0.5 shadow-lg shadow-cyan-500/25">
            <div className="w-full h-full bg-space-950 rounded-full flex items-center justify-center font-bold text-xs text-cyan-300 font-mono">
              NASA
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-tight text-sm text-slate-100 font-mono uppercase">
                SELENE<span className="text-cyan-400">-COMPARE</span>
              </span>
              <Badge variant="viable">
                CLPS & ARTEMIS
              </Badge>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              Lunar South Pole 3D Illumination & Communication Operations
            </div>
          </div>
        </div>

        {/* View Mode Toggle: Simple vs Detailed using shadcn Button */}
        <div className="flex items-center gap-1 bg-space-900 p-1 rounded-xl border border-slate-700/70 text-xs">
          <Button
            size="sm"
            variant={uiMode === 'simple' ? 'nasa' : 'ghost'}
            onClick={() => onSetUIMode('simple')}
            className="gap-1.5"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Simple View</span>
          </Button>

          <Button
            size="sm"
            variant={uiMode === 'detailed' ? 'solar' : 'ghost'}
            onClick={() => onSetUIMode('detailed')}
            className="gap-1.5"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Detailed View</span>
          </Button>
        </div>

        {/* 3D Comparison Mode: Overlapped vs Split Screen */}
        <div className="flex items-center gap-1 bg-space-900 p-1 rounded-xl border border-slate-700/70 text-xs font-mono">
          <span className="text-slate-500 text-[10px] px-2 uppercase">3D Compare:</span>
          <Button
            size="sm"
            variant={viewMode === 'overlapped' ? 'cyanPill' : 'ghost'}
            onClick={() => onSetViewMode('overlapped')}
          >
            Overlapped
          </Button>

          <Button
            size="sm"
            variant={viewMode === 'split' ? 'amberPill' : 'ghost'}
            onClick={() => onSetViewMode('split')}
            className="gap-1"
          >
            <Split className="w-3 h-3" />
            <span>Split Screen</span>
          </Button>
        </div>

        {/* Global Time Window & Actions */}
        <div className="flex items-center gap-2">
          {/* Epoch Date & Window */}
          <div className="flex items-center gap-2 bg-space-900 px-3 py-1 rounded-xl border border-slate-700/70 text-xs font-mono">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            <input
              type="date"
              value={startDateIso}
              onChange={(e) => onSetStartDate(e.target.value)}
              className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
            />
            <Separator orientation="vertical" className="h-4 bg-slate-700" />
            <select
              value={windowDays}
              onChange={(e) => onSetWindowDays(Number(e.target.value))}
              className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
            >
              <option value={7}>7d</option>
              <option value={14}>14d</option>
              <option value={28}>28d (1mo)</option>
              <option value={45}>45d</option>
              <option value={90}>90d (Qtr)</option>
            </select>
          </div>

          {/* Learn Tour Guide Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenLearnTour}
            title="Science & Engineering Guide"
            className="gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Guide</span>
          </Button>

          {/* Share Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={handleShare}
            title="Share Mission Configuration Link"
          >
            {copiedShare ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Share2 className="w-4 h-4 text-cyan-400" />
            )}
          </Button>
        </div>
      </div>
    </header>
  );
};
