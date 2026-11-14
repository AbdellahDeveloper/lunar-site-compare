import React, { useState } from 'react';
import { BookOpen, Sun, Radio, Compass, Mountain, Battery, ArrowRight, ArrowLeft } from 'lucide-react';
import { Button, Badge, Card, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui';

interface LearnTourModalProps {
  onClose: () => void;
}

const TOUR_SLIDES = [
  {
    title: '1. The 1.54° Axial Tilt & Grazing Polar Sun',
    subtitle: 'Why the Sun skims perpetually along the horizon',
    icon: Sun,
    color: 'text-solar-gold',
    content: (
      <div className="flex flex-col gap-3 text-xs text-slate-300 leading-relaxed">
        <p>
          Unlike Earth’s 23.4° axial tilt which creates distinct four seasons, the Moon’s rotational axis is tilted only <strong className="text-solar-gold">1.54°</strong> relative to the ecliptic plane.
        </p>
        <Card className="p-3 bg-space-850 border-slate-700/60 font-mono text-[11px] text-slate-200">
          At the lunar equator: Sun rises to 90° zenith overhead every 29.5 days.<br />
          At the South Pole (-85° to -90°): Sun never rises higher than ~1.5° to 3° above the horizon!
        </Card>
        <p>
          Because the Sun stays so low, elevated mountain peaks and crater rims cast immense shadows stretching <strong>50 to 100 kilometers</strong> across the surface. A depression only a few meters deep can be plunged into complete perpetual darkness.
        </p>
      </div>
    ),
  },
  {
    title: '2. Permanently Shadowed Regions (PSRs) & Water Ice',
    subtitle: 'The coldest places in the Solar System',
    icon: Mountain,
    color: 'text-violet-400',
    content: (
      <div className="flex flex-col gap-3 text-xs text-slate-300 leading-relaxed">
        <p>
          Impact craters with steep rims (like Shackleton, Haworth, Shoemaker, and Faustini) shield their deep floors from ever receiving a single ray of sunlight. These are known as <strong className="text-violet-400">Permanently Shadowed Regions (PSRs)</strong>.
        </p>
        <Card className="p-3 bg-space-850 border-slate-700/60 font-mono text-[11px] text-slate-200">
          Temperature in PSRs: 35 Kelvin (-238°C / -396°F) — colder than the surface of Pluto!<br />
          Stability: Volatile molecules are frozen in place for billions of years.
        </Card>
        <p>
          NASA’s LCROSS mission proved that these cold traps contain vast deposits of <strong className="text-cyan-300">water ice (H₂O)</strong>. Future astronauts and rovers (like NASA Artemis and VIPER) plan to prospect and harvest this water for drinking, oxygen, and hydrogen rocket fuel!
        </p>
      </div>
    ),
  },
  {
    title: '3. Peaks of Eternal Light & Vertical Solar Panels',
    subtitle: 'High ridges as solar power sanctuaries',
    icon: Battery,
    color: 'text-emerald-400',
    content: (
      <div className="flex flex-col gap-3 text-xs text-slate-300 leading-relaxed">
        <p>
          While the crater depths are forever black, elevated ridges (such as the Shackleton Connecting Ridge or Malapert Mountain) stand tall enough to catch the skimming Sun across <strong className="text-emerald-400">70% to 90%</strong> of the lunar year.
        </p>
        <Card className="p-3 bg-space-850 border-slate-700/60 font-mono text-[11px] text-slate-200">
          Horizontal deck panel at 1.5° sun: receives sin(1.5°) ≈ 0.026 (only 2.6% of solar flux!).<br />
          Vertical tracking panel: receives cos(1.5°) ≈ 0.9996 (nearly 100% of solar flux!).
        </Card>
        <p>
          This is why modern south pole landers (like Intuitive Machines IM-2, Astrobotic Griffin, and NASA landers) feature tall, vertical solar arrays rather than flat roofs.
        </p>
      </div>
    ),
  },
  {
    title: '4. Earth Libration & Communication Outages',
    subtitle: 'The Moon’s wobble and direct-to-Earth sightlines',
    icon: Radio,
    color: 'text-comm-cyan',
    content: (
      <div className="flex flex-col gap-3 text-xs text-slate-300 leading-relaxed">
        <p>
          The Moon is tidally locked to Earth, showing approximately the same face. However, because its orbit is eccentric and inclined, the Moon undergoes an apparent oscillation called <strong className="text-comm-cyan">Libration</strong>.
        </p>
        <Card className="p-3 bg-space-850 border-slate-700/60 font-mono text-[11px] text-slate-200">
          Libration amplitude: Up to ±8.1° in longitude and ±6.7° in latitude.<br />
          Consequence at the South Pole: Earth hovers right near the horizon and slowly loops over a 27.3-day draconic period.
        </Card>
        <p>
          As Earth dips below high crater rim topography, direct radio communication is completely lost. Landing site planners must carefully calculate whether a site maintains an open Earth window during critical rover traverses.
        </p>
      </div>
    ),
  },
  {
    title: '5. Why Rapid Scenario Comparison Matters',
    subtitle: 'Agile decision making when launch dates slip',
    icon: Compass,
    color: 'text-amber-300',
    content: (
      <div className="flex flex-col gap-3 text-xs text-slate-300 leading-relaxed">
        <p>
          Hardware development delays, weather scrubs, and launch slips are common in spaceflight. But on the Moon's south pole, a <strong className="text-amber-300">1-week delay</strong> rotates the Sun angle by 90°, turning a sunlit plateau into a freezing shadow zone.
        </p>
        <p>
          This application enables mission teams, educators, and the public to instantly compare candidate landing sites side-by-side, evaluate slip sensitivity tables, and find alternative viable dates within seconds.
        </p>
      </div>
    ),
  },
];

export const LearnTourModal: React.FC<LearnTourModalProps> = ({ onClose }) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  const slide = TOUR_SLIDES[currentSlideIndex];
  const Icon = slide.icon;

  const handleNext = () => {
    if (currentSlideIndex < TOUR_SLIDES.length - 1) {
      setCurrentSlideIndex((prev) => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex((prev) => prev - 1);
    }
  };

  return (
    <DialogContent onClose={onClose} className="max-w-2xl">
      <DialogHeader>
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-cyan-400" />
          <DialogTitle>Lunar South Pole Science & Engineering Primer</DialogTitle>
        </div>
        <DialogDescription>
          Learn why lighting and communication constraints at the Moon's south pole dictate mission success.
        </DialogDescription>
      </DialogHeader>

      {/* Slide Navigation Progress */}
      <div className="flex items-center justify-between py-2 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-1.5">
          {TOUR_SLIDES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlideIndex(idx)}
              className={`h-2 rounded-full transition-all ${
                idx === currentSlideIndex
                  ? 'w-6 bg-cyan-400 shadow-sm shadow-cyan-400/50'
                  : 'w-2 bg-slate-700 hover:bg-slate-600'
              }`}
            />
          ))}
        </div>
        <span className="font-mono text-slate-400 text-[11px]">
          Concept {currentSlideIndex + 1} of {TOUR_SLIDES.length}
        </span>
      </div>

      {/* Slide Content Card */}
      <Card className="p-4 bg-space-850/50 border-slate-800 flex flex-col gap-4 min-h-[220px]">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-space-800 border border-slate-700 shrink-0">
            <Icon className={`w-6 h-6 ${slide.color}`} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 font-mono">{slide.title}</h3>
            <p className="text-xs text-slate-400 mt-0.5">{slide.subtitle}</p>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-800">
          {slide.content}
        </div>
      </Card>

      {/* Footer Navigation Buttons */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrev}
          disabled={currentSlideIndex === 0}
          className="gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Previous</span>
        </Button>

        <Button
          variant="nasa"
          size="sm"
          onClick={handleNext}
          className="gap-1.5"
        >
          <span>{currentSlideIndex === TOUR_SLIDES.length - 1 ? 'Finish Primer' : 'Next Concept'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </DialogContent>
  );
};
