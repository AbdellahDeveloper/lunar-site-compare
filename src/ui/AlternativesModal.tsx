import React, { useState } from 'react';
import { AlternativeCandidate } from '../engine/alternatives';
import { X, Sparkles, Calendar, MapPin, ArrowRight, Award } from 'lucide-react';

interface AlternativesModalProps {
  candidates: AlternativeCandidate[];
  currentScenarioName: string;
  onApplyAlternative: (candidate: AlternativeCandidate) => void;
  onClose: () => void;
}

export const AlternativesModal: React.FC<AlternativesModalProps> = ({
  candidates,
  currentScenarioName,
  onApplyAlternative,
  onClose,
}) => {
  const [filter, setFilter] = useState<'all' | 'date_shift' | 'nearby_site'>('all');

  const filtered = candidates.filter((c) => filter === 'all' || c.type === filter);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700 bg-space-900 shadow-2xl p-6 flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-bold text-slate-100 uppercase tracking-wide">
                Mission Feasibility & Alternatives Finder
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Automated sensitivity scanner searching alternative launch epochs and alternative landing sites to maximize power and direct-to-Earth contact.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-space-850 hover:bg-space-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === 'all'
                ? 'bg-cyan-500 text-black font-semibold'
                : 'bg-space-850 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            All Alternatives ({candidates.length})
          </button>
          <button
            onClick={() => setFilter('date_shift')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === 'date_shift'
                ? 'bg-cyan-500 text-black font-semibold'
                : 'bg-space-850 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Date Shift Scenarios
          </button>
          <button
            onClick={() => setFilter('nearby_site')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === 'nearby_site'
                ? 'bg-cyan-500 text-black font-semibold'
                : 'bg-space-850 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Alternative South Pole Sites
          </button>
        </div>

        {/* Candidate Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filtered.map((cand, idx) => {
            const isTopMatch = idx === 0 && filter === 'all';
            return (
              <div
                key={`${cand.type}_${cand.label}_${cand.startDateIso}`}
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                  isTopMatch
                    ? 'bg-emerald-950/20 border-emerald-500/50 shadow-lg shadow-emerald-950/30'
                    : 'bg-space-850/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-slate-100">
                      {cand.type === 'date_shift' ? (
                        <Calendar className="w-3.5 h-3.5 text-solar-gold" />
                      ) : (
                        <MapPin className="w-3.5 h-3.5 text-comm-cyan" />
                      )}
                      {cand.label}
                    </span>

                    <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-space-950 border border-slate-700 text-amber-300">
                      <Award className="w-3.5 h-3.5 text-amber-400" />
                      Score {cand.score}/100
                    </span>
                  </div>

                  <div className="text-xs text-slate-300">
                    <span className="font-semibold">{cand.siteName}</span>
                    <span className="text-slate-500 text-[11px] ml-1.5">
                      ({cand.lat.toFixed(2)}°, {cand.lon.toFixed(2)}°)
                    </span>
                  </div>

                  <div className="text-[11px] font-mono text-slate-400">
                    Target Start: <span className="text-slate-200">{cand.startDateIso}</span>
                  </div>

                  <p className="text-xs text-slate-300 font-medium mt-1 leading-normal">
                    {cand.recommendation}
                  </p>
                </div>

                {/* Metric Readouts */}
                <div className="grid grid-cols-3 gap-2 py-2 border-t border-slate-800 text-[11px] font-mono">
                  <div className="text-center bg-space-950/50 p-1.5 rounded">
                    <div className="text-slate-500 text-[9px]">SUNLIGHT</div>
                    <div className="text-solar-gold font-bold">
                      {cand.metrics.sunlightPercent.toFixed(0)}%
                    </div>
                  </div>
                  <div className="text-center bg-space-950/50 p-1.5 rounded">
                    <div className="text-slate-500 text-[9px]">EARTH DTE</div>
                    <div className="text-comm-cyan font-bold">
                      {cand.metrics.earthVisPercent.toFixed(0)}%
                    </div>
                  </div>
                  <div className="text-center bg-space-950/50 p-1.5 rounded">
                    <div className="text-slate-500 text-[9px]">BOTH-UP</div>
                    <div className="text-emerald-400 font-bold">
                      {cand.metrics.bothUpHours.toFixed(1)}h
                    </div>
                  </div>
                </div>

                {/* Apply button */}
                <button
                  onClick={() => onApplyAlternative(cand)}
                  className="w-full py-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-black font-semibold text-xs border border-cyan-500/40 hover:border-transparent transition-all flex items-center justify-center gap-1.5"
                >
                  <span>Apply This Scenario</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

