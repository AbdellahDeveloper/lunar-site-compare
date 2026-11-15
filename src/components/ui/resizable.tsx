import * as React from "react";
import { GripVertical } from "lucide-react";
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
      "relative flex w-2 items-center justify-center bg-space-950 hover:bg-cyan-500/20 transition-colors after:absolute after:inset-y-0 after:left-1/2 after:w-2.5 after:-translate-x-1/2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400 cursor-col-resize z-20 group border-x border-slate-800",
      className
    )}
    {...props}
  >
    {withHandle && (
      <div className="z-10 flex h-7 w-3.5 items-center justify-center rounded border border-slate-700 bg-space-900 group-hover:border-cyan-400 group-hover:bg-cyan-950/80 transition-colors shadow-md">
        <GripVertical className="h-3.5 w-3.5 text-slate-400 group-hover:text-cyan-300" />
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
