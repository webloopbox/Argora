import { useCallback, useEffect, useState } from "react";
import type { Edge, Node } from "@xyflow/react";
import type { ArgumentDto, DebateDetailDto } from "@brainstorm/core";
import { ArgumentSide } from "@brainstorm/core";
import { listArgumentsForDebate } from "../../../api/arguments.api";

export type ThesisNodeData = {
  thesis: string;
  authorName: string;
  proCount: number;
  againstCount: number;
};

export type ArgumentNodeData = {
  argument: ArgumentDto;
};

export interface DebateGraphState {
  status: "loading" | "ready" | "error";
  nodes: Node[];
  edges: Edge[];
  arguments: ArgumentDto[];
}

const THESIS_NODE_ID = "thesis";

function buildEdge(sourceId: string, target: ArgumentDto): Edge {
  return {
    id: `${sourceId}->${target.id}`,
    source: sourceId,
    target: target.id,
    type: "smoothstep",
    style: {
      stroke:
        target.side === ArgumentSide.Pro
          ? "var(--color-pro-400)"
          : "var(--color-against-400)",
      strokeWidth: 1.5,
    },
  };
}

function buildGraph(
  debate: DebateDetailDto,
  args: ArgumentDto[],
): { nodes: Node[]; edges: Edge[] } {
  const thesisNode: Node = {
    id: THESIS_NODE_ID,
    type: "thesis",
    position: { x: 0, y: 0 },
    data: {
      thesis: debate.thesis,
      authorName: debate.author.displayName,
      proCount: debate.proCount,
      againstCount: debate.againstCount,
    } satisfies ThesisNodeData,
  };

  const nodes: Node[] = [thesisNode];
  const edges: Edge[] = [];

  for (const arg of args) {
    nodes.push({
      id: arg.id,
      type: arg.side === ArgumentSide.Pro ? "pro" : "against",
      position: { x: 0, y: 0 },
      data: { argument: arg } satisfies ArgumentNodeData,
    });
    const sourceId = arg.parentArgumentId ?? THESIS_NODE_ID;
    edges.push(buildEdge(sourceId, arg));
  }

  return { nodes, edges };
}

export function useDebateGraph(debate: DebateDetailDto): {
  state: DebateGraphState;
  upsertArgument: (next: ArgumentDto) => void;
} {
  const [state, setState] = useState<DebateGraphState>({
    status: "loading",
    nodes: [],
    edges: [],
    arguments: [],
  });

  // .then/.catch keeps setState calls explicitly in async callbacks so the
  // react-hooks/set-state-in-effect rule can see through the indirection.
  useEffect(() => {
    let cancelled = false;
    listArgumentsForDebate(debate.id)
      .then((args) => {
        if (cancelled) return;
        const { nodes, edges } = buildGraph(debate, args);
        setState({ status: "ready", nodes, edges, arguments: args });
      })
      .catch(() => {
        if (cancelled) return;
        setState({
          status: "error",
          nodes: [],
          edges: [],
          arguments: [],
        });
      });
    return () => {
      cancelled = true;
    };
  }, [debate]);

  // Optimistic insert / replace: keeps the graph in sync after a successful
  // POST without paying a round-trip for a fresh GET.
  const upsertArgument = useCallback(
    (next: ArgumentDto) => {
      setState((prev) => {
        if (prev.status !== "ready") return prev;
        const exists = prev.arguments.some((a) => a.id === next.id);
        const merged = exists
          ? prev.arguments.map((a) => (a.id === next.id ? next : a))
          : [...prev.arguments, next];
        const { nodes, edges } = buildGraph(debate, merged);
        return { status: "ready", nodes, edges, arguments: merged };
      });
    },
    [debate],
  );

  return { state, upsertArgument };
}
