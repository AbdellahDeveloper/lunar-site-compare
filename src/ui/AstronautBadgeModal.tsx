import React, { useRef, useState } from 'react';
import {
  Sparkles,
  Download,
  Share2,
  Check,
  X,
  Award,
  Sun,
  Radio,
  ShieldCheck,
  Compass,
  MapPin,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Button,
  Badge,
} from '@/components/ui';
import { Site, ScenarioEvaluation } from '@/types';

export interface AstronautBadgeModalProps {
  site: Site;
  evaluation?: ScenarioEvaluation;
  onClose: () => void;
}

export const AstronautBadgeModal: React.FC<AstronautBadgeModalProps> = ({
  site,
  evaluation,
  onClose,
}) => {
  const badgeCardRef = useRef<HTMLDivElement | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  const latStr = `${Math.abs(site.lat).toFixed(3)}°${site.lat < 0 ? 'S' : 'N'}`;
  const lonStr = `${Math.abs(site.lon).toFixed(3)}°${site.lon >= 0 ? 'E' : 'W'}`;

  const metrics = evaluation?.metrics;
  const sunDays = metrics ? (metrics.longestLightHours / 24).toFixed(1) : '14+';
  const earthPercent = metrics ? metrics.earthVisPercent.toFixed(0) : '100';

  const handleDownloadBadge = async () => {
    if (!badgeCardRef.current) return;
    setIsDownloading(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(badgeCardRef.current, {
        backgroundColor: '#020617',
        scale: 2,
        useCORS: true,
      });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `artemis-base-badge-${site.id || 'moon'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export badge image:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = () => {
    const text = `🚀 I just claimed my Moon Base at ${site.name} (${latStr}, ${lonStr}) on Selene-Compare!`;
    if (navigator.share) {
      navigator.share({
        title: 'My Artemis Lunar Base Badge',
        text,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${text} ${window.location.href}`);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2500);
    }
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg font-mono select-none bg-space-950 border-cyan-500/30 text-slate-100 shadow-2xl p-6">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center text-cyan-400">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-slate-100">
                  Artemis Base Commander Badge
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-400">
                  Official surface outpost designation & astronaut achievement.
                </DialogDescription>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-100 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </DialogHeader>

        {/* The Collectible Badge Card (Captured by html2canvas) */}
        <div
          ref={badgeCardRef}
          className="mt-4 p-5 rounded-2xl bg-gradient-to-b from-space-900 via-space-950 to-slate-950 border-2 border-cyan-500/50 shadow-2xl shadow-cyan-950/60 relative overflow-hidden flex flex-col gap-4 text-center"
        >
          {/* Futuristic Background Accents */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-emerald-400 to-amber-400" />
          <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-cyan-500/10 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-32 h-32 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />

          {/* Badge Insignia Header */}
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-cyan-600 via-slate-900 to-amber-500 p-0.5 shadow-lg shadow-cyan-500/30 flex items-center justify-center mb-2">
              <div className="w-full h-full rounded-full bg-space-950 flex flex-col items-center justify-center border border-cyan-400/40">
                <Award className="w-8 h-8 text-cyan-300" />
              </div>
            </div>
            <span className="text-[10px] tracking-widest text-cyan-400 uppercase font-bold">
              NASA ARTEMIS III LUNAR OUTPOST
            </span>
            <h2 className="text-lg font-extrabold text-white tracking-wide mt-0.5">
              {site.name.toUpperCase()}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-[10px] bg-cyan-950/60 text-cyan-300 border-cyan-500/40">
                <MapPin className="w-3 h-3 mr-1" />
                {latStr}, {lonStr}
              </Badge>
              <Badge variant="outline" className="text-[10px] bg-emerald-950/60 text-emerald-300 border-emerald-500/40">
                Elev: {site.elevKm >= 0 ? `+${site.elevKm.toFixed(1)}` : site.elevKm.toFixed(1)} km
              </Badge>
            </div>
          </div>

          {/* 4 Core Base Stats Grid */}
          <div className="grid grid-cols-2 gap-2 text-left mt-1">
            <div className="p-2.5 rounded-xl bg-space-900/80 border border-slate-800 flex flex-col">
              <span className="text-[10px] text-slate-400 flex items-center gap-1 font-semibold uppercase">
                <Sun className="w-3 h-3 text-solar-gold" />
                Solar Power
              </span>
              <span className="text-sm font-bold text-solar-gold mt-0.5">
                {sunDays} Days Continuous
              </span>
              <span className="text-[9px] text-slate-400">Long daylight window</span>
            </div>

            <div className="p-2.5 rounded-xl bg-space-900/80 border border-slate-800 flex flex-col">
              <span className="text-[10px] text-slate-400 flex items-center gap-1 font-semibold uppercase">
                <Radio className="w-3 h-3 text-cyan-400" />
                Earth Signal
              </span>
              <span className="text-sm font-bold text-cyan-400 mt-0.5">
                {earthPercent}% Active Contact
              </span>
              <span className="text-[9px] text-slate-400">Direct Earth radio view</span>
            </div>

            <div className="p-2.5 rounded-xl bg-space-900/80 border border-slate-800 flex flex-col">
              <span className="text-[10px] text-slate-400 flex items-center gap-1 font-semibold uppercase">
                <Sparkles className="w-3 h-3 text-teal-400" />
                Water Ice Access
              </span>
              <span className="text-sm font-bold text-teal-300 mt-0.5">
                {site.nearestPsrDistanceKm.toFixed(1)} km to Crater
              </span>
              <span className="text-[9px] text-slate-400">
                {site.nearestPsrDistanceKm <= 2.0 ? 'Walkable Rover Range' : 'Extended Transit'}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-space-900/80 border border-slate-800 flex flex-col">
              <span className="text-[10px] text-slate-400 flex items-center gap-1 font-semibold uppercase">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                Landing Safety
              </span>
              <span className="text-sm font-bold text-emerald-400 mt-0.5">
                {site.slopeDeg.toFixed(1)}° Safe Slope
              </span>
              <span className="text-[9px] text-slate-400">HLS Landing Safe (&lt;8°)</span>
            </div>
          </div>

          {/* Commander Rank Footer */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
            <span>OFFICIAL MISSION BADGE</span>
            <span className="text-amber-400 font-bold uppercase tracking-wider">
              COMMANDER STATUS: VERIFIED
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="mt-5 flex items-center justify-between gap-3 pt-3 border-t border-slate-800">
          <Button
            size="sm"
            onClick={handleDownloadBadge}
            disabled={isDownloading}
            className="flex-1 font-bold text-xs bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white shadow-md shadow-cyan-950/50"
          >
            {isDownloading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-1.5" />
                Generating PNG...
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Save Badge Image (PNG)
              </>
            )}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleShare}
            className="text-xs text-slate-300 border-slate-700 hover:bg-slate-800"
          >
            {copiedShare ? (
              <>
                <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                Copied Link!
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 mr-1.5 text-cyan-400" />
                Share
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
