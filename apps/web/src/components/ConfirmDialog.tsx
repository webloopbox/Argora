import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Loader2, X } from "lucide-react";
import { Button } from "@heroui/react";
import { ui } from "../texts/ui";

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  isPending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = ui.common.confirm,
  cancelLabel = ui.common.cancel,
  isDestructive = true,
  isPending = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]"
          onClick={isPending ? undefined : onCancel}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: "spring", stiffness: 340, damping: 30 }}
            className="w-full max-w-sm overflow-hidden rounded-3xl border border-default-100 bg-white shadow-2xl shadow-violet-500/15 dark:border-zinc-800 dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start justify-between gap-3 border-b border-default-100 px-5 py-4 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                {isDestructive && <AlertTriangle className="text-red-500" size={18} />}
                <h2 className="text-base font-semibold text-default-900 dark:text-zinc-100">
                  {title}
                </h2>
              </div>
              <button
                type="button"
                disabled={isPending}
                onClick={onCancel}
                className="shrink-0 rounded-full p-1.5 text-default-400 transition-colors hover:bg-default-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 dark:hover:bg-zinc-800 disabled:opacity-50"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 text-sm text-default-600 dark:text-zinc-400">
              {description}
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-default-100 bg-default-50/50 px-5 py-4 dark:border-zinc-800 dark:bg-zinc-900/50">
              <Button
                variant="outline"
                onPress={onCancel}
                isDisabled={isPending}
              >
                {cancelLabel}
              </Button>
              <Button
                variant={isDestructive ? "danger" : "primary"}
                onPress={onConfirm}
                isDisabled={isPending}
                className="inline-flex items-center gap-1.5"
              >
                {isPending && <Loader2 size={14} className="animate-spin" />}
                {confirmLabel}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
