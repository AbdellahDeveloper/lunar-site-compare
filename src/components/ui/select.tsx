import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  icon?: React.ReactNode;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, icon, ...props }, ref) => {
    return (
      <div className="relative inline-flex items-center w-full">
        {icon && <div className="absolute left-3 pointer-events-none text-slate-400">{icon}</div>}
        <select
          ref={ref}
          className={cn(
            "w-full appearance-none rounded-xl border border-slate-700/80 bg-space-900/90 py-2 text-xs text-slate-100 font-mono shadow-sm transition-colors",
            "focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400",
            "disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer",
            icon ? "pl-9 pr-8" : "pl-3 pr-8",
            className
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="absolute right-3 h-3.5 w-3.5 pointer-events-none text-slate-400" />
      </div>
    );
  }
);
Select.displayName = "Select";

export { Select };
