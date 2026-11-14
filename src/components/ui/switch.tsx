import * as React from "react";
import { cn } from "@/lib/utils";

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  label?: string;
}

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ checked, onCheckedChange, disabled = false, className, label, ...props }, ref) => {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onCheckedChange(!checked)}
        ref={ref}
        className={cn(
          "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400 disabled:cursor-not-allowed disabled:opacity-50",
          checked ? "bg-cyan-500" : "bg-space-800 border-slate-700",
          className
        )}
        {...props}
      >
        <span
          className={cn(
            "pointer-events-none block h-4 w-4 rounded-full bg-slate-100 shadow-lg ring-0 transition-transform",
            checked ? "translate-x-4 bg-black" : "translate-x-0"
          )}
        />
        {label && <span className="sr-only">{label}</span>}
      </button>
    );
  }
);
Switch.displayName = "Switch";

export { Switch };
