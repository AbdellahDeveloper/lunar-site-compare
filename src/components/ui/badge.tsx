import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold transition-colors focus:outline-none focus:ring-1 focus:ring-cyan-400 font-mono select-none",
  {
    variants: {
      variant: {
        default:
          "border border-transparent bg-space-800 text-slate-200 hover:bg-space-700",
        secondary:
          "border border-slate-700 bg-space-900 text-slate-400",
        destructive:
          "border border-rose-500/50 bg-rose-950/60 text-rose-300",
        outline:
          "border border-slate-700 text-slate-300",
        optimal:
          "border border-emerald-500/50 bg-emerald-950/60 text-emerald-300",
        viable:
          "border border-cyan-500/50 bg-cyan-950/60 text-cyan-300",
        constrained:
          "border border-amber-500/50 bg-amber-950/60 text-amber-300",
        critical:
          "border border-rose-500/50 bg-rose-950/60 text-rose-300",
        cyan:
          "border border-cyan-500/40 bg-cyan-950/60 text-cyan-300",
        amber:
          "border border-amber-500/40 bg-amber-950/60 text-amber-300",
        emerald:
          "border border-emerald-500/40 bg-emerald-950/60 text-emerald-300",
        purple:
          "border border-purple-500/40 bg-purple-950/60 text-purple-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
