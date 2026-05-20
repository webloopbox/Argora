import { Handle, Position } from "@xyflow/react";
import type { NodeProps } from "@xyflow/react";
import { Bot, ThumbsDown, ThumbsUp } from "lucide-react";
import { ArgumentSide } from "@brainstorm/core";
import type { ArgumentNodeData } from "./useDebateGraph";
import { VoteControls } from "./VoteControls";
import { ui } from "../../../texts/ui";

interface ArgumentNodeProps extends NodeProps {
  data: ArgumentNodeData;
}

// One renderer parameterized by side keeps node markup consistent and
// avoids cargo-culting two near-identical files. ProNode / AgainstNode
// are tiny wrappers below so React Flow's nodeTypes map stays readable.
function ArgumentNodeBase({ data, selected }: ArgumentNodeProps) {
  const { argument } = data;
  const isPro = argument.side === ArgumentSide.Pro;
  const sideAccent = isPro
    ? {
        ring: selected ? "ring-pro-300/60" : "ring-pro-200/40",
        border: selected
          ? "border-pro-400 dark:border-pro-500"
          : "border-pro-200 dark:border-pro-700/50",
        bg: "from-pro-50/80 to-white dark:from-pro-900/30 dark:to-zinc-900",
        badgeBg: "bg-pro-100 dark:bg-pro-900/40",
        badgeText: "text-pro-700 dark:text-pro-300",
        Icon: ThumbsUp,
        sideLabel: ui.sides.pro,
        handleColor: "!bg-pro-400",
      }
    : {
        ring: selected ? "ring-against-300/60" : "ring-against-200/40",
        border: selected
          ? "border-against-400 dark:border-against-500"
          : "border-against-200 dark:border-against-700/50",
        bg: "from-against-50/80 to-white dark:from-against-900/30 dark:to-zinc-900",
        badgeBg: "bg-against-100 dark:bg-against-900/40",
        badgeText: "text-against-700 dark:text-against-300",
        Icon: ThumbsDown,
        sideLabel: ui.sides.against,
        handleColor: "!bg-against-400",
      };
  const Icon = sideAccent.Icon;

  return (
    <div
      tabIndex={0}
      role="article"
      aria-label={`${sideAccent.sideLabel}: ${argument.content}`}
      className={`group relative w-[300px] rounded-2xl border bg-gradient-to-br p-4 shadow-sm backdrop-blur transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 hover:shadow-md ${sideAccent.bg} ${sideAccent.border} ring-1 ${sideAccent.ring}`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className={`!h-2 !w-2 !border-none ${sideAccent.handleColor}`}
      />
      <div className="flex items-center justify-between gap-2 text-xs">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-medium ${sideAccent.badgeBg} ${sideAccent.badgeText}`}
        >
          <Icon size={11} />
          {sideAccent.sideLabel}
        </span>
        {argument.isAiGenerated ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-violet-100/70 px-2 py-0.5 text-[10px] font-medium text-violet-700">
            <Bot size={10} />
            {ui.debates.graph.aiBadge}
          </span>
        ) : null}
      </div>
      <p className="mt-2 line-clamp-5 text-sm leading-snug text-default-900 dark:text-zinc-100">
        {argument.content}
      </p>
      <div className="mt-3 flex items-center justify-between gap-2 text-[11px] text-default-500 dark:text-zinc-400">
        <span className="truncate font-medium text-default-700 dark:text-zinc-300">
          {argument.author.displayName}
        </span>
        <VoteControls argument={argument} />
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className={`!h-2 !w-2 !border-none ${sideAccent.handleColor}`}
      />
    </div>
  );
}

export function ProNode(props: ArgumentNodeProps) {
  return <ArgumentNodeBase {...props} />;
}

export function AgainstNode(props: ArgumentNodeProps) {
  return <ArgumentNodeBase {...props} />;
}
