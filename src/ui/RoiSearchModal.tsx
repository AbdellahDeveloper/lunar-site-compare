import React from 'react';
import {
  Sparkles,
  Sun,
  Radio,
  BatteryCharging,
  Zap,
  MapPin,
  CheckCircle2,
  X,
  RotateCcw,
  Compass,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Card,
  Badge,
  Button,
} from '@/components/ui';
import { OptimalRoiResult } from '@/engine/roiOptimizer';
import { Site, UIMode } from '@/types';

export interface RoiSearchModalProps {
  result: OptimalRoiResult;
  uiMode?: UIMode;
  onSetLocationA: (site: Site) => void;
  onSetLocationB: (site: Site) => void;
  onRedraw: () => void;
  onClose: () => void;
}

export const RoiSearchModal: React.FC<RoiSearchModalProps> = ({
  result,
  uiMode = 'detailed',
  onSetLocationA,
  onSetLocationB,
  onRedraw,
  onClose,
}) => {
  const isSimple = uiMode === 'simple';
  const {
    bestSite,
    score,
    longestSunHours,
    longestEarthHours,
    sunlightPercent,
    avgPowerFlux,
    avgTrackingFlux,
    evaluatedCandidatesCount,
  } = result;

  // Realistic power flux: on the lunar surface, vertical/tracking arrays receive high incident flux
  const displayFlux = Math.max(avgTrackingFlux || 0, avgPowerFlux || 0);

  const latStr = `${Math.abs(bestSite.lat).toFixed(3)}°${bestSite.lat < 0 ? 'S' : 'N'}`;
  const lonStr = `${Math.abs(bestSite.lon).toFixed(3)}°${bestSite.lon >= 0 ? 'E' : 'W'}`;

  const formatHours = (hours: number) => {
    const days = Math.floor(hours / 24);
    const remHours = Math.round(hours % 24);
    if (days > 0) return `${days}d ${remHours}h (${hours.toFixed(1)}h)`;
    return `${hours.toFixed(1)}h`;
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl font-mono select-none bg-space-950 border-slate-800 text-slate-100 shadow-2xl p-6">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-950/50">
                <Sparkles className="w-5 h-5 text-cyan-300" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  {isSimple ? 'Best Moon Base Discovered!' : 'Optimal Landing Site Discovered'}
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[11px] font-bold">
                    Score: {score}/100
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-400 mt-0.5">
                  {isSimple
                    ? 'Found the top Artemis base candidate inside your selected boundary.'
                    : `Algorithm evaluated ${evaluatedCandidatesCount} interior candidate coordinates within user-drawn ROI.`}
                </DialogDescription>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-100 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </DialogHeader>

        {/* Selected Best Coordinate Header Banner */}
        <div className="mt-4 p-3.5 bg-slate-900/90 border border-cyan-500/30 rounded-xl flex items-center justify-between shadow-inner">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-400/50 flex items-center justify-center text-cyan-300">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-cyan-200">
                {isSimple ? `Base Candidate (${latStr}, ${lonStr})` : bestSite.name}
              </div>
              <div className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                <span>Lat: {latStr}</span>
                <span>•</span>
                <span>Lon: {lonStr}</span>
                <span>•</span>
                <span>Elev: {bestSite.elevKm > 0 ? `+${bestSite.elevKm.toFixed(2)}` : bestSite.elevKm.toFixed(2)} km</span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold">
              Mission Suitability
            </span>
            <span className="text-xs font-bold text-emerald-400">
              {score >= 80 ? 'HIGH FEASIBILITY' : score >= 60 ? 'MODERATE FEASIBILITY' : 'CONSTRAINED'}
            </span>
          </div>
        </div>

        {/* 4 Pillars of Optimization Evaluation */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          {/* 1. Consecutive Sunlight */}
          <Card className="p-3.5 bg-slate-900/60 border-slate-800/80 rounded-xl flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="flex items-center gap-1.5 text-amber-300 font-medium">
                <Sun className="w-4 h-4 text-amber-400" />
                Consecutive Sunlight
              </span>
              <Badge variant="outline" className="text-[10px] bg-amber-950/30 text-amber-400 border-amber-500/30">
                Primary Factor
              </Badge>
            </div>
            <div className="mt-2 text-xl font-bold text-amber-400 font-mono">
              {formatHours(longestSunHours)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Longest continuous daylight window without shadow blockage.
            </div>
          </Card>

          {/* 2. Consecutive Earth Direct Comms */}
          <Card className="p-3.5 bg-slate-900/60 border-slate-800/80 rounded-xl flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="flex items-center gap-1.5 text-cyan-300 font-medium">
                <Radio className="w-4 h-4 text-cyan-400" />
                Consecutive Earth Comms
              </span>
              <Badge variant="outline" className="text-[10px] bg-cyan-950/30 text-cyan-400 border-cyan-500/30">
                Primary Factor
              </Badge>
            </div>
            <div className="mt-2 text-xl font-bold text-cyan-400 font-mono">
              {formatHours(longestEarthHours)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Longest uninterrupted direct-to-Earth (DTE) radio contact.
            </div>
          </Card>

          {/* 3. Sunny / Minimal Shadows */}
          <Card className="p-3.5 bg-slate-900/60 border-slate-800/80 rounded-xl flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="flex items-center gap-1.5 text-emerald-300 font-medium">
                <BatteryCharging className="w-4 h-4 text-emerald-400" />
                Sunny (No Shadow) Ratio
              </span>
              <Badge variant="outline" className="text-[10px] bg-emerald-950/30 text-emerald-400 border-emerald-500/30">
                Power Duty
              </Badge>
            </div>
            <div className="mt-2 text-xl font-bold text-emerald-400 font-mono">
              {sunlightPercent.toFixed(1)}%
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Total fraction of timeline bathed in direct sunlight for solar power.
            </div>
          </Card>

          {/* 4. Average Solar Power Flux */}
          <Card className="p-3.5 bg-slate-900/60 border-slate-800/80 rounded-xl flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="flex items-center gap-1.5 text-yellow-300 font-medium">
                <Zap className="w-4 h-4 text-yellow-400" />
                Avg Solar Flux
              </span>
              <Badge variant="outline" className="text-[10px] bg-yellow-950/30 text-yellow-400 border-yellow-500/30">
                {displayFlux > 0 ? `${((displayFlux / 1361) * 100).toFixed(0)}% Intensity` : '0%'}
              </Badge>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-xl font-bold text-yellow-400 font-mono">
                {displayFlux.toFixed(0)} W/m²
              </span>
              {avgPowerFlux > 0 && avgTrackingFlux > 0 && Math.abs(avgPowerFlux - avgTrackingFlux) > 5 && (
                <span className="text-xs text-slate-400 font-mono">
                  ({avgPowerFlux.toFixed(0)} W/m² flat)
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {isSimple
                ? 'Average solar irradiance available for vertical base power collectors.'
                : 'Average incident irradiance for vertical/tracking solar array across the window.'}
            </div>
          </Card>
        </div>

        {/* Action Buttons: Choose to add as Location A or Location B */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={onRedraw}
            className="text-xs text-slate-300 border-slate-700 hover:bg-slate-800"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            Redraw Region
          </Button>

          <div className="flex items-center gap-3">
            <Button
              size="sm"
              onClick={() => onSetLocationA(bestSite)}
              className="bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs shadow-lg shadow-amber-950/50 ring-1 ring-amber-400/50"
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5 text-amber-200" />
              Use as Location A
            </Button>

            <Button
              size="sm"
              onClick={() => onSetLocationB(bestSite)}
              className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-lg shadow-cyan-950/50 ring-1 ring-cyan-400/50"
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5 text-cyan-200" />
              Use as Location B
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

