import React from 'react';
import { ScenarioConfig, ScenarioEvaluation } from '../types';
import { Award, Zap, Radio, Clock, ShieldCheck, ChevronRight } from 'lucide-react';

interface ComparisonSummaryProps {
  scenarios: ScenarioConfig[];
  evaluations: Record<string, ScenarioEvaluation>;
}

export const ComparisonSummary: React.FC<ComparisonSummaryProps> = ({
  scenarios,
  evaluations,
}) => {
  if (scenarios.length < 2) return null;

  // Find winners for key criteria
  let maxSunHours = -1;
  let maxSunScenarioId = '';

  let maxEarthHours = -1;
  let maxEarthScenarioId = '';

  let maxBothUpHours = -1;
  let maxBothUpScenarioId = '';

  let minDarkHours = 999999;
  let minDarkScenarioId = '';

  for (const sc of scenarios) {
    const ev = evaluations[sc.id];
    if (!ev) continue;

    if (ev.metrics.sunlightHours > maxSunHours) {
      maxSunHours = ev.metrics.sunlightHours;
      maxSunScenarioId = sc.id;
    }
    if (ev.metrics.earthVisHours > maxEarthHours) {
      maxEarthHours = ev.metrics.earthVisHours;
      maxEarthScenarioId = sc.id;
    }
    if (ev.metrics.bothUpHours > maxBothUpHours) {
      maxBothUpHours = ev.metrics.bothUpHours;
      maxBothUpScenarioId = sc.id;
    }
    if (ev.metrics.longestDarkHours < minDarkHours) {
      minDarkHours = ev.metrics.longestDarkHours;
      minDarkScenarioId = sc.id;
    }
  }

  return (
    <div className="w-full rounded-2xl border border-slate-700/80 bg-space-900/90 shadow-2xl p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-400" />
          <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
            Side-by-Side Scenario Decision Matrix
          </h2>
        </div>
        <span className="text-xs font-mono text-slate-400">
          Comparing {scenarios.length} Scenarios
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-xs text-left font-mono">
          <thead className="bg-space-850 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
            <tr>
              <th className="px-4 py-3">Metric</th>
              {scenarios.map((sc) => (
                <th key={sc.id} className="px-3 py-3 text-slate-200">
                  {sc.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {/* Total Sunlight */}
            <tr className="hover:bg-space-850/40">
              <td className="px-4 py-2.5 font-bold text-slate-300 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-solar-gold" />
                <span>Daylight Duration</span>
              </td>
              {scenarios.map((sc) => {
                const ev = evaluations[sc.id];
                const isWinner = sc.id === maxSunScenarioId;
                return (
                  <td
                    key={sc.id}
                    className={`px-3 py-2.5 ${
                      isWinner ? 'text-solar-gold font-bold bg-amber-500/10' : 'text-slate-300'
                    }`}
                  >
                    {ev?.metrics.sunlightHours.toFixed(1)}h ({ev?.metrics.sunlightPercent.toFixed(1)}%)
                    {isWinner && <span className="ml-1.5 text-[10px] text-amber-400">★ BEST</span>}
                  </td>
                );
              })}
            </tr>

            {/* Earth DTE Window */}
            <tr className="hover:bg-space-850/40">
              <td className="px-4 py-2.5 font-bold text-slate-300 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-comm-cyan" />
                <span>Direct Earth Comm</span>
              </td>
              {scenarios.map((sc) => {
                const ev = evaluations[sc.id];
                const isWinner = sc.id === maxEarthScenarioId;
                return (
                  <td
                    key={sc.id}
                    className={`px-3 py-2.5 ${
                      isWinner ? 'text-comm-cyan font-bold bg-cyan-500/10' : 'text-slate-300'
                    }`}
                  >
                    {ev?.metrics.earthVisHours.toFixed(1)}h ({ev?.metrics.earthVisPercent.toFixed(1)}%)
                    {isWinner && <span className="ml-1.5 text-[10px] text-cyan-400">★ BEST</span>}
                  </td>
                );
              })}
            </tr>

            {/* Both-Up Window */}
            <tr className="hover:bg-space-850/40">
              <td className="px-4 py-2.5 font-bold text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Both-Up (Power + Comm)</span>
              </td>
              {scenarios.map((sc) => {
                const ev = evaluations[sc.id];
                const isWinner = sc.id === maxBothUpScenarioId;
                return (
                  <td
                    key={sc.id}
                    className={`px-3 py-2.5 ${
                      isWinner ? 'text-emerald-400 font-bold bg-emerald-500/10' : 'text-slate-300'
                    }`}
                  >
                    {ev?.metrics.bothUpHours.toFixed(1)}h ({ev?.metrics.bothUpPercent.toFixed(1)}%)
                    {isWinner && <span className="ml-1.5 text-[10px] text-emerald-400">★ BEST</span>}
                  </td>
                );
              })}
            </tr>

            {/* Longest Dark Night */}
            <tr className="hover:bg-space-850/40">
              <td className="px-4 py-2.5 font-bold text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                <span>Longest Dark Period</span>
              </td>
              {scenarios.map((sc) => {
                const ev = evaluations[sc.id];
                const isSafest = sc.id === minDarkScenarioId;
                return (
                  <td
                    key={sc.id}
                    className={`px-3 py-2.5 ${
                      isSafest ? 'text-purple-300 font-bold bg-purple-500/10' : 'text-slate-400'
                    }`}
                  >
                    {ev?.metrics.longestDarkHours.toFixed(1)}h
                    {isSafest && <span className="ml-1.5 text-[10px] text-purple-400">★ SAFEST</span>}
                  </td>
                );
              })}
            </tr>

            {/* Overall Verdict */}
            <tr className="hover:bg-space-850/40">
              <td className="px-4 py-2.5 font-bold text-slate-300">Viability Verdict</td>
              {scenarios.map((sc) => {
                const ev = evaluations[sc.id];
                return (
                  <td key={sc.id} className="px-3 py-2.5">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        ev?.verdict.tier === 'optimal'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : ev?.verdict.tier === 'viable'
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                          : ev?.verdict.tier === 'constrained'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-red-500/20 text-red-400 border-red-500/40'
                      }`}
                    >
                      {ev?.verdict.title}
                    </span>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

