import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { GitMerge, Layers, ThumbsDown, ThumbsUp, X } from "lucide-react";
import { Button } from "@heroui/react";
import type { ArgumentDto } from "@brainstorm/core";
import { ArgumentSide } from "@brainstorm/core";
import { castVote } from "../../../api/votes.api";
import { ui } from "../../../texts/ui";
import { useDebateGraphContext } from "./debate-graph-context";

interface MergeOrNuanceDialogProps {
  original: ArgumentDto;
  newContent: string;
  onMerged: () => void;
  onNuance: () => void;
  onClose: () => void;
}

export function MergeOrNuanceDialog({
  original,
  newContent,
  onMerged,
  onNuance,
  onClose,
}: MergeOrNuanceDialogProps) {
  const { onArgumentUpdated } = useDebateGraphContext();
  const [merging, setMerging] = useState(false);

  async function handleMerge() {
    setMerging(true);
    try {
      const updated = await castVote(original.id, 1);
      onArgumentUpdated(updated);
      onMerged();
    } catch {
      // Vote may already exist (idempotent re-merge) — still close the
      // dialog so the user isn't stuck.
      onMerged();
    } finally {
      setMerging(false);
    }
  }

  const isPro = original.side === ArgumentSide.Pro;
  const SideIcon = isPro ? ThumbsUp : ThumbsDown;
  const sideColor = isPro ? "text-pro-700" : "text-against-700";
  const sideBg = isPro ? "bg-pro-50 border-pro-200" : "bg-against-50 border-against-200";

  return (
    <AnimatePresence>
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ type: "spring", stiffness: 340, damping: 30 }}
          className="w-full max-w-lg overflow-hidden rounded-3xl border border-default-100 bg-white shadow-2xl shadow-violet-500/15"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="merge-dialog-title"
        >
          <div className="flex items-start justify-between gap-3 border-b border-default-100 px-5 py-4">
            <div>
              <h2
                id="merge-dialog-title"
                className="text-sm font-semibold text-default-900"
              >
                {ui.debates.ai.duplicateTitle}
              </h2>
              <p className="mt-0.5 text-xs text-default-500">
                {ui.debates.ai.duplicateSubtitle}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-full p-1.5 text-default-400 transition-colors hover:bg-default-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
            >
              <X size={15} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 p-5">
            <div className="flex flex-col gap-1.5">
              <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-default-500">
                <SideIcon size={10} className={sideColor} />
                {ui.debates.ai.duplicateOriginalLabel}
              </span>
              <div
                className={`flex-1 rounded-2xl border p-3 text-xs leading-snug text-default-800 ${sideBg}`}
              >
                {original.content}
              </div>
              <span className="text-[10px] text-default-400">
                {original.author.displayName} · {original.weight}{" "}
                {ui.debates.graph.weightAriaLabel}
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-default-500">
                {ui.debates.ai.duplicateNewLabel}
              </span>
              <div className="flex-1 rounded-2xl border border-default-200 bg-default-50 p-3 text-xs leading-snug text-default-800">
                {newContent}
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-default-100 px-5 py-4 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              size="md"
              onPress={onClose}
              isDisabled={merging}
            >
              {ui.common.cancel}
            </Button>
            <Button
              variant="outline"
              size="md"
              onPress={() => void handleMerge()}
              isDisabled={merging}
              className="gap-2 border-violet-200 text-violet-700 hover:bg-violet-50"
            >
              <GitMerge size={14} />
              {merging ? ui.debates.ai.duplicateMerging : ui.debates.ai.duplicateMerge}
            </Button>
            <Button
              variant="primary"
              size="md"
              onPress={onNuance}
              isDisabled={merging}
              className="gap-2"
            >
              <Layers size={14} />
              {ui.debates.ai.duplicateNuance}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
