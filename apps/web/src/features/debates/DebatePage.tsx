import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@heroui/react";
import { AxiosError } from "axios";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Lock,
  MessageSquareQuote,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import type { ArgumentDto, DebateDetailDto } from "@brainstorm/core";
import { ArgumentSide, DebateVisibility } from "@brainstorm/core";
import { fetchDebateDetail } from "../../api/debates.api";
import { useAuth } from "../../app-config/auth-context";
import { ui } from "../../texts/ui";
import { AddArgumentPanel } from "./graph/AddArgumentPanel";
import { ArgumentGraph } from "./graph/ArgumentGraph";
import { useDebateGraph } from "./graph/useDebateGraph";

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
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { state: graphState, upsertArgument } = useDebateGraph(debate);
  const [selectedArgumentId, setSelectedArgumentId] = useState<string | null>(
    null,
  );
  const [defaultSide, setDefaultSide] = useState<ArgumentSide>(ArgumentSide.Pro);
  const [drawerOpen, setDrawerOpen] = useState(false);

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

  return (
    <FullBleedShell>
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
        />
      )}

      <FloatingThesisCard debate={debate} onBack={() => navigate("/")} />

      {isAuthenticated && graphState.status === "ready" ? (
        <FloatingActionToolbar
          onAddPro={() => openDrawerWithSide(ArgumentSide.Pro)}
          onAddAgainst={() => openDrawerWithSide(ArgumentSide.Against)}
          parent={parentArgument}
          onClearParent={() => setSelectedArgumentId(null)}
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
    </FullBleedShell>
  );
}

function FloatingThesisCard({
  debate,
  onBack,
}: {
  debate: DebateDetailDto;
  onBack: () => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const isPrivate = debate.visibility === DebateVisibility.Private;

  return (
    <motion.aside
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="pointer-events-auto absolute left-4 top-4 z-30 w-[min(380px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-default-100 bg-white/90 shadow-xl shadow-violet-500/10 backdrop-blur-xl"
    >
      <div className="flex items-start gap-2 px-4 pt-3.5">
        <button
          type="button"
          onClick={onBack}
          aria-label={ui.debates.detail.backToFeed}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-default-100/80 text-default-700 transition-colors hover:bg-default-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
        >
          <ArrowLeft size={14} />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ${
                isPrivate
                  ? "border border-default-200 bg-default-50 text-default-700"
                  : "border border-violet-200 bg-violet-50 text-violet-700"
              }`}
            >
              {isPrivate ? <Lock size={9} /> : <Sparkles size={9} />}
              {isPrivate
                ? ui.debates.detail.privateBadge
                : ui.debates.detail.publicBadge}
            </span>
            <span className="text-default-400">·</span>
            <span className="text-default-500">
              {dateFormatter.format(new Date(debate.createdAt))}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-label={expanded ? "Zwiń" : "Rozwiń"}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-default-500 transition-colors hover:bg-default-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      <h1
        className={`px-4 pt-1 text-sm font-semibold leading-snug tracking-tight text-default-900 ${
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
                <span className="grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br from-indigo-500/15 to-fuchsia-500/15 text-[10px] font-semibold text-violet-700">
                  {initialsFor(debate.author.displayName)}
                </span>
                <span className="font-medium text-default-700">
                  {debate.author.displayName}
                </span>
              </div>
              <span className="text-default-300">·</span>
              <span className="inline-flex items-center gap-1 font-medium text-pro-700">
                <span className="h-1.5 w-1.5 rounded-full bg-pro-500" />
                {debate.proCount}
              </span>
              <span className="inline-flex items-center gap-1 font-medium text-against-700">
                <span className="h-1.5 w-1.5 rounded-full bg-against-500" />
                {debate.againstCount}
              </span>
              <span className="inline-flex items-center gap-1 text-default-500">
                <MessageSquareQuote size={11} />
                {debate.argumentCount}
              </span>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
      {!expanded ? <div className="pb-3" /> : null}
    </motion.aside>
  );
}

function FloatingActionToolbar({
  onAddPro,
  onAddAgainst,
  parent,
  onClearParent,
}: {
  onAddPro: () => void;
  onAddAgainst: () => void;
  parent: ArgumentDto | null;
  onClearParent: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut", delay: 0.1 }}
      className="pointer-events-auto absolute bottom-6 right-4 z-30 flex flex-col items-end gap-2 sm:bottom-auto sm:top-4"
    >
      <AnimatePresence>
        {parent ? (
          <motion.button
            type="button"
            onClick={onClearParent}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.2 }}
            className="max-w-[300px] truncate rounded-full border border-violet-200 bg-violet-50/90 px-3 py-1.5 text-[11px] font-medium text-violet-700 backdrop-blur transition-colors hover:bg-violet-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
          >
            {ui.debates.graph.replyingToEyebrow}: {parent.content}
          </motion.button>
        ) : null}
      </AnimatePresence>

      <div className="flex items-center gap-2 rounded-full border border-default-100 bg-white/95 p-1.5 shadow-xl shadow-violet-500/10 backdrop-blur-xl">
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
      className="pointer-events-auto absolute bottom-24 left-1/2 z-20 w-[min(380px,calc(100vw-2rem))] -translate-x-1/2 rounded-3xl border border-default-100 bg-white/95 px-5 py-4 text-center shadow-xl shadow-violet-500/10 backdrop-blur-xl"
    >
      <div className="mx-auto grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500/15 to-fuchsia-500/15 text-violet-700">
        <Sparkles size={16} />
      </div>
      <h2 className="mt-2 text-sm font-semibold tracking-tight text-default-900">
        {ui.debates.detail.graphEmptyTitle}
      </h2>
      <p className="mt-1 text-xs text-default-500">
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
