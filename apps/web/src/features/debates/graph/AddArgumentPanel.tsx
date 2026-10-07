import { useEffect } from "react";
import { Button } from "@heroui/react";
import { AnimatePresence, motion } from "framer-motion";
import { Lock, MessageCircle, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { ArgumentDto } from "@argora/core";
import { ArgumentSide } from "@argora/core";
import { useMediaQuery } from "../../../hooks/useMediaQuery";
import { AddArgumentForm } from "./AddArgumentForm";
import { ui } from "../../../texts/ui";

interface AddArgumentPanelProps {
  debateId: string;
  isAuthenticated: boolean;
  parent: ArgumentDto | null;
  defaultSide?: ArgumentSide;
  onClearParent: () => void;
  onCreated: (created: ArgumentDto) => void;
  isOpen: boolean;
  onClose: () => void;
}

// Floating drawer overlay: slides in from the right on desktop, from the
// bottom on mobile. The graph beneath stays interactive only when the
// drawer is closed; while open we trap pointer focus via the backdrop.
//
// One drawer, not one per breakpoint: the sheet differs by the axis it enters
// on, which CSS cannot express, so the axis is read from a media query. Two
// conditionally-hidden copies would mount two independent forms, each with its
// own draft text, its own AI toggle and its own observers.
export function AddArgumentPanel({
  debateId,
  isAuthenticated,
  parent,
  defaultSide,
  onClearParent,
  onCreated,
  isOpen,
  onClose,
}: AddArgumentPanelProps) {
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  // Scroll-lock the underlying page while the drawer is open so swipes on
  // mobile don't scroll the body underneath the sheet.
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  return (
    <>
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
            onClick={onClose}
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen ? (
          <motion.aside
            key="drawer"
            role="dialog"
            aria-label={ui.debates.argumentForm.panelTitle}
            initial={isDesktop ? { x: "100%" } : { y: "100%" }}
            animate={isDesktop ? { x: 0 } : { y: 0 }}
            exit={isDesktop ? { x: "100%" } : { y: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            className={
              isDesktop
                ? "fixed right-4 top-20 z-50 h-[calc(100dvh-6rem)] w-[400px] overflow-hidden rounded-3xl border border-default-100 bg-white/95 shadow-2xl shadow-violet-500/10 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/95"
                : "fixed inset-x-0 bottom-0 z-50 max-h-[88dvh] overflow-hidden rounded-t-3xl border border-default-100 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
            }
          >
            <PanelBody
              debateId={debateId}
              isAuthenticated={isAuthenticated}
              parent={parent}
              defaultSide={defaultSide}
              onClearParent={onClearParent}
              onCreated={(created) => {
                onCreated(created);
                onClose();
              }}
              onClose={onClose}
            />
          </motion.aside>
        ) : null}
      </AnimatePresence>
    </>
  );
}

interface PanelBodyProps {
  debateId: string;
  isAuthenticated: boolean;
  parent: ArgumentDto | null;
  defaultSide?: ArgumentSide;
  onClearParent: () => void;
  onCreated: (created: ArgumentDto) => void;
  onClose: () => void;
}

function PanelBody({
  debateId,
  isAuthenticated,
  parent,
  defaultSide,
  onClearParent,
  onCreated,
  onClose,
}: PanelBodyProps) {
  const navigate = useNavigate();
  return (
    <div className="flex h-full flex-col">
      <header className="flex items-start justify-between gap-3 border-b border-default-100 px-5 py-4 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-violet-700 dark:text-violet-300">
            <MessageCircle size={12} />
            <span>{ui.debates.argumentForm.panelTitle}</span>
          </div>
          <p className="mt-1 text-xs text-default-500 dark:text-zinc-400">
            {ui.debates.argumentForm.panelSubtitle}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={ui.debates.argumentForm.cancel}
          className="rounded-full p-1.5 text-default-500 transition-colors hover:bg-default-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          <X size={16} />
        </button>
      </header>
      <div className="flex-1 overflow-y-auto px-5 py-5">
        {isAuthenticated ? (
          <AddArgumentForm
            debateId={debateId}
            parent={parent}
            defaultSide={defaultSide}
            onClearParent={onClearParent}
            onCreated={onCreated}
            onCancel={onClose}
          />
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-default-200 bg-white/60 px-4 py-8 text-center">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-500/15 to-fuchsia-500/15 text-violet-700">
              <Lock size={16} />
            </span>
            <p className="text-sm text-default-600">
              {ui.debates.argumentForm.requiresLogin}
            </p>
            <Button
              size="md"
              variant="primary"
              onPress={() => navigate("/logowanie")}
            >
              {ui.debates.argumentForm.signIn}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
