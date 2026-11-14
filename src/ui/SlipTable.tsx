import React from 'react';
import { SlipCase } from '../types';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Badge, Card, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui';

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
    <DialogContent onClose={onClose} className="max-w-4xl">
      <DialogHeader>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
          <DialogTitle>Schedule Slip Analysis ("What If It Slips?")</DialogTitle>
        </div>
        <DialogDescription>
          Evaluating launch and landing delay trade-offs for <span className="text-cyan-300 font-semibold">{scenarioName}</span> across lunar synodic and weekly cycles.
        </DialogDescription>
      </DialogHeader>

      {/* Why this matters callout using shadcn Card */}
      <Card className="p-3.5 bg-space-850/80 border-slate-700/60 text-xs text-slate-300 leading-relaxed">
        <span className="text-amber-400 font-bold uppercase tracking-wider block mb-1 font-mono">
          Why Slip Analysis is Critical for Lunar South Pole Missions:
        </span>
        A 1-week launch slip (quarter lunar cycle) rotates the Sun position by 90°, frequently plunging polar sites from peak illumination into multi-day freezing shadows. A 29.5-day slip (1 synodic month) preserves the solar phase but introduces libration shifts of up to ±8° in Earth elevation and seasonal subsolar drift.
      </Card>

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
                      <Badge variant="viable">NOMINAL</Badge>
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
                        <span>{sc.deltaSunHours >= 0 ? `+${sc.deltaSunHours.toFixed(1)}h` : `${sc.deltaSunHours.toFixed(1)}h`}</span>
                      </span>
                    )}
                  </td>

                  <td className="px-3 py-3.5 text-comm-cyan font-bold">
                    {sc.metrics.earthVisHours.toFixed(1)}h ({sc.metrics.earthVisPercent.toFixed(0)}%)
                  </td>

                  <td className="px-3 py-3.5 text-emerald-400 font-bold">
                    {sc.metrics.bothUpHours.toFixed(1)}h
                  </td>

                  <td className="px-3 py-3.5 text-purple-300 font-bold">
                    {sc.metrics.longestDarkHours.toFixed(1)}h
                  </td>

                  <td className="px-4 py-3.5">
                    <Badge
                      variant={
                        sc.verdict.tier === 'optimal'
                          ? 'optimal'
                          : sc.verdict.tier === 'viable'
                          ? 'viable'
                          : sc.verdict.tier === 'constrained'
                          ? 'constrained'
                          : 'critical'
                      }
                    >
                      {sc.verdict.title}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </DialogContent>
  );
};
