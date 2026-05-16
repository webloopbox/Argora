import { useMemo } from "react";
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

interface ArgumentGraphProps {
  nodes: Node[];
  edges: Edge[];
  onArgumentSelect?: (argumentId: string | null) => void;
  selectedArgumentId?: string | null;
}

// Node types and edge types are declared module-level (not inside the
// component) because React Flow throws when they're recreated each render.
const nodeTypes: NodeTypes = {
  thesis: ThesisNode,
  pro: ProNode,
  against: AgainstNode,
};

export function ArgumentGraph({
  nodes,
  edges,
  onArgumentSelect,
  selectedArgumentId,
}: ArgumentGraphProps) {
  const layout = useGraphLayout(nodes, edges);

  const decoratedNodes = useMemo(
    () =>
      layout.nodes.map((node) => ({
        ...node,
        selected: node.id === selectedArgumentId,
      })),
    [layout.nodes, selectedArgumentId],
  );

  const handleNodeClick: NodeMouseHandler = (_event, node) => {
    if (node.type === "thesis") {
      onArgumentSelect?.(null);
      return;
    }
    onArgumentSelect?.(node.id);
  };

  const handlePaneClick = () => onArgumentSelect?.(null);

  return (
    <div className="h-full w-full bg-gradient-to-br from-white via-default-50 to-violet-50/30">
      <ReactFlow
        nodes={decoratedNodes}
        edges={layout.edges}
        nodeTypes={nodeTypes}
        nodesDraggable={false}
        nodesConnectable={false}
        edgesFocusable={false}
        fitView
        fitViewOptions={{ padding: 0.25, includeHiddenNodes: false }}
        proOptions={{ hideAttribution: true }}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="rgba(99, 102, 241, 0.18)"
        />
        <Controls
          showInteractive={false}
          className="!rounded-xl !border !border-default-200 !bg-white/80 !shadow-sm"
        />
        <MiniMap
          pannable
          zoomable
          nodeStrokeWidth={2}
          maskColor="rgba(255,255,255,0.5)"
          className="!hidden !rounded-xl !border !border-default-200 md:!block"
          nodeColor={(node) => {
            if (node.type === "pro") return "var(--color-pro-400)";
            if (node.type === "against") return "var(--color-against-400)";
            return "rgb(167, 139, 250)";
          }}
        />
      </ReactFlow>
    </div>
  );
}
