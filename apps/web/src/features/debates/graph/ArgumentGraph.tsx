import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
} from "@xyflow/react";
import type { Edge, Node, NodeMouseHandler, NodeTypes } from "@xyflow/react";
import { AgainstNode, ProNode } from "./ArgumentNode";
import { ThesisNode } from "./ThesisNode";
import { useGraphLayout } from "./useGraphLayout";
import { LassoOverlay } from "./LassoOverlay";
import { useLassoSelection } from "./useLassoSelection";
import { useTheme } from "../../../app-config/theme-context";

interface ArgumentGraphProps {
  nodes: Node[];
  edges: Edge[];
  onArgumentSelect?: (argumentId: string | null) => void;
  selectedArgumentId?: string | null;
  lassoMode?: boolean;
  onLassoComplete?: (argumentIds: string[]) => void;
  hideMiniMap?: boolean;
  focusNodeId?: string | null;
}

// Node types declared module-level - React Flow throws if recreated each render.
const nodeTypes: NodeTypes = {
  thesis: ThesisNode,
  pro: ProNode,
  against: AgainstNode,
};

import { Loader2 } from "lucide-react";

export function ArgumentGraph({
  nodes,
  edges,
  onArgumentSelect,
  selectedArgumentId,
  lassoMode = false,
  onLassoComplete,
  hideMiniMap = false,
  focusNodeId,
}: ArgumentGraphProps) {
  const layout = useGraphLayout(nodes, edges);
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const maskColor =
    theme === "dark" ? "rgba(0,0,0,0.55)" : "rgba(180,180,190,0.5)";

  const [isReady, setIsReady] = useState(false);

  // The lasso hook needs `useReactFlow` / `useViewport`, which require being
  // inside <ReactFlow>. We render a `<LassoBridge>` child to call the hook,
  // then mirror its event handlers to this outer container via local state
  // so the pointer events can be captured on the wrapping div.
  const [handlers, setHandlers] = useState<{
    onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
    onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
    onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => void;
  } | null>(null);
  const [lassoPolygon, setLassoPolygon] = useState<{ x: number; y: number }[]>(
    [],
  );
  const [lassoDrawing, setLassoDrawing] = useState(false);
  const [rfInstance, setRfInstance] = useState<any>(null);

  useEffect(() => {
    if (rfInstance && focusNodeId) {
      // slight delay to let React Flow apply the new nodes and measure them
      setTimeout(() => {
        rfInstance.fitView({
          nodes: [{ id: focusNodeId }],
          duration: 800,
          padding: 0.2,
          maxZoom: 1.2
        });
      }, 50);
    }
  }, [rfInstance, focusNodeId]);

  const decoratedNodes = useMemo(
    () =>
      layout.nodes.map((node) => ({
        ...node,
        selected: node.id === selectedArgumentId,
      })),
    [layout.nodes, selectedArgumentId],
  );

  const handleNodeClick: NodeMouseHandler = (_event, node) => {
    if (lassoMode) return;
    if (node.type === "thesis") {
      onArgumentSelect?.(null);
      return;
    }
    onArgumentSelect?.(node.id);
  };

  const handlePaneClick = () => {
    if (!lassoMode) onArgumentSelect?.(null);
  };

  const handleLassoComplete = useCallback(
    (ids: string[]) => {
      onLassoComplete?.(ids);
    },
    [onLassoComplete],
  );

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full bg-gradient-to-br from-white via-default-50 to-violet-50/30 dark:from-zinc-950 dark:via-zinc-900 dark:to-violet-950/30"
      style={{
        touchAction: lassoMode ? "none" : undefined,
        cursor: lassoMode ? "crosshair" : undefined,
      }}
      onPointerDown={lassoMode ? handlers?.onPointerDown : undefined}
      onPointerMove={lassoMode ? handlers?.onPointerMove : undefined}
      onPointerUp={lassoMode ? handlers?.onPointerUp : undefined}
    >
      {!isReady && (
        <div className="absolute inset-0 z-50 flex items-center justify-center">
          <Loader2
            className="animate-spin text-violet-500 opacity-50"
            size={32}
          />
        </div>
      )}
      <div
        className={`h-full w-full transition-opacity duration-300 ease-out ${
          isReady ? "opacity-100" : "opacity-0"
        }`}
      >
        <ReactFlow
          nodes={decoratedNodes}
          edges={layout.edges}
          nodeTypes={nodeTypes}
          nodesDraggable={false}
          nodesConnectable={false}
          edgesFocusable={false}
          panOnDrag={!lassoMode}
          zoomOnScroll={!lassoMode}
          fitView
          fitViewOptions={{ padding: 0.25, includeHiddenNodes: false }}
          proOptions={{ hideAttribution: true }}
          onInit={(instance) => {
            setRfInstance(instance);
            // React Flow's fitView happens shortly after init when nodes are measured.
            // Giving it a tiny timeout avoids the initial snap flicker.
            setTimeout(() => setIsReady(true), 50);
          }}
          onNodeClick={handleNodeClick}
          onPaneClick={handlePaneClick}
        >
          <LassoBridge
            containerRef={containerRef}
            onHandlersReady={setHandlers}
            onPolygonChange={setLassoPolygon}
            onDrawingChange={setLassoDrawing}
            onComplete={handleLassoComplete}
            lassoMode={lassoMode}
          />

          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color="rgba(99, 102, 241, 0.18)"
          />
          <Controls showInteractive={false} className="rf-controls-themed" />
          {!hideMiniMap ? (
            <MiniMap
              pannable
              zoomable
              nodeBorderRadius={4}
              nodeStrokeWidth={1.5}
              maskColor={maskColor}
              className="rf-minimap-themed !hidden !rounded-xl md:!block"
              nodeColor={(node) => {
                if (node.type === "pro") return "#4ade80";
                if (node.type === "against") return "#f87171";
                return "#a78bfa";
              }}
              nodeStrokeColor={(node) => {
                if (node.type === "pro") return "#16a34a";
                if (node.type === "against") return "#dc2626";
                return "#7c3aed";
              }}
            />
          ) : null}
        </ReactFlow>
      </div>

      {lassoMode ? (
        <LassoOverlay
          lasso={{ drawing: lassoDrawing, polygon: lassoPolygon }}
        />
      ) : null}
    </div>
  );
}

// Lives inside <ReactFlow> so `useLassoSelection` (which calls useReactFlow
// + useViewport) finds the store. Mirrors the hook's handlers and current
// polygon back to the outer ArgumentGraph via the props callbacks.
function LassoBridge({
  containerRef,
  onHandlersReady,
  onPolygonChange,
  onDrawingChange,
  onComplete,
  lassoMode,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>;
  onHandlersReady: (handlers: {
    onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
    onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
    onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => void;
  }) => void;
  onPolygonChange: (polygon: { x: number; y: number }[]) => void;
  onDrawingChange: (drawing: boolean) => void;
  onComplete: (ids: string[]) => void;
  lassoMode: boolean;
}) {
  const lasso = useLassoSelection(containerRef, onComplete);

  // Forward stable handlers + reactive polygon state to the parent.
  useStableHandlers({
    onPointerDown: lasso.onPointerDown,
    onPointerMove: lasso.onPointerMove,
    onPointerUp: lasso.onPointerUp,
    onHandlersReady,
  });

  // Mirror polygon + drawing flag so the overlay (rendered outside ReactFlow)
  // can read them without subscribing to the hook itself.
  useMirror(lasso.lasso.polygon, onPolygonChange);
  useMirror(lasso.lasso.drawing, onDrawingChange);

  // Reset polygon when leaving lasso mode.
  useResetOnExit(lassoMode, lasso.reset);

  return null;
}

function useStableHandlers(args: {
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => void;
  onHandlersReady: (h: {
    onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
    onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
    onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => void;
  }) => void;
}) {
  const { onPointerDown, onPointerMove, onPointerUp, onHandlersReady } = args;
  // Run once per mount - handlers are stable via the hook's useCallback.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useMemoOnce(() => {
    onHandlersReady({ onPointerDown, onPointerMove, onPointerUp });
  });
}

function useMemoOnce(fn: () => void) {
  const ranRef = useRef(false);
  if (!ranRef.current) {
    ranRef.current = true;
    fn();
  }
}

function useMirror<T>(value: T, setter: (next: T) => void) {
  // Forward each value change to the consumer.
  const prevRef = useRef<T>(value);
  if (!Object.is(prevRef.current, value)) {
    prevRef.current = value;
    setter(value);
  }
}

function useResetOnExit(active: boolean, reset: () => void) {
  const prev = useRef(active);
  if (prev.current && !active) reset();
  prev.current = active;
}
