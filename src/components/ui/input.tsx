import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", icon, ...props }, ref) => {
    return (
      <div className="relative inline-flex items-center w-full">
        {icon && (
          <div className="absolute left-3 pointer-events-none text-slate-400">
            {icon}
          </div>
        )}
        <input
          type={type}
          ref={ref}
          className={cn(
            "w-full rounded-xl border border-slate-700/80 bg-space-900/90 py-2 text-xs text-slate-100 font-mono shadow-sm transition-colors",
            "placeholder:text-slate-500",
            "focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400",
            "disabled:cursor-not-allowed disabled:opacity-50",
            icon ? "pl-9 pr-3" : "px-3",
            className
          )}
          {...props}
        />
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };

