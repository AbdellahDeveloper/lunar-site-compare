import React from 'react';
import {
  Keyboard,
  Move,
  Rotate3d,
  ZoomIn,
  MousePointer,
  Compass,
  Radio,
  Sun,
  Clock,
  Sparkles,
  Orbit,
  Play,
} from 'lucide-react';
import { DialogContent, DialogHeader, DialogTitle, DialogDescription, Card, Badge, Button } from '@/components/ui';

interface ShortcutsModalProps {
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ onClose }) => {
  return (
    <DialogContent onClose={onClose} className="max-w-md font-mono select-none">
      <DialogHeader>
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Keyboard className="w-4 h-4" />
          </div>
          <DialogTitle className="text-sm font-bold tracking-wider uppercase text-slate-100">
            Navigation & Controls Reference
          </DialogTitle>
        </div>
        <DialogDescription className="text-xs text-slate-400">
          Essential mouse gestures, keyboard shortcuts, and dynamic lighting cues for mission navigation.
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-3 max-h-[70vh] overflow-y-auto pr-1">
        {/* 1. Camera & Viewport Navigation */}
        <Card className="p-3 bg-space-900 border-slate-800 flex flex-col gap-2.5">
          <div className="flex items-center justify-between pb-1 border-b border-slate-800 text-[11px] font-bold text-slate-300 uppercase">
            <div className="flex items-center gap-1.5 text-cyan-400">
              <Compass className="w-3.5 h-3.5" />
              <span>Camera & Flight Gestures</span>
            </div>
            <Badge variant="cyan" className="text-[9px]">3D MOON</Badge>
          </div>

          <div className="flex flex-col gap-2 text-xs">
            {/* Pan Move */}
            <div className="flex items-center justify-between">
              <span className="text-slate-300 flex items-center gap-1.5">
                <Move className="w-3.5 h-3.5 text-cyan-400" />
                <span>Pan Camera</span>
              </span>
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-space-800 border border-slate-700 text-cyan-300 font-bold text-[10px]">
                  Shift
                </kbd>
                <span className="text-slate-500 text-[10px]">+</span>
                <span className="text-slate-300 text-[11px]">Move / Drag</span>
              </div>
            </div>

            {/* Trackball Orbit */}
            <div className="flex items-center justify-between">
              <span className="text-slate-300 flex items-center gap-1.5">
                <Rotate3d className="w-3.5 h-3.5 text-amber-400" />
                <span>360° Orbit</span>
              </span>
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-space-800 border border-slate-700 text-slate-200 text-[10px]">
                  Left Drag
                </kbd>
                <span className="text-slate-500 text-[10px]">(0 Deadzone)</span>
              </div>
            </div>

            {/* Universal Zoom */}
            <div className="flex items-center justify-between">
              <span className="text-slate-300 flex items-center gap-1.5">
                <ZoomIn className="w-3.5 h-3.5 text-emerald-400" />
                <span>Fluid Zoom</span>
              </span>
              <div className="flex items-center gap-1">
                <span className="text-slate-300 text-[11px]">Wheel / 2-Finger /</span>
                <kbd className="px-1 py-0.5 rounded bg-space-800 border border-slate-700 text-slate-200 text-[10px]">
                  +
                </kbd>
                <kbd className="px-1 py-0.5 rounded bg-space-800 border border-slate-700 text-slate-200 text-[10px]">
                  -
                </kbd>
              </div>
            </div>

            {/* Focus Crater */}
            <div className="flex items-center justify-between">
              <span className="text-slate-300 flex items-center gap-1.5">
                <MousePointer className="w-3.5 h-3.5 text-purple-400" />
                <span>Surface Focus</span>
              </span>
              <span className="text-purple-300 font-medium text-[11px]">Double-Click Crater</span>
            </div>

            {/* Focus Moon & Celestial System */}
            <div className="flex items-center justify-between">
              <span className="text-slate-300 flex items-center gap-1.5">
                <Orbit className="w-3.5 h-3.5 text-cyan-400" />
                <span>Moon & System Focus</span>
              </span>
              <span className="text-cyan-300 font-medium text-[11px]">Click Orbit Button</span>
            </div>
          </div>
        </Card>

        {/* 2. Dynamic Surface Lighting Indicators */}
        <Card className="p-3 bg-space-900 border-slate-800 flex flex-col gap-2.5">
          <div className="flex items-center justify-between pb-1 border-b border-slate-800 text-[11px] font-bold text-slate-300 uppercase">
            <div className="flex items-center gap-1.5 text-amber-400">
              <Sun className="w-3.5 h-3.5" />
              <span>Surface Lights & Directional Swaths</span>
            </div>
            <Badge variant="amber" className="text-[9px]">REAL-TIME</Badge>
          </div>

          <div className="flex flex-col gap-2 text-xs">
            <div className="flex items-start gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0 mt-0.5 shadow-sm shadow-amber-400/50" />
              <div className="flex flex-col">
                <span className="text-amber-300 font-bold text-[11px]">Gold Grazing Swath</span>
                <span className="text-[10px] text-slate-400 leading-tight">
                  Directional sunlight footprint oriented along the Sun's azimuth. Disappears in shadow.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shrink-0 mt-0.5 shadow-sm shadow-cyan-400/50" />
              <div className="flex flex-col">
                <span className="text-cyan-300 font-bold text-[11px]">Cyan Line-of-Sight Swath</span>
                <span className="text-[10px] text-slate-400 leading-tight">
                  Direct communication corridor oriented toward Earth. Disappears when occluded.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-white shrink-0 mt-0.5 shadow-sm shadow-white/80" />
              <div className="flex flex-col">
                <span className="text-slate-100 font-bold text-[11px]">Radiant Point Light Beacon</span>
                <span className="text-[10px] text-slate-400 leading-tight">
                  Surface light source shining with white/gold/cyan flare when powered, dimming to grey when dormant.
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* 3. Timeline Scrubber & Actions */}
        <Card className="p-3 bg-space-900 border-slate-800 flex flex-col gap-2 text-xs">
          <div className="flex items-center justify-between pb-1 border-b border-slate-800 text-[11px] font-bold text-slate-300 uppercase">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <Clock className="w-3.5 h-3.5" />
              <span>Timeline Controls</span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 text-[11px]">
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-1.5 text-cyan-300">
                <Play className="w-3.5 h-3.5 text-cyan-400" />
                <span>Play / Pause Simulation:</span>
              </span>
              <kbd className="px-2 py-0.5 rounded bg-space-800 border border-slate-700 text-cyan-300 font-bold text-[10px]">
                Space
              </kbd>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Time Scrubbing:</span>
              <span className="text-slate-200 font-medium">Fluid Slider / Laser Needle</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Playback Speeds:</span>
              <span className="text-slate-200 font-medium">1x, 6x, 24x (1 day/sec), 72x</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Step Simulation:</span>
              <span className="text-slate-200 font-medium">Step -24h / -6h / -1h / +1h / +6h / +24h</span>
            </div>
          </div>
        </Card>

        {/* Close Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onClose}
          className="w-full justify-center border-slate-700 hover:bg-space-800 text-xs text-slate-300 font-mono mt-1"
        >
          Close Reference
        </Button>
      </div>
    </DialogContent>
  );
};
