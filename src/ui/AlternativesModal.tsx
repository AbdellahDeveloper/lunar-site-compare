import React, { useState } from 'react';
import { AlternativeCandidate } from '../engine/alternatives';
import { Sparkles, Calendar, MapPin, ArrowRight, Sun, Radio, Clock } from 'lucide-react';
import { Button, Badge, Card, CardHeader, CardTitle, CardContent, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui';

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
    <DialogContent onClose={onClose} className="max-w-4xl">
      <DialogHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <DialogTitle>Mission Feasibility & Alternatives Finder</DialogTitle>
        </div>
        <DialogDescription>
          Automated sensitivity scanner searching alternative launch epochs and landing sites for {currentScenarioName} to maximize power and direct-to-Earth contact.
        </DialogDescription>
      </DialogHeader>

      {/* Filter buttons using shadcn Button */}
      <div className="flex items-center gap-2">
        <Button
          variant={filter === 'all' ? 'nasa' : 'secondary'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All Alternatives ({candidates.length})
        </Button>
        <Button
          variant={filter === 'date_shift' ? 'nasa' : 'secondary'}
          size="sm"
          onClick={() => setFilter('date_shift')}
        >
          Date Shift Scenarios
        </Button>
        <Button
          variant={filter === 'nearby_site' ? 'nasa' : 'secondary'}
          size="sm"
          onClick={() => setFilter('nearby_site')}
        >
          Alternative South Pole Sites
        </Button>
      </div>

      {/* Candidate Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filtered.map((cand, idx) => {
          const isTopMatch = idx === 0 && filter === 'all';
          return (
            <Card
              key={`${cand.type}_${cand.label}_${cand.startDateIso}`}
              className={`p-4 transition-all flex flex-col justify-between gap-3 ${
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
                    <span>{cand.label}</span>
                  </span>

                  {isTopMatch && (
                    <Badge variant="optimal">
                      Recommended
                    </Badge>
                  )}
                </div>

                <div className="text-[11px] text-slate-400 font-mono">
                  {cand.siteName} • Launch: {cand.startDateIso}
                </div>

                <p className="text-xs text-slate-300 leading-normal mt-1">
                  {cand.recommendation}
                </p>
              </div>

              {/* Metrics preview using icons */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] font-mono">
                <div className="flex items-center gap-3">
                  <span className="text-solar-gold font-bold flex items-center gap-1">
                    <Sun className="w-3 h-3 text-solar-gold" />
                    <span>{cand.metrics.sunlightPercent.toFixed(0)}%</span>
                  </span>
                  <span className="text-comm-cyan font-bold flex items-center gap-1">
                    <Radio className="w-3 h-3 text-comm-cyan" />
                    <span>{cand.metrics.earthVisPercent.toFixed(0)}%</span>
                  </span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <Clock className="w-3 h-3 text-emerald-400" />
                    <span>{cand.metrics.bothUpHours.toFixed(1)}h</span>
                  </span>
                </div>

                <Button
                  variant="nasa"
                  size="xs"
                  onClick={() => onApplyAlternative(cand)}
                  className="gap-1 font-mono"
                >
                  <span>Apply</span>
                  <ArrowRight className="w-3 h-3" />
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </DialogContent>
  );
};
