import { useMemo } from "react";
import type { Edge, Node } from "@xyflow/react";
import dagre from "dagre";

interface LayoutOptions {
  nodeWidth?: number;
  nodeHeight?: number;
  thesisWidth?: number;
  thesisHeight?: number;
  rankSep?: number;
  nodeSep?: number;
}

const DEFAULTS = {
  nodeWidth: 300,
  nodeHeight: 150,
  thesisWidth: 360,
  thesisHeight: 160,
  rankSep: 90,
  nodeSep: 40,
} as const;

// Pure dagre wrapper. Sort the inputs deterministically before layout so
// two clients with the same data render the same picture - dagre's order
// is stable, but it depends on insertion order.
export function useGraphLayout(
  nodes: Node[],
  edges: Edge[],
  options: LayoutOptions = {},
): { nodes: Node[]; edges: Edge[] } {
  const settings = { ...DEFAULTS, ...options };

  return useMemo(() => {
    if (nodes.length === 0) {
      return { nodes, edges };
    }

    const g = new dagre.graphlib.Graph();
    g.setGraph({
      rankdir: "TB",
      ranksep: settings.rankSep,
      nodesep: settings.nodeSep,
      marginx: 16,
      marginy: 16,
    });
    g.setDefaultEdgeLabel(() => ({}));

    // Create a map to quickly look up node timestamps
    const nodeTimes = new Map<string, number>();
    for (const node of nodes) {
      if (node.id === "thesis") {
        nodeTimes.set(node.id, 0);
      } else {
        nodeTimes.set(node.id, new Date((node.data as any).argument.createdAt).getTime());
      }
    }

    const sortedNodes = [...nodes].sort((a, b) => {
      return (nodeTimes.get(a.id) ?? 0) - (nodeTimes.get(b.id) ?? 0);
    });
    
    // Sort edges by the creation time of their target node so Dagre processes them deterministically
    const sortedEdges = [...edges].sort((a, b) => {
      return (nodeTimes.get(a.target) ?? 0) - (nodeTimes.get(b.target) ?? 0);
    });

    for (const node of sortedNodes) {
      const isThesis = node.type === "thesis";
      g.setNode(node.id, {
        width: isThesis ? settings.thesisWidth : settings.nodeWidth,
        height: isThesis ? settings.thesisHeight : settings.nodeHeight,
      });
    }
    for (const edge of sortedEdges) {
      g.setEdge(edge.source, edge.target);
    }

    dagre.layout(g);

    const positionedNodes = sortedNodes.map((node) => {
      const dn = g.node(node.id);
      const isThesis = node.type === "thesis";
      const width = isThesis ? settings.thesisWidth : settings.nodeWidth;
      const height = isThesis ? settings.thesisHeight : settings.nodeHeight;
      return {
        ...node,
        position: {
          x: dn.x - width / 2,
          y: dn.y - height / 2,
        },
        width,
        height,
      };
    });

    return { nodes: positionedNodes, edges: sortedEdges };
  }, [
    nodes,
    edges,
    settings.nodeWidth,
    settings.nodeHeight,
    settings.thesisWidth,
    settings.thesisHeight,
    settings.rankSep,
    settings.nodeSep,
  ]);
}
