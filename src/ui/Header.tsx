import React, { useState } from 'react';
import { AppMode } from '../types';
import {
  Compass,
  Calendar,
  Layers,
  Sparkles,
  Map,
  Share2,
  FileDown,
  BookOpen,
  Plus,
  HelpCircle,
  Clock,
  Check,
} from 'lucide-react';

interface HeaderProps {
  mode: AppMode;
  onSetMode: (mode: AppMode) => void;
  startDateIso: string;
  onSetStartDate: (dateIso: string) => void;
  windowDays: number;
  onSetWindowDays: (days: number) => void;
  onAddScenario: () => void;
  canAddScenario: boolean;
  onOpenSlipTable: () => void;
  onOpenAlternatives: () => void;
  onOpenMapPicker: () => void;
  onOpenLearnTour: () => void;
  onOpenExport: () => void;
  onShareUrl: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  mode,
  onSetMode,
  startDateIso,
  onSetStartDate,
  windowDays,
  onSetWindowDays,
  onAddScenario,
  canAddScenario,
  onOpenSlipTable,
  onOpenAlternatives,
  onOpenMapPicker,
  onOpenLearnTour,
  onOpenExport,
  onShareUrl,
}) => {
  const [copiedShare, setCopiedShare] = useState(false);

  const handleShareClick = () => {
    onShareUrl();
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2500);
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-space-950/90 backdrop-blur-md border-b border-slate-700/80 px-4 py-2.5 shadow-xl">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Branding & Logo */}
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-700 p-0.5 shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full bg-space-950 rounded-[10px] flex items-center justify-center">
              <Compass className="w-5 h-5 text-cyan-400" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-tight text-base text-slate-100 font-mono">
                SELENE<span className="text-cyan-400">-COMPARE</span>
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-semibold uppercase">
                NASA CLPS / ARTEMIS
              </span>
            </div>
            <div className="text-[11px] text-slate-400 hidden sm:block">
              Lunar South Pole Ephemeris & Site Viability System
            </div>
          </div>
        </div>

        {/* Global Window & Date Controls */}
        <div className="flex flex-wrap items-center gap-2 bg-space-900 px-3 py-1.5 rounded-xl border border-slate-700/70 text-xs">
          <div className="flex items-center gap-1.5 font-mono">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">Epoch:</span>
            <input
              type="date"
              value={startDateIso}
              onChange={(e) => onSetStartDate(e.target.value)}
              className="bg-space-950 border border-slate-700 rounded px-2 py-0.5 text-slate-100 text-xs focus:outline-none focus:border-cyan-400 cursor-pointer"
            />
          </div>

          <div className="h-4 w-px bg-slate-700 mx-1 hidden sm:block" />

          <div className="flex items-center gap-1.5 font-mono">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400">Window:</span>
            <select
              value={windowDays}
              onChange={(e) => onSetWindowDays(Number(e.target.value))}
              className="bg-space-950 border border-slate-700 rounded px-2 py-0.5 text-slate-100 text-xs focus:outline-none focus:border-cyan-400 cursor-pointer"
            >
              <option value={7}>7 Days (1 Week)</option>
              <option value={14}>14 Days (Half Synodic)</option>
              <option value={28}>28 Days (~1 Lunar Month)</option>
              <option value={45}>45 Days (Extended Window)</option>
              <option value={90}>90 Days (Quarterly Season)</option>
            </select>
          </div>
        </div>

        {/* Modes & Actions */}
        <div className="flex items-center gap-2">
          {/* Mode Switcher */}
          <div className="flex items-center bg-space-900 p-0.5 rounded-lg border border-slate-700/70 text-xs">
            <button
              onClick={() => onSetMode('planner')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                mode === 'planner'
                  ? 'bg-cyan-500 text-black font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Planner
            </button>
            <button
              onClick={() => onSetMode('explorer')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                mode === 'explorer'
                  ? 'bg-cyan-500 text-black font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Explorer
            </button>
            <button
              onClick={() => {
                onSetMode('learn');
                onOpenLearnTour();
              }}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                mode === 'learn'
                  ? 'bg-cyan-500 text-black font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Learn
            </button>
          </div>

          {/* Map Picker Modal Trigger */}
          <button
            onClick={onOpenMapPicker}
            title="Open Lunar Map Picker"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-space-850 hover:bg-space-700 border border-slate-700 text-slate-200 text-xs font-medium transition-colors"
          >
            <Map className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline">Map Picker</span>
          </button>

          {/* "What If It Slips?" Table Trigger */}
          <button
            onClick={onOpenSlipTable}
            title="Schedule Slip Analysis"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-950/60 hover:bg-amber-900 border border-amber-500/50 text-amber-300 text-xs font-medium transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Slip Analysis</span>
          </button>

          {/* Alternatives Finder Trigger */}
          <button
            onClick={onOpenAlternatives}
            title="Search Launch Date & Site Alternatives"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 text-xs font-medium transition-colors"
          >
            <Compass className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Alternatives</span>
          </button>

          {/* Add Scenario Button */}
          {canAddScenario && (
            <button
              onClick={onAddScenario}
              title="Add Side-by-Side Comparison Scenario"
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-black font-semibold text-xs shadow-md transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Compare</span>
            </button>
          )}

          {/* Export Data */}
          <button
            onClick={onOpenExport}
            title="Export CSV & Telemetry Data"
            className="p-1.5 rounded-lg bg-space-850 hover:bg-space-700 border border-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <FileDown className="w-4 h-4" />
          </button>

          {/* Share URL */}
          <button
            onClick={handleShareClick}
            title="Copy Shareable Scenario Link"
            className="p-1.5 rounded-lg bg-space-850 hover:bg-space-700 border border-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            {copiedShare ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Share2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
