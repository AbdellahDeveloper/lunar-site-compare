import React, { useState } from 'react';
import {
  ComparisonViewMode,
  ScientificLayer,
  UIMode,
} from '../types';
import {
  Compass,
  Calendar,
  Layers,
  Sparkles,
  Share2,
  Check,
  Split,
  Maximize2,
  Sliders,
  BookOpen,
  Eye,
  Clock,
} from 'lucide-react';

interface NasaHeaderProps {
  uiMode: UIMode;
  onSetUIMode: (mode: UIMode) => void;
  viewMode: ComparisonViewMode;
  onSetViewMode: (mode: ComparisonViewMode) => void;
  scientificLayer: ScientificLayer;
  onSetScientificLayer: (layer: ScientificLayer) => void;
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
  scientificLayer,
  onSetScientificLayer,
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
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-950/80 border border-blue-500/50 text-cyan-300 font-bold uppercase tracking-wider">
                CLPS & ARTEMIS
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              Lunar South Pole 3D Illumination & Communication Operations
            </div>
          </div>
        </div>

        {/* View Mode Toggle: Simple vs Detailed */}
        <div className="flex items-center gap-1 bg-space-900 p-1 rounded-xl border border-slate-700/70 text-xs">
          <button
            onClick={() => onSetUIMode('simple')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
              uiMode === 'simple'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-bold shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Simple View</span>
          </button>

          <button
            onClick={() => onSetUIMode('detailed')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
              uiMode === 'detailed'
                ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-black font-bold shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Detailed View</span>
          </button>
        </div>

        {/* 3D Comparison Mode: Overlapped vs Split Screen */}
        <div className="flex items-center gap-1 bg-space-900 p-1 rounded-xl border border-slate-700/70 text-xs font-mono">
          <span className="text-slate-500 text-[10px] px-2 uppercase">3D Compare:</span>
          <button
            onClick={() => onSetViewMode('overlapped')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
              viewMode === 'overlapped'
                ? 'bg-space-700 text-cyan-300 border border-cyan-500/50'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Overlapped View
          </button>

          <button
            onClick={() => onSetViewMode('split')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
              viewMode === 'split'
                ? 'bg-space-700 text-amber-300 border border-amber-500/50'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Split className="w-3 h-3" />
            <span>Split Screen (Dual Moons)</span>
          </button>
        </div>

        {/* Scientific Exploration Layer Toggles */}
        <div className="hidden lg:flex items-center gap-1 bg-space-900 p-1 rounded-xl border border-slate-700/70 text-xs font-mono">
          <span className="text-slate-500 text-[10px] px-2 uppercase">Layer:</span>
          <button
            onClick={() => onSetScientificLayer('none')}
            className={`px-2 py-1 rounded-md text-[10px] transition-colors ${
              scientificLayer === 'none'
                ? 'bg-space-800 text-slate-100 font-bold border border-slate-600'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Regolith
          </button>
          <button
            onClick={() => onSetScientificLayer('volatiles')}
            className={`px-2 py-1 rounded-md text-[10px] transition-colors ${
              scientificLayer === 'volatiles'
                ? 'bg-teal-950 text-teal-300 border border-teal-500/60 font-bold'
                : 'text-slate-400 hover:text-teal-300'
            }`}
          >
            🧊 Volatiles / Ice
          </button>
          <button
            onClick={() => onSetScientificLayer('thermal')}
            className={`px-2 py-1 rounded-md text-[10px] transition-colors ${
              scientificLayer === 'thermal'
                ? 'bg-pink-950 text-pink-300 border border-pink-500/60 font-bold'
                : 'text-slate-400 hover:text-pink-300'
            }`}
          >
            🪨 Rock Hazard
          </button>
          <button
            onClick={() => onSetScientificLayer('shadow')}
            className={`px-2 py-1 rounded-md text-[10px] transition-colors ${
              scientificLayer === 'shadow'
                ? 'bg-amber-950 text-amber-300 border border-amber-500/60 font-bold'
                : 'text-slate-400 hover:text-amber-300'
            }`}
          >
            🌑 Shadow Density
          </button>
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
            <span className="text-slate-600">|</span>
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

          {/* Learn Tour Button */}
          <button
            onClick={onOpenLearnTour}
            title="Science & Engineering Guide"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-space-850 hover:bg-space-800 border border-slate-700 text-slate-300 hover:text-white text-xs transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Guide</span>
          </button>

          {/* Share Button */}
          <button
            onClick={handleShare}
            title="Share Mission Configuration Link"
            className="p-1.5 rounded-lg bg-space-850 hover:bg-space-800 border border-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            {copiedShare ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Share2 className="w-4 h-4 text-cyan-400" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
