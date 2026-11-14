import * as React from "react";
import { cn } from "@/lib/utils";

interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className, value, onValueChange, min = 0, max = 100, step = 1, disabled, ...props }, ref) => {
    const percentage = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));

    return (
      <div className={cn("relative flex w-full touch-none select-none items-center py-1 group", className)}>
        {/* Background track */}
        <div className="relative h-2 w-full grow overflow-hidden rounded-full bg-space-850 border border-slate-800">
          {/* Active filled range */}
          <div
            className="h-full bg-gradient-to-r from-cyan-600 via-cyan-400 to-blue-500 rounded-full transition-all duration-75"
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Real accessible range input layered invisibly on top */}
        <input
          ref={ref}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          onChange={(e) => onValueChange(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          {...props}
        />

        {/* Visual Thumb */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-slate-100 border-2 border-cyan-400 shadow-md shadow-cyan-500/40 pointer-events-none group-hover:scale-110 transition-transform -translate-x-1/2"
          style={{ left: `${percentage}%` }}
        />
      </div>
    );
  }
);
Slider.displayName = "Slider";

export { Slider };
