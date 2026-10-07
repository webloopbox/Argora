import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ThumbsDown, ThumbsUp, X } from "lucide-react";
import { Button } from "@heroui/react";
import { ArgumentSide } from "@argora/core";
import { ui } from "../../../texts/ui";

interface SideMismatchDialogProps {
  selectedSide: ArgumentSide;
  suggestedSide: ArgumentSide;
  argumentContent: string;
  onSwitch: () => void;
  onKeepOriginal: () => void;
  onClose: () => void;
}

export function SideMismatchDialog({
  selectedSide,
  suggestedSide,
  argumentContent,
  onSwitch,
  onKeepOriginal,
  onClose,
}: SideMismatchDialogProps) {
  const SuggestedIcon =
    suggestedSide === ArgumentSide.Pro ? ThumbsUp : ThumbsDown;
  const suggestedColor =
    suggestedSide === ArgumentSide.Pro
      ? "text-pro-700 dark:text-pro-400"
      : "text-against-700 dark:text-against-400";
  const suggestedBg =
    suggestedSide === ArgumentSide.Pro
      ? "bg-pro-50 border-pro-200 dark:bg-pro-900/20 dark:border-pro-800/50"
      : "bg-against-50 border-against-200 dark:bg-against-900/20 dark:border-against-800/50";

  const selectedLabel =
    selectedSide === ArgumentSide.Pro
      ? ui.sides.pro
      : ui.sides.against;
  const suggestedLabel =
    suggestedSide === ArgumentSide.Pro
      ? ui.sides.pro
      : ui.sides.against;

  const switchLabel =
    suggestedSide === ArgumentSide.Pro
      ? ui.debates.ai.sideMismatchSwitchToPro
      : ui.debates.ai.sideMismatchSwitchToAgainst;

  return (
    <AnimatePresence>
      <motion.div
        key="side-mismatch-overlay"
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
          className="w-full max-w-md overflow-hidden rounded-3xl border border-default-100 bg-white dark:bg-zinc-900 shadow-2xl shadow-violet-500/15"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="side-mismatch-dialog-title"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3 border-b border-default-100 px-5 py-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
                <AlertTriangle
                  size={15}
                  className="text-amber-600 dark:text-amber-400"
                />
              </div>
              <div>
                <h2
                  id="side-mismatch-dialog-title"
                  className="text-sm font-semibold text-default-900"
                >
                  {ui.debates.ai.sideMismatchTitle}
                </h2>
                <p className="mt-0.5 text-xs text-default-500">
                  {ui.debates.ai.sideMismatchSubtitle}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-full p-1.5 text-default-400 transition-colors hover:bg-default-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
            >
              <X size={15} />
            </button>
          </div>

          {/* Content */}
          <div className="p-5 space-y-4">
            {/* Argument preview */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-default-500">
                {ui.debates.ai.sideMismatchYourContent}
              </span>
              <div className="rounded-2xl border border-default-200 bg-default-50 dark:border-zinc-700 dark:bg-zinc-800/60 p-3 text-xs leading-snug text-default-800 dark:text-zinc-200">
                {argumentContent}
              </div>
            </div>

            {/* Side comparison */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-default-400">
                  {ui.debates.ai.sideMismatchSelectedLabel}
                </span>
                <div className="flex items-center gap-1.5 rounded-xl border border-default-200 bg-default-50/60 dark:border-zinc-700 dark:bg-zinc-800/40 px-3 py-2 text-xs font-medium text-default-700 dark:text-zinc-300">
                  {selectedSide === ArgumentSide.Pro ? (
                    <ThumbsUp size={11} className="text-pro-600 dark:text-pro-400" />
                  ) : (
                    <ThumbsDown size={11} className="text-against-600 dark:text-against-400" />
                  )}
                  {selectedLabel}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-default-400">
                  {ui.debates.ai.sideMismatchSuggestedLabel}
                </span>
                <div
                  className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold ${suggestedBg} ${suggestedColor}`}
                >
                  <SuggestedIcon size={11} />
                  {suggestedLabel}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 border-t border-default-100 px-5 py-4">
            <Button
              variant="primary"
              size="md"
              onPress={onSwitch}
              className="w-full gap-2"
            >
              <SuggestedIcon size={14} />
              {switchLabel}
            </Button>
            <Button
              variant="outline"
              size="md"
              onPress={onKeepOriginal}
              className="w-full border-default-200 text-default-700 hover:bg-default-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              {ui.debates.ai.sideMismatchKeep}
            </Button>
            <button
              type="button"
              onClick={onClose}
              className="mt-1 text-xs text-default-400 hover:text-default-600 transition-colors"
            >
              {ui.common.cancel}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
