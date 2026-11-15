import * as React from "react";
import { GripVertical, GripHorizontal } from "lucide-react";
import * as ResizablePrimitive from "react-resizable-panels";
import { cn } from "@/lib/utils";

interface ResizablePanelGroupProps
  extends Omit<React.ComponentProps<typeof ResizablePrimitive.Group>, "orientation"> {
  direction?: "horizontal" | "vertical";
  orientation?: "horizontal" | "vertical";
}

const ResizablePanelGroup = ({
  className,
  direction = "horizontal",
  orientation,
  ...props
}: ResizablePanelGroupProps) => (
  <ResizablePrimitive.Group
    orientation={orientation || direction}
    className={cn(
      "flex h-full w-full data-[panel-group-direction=vertical]:flex-col",
      className
    )}
    {...props}
  />
);

const ResizablePanel = ResizablePrimitive.Panel;

const ResizableHandle = ({
  withHandle = true,
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.Separator> & {
  withHandle?: boolean;
}) => (
  <ResizablePrimitive.Separator
    className={cn(
      "relative flex items-center justify-center bg-space-950 hover:bg-cyan-500/20 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400 z-20 group",
      // Horizontal group separator (vertical separator bar)
      "w-2 data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:h-2",
      "cursor-col-resize data-[panel-group-direction=vertical]:cursor-row-resize",
      "border-x border-slate-800 data-[panel-group-direction=vertical]:border-x-0 data-[panel-group-direction=vertical]:border-y",
      "after:absolute after:inset-y-0 after:left-1/2 after:w-2.5 after:-translate-x-1/2 data-[panel-group-direction=vertical]:after:inset-x-0 data-[panel-group-direction=vertical]:after:top-1/2 data-[panel-group-direction=vertical]:after:h-2.5 data-[panel-group-direction=vertical]:after:-translate-y-1/2 data-[panel-group-direction=vertical]:after:translate-x-0",
      className
    )}
    {...props}
  >
    {withHandle && (
      <div className="z-10 flex h-7 w-3.5 data-[panel-group-direction=vertical]:h-3.5 data-[panel-group-direction=vertical]:w-7 items-center justify-center rounded border border-slate-700 bg-space-900 group-hover:border-cyan-400 group-hover:bg-cyan-950/80 transition-colors shadow-md">
        <GripVertical className="h-3.5 w-3.5 text-slate-400 group-hover:text-cyan-300 group-data-[panel-group-direction=vertical]:hidden" />
        <GripHorizontal className="h-3.5 w-3.5 text-slate-400 group-hover:text-cyan-300 hidden group-data-[panel-group-direction=vertical]:block" />
      </div>
    )}
  </ResizablePrimitive.Separator>
);

export {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
};
export { usePanelRef } from "react-resizable-panels";
export type { PanelImperativeHandle } from "react-resizable-panels";
