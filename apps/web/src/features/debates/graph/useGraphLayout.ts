import { useMemo } from "react";
import type { Edge, Node } from "@xyflow/react";
import dagre from "dagre";
import {
  NODE_HEIGHT,
  NODE_WIDTH,
  THESIS_HEIGHT,
  THESIS_NODE_ID,
  THESIS_WIDTH,
} from "./graph-metrics";
import type { ArgumentNodeData } from "./useDebateGraph";

const RANK_SEP = 90;
const NODE_SEP = 40;

// The thesis node is the only one without an argument payload, so it sorts
// first; every other node sorts by creation time.
function createdAtOf(node: Node): number {
  if (node.id === THESIS_NODE_ID) return 0;
  const data = node.data as ArgumentNodeData | undefined;
  const iso = data?.argument?.createdAt;
  return iso ? new Date(iso).getTime() : 0;
}

function boxOf(node: Node): { width: number; height: number } {
  return node.type === "thesis"
    ? { width: THESIS_WIDTH, height: THESIS_HEIGHT }
    : { width: NODE_WIDTH, height: NODE_HEIGHT };
}

// Pure dagre wrapper. Sort the inputs deterministically before layout so
// two clients with the same data render the same picture - dagre's order
// is stable, but it depends on insertion order.
export function useGraphLayout(
  nodes: Node[],
  edges: Edge[],
): { nodes: Node[]; edges: Edge[] } {
  return useMemo(() => {
    if (nodes.length === 0) {
      return { nodes, edges };
    }

    const nodeTimes = new Map(nodes.map((node) => [node.id, createdAtOf(node)]));
    const byCreation = (a: string, b: string) =>
      (nodeTimes.get(a) ?? 0) - (nodeTimes.get(b) ?? 0);

    const sortedNodes = [...nodes].sort((a, b) => byCreation(a.id, b.id));
    const sortedEdges = [...edges].sort((a, b) => byCreation(a.target, b.target));

    const g = new dagre.graphlib.Graph();
    g.setGraph({
      rankdir: "TB",
      ranksep: RANK_SEP,
      nodesep: NODE_SEP,
      marginx: 16,
      marginy: 16,
    });
    g.setDefaultEdgeLabel(() => ({}));

    for (const node of sortedNodes) {
      g.setNode(node.id, boxOf(node));
    }
    for (const edge of sortedEdges) {
      g.setEdge(edge.source, edge.target);
    }

    dagre.layout(g);

    // Everything is shifted so the thesis sits on x=0, which keeps the root
    // centred no matter how lopsided the pro/against subtrees are.
    const offsetX = g.node(THESIS_NODE_ID)?.x ?? 0;

    const positionedNodes = sortedNodes.map((node) => {
      const laidOut = g.node(node.id);
      const { width, height } = boxOf(node);
      return {
        ...node,
        position: {
          x: laidOut.x - offsetX - width / 2,
          y: laidOut.y - height / 2,
        },
        width,
        height,
      };
    });

    return { nodes: positionedNodes, edges: sortedEdges };
  }, [nodes, edges]);
}
