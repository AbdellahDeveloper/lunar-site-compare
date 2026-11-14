import React from 'react';
import { SlipCase } from '../types';
import { AlertTriangle, CheckCircle, TrendingUp, TrendingDown, ArrowRight, X } from 'lucide-react';

interface SlipTableProps {
  slipCases: SlipCase[];
  scenarioName: string;
  onClose: () => void;
}

export const SlipTable: React.FC<SlipTableProps> = ({
  slipCases,
  scenarioName,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700 bg-space-900 shadow-2xl p-6 flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
              <h2 className="text-lg font-bold text-slate-100 uppercase tracking-wide">
                Schedule Slip Analysis ("What If It Slips?")
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Evaluating launch and landing delay trade-offs for <span className="text-cyan-300 font-semibold">{scenarioName}</span> across lunar synodic and weekly cycles.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-space-800 hover:bg-space-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Why this matters callout */}
        <div className="p-3.5 rounded-xl bg-space-850/80 border border-slate-700/60 text-xs text-slate-300 leading-relaxed">
          <span className="text-amber-400 font-bold uppercase tracking-wider block mb-1">
            Why Slip Analysis is Critical for Lunar South Pole Missions:
          </span>
          A 1-week launch slip (quarter lunar cycle) rotates the Sun position by 90°, frequently plunging polar sites from peak illumination into multi-day freezing shadows. A 29.5-day slip (1 synodic month) preserves the solar phase but introduces libration shifts of up to ±8° in Earth elevation and seasonal subsolar drift.
        </div>

        {/* Delta Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-xs text-left font-mono">
            <thead className="bg-space-850 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Schedule Offset</th>
                <th className="px-3 py-3">Start Date</th>
                <th className="px-3 py-3">Sunlight (Hrs)</th>
                <th className="px-3 py-3">Δ Light</th>
                <th className="px-3 py-3">Earth DTE (Hrs)</th>
                <th className="px-3 py-3">Both-Up Window</th>
                <th className="px-3 py-3">Max Night (Hrs)</th>
                <th className="px-4 py-3">Viability Verdict</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {slipCases.map((sc) => {
                const isNominal = sc.offsetDays === 0;
                return (
                  <tr
                    key={sc.offsetDays}
                    className={`transition-colors ${
                      isNominal
                        ? 'bg-cyan-950/30 hover:bg-cyan-950/50 font-semibold'
                        : 'hover:bg-space-850/50'
                    }`}
                  >
                    <td className="px-4 py-3.5 flex items-center gap-2">
                      {isNominal ? (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold">
                          NOMINAL
                        </span>
                      ) : (
                        <span className="text-slate-300">{sc.label}</span>
                      )}
                    </td>

                    <td className="px-3 py-3.5 text-slate-300">{sc.startDateIso}</td>

                    <td className="px-3 py-3.5 text-solar-gold font-bold">
                      {sc.metrics.sunlightHours.toFixed(1)}h ({sc.metrics.sunlightPercent.toFixed(0)}%)
                    </td>

                    <td className="px-3 py-3.5">
                      {isNominal ? (
                        <span className="text-slate-500">—</span>
                      ) : (
                        <span
                          className={`flex items-center gap-1 font-bold ${
                            sc.deltaSunHours >= 0 ? 'text-emerald-400' : 'text-red-400'
                          }`}
                        >
                          {sc.deltaSunHours >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                          {sc.deltaSunHours > 0 ? '+' : ''}
                          {sc.deltaSunHours.toFixed(1)}h
                        </span>
                      )}
                    </td>

                    <td className="px-3 py-3.5 text-comm-cyan">
                      {sc.metrics.earthVisHours.toFixed(1)}h ({sc.metrics.earthVisPercent.toFixed(0)}%)
                    </td>

                    <td className="px-3 py-3.5 text-emerald-400 font-bold">
                      {sc.metrics.bothUpHours.toFixed(1)}h
                      {!isNominal && (
                        <span className={`text-[10px] ml-1.5 ${sc.deltaBothUpHours >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          ({sc.deltaBothUpHours > 0 ? '+' : ''}{sc.deltaBothUpHours.toFixed(1)}h)
                        </span>
                      )}
                    </td>

                    <td className="px-3 py-3.5 text-slate-400">
                      {sc.metrics.longestDarkHours.toFixed(1)}h
                    </td>

                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                          sc.verdict.tier === 'optimal'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : sc.verdict.tier === 'viable'
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                            : sc.verdict.tier === 'constrained'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-red-500/20 text-red-400 border-red-500/40'
                        }`}
                      >
                        {sc.verdict.title}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Action button */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs transition-colors"
          >
            Close Analysis
          </button>
        </div>
      </div>
    </div>
  );
};

