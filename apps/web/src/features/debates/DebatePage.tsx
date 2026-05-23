import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@heroui/react";
import { AxiosError } from "axios";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Lasso,
  Lock,
  MessageSquareQuote,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  X,
  Trash2,
  Loader2,
} from "lucide-react";
import type { ArgumentDto, DebateDetailDto } from "@brainstorm/core";
import { ArgumentSide, DebateVisibility } from "@brainstorm/core";
import { toast } from "sonner";
import { fetchDebateDetail, deleteDebate } from "../../api/debates.api";
import { useAuth } from "../../app-config/auth-context";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { ui } from "../../texts/ui";
import { AddArgumentPanel } from "./graph/AddArgumentPanel";
import { ArgumentGraph } from "./graph/ArgumentGraph";
import { DebateGraphContext } from "./graph/debate-graph-context";
import { useDebateGraph } from "./graph/useDebateGraph";
import { SynthesisPanel } from "./graph/SynthesisPanel";

type LoadState =
  | { kind: "loading" }
  | { kind: "ready"; debate: DebateDetailDto }
  | { kind: "not-found" }
  | { kind: "forbidden" }
  | { kind: "error" };

const dateFormatter = new Intl.DateTimeFormat("pl-PL", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

// Wrapper keys the inner component by id so navigating between debates
// remounts the body. That lets the inner useState lazy initializer
// declare "loading" synchronously without setState-in-effect.
export function DebatePage() {
  const params = useParams<{ id: string }>();
  const navigate = useNavigate();
  if (!params.id) {
    return (
      <EmptyView
        title={ui.debates.detail.notFoundTitle}
        body={ui.debates.detail.notFoundBody}
        onBack={() => navigate("/")}
      />
    );
  }
  return <DebatePageBody key={params.id} debateId={params.id} />;
}

function DebatePageBody({ debateId }: { debateId: string }) {
  const navigate = useNavigate();
  const [state, setState] = useState<LoadState>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    fetchDebateDetail(debateId)
      .then((debate) => {
        if (!cancelled) setState({ kind: "ready", debate });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const status =
          err instanceof AxiosError ? err.response?.status : undefined;
        if (status === 404) setState({ kind: "not-found" });
        else if (status === 403) setState({ kind: "forbidden" });
        else setState({ kind: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [debateId]);

  if (state.kind === "loading") {
    return (
      <FullBleedShell>
        <div className="grid h-full place-items-center text-sm text-default-500">
          {ui.debates.detail.loading}
        </div>
      </FullBleedShell>
    );
  }

  if (state.kind === "not-found" || state.kind === "error") {
    return (
      <EmptyView
        title={ui.debates.detail.notFoundTitle}
        body={
          state.kind === "error"
            ? ui.debates.detail.loadFailed
            : ui.debates.detail.notFoundBody
        }
        onBack={() => navigate("/")}
      />
    );
  }

  if (state.kind === "forbidden") {
    return (
      <EmptyView
        title={ui.debates.detail.forbiddenTitle}
        body={ui.debates.detail.forbiddenBody}
        onBack={() => navigate("/")}
      />
    );
  }

  return <DebateReady debate={state.debate} />;
}

function FullBleedShell({ children }: { children: React.ReactNode }) {
  // TopBar is h-16 (4rem). Use dvh for mobile safe area.
  return (
    <div className="relative h-[calc(100dvh-4rem)] w-full overflow-hidden">
      {children}
    </div>
  );
}

function DebateReady({ debate }: { debate: DebateDetailDto }) {
  useDocumentTitle(debate.thesis);
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { state: graphState, upsertArgument, removeArgument } = useDebateGraph(debate);
  const [selectedArgumentId, setSelectedArgumentId] = useState<string | null>(
    null,
  );
  const [defaultSide, setDefaultSide] = useState<ArgumentSide>(ArgumentSide.Pro);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [lassoMode, setLassoMode] = useState(false);
  const [lassoIds, setLassoIds] = useState<string[]>([]);
  const [synthesisPanelOpen, setSynthesisPanelOpen] = useState(false);
  const isOwner = user?.id === debate.author.id;

  const handleDelete = async () => {
    try {
      await deleteDebate(debate.id);
      if (debate.groupId) {
        navigate(`/grupy/${debate.groupId}`);
      } else {
        navigate("/");
      }
    } catch (err) {
      toast.error(ui.debates.detail.deleteFailed);
      throw err;
    }
  };

  const handleLassoComplete = useCallback((ids: string[]) => {
    setLassoIds(ids);
    setLassoMode(false);
    if (ids.length > 0) setSynthesisPanelOpen(true);
  }, []);

  const parentArgument = useMemo<ArgumentDto | null>(() => {
    if (!selectedArgumentId) return null;
    return (
      graphState.arguments.find((a) => a.id === selectedArgumentId) ?? null
    );
  }, [selectedArgumentId, graphState.arguments]);

  function openDrawerWithSide(side: ArgumentSide) {
    setDefaultSide(side);
    setDrawerOpen(true);
  }

  function handleArgumentSelect(id: string | null) {
    setSelectedArgumentId(id);
    if (id && isAuthenticated) {
      setDrawerOpen(true);
    }
  }

  function handleDrawerClose() {
    setDrawerOpen(false);
    setSelectedArgumentId(null);
  }

  // Precompute child counts so each node knows whether it can be deleted
  // (only leaf arguments are deletable per backend invariant).
  const childCountByArgumentId = useMemo(() => {
    const map = new Map<string, number>();
    if (graphState.status !== "ready") return map;
    for (const arg of graphState.arguments) {
      if (arg.parentArgumentId) {
        map.set(
          arg.parentArgumentId,
          (map.get(arg.parentArgumentId) ?? 0) + 1,
        );
      }
    }
    return map;
  }, [graphState]);

  const graphCtx = useMemo(
    () => ({
      isAuthenticated,
      currentUserId: user?.id ?? null,
      childCountByArgumentId,
      onArgumentUpdated: upsertArgument,
      onArgumentDeleted: removeArgument,
      onSignInClick: () => navigate("/logowanie"),
    }),
    [
      isAuthenticated,
      user,
      childCountByArgumentId,
      upsertArgument,
      removeArgument,
      navigate,
    ],
  );

  return (
    <FullBleedShell>
      <DebateGraphContext.Provider value={graphCtx}>
      {graphState.status === "loading" ? (
        <div className="grid h-full place-items-center text-sm text-default-500">
          {ui.debates.detail.graphLoading}
        </div>
      ) : graphState.status === "error" ? (
        <div
          role="alert"
          className="grid h-full place-items-center px-4 text-sm text-red-700"
        >
          {ui.debates.detail.graphLoadFailed}
        </div>
      ) : (
        <ArgumentGraph
          nodes={graphState.nodes}
          edges={graphState.edges}
          selectedArgumentId={selectedArgumentId}
          onArgumentSelect={handleArgumentSelect}
          lassoMode={lassoMode}
          onLassoComplete={handleLassoComplete}
          hideMiniMap={drawerOpen}
        />
      )}

      <FloatingThesisCard
        debate={debate}
        onBack={() => navigate("/")}
        isOwner={isOwner}
        onDelete={handleDelete}
      />

      {isAuthenticated && graphState.status === "ready" ? (
        <FloatingActionToolbar
          onAddPro={() => openDrawerWithSide(ArgumentSide.Pro)}
          onAddAgainst={() => openDrawerWithSide(ArgumentSide.Against)}
          lassoMode={lassoMode}
          onLassoToggle={() => setLassoMode((v) => !v)}
          lassoIds={lassoIds}
          onSynthesizeClick={() => setSynthesisPanelOpen(true)}
        />
      ) : null}

      {!isAuthenticated && graphState.status === "ready" ? (
        <GuestBanner onSignIn={() => navigate("/logowanie")} />
      ) : null}

      {graphState.status === "ready" && graphState.arguments.length === 0 ? (
        <FloatingEmptyHint
          isAuthenticated={isAuthenticated}
          onStart={() => openDrawerWithSide(ArgumentSide.Pro)}
        />
      ) : null}

      <AddArgumentPanel
        debateId={debate.id}
        thesis={debate.thesis}
        isAuthenticated={isAuthenticated}
        parent={parentArgument}
        defaultSide={defaultSide}
        onClearParent={() => setSelectedArgumentId(null)}
        onCreated={(created) => {
          upsertArgument(created);
          setSelectedArgumentId(null);
        }}
        isOpen={drawerOpen}
        onClose={handleDrawerClose}
      />

      <SynthesisPanel
        debateId={debate.id}
        selectedArgumentIds={lassoIds}
        isOpen={synthesisPanelOpen}
        onClose={() => {
          setSynthesisPanelOpen(false);
          setLassoIds([]);
        }}
      />
      </DebateGraphContext.Provider>
    </FullBleedShell>
  );
}

import { ConfirmDialog } from "../../components/ConfirmDialog";

function FloatingThesisCard({
  debate,
  onBack,
  isOwner,
  onDelete,
}: {
  debate: DebateDetailDto;
  onBack: () => void;
  isOwner?: boolean;
  onDelete?: () => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const isPrivate = debate.visibility === DebateVisibility.Private;

  const handleConfirm = async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete();
    } catch {
      setIsDeleting(false);
      setIsConfirmOpen(false);
    }
  };

  const handleDeleteClick = () => {
    if (!onDelete) return;
    setIsConfirmOpen(true);
  };

  return (
    <motion.aside
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="pointer-events-auto absolute left-4 top-4 z-30 w-[min(380px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-default-100 bg-white/90 shadow-xl shadow-violet-500/10 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-900/90"
    >
      <div className="flex items-start gap-2 px-4 pt-3.5">
        <button
          type="button"
          onClick={onBack}
          aria-label={ui.debates.detail.backToFeed}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-default-100/80 text-default-700 transition-colors hover:bg-default-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          <ArrowLeft size={14} />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ${
                isPrivate
                  ? "border border-default-200 bg-default-50 text-default-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                  : "border border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-700/40 dark:bg-violet-900/30 dark:text-violet-300"
              }`}
            >
              {isPrivate ? <Lock size={9} /> : <Sparkles size={9} />}
              {isPrivate
                ? ui.debates.detail.privateBadge
                : ui.debates.detail.publicBadge}
            </span>
            <span className="text-default-400 dark:text-zinc-600">·</span>
            <span className="text-default-500 dark:text-zinc-400">
              {dateFormatter.format(new Date(debate.createdAt))}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {isOwner && (
            <button
              type="button"
              onClick={handleDeleteClick}
              disabled={isDeleting}
              aria-label={ui.debates.detail.deleteAriaLabel}
              className="grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-full text-red-500 transition-colors hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-900/30"
            >
              {isDeleting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Trash2 size={14} />
              )}
            </button>
          )}
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-label={expanded ? "Zwiń" : "Rozwiń"}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-default-500 transition-colors hover:bg-default-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      <h1
        className={`px-4 pt-1 text-sm font-semibold leading-snug tracking-tight text-default-900 dark:text-zinc-100 ${
          expanded ? "" : "line-clamp-2"
        }`}
      >
        {debate.thesis}
      </h1>

      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            key="expanded"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap items-center gap-2 px-4 py-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br from-indigo-500/15 to-fuchsia-500/15 text-[10px] font-semibold text-violet-700 dark:from-indigo-400/20 dark:to-fuchsia-400/20 dark:text-violet-300">
                  {initialsFor(debate.author.displayName)}
                </span>
                <span className="font-medium text-default-700 dark:text-zinc-300">
                  {debate.author.displayName}
                </span>
              </div>
              <span className="text-default-300 dark:text-zinc-600">·</span>
              <span className="inline-flex items-center gap-1 font-medium text-pro-700 dark:text-pro-300">
                <span className="h-1.5 w-1.5 rounded-full bg-pro-500" />
                {debate.proCount}
              </span>
              <span className="inline-flex items-center gap-1 font-medium text-against-700 dark:text-against-300">
                <span className="h-1.5 w-1.5 rounded-full bg-against-500" />
                {debate.againstCount}
              </span>
              <span className="inline-flex items-center gap-1 text-default-500 dark:text-zinc-400">
                <MessageSquareQuote size={11} />
                {debate.argumentCount}
              </span>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
      {!expanded ? <div className="pb-3" /> : null}

      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Usuń dyskusję"
        description={ui.debates.detail.deleteConfirm}
        confirmLabel="Usuń"
        isPending={isDeleting}
        onConfirm={handleConfirm}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </motion.aside>
  );
}

function FloatingActionToolbar({
  onAddPro,
  onAddAgainst,
  lassoMode,
  onLassoToggle,
  lassoIds,
  onSynthesizeClick,
}: {
  onAddPro: () => void;
  onAddAgainst: () => void;
  lassoMode: boolean;
  onLassoToggle: () => void;
  lassoIds: string[];
  onSynthesizeClick: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut", delay: 0.1 }}
      className="pointer-events-auto absolute bottom-6 right-4 z-30 flex flex-col items-end gap-2 sm:bottom-auto sm:top-4"
    >
      <AnimatePresence>
        {lassoIds.length > 0 && !lassoMode ? (
          <motion.button
            type="button"
            onClick={onSynthesizeClick}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.2 }}
            className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-600 px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm backdrop-blur transition-colors hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
          >
            <Sparkles size={11} />
            {ui.debates.ai.synthesizeButton} ({lassoIds.length})
          </motion.button>
        ) : null}
      </AnimatePresence>

      <div className="flex items-center gap-2 rounded-full border border-default-100 bg-white/95 p-1.5 shadow-xl shadow-violet-500/10 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-900/95">
        {!lassoMode ? (
          <>
            <button
              type="button"
              onClick={onAddPro}
              className="inline-flex items-center gap-1.5 rounded-full bg-pro-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-pro-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pro-400"
            >
              <ThumbsUp size={13} />
              <span className="hidden sm:inline">{ui.debates.graph.addPro}</span>
              <span className="sm:hidden">{ui.sides.pro}</span>
            </button>
            <button
              type="button"
              onClick={onAddAgainst}
              className="inline-flex items-center gap-1.5 rounded-full bg-against-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-against-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-against-400"
            >
              <ThumbsDown size={13} />
              <span className="hidden sm:inline">{ui.debates.graph.addAgainst}</span>
              <span className="sm:hidden">{ui.sides.against}</span>
            </button>
          </>
        ) : null}
        <button
          type="button"
          onClick={onLassoToggle}
          className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 ${
            lassoMode
              ? "bg-violet-100 text-violet-700 hover:bg-violet-200 dark:bg-violet-900/40 dark:text-violet-200 dark:hover:bg-violet-900/60"
              : "bg-default-100 text-default-700 hover:bg-default-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          }`}
        >
          {lassoMode ? <X size={13} /> : <Lasso size={13} />}
          <span className="hidden sm:inline">
            {lassoMode ? ui.debates.ai.lassoCancel : ui.debates.ai.lassoToggle}
          </span>
        </button>
      </div>
    </motion.div>
  );
}

function GuestBanner({ onSignIn }: { onSignIn: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut", delay: 0.15 }}
      className="pointer-events-auto absolute left-1/2 top-4 z-20 hidden -translate-x-1/2 items-center gap-2 rounded-full border border-amber-200/80 bg-amber-50/95 px-3 py-1.5 text-xs text-amber-900 shadow-sm backdrop-blur-xl sm:inline-flex"
    >
      <Lock size={11} />
      <span>{ui.debates.argumentForm.requiresLogin}</span>
      <button
        type="button"
        onClick={onSignIn}
        className="ml-1 rounded-full bg-amber-600 px-2.5 py-0.5 text-[11px] font-semibold text-white transition-colors hover:bg-amber-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
      >
        {ui.debates.argumentForm.signIn}
      </button>
    </motion.div>
  );
}

function FloatingEmptyHint({
  isAuthenticated,
  onStart,
}: {
  isAuthenticated: boolean;
  onStart: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, delay: 0.2, ease: "easeOut" }}
      className="pointer-events-auto absolute bottom-24 left-1/2 z-20 w-[min(380px,calc(100vw-2rem))] -translate-x-1/2 rounded-3xl border border-default-100 bg-white/95 px-5 py-4 text-center shadow-xl shadow-violet-500/10 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-900/95"
    >
      <div className="mx-auto grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500/15 to-fuchsia-500/15 text-violet-700">
        <Sparkles size={16} />
      </div>
      <h2 className="mt-2 text-sm font-semibold tracking-tight text-default-900 dark:text-zinc-100">
        {ui.debates.detail.graphEmptyTitle}
      </h2>
      <p className="mt-1 text-xs text-default-500 dark:text-zinc-400">
        {ui.debates.detail.graphEmptyBody}
      </p>
      {isAuthenticated ? (
        <Button
          variant="primary"
          size="sm"
          onPress={onStart}
          className="mt-3"
        >
          <ThumbsUp size={12} />
          {ui.debates.graph.addPro}
        </Button>
      ) : null}
    </motion.div>
  );
}

function initialsFor(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0]!.toUpperCase())
    .slice(0, 2)
    .join("");
}

interface EmptyViewProps {
  title: string;
  body: string;
  onBack: () => void;
}

function EmptyView({ title, body, onBack }: EmptyViewProps) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center px-4 py-20 text-center sm:px-6">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500/15 to-fuchsia-500/15 text-violet-700">
        <Sparkles size={22} />
      </div>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 text-sm text-default-500">{body}</p>
      <Button variant="primary" size="lg" onPress={onBack} className="mt-6">
        {ui.debates.detail.backToFeed}
      </Button>
    </div>
  );
}
