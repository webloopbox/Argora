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

    const sortedNodes = [...nodes].sort((a, b) =>
      a.id < b.id ? -1 : a.id > b.id ? 1 : 0,
    );
    const sortedEdges = [...edges].sort((a, b) =>
      a.id < b.id ? -1 : a.id > b.id ? 1 : 0,
    );

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
