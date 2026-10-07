import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
} from "@xyflow/react";
import type { Edge, Node, NodeMouseHandler, NodeTypes } from "@xyflow/react";
import { Loader2 } from "lucide-react";
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

const MINIMAP_FILL: Record<string, string> = {
  pro: "#4ade80",
  against: "#f87171",
};
const MINIMAP_STROKE: Record<string, string> = {
  pro: "#16a34a",
  against: "#dc2626",
};
const MINIMAP_THESIS_FILL = "#a78bfa";
const MINIMAP_THESIS_STROKE = "#7c3aed";

// The provider is mounted here rather than around <ReactFlow> itself so the
// body below can call `useReactFlow` / `useViewport` directly - the lasso
// needs the live viewport to map screen points onto canvas coordinates.
export function ArgumentGraph(props: ArgumentGraphProps) {
  return (
    <ReactFlowProvider>
      <ArgumentGraphBody {...props} />
    </ReactFlowProvider>
  );
}

function ArgumentGraphBody({
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
  const { fitView } = useReactFlow();
  const maskColor =
    theme === "dark" ? "rgba(0,0,0,0.55)" : "rgba(180,180,190,0.5)";

  const [isReady, setIsReady] = useState(false);

  const handleLassoComplete = useCallback(
    (ids: string[]) => {
      onLassoComplete?.(ids);
    },
    [onLassoComplete],
  );

  const lasso = useLassoSelection(containerRef, handleLassoComplete);

  // Drop a half-drawn polygon when the user leaves lasso mode.
  const { reset: resetLasso } = lasso;
  useEffect(() => {
    if (!lassoMode) resetLasso();
  }, [lassoMode, resetLasso]);

  // Centre a freshly created argument. The short delay lets React Flow apply
  // and measure the new node before the viewport animates to it.
  useEffect(() => {
    if (!focusNodeId) return;
    const timer = setTimeout(() => {
      void fitView({
        nodes: [{ id: focusNodeId }],
        duration: 800,
        padding: 0.2,
        maxZoom: 1.2,
      });
    }, 50);
    return () => clearTimeout(timer);
  }, [focusNodeId, fitView]);

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
    onArgumentSelect?.(node.type === "thesis" ? null : node.id);
  };

  const handlePaneClick = () => {
    if (!lassoMode) onArgumentSelect?.(null);
  };

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full bg-gradient-to-br from-white via-default-50 to-violet-50/30 dark:from-zinc-950 dark:via-zinc-900 dark:to-violet-950/30"
      style={{
        touchAction: lassoMode ? "none" : undefined,
        cursor: lassoMode ? "crosshair" : undefined,
      }}
      onPointerDown={lassoMode ? lasso.onPointerDown : undefined}
      onPointerMove={lassoMode ? lasso.onPointerMove : undefined}
      onPointerUp={lassoMode ? lasso.onPointerUp : undefined}
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
          onInit={() => {
            // React Flow's fitView happens shortly after init when nodes are
            // measured. A tiny timeout avoids the initial snap flicker.
            setTimeout(() => setIsReady(true), 50);
          }}
          onNodeClick={handleNodeClick}
          onPaneClick={handlePaneClick}
        >
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
              nodeColor={(node) =>
                MINIMAP_FILL[node.type ?? ""] ?? MINIMAP_THESIS_FILL
              }
              nodeStrokeColor={(node) =>
                MINIMAP_STROKE[node.type ?? ""] ?? MINIMAP_THESIS_STROKE
              }
            />
          ) : null}
        </ReactFlow>
      </div>

      {lassoMode ? <LassoOverlay lasso={lasso.lasso} /> : null}
    </div>
  );
}
