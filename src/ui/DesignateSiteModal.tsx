import React, { useState } from 'react';
import {
  MapPin,
  Check,
  X,
  Compass,
  Sparkles,
  Mountain,
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
  Input,
} from '@/components/ui';

export interface DesignateSiteModalProps {
  coords: { lat: number; lon: number };
  initialTarget?: 'A' | 'B';
  onConfirm: (name: string, target: 'A' | 'B') => void;
  onClose: () => void;
}

export const DesignateSiteModal: React.FC<DesignateSiteModalProps> = ({
  coords,
  initialTarget = 'A',
  onConfirm,
  onClose,
}) => {
  const isSouthPole = coords.lat < -75;
  const latStr = `${Math.abs(coords.lat).toFixed(4)}°${coords.lat < 0 ? 'S' : 'N'}`;
  const lonStr = `${Math.abs(coords.lon).toFixed(4)}°${coords.lon >= 0 ? 'E' : 'W'}`;

  const defaultName = `Custom Site [${Math.abs(coords.lat).toFixed(2)}°${coords.lat < 0 ? 'S' : 'N'}, ${Math.abs(coords.lon).toFixed(2)}°${coords.lon >= 0 ? 'E' : 'W'}]`;
  const [siteName, setSiteName] = useState<string>(defaultName);
  const [selectedTarget, setSelectedTarget] = useState<'A' | 'B'>(initialTarget);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const finalName = siteName.trim() || defaultName;
    onConfirm(finalName, selectedTarget);
  };

  const quickNames = [
    'Polar Ridge Peak',
    'PSR Crater Rim',
    'Connecting Plateau',
    'Highland Vista',
    'CLPS Scout Landing',
  ];

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md font-mono select-none bg-space-950 border-slate-800 text-slate-100 shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-sm font-bold tracking-wider uppercase text-slate-100">
                Designate 3D Landing Site
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400">
                Configure your custom coordinates picked directly on the 3D Moon surface.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 mt-2">
          {/* Coordinates Summary Card */}
          <Card className="p-3 bg-space-900/90 border-slate-800 flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Compass className="w-3 h-3 text-cyan-400" />
                SELENOCENTRIC 3D POSITION
              </span>
              <div className="text-sm font-bold text-slate-100 tracking-wide">
                <span className="text-cyan-300">{latStr}</span>
                <span className="text-slate-500 mx-1.5">/</span>
                <span className="text-amber-300">{lonStr}</span>
              </div>
            </div>
            <Badge variant={isSouthPole ? 'optimal' : 'cyan'} className="text-[10px]">
              {isSouthPole ? 'SOUTH POLE' : 'EQUATORIAL'}
            </Badge>
          </Card>

          {/* Target Assignment Selector: A or B */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">
              ASSIGN AS TARGET LOCATION
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSelectedTarget('A')}
                className={`p-2.5 rounded-xl border flex flex-col items-start gap-1 transition-all ${
                  selectedTarget === 'A'
                    ? 'bg-cyan-950/40 border-cyan-400 shadow-md ring-1 ring-cyan-400'
                    : 'bg-space-900/60 border-slate-800 hover:border-slate-700 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block shadow-sm" />
                    SITE A
                  </span>
                  {selectedTarget === 'A' && (
                    <span className="p-0.5 rounded-full bg-cyan-500 text-space-950">
                      <Check className="w-2.5 h-2.5" />
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 text-left">
                  Primary Mission Target
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedTarget('B')}
                className={`p-2.5 rounded-xl border flex flex-col items-start gap-1 transition-all ${
                  selectedTarget === 'B'
                    ? 'bg-amber-950/40 border-amber-400 shadow-md ring-1 ring-amber-400'
                    : 'bg-space-900/60 border-slate-800 hover:border-slate-700 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block shadow-sm" />
                    SITE B
                  </span>
                  {selectedTarget === 'B' && (
                    <span className="p-0.5 rounded-full bg-amber-500 text-space-950">
                      <Check className="w-2.5 h-2.5" />
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 text-left">
                  Secondary Comparison Target
                </span>
              </button>
            </div>
          </div>

          {/* Site Name Input */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">
              TARGET NAME
            </span>
            <Input
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              placeholder="Enter site name..."
              className="text-xs"
              autoFocus
            />

            {/* Quick Name Presets */}
            <div className="flex flex-wrap gap-1 mt-1">
              {quickNames.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setSiteName(name)}
                  className="px-2 py-0.5 rounded text-[9px] bg-space-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-cyan-300 transition-colors"
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="gap-1.5 text-xs text-slate-400 hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </Button>

            <Button
              type="submit"
              variant={selectedTarget === 'A' ? 'nasa' : 'solar'}
              size="sm"
              className="gap-1.5 text-xs font-bold"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Assign to Site {selectedTarget}</span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

