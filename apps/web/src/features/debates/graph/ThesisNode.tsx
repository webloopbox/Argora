import { Handle, Position } from "@xyflow/react";
import type { NodeProps } from "@xyflow/react";
import { MessageSquareQuote, Sparkles } from "lucide-react";
import type { ThesisNodeData } from "./useDebateGraph";
import { ui } from "../../../texts/ui";

export function ThesisNode({
  data,
  selected,
}: NodeProps & { data: ThesisNodeData }) {
  return (
    <div
      tabIndex={0}
      className={`group relative w-[360px] rounded-3xl border bg-white/95 p-5 shadow-lg shadow-violet-500/10 backdrop-blur transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 ${
        selected
          ? "border-violet-400 ring-2 ring-violet-300/50"
          : "border-default-200"
      }`}
    >
      <div className="flex items-center gap-2 text-xs">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-indigo-500/15 to-fuchsia-500/15 px-2.5 py-1 font-medium text-violet-700">
          <Sparkles size={12} />
          {ui.debates.graph.thesisBadge}
        </span>
        <span className="text-default-400">·</span>
        <span className="text-default-500">{data.authorName}</span>
      </div>
      <p className="mt-3 text-base font-semibold leading-snug text-default-900">
        {data.thesis}
      </p>
      <div className="mt-4 flex items-center gap-3 text-xs">
        <span className="inline-flex items-center gap-1.5 font-medium text-pro-700">
          <span className="h-2 w-2 rounded-full bg-pro-500" />
          {ui.sides.pro} · {data.proCount}
        </span>
        <span className="inline-flex items-center gap-1.5 font-medium text-against-700">
          <span className="h-2 w-2 rounded-full bg-against-500" />
          {ui.sides.against} · {data.againstCount}
        </span>
        <span className="inline-flex items-center gap-1.5 text-default-500">
          <MessageSquareQuote size={12} />
          {data.proCount + data.againstCount}
        </span>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-2 !w-2 !border-none !bg-violet-400"
      />
    </div>
  );
}
