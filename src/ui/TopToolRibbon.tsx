import React, { useRef } from 'react';
import {
  Layers,
  Activity,
  Compass,
  Eye,
  Rocket,
  Camera,
  Search,
  MapPin,
  Sun,
  Radio,
  Mountain,
  Globe,
  ShieldAlert,
  Award,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Crosshair,
} from 'lucide-react';
import { Button, Card, Badge, Tooltip } from '@/components/ui';

export interface RibbonTool {
  id: string;
  label: string;
  icon: React.ElementType;
  targetPanel: 'left' | 'right' | 'modal' | 'viewport';
  targetDescription: string;
  category: 'GIS & Mapping' | 'Telemetry & Analysis' | 'Mission Planning';
  badgeText?: string;
}

export const RIBBON_TOOLS: RibbonTool[] = [
  {
    id: 'layer-management',
    label: 'Layer Management',
    icon: Layers,
    targetPanel: 'left',
    targetDescription: 'Basemaps, LROC WAC mosaic, LOLA topography, Diviner rockiness & volatile cold traps',
    category: 'GIS & Mapping',
    badgeText: 'Layers',
  },
  {
    id: 'measurements',
    label: 'Measurements',
    icon: Radio,
    targetPanel: 'right',
    targetDescription: 'Instantaneous solar power flux (W/m²), direct-to-Earth link margin (dB) & geodesic arc',
    category: 'Telemetry & Analysis',
    badgeText: 'Telemetry',
  },
  {
    id: 'coordinates',
    label: 'Coordinates',
    icon: Compass,
    targetPanel: 'left',
    targetDescription: 'Selenocentric lat/lon, polar stereographic projection, distance and azimuth bearing',
    category: 'GIS & Mapping',
    badgeText: 'Coords',
  },
  {
    id: 'terrain-profile',
    label: 'Terrain Profile [h(t)]',
    icon: Activity,
    targetPanel: 'right',
    targetDescription: 'LOLA topographic horizon mask H(α), Sun & Earth elevation curves h(t), and solar clearance C(t)',
    category: 'Telemetry & Analysis',
    badgeText: 'H(α) & C(t)',
  },
  {
    id: 'sight-lines',
    label: 'Sight Lines',
    icon: Eye,
    targetPanel: 'right',
    targetDescription: 'Toggle direct 3D line-of-sight rays to Sun and Earth, orbital trails, and line-of-sight status',
    category: 'Telemetry & Analysis',
    badgeText: '3D Rays',
  },
  {
    id: 'landing-sites',
    label: 'Landing Sites',
    icon: Rocket,
    targetPanel: 'left',
    targetDescription: 'Artemis III official 9 candidate regions, dual-location switcher, slope & hazards',
    category: 'Mission Planning',
    badgeText: 'Artemis III',
  },
  {
    id: 'places-of-interest',
    label: 'Places of Interest',
    icon: Camera,
    targetPanel: 'right',
    targetDescription: '3D viewpoints: South Pole Nadir, Site Recon, Orbital Vista, and auto-turntable',
    category: 'GIS & Mapping',
    badgeText: '3D Camera',
  },
  {
    id: 'search-lunar',
    label: 'Pick 3D Location',
    icon: Crosshair,
    targetPanel: 'viewport',
    targetDescription: 'Click directly on the 3D Moon surface to designate a custom landing target for Site A or B',
    category: 'Mission Planning',
    badgeText: '3D Picker',
  },
  {
    id: 'placemarks',
    label: 'Placemarks',
    icon: MapPin,
    targetPanel: 'left',
    targetDescription: 'Surface bases directory: Artemis III, Nova-C IM-1/2, Griffin, Chandrayaan-3, Chang\'e-4',
    category: 'GIS & Mapping',
    badgeText: 'Pushpins',
  },
  {
    id: 'moon-shading',
    label: 'Moon Shading',
    icon: Sun,
    targetPanel: 'right',
    targetDescription: 'Solar illumination timeline, grazing angle analysis, shadow duration, and terminator line',
    category: 'Telemetry & Analysis',
    badgeText: 'Sunlight',
  },
  {
    id: 'viewshed',
    label: 'Viewshed Analysis',
    icon: Mountain,
    targetPanel: 'right',
    targetDescription: '360° cylindrical local horizon panorama with Solar & Earth tracking trajectories',
    category: 'Telemetry & Analysis',
    badgeText: '360° Horiz',
  },
  {
    id: 'graticule',
    label: 'Graticule',
    icon: Globe,
    targetPanel: 'viewport',
    targetDescription: 'Toggle polar coordinate grid rings (-90° to -50°S) and meridian radials on the 3D Moon',
    category: 'GIS & Mapping',
    badgeText: 'Polar Grid',
  },
  {
    id: 'monte-carlo',
    label: 'Monte Carlo Risk',
    icon: ShieldAlert,
    targetPanel: 'right',
    targetDescription: 'Stochastic 120-run landing dispersion, slope probability, and PSR hazard reliability',
    category: 'Mission Planning',
    badgeText: 'Risk Analysis',
  },
  {
    id: 'hls-overview',
    label: 'HLS Flight Overview',
    icon: Award,
    targetPanel: 'modal',
    targetDescription: 'Artemis III Human Landing System constraint verification & multi-criteria scorecard',
    category: 'Mission Planning',
    badgeText: 'NASA Scorecard',
  },
];

interface TopToolRibbonProps {
  activeTool: string;
  onSelectTool: (toolId: string) => void;
  showGraticule?: boolean;
}

export const TopToolRibbon: React.FC<TopToolRibbonProps> = ({
  activeTool,
  onSelectTool,
  showGraticule = true,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -240, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 240, behavior: 'smooth' });
    }
  };

  const getTargetBadgeColor = (panel: RibbonTool['targetPanel']) => {
    switch (panel) {
      case 'left':
        return 'border-cyan-500/40 text-cyan-300 bg-cyan-950/40';
      case 'right':
        return 'border-amber-500/40 text-amber-300 bg-amber-950/40';
      case 'viewport':
        return 'border-emerald-500/40 text-emerald-300 bg-emerald-950/40';
      case 'modal':
        return 'border-purple-500/40 text-purple-300 bg-purple-950/40';
      default:
        return 'border-slate-700 text-slate-300 bg-space-900';
    }
  };

  const getTargetLabel = (panel: RibbonTool['targetPanel']) => {
    switch (panel) {
      case 'left':
        return 'LEFT SIDEBAR';
      case 'right':
        return 'RIGHT SIDEBAR';
      case 'viewport':
        return '3D MOON';
      case 'modal':
        return 'MODAL VIEW';
    }
  };

  return (
    <div className="relative z-20 w-full bg-space-950/95 border-b border-slate-800 shadow-xl backdrop-blur-md px-3 py-1.5 flex items-center gap-1.5 select-none">
      {/* Left Scroll Navigation Button */}
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={scrollLeft}
        className="hidden md:flex h-12 w-6 text-slate-400 hover:text-slate-100 hover:bg-space-900 shrink-0 rounded-md"
        title="Scroll tools left"
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>

      {/* Ribbon Scrollable Container */}
      <div
        ref={scrollContainerRef}
        className="flex-1 flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth py-0.5"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {RIBBON_TOOLS.map((tool) => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.id || (tool.id === 'graticule' && showGraticule);

          return (
            <Tooltip
              key={tool.id}
              side="bottom"
              content={
                <div className="flex flex-col gap-1 max-w-xs">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1">
                    <span className="font-bold text-slate-100 text-xs">{tool.label}</span>
                    <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded border font-mono ${getTargetBadgeColor(tool.targetPanel)}`}>
                      {getTargetLabel(tool.targetPanel)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-snug">
                    {tool.targetDescription}
                  </p>
                  <span className="text-[10px] text-cyan-400 font-mono">
                    Click to activate & focus options in {getTargetLabel(tool.targetPanel).toLowerCase()}
                  </span>
                </div>
              }
            >
              <Card
                onClick={() => onSelectTool(tool.id)}
                className={`flex flex-col items-center justify-between p-2 min-w-[104px] h-[66px] rounded-lg cursor-pointer transition-all duration-200 border text-center group ${
                  isActive
                    ? 'bg-cyan-950/40 border-cyan-500/80 ring-1 ring-cyan-500/50 shadow-md shadow-cyan-950/40 text-cyan-200'
                    : 'bg-space-900/70 border-slate-800/90 text-slate-300 hover:bg-space-850 hover:border-slate-700 hover:text-slate-100'
                }`}
              >
                {/* Tool Icon */}
                <div className="relative flex items-center justify-center">
                  <Icon
                    className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${
                      isActive ? 'text-cyan-400 stroke-[2.2]' : 'text-slate-400 group-hover:text-cyan-300'
                    }`}
                  />
                  {isActive && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-400 ring-2 ring-space-950 animate-pulse" />
                  )}
                </div>

                {/* Tool Title */}
                <div className="flex flex-col items-center">
                  <span
                    className={`text-[10.5px] font-medium leading-tight line-clamp-1 truncate max-w-[94px] ${
                      isActive ? 'font-bold text-cyan-200' : 'text-slate-300 group-hover:text-slate-100'
                    }`}
                  >
                    {tool.label}
                  </span>

                  {/* Micro Target Indicator Pill */}
                  <div className="flex items-center gap-1 mt-0.5">
                    <span
                      className={`text-[8.5px] uppercase font-mono tracking-tight px-1 rounded-sm border ${
                        isActive
                          ? 'border-cyan-400/50 text-cyan-300 bg-cyan-900/60'
                          : 'border-slate-800 text-slate-500 bg-space-950/60 group-hover:text-slate-400'
                      }`}
                    >
                      {tool.badgeText || getTargetLabel(tool.targetPanel).split(' ')[0]}
                    </span>
                  </div>
                </div>
              </Card>
            </Tooltip>
          );
        })}
      </div>

      {/* Right Scroll Navigation Button */}
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={scrollRight}
        className="hidden md:flex h-12 w-6 text-slate-400 hover:text-slate-100 hover:bg-space-900 shrink-0 rounded-md"
        title="Scroll tools right"
      >
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
};

