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
}: ResizablePanelGroupProps) => {
  const resolvedOrientation = orientation || direction;
  return (
    <ResizablePrimitive.Group
      orientation={resolvedOrientation}
      className={cn(
        "flex h-full w-full",
        resolvedOrientation === "vertical" ? "flex-col" : "flex-row",
        className
      )}
      {...props}
    />
  );
};

const ResizablePanel = ResizablePrimitive.Panel;

const ResizableHandle = ({
  withHandle = true,
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.Separator> & {
  withHandle?: boolean;
}) => {
  const group = ResizablePrimitive.useParentGroup();
  // When parent group orientation is "vertical", panels are stacked vertically (top & bottom).
  // The separator between them is a horizontal bar across the full width.
  const isHorizontalBar = group?.orientation === "vertical";

  return (
    <ResizablePrimitive.Separator
      className={cn(
        "relative flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400 z-20 group",
        isHorizontalBar
          ? "w-full h-1 bg-space-950 border-t border-slate-800/90 hover:border-cyan-500/60 cursor-row-resize after:absolute after:inset-x-0 after:-top-2 after:-bottom-2 after:z-10"
          : "w-1.5 h-full bg-space-950 border-x border-slate-800/90 hover:border-cyan-500/60 cursor-col-resize after:absolute after:inset-y-0 after:-left-2 after:-right-2 after:z-10",
        className
      )}
      {...props}
    >
      {withHandle && (
        <div
          className={cn(
            "z-20 flex items-center justify-center rounded-full border border-slate-700/80 bg-space-900 transition-colors shadow-sm",
            "group-hover:border-cyan-400 group-hover:bg-cyan-950/90",
            isHorizontalBar ? "h-2 w-16" : "w-2 h-14"
          )}
        >
          {isHorizontalBar ? (
            <GripHorizontal className="h-3 w-5 text-slate-400 group-hover:text-cyan-300 transition-colors" />
          ) : (
            <GripVertical className="h-5 w-3 text-slate-400 group-hover:text-cyan-300 transition-colors" />
          )}
        </div>
      )}
    </ResizablePrimitive.Separator>
  );
};

export {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
};
export { usePanelRef } from "react-resizable-panels";
export type { PanelImperativeHandle } from "react-resizable-panels";
