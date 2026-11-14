import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400 disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        default:
          "bg-space-850 hover:bg-space-800 border border-slate-700 text-slate-200 hover:text-white shadow-sm",
        destructive:
          "bg-rose-950/80 hover:bg-rose-900 border border-rose-500/50 text-rose-200 shadow-sm",
        outline:
          "border border-slate-700/80 bg-transparent hover:bg-space-800 text-slate-300 hover:text-white",
        secondary:
          "bg-space-900 hover:bg-space-800 text-slate-300 hover:text-white border border-slate-800",
        ghost:
          "hover:bg-space-800/80 text-slate-400 hover:text-white",
        link:
          "text-cyan-400 underline-offset-4 hover:underline p-0 h-auto",
        nasa:
          "bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-bold shadow-md shadow-cyan-500/25 hover:from-cyan-400 hover:to-blue-500 border border-cyan-400/30",
        solar:
          "bg-gradient-to-r from-amber-400 to-amber-500 text-black font-bold shadow-md shadow-amber-500/25 hover:from-amber-300 hover:to-amber-400 border border-amber-400/30",
        emerald:
          "bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-bold shadow-md shadow-emerald-500/25 hover:from-emerald-400 hover:to-teal-400 border border-emerald-400/30",
        cyanPill:
          "bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/25 font-semibold",
        amberPill:
          "bg-amber-500/15 border border-amber-500/40 text-amber-300 hover:bg-amber-500/25 font-semibold",
        emeraldPill:
          "bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25 font-semibold",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-7 rounded-md px-2.5 text-[11px]",
        lg: "h-10 rounded-lg px-6 text-sm",
        icon: "h-8 w-8 p-0",
        "icon-sm": "h-7 w-7 p-0",
        xs: "h-6 px-2 text-[10px] rounded",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
