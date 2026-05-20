import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@heroui/react";
import { motion } from "framer-motion";
import { PlusCircle, Sparkles } from "lucide-react";
import type { DebatePreviewDto } from "@brainstorm/core";
import { listPublicDebates } from "../../api/debates.api";
import { useAuth } from "../../app-config/auth-context";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { ui } from "../../texts/ui";
import { DebateCard } from "./DebateCard";
import { FiltersBar, type DebateFilter } from "./FiltersBar";
import { HeroSection } from "./HeroSection";
import { StatsStrip } from "./StatsStrip";

type LoadState =
  | { kind: "loading" }
  | { kind: "ready"; debates: DebatePreviewDto[] }
  | { kind: "error" };

const gridVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};

export function DashboardPage() {
  useDocumentTitle(ui.dashboard.heroEyebrow);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<DebateFilter>("hottest");
  const [state, setState] = useState<LoadState>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    listPublicDebates()
      .then((debates) => {
        if (!cancelled) setState({ kind: "ready", debates });
      })
      .catch(() => {
        if (!cancelled) setState({ kind: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const sortedDebates = useMemo(() => {
    if (state.kind !== "ready") return [];
    const items = [...state.debates];
    if (filter === "hottest") {
      return items.sort(
        (a, b) =>
          b.proCount + b.againstCount - (a.proCount + a.againstCount),
      );
    }
    if (filter === "newest") {
      return items.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    }
    return items.sort((a, b) => {
      const balance = (x: DebatePreviewDto) =>
        Math.abs(x.proCount - x.againstCount);
      return balance(a) - balance(b);
    });
  }, [filter, state]);

  return (
    <div className="pb-16">
      <HeroSection
        isAuthenticated={isAuthenticated}
        onSignIn={() => navigate("/logowanie")}
        onCreateDebate={() => navigate("/dyskusje/utworz")}
      />

      <StatsStrip />

      {!isAuthenticated && (
        <div className="mx-auto mt-8 w-full max-w-7xl px-4 sm:px-6">
          <div className="rounded-2xl border border-amber-200/60 bg-amber-50/60 px-4 py-3 text-sm text-amber-900 backdrop-blur">
            {ui.dashboard.guestBanner}
          </div>
        </div>
      )}

      <section
        id="debates-grid"
        className="mx-auto mt-8 w-full max-w-7xl scroll-mt-20 px-4 sm:px-6"
      >
        <div className="mb-5 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
            {ui.dashboard.heroEyebrow}
          </h2>
          <FiltersBar value={filter} onChange={setFilter} />
        </div>

        {state.kind === "loading" ? (
          <DashboardLoading />
        ) : state.kind === "error" ? (
          <div
            role="alert"
            className="rounded-2xl border border-red-200 bg-red-50 px-4 py-6 text-center text-sm text-red-700"
          >
            {ui.dashboard.loadFailed}
          </div>
        ) : sortedDebates.length === 0 ? (
          <DashboardEmpty
            isAuthenticated={isAuthenticated}
            onCreate={() => navigate("/dyskusje/utworz")}
            onSignIn={() => navigate("/logowanie")}
          />
        ) : (
          <motion.div
            variants={gridVariants}
            initial="hidden"
            animate="visible"
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {sortedDebates.map((debate) => (
              <DebateCard
                key={debate.id}
                debate={debate}
                canParticipate={isAuthenticated}
                onOpen={(id) => navigate(`/dyskusje/${id}`)}
              />
            ))}
          </motion.div>
        )}
      </section>
    </div>
  );
}

function DashboardLoading() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, idx) => (
        <div
          key={idx}
          aria-hidden
          className="h-52 animate-pulse rounded-2xl border border-default-100 bg-white/60 dark:border-zinc-800 dark:bg-zinc-900/60"
        />
      ))}
      <span className="sr-only">{ui.dashboard.loading}</span>
    </div>
  );
}

interface DashboardEmptyProps {
  isAuthenticated: boolean;
  onCreate: () => void;
  onSignIn: () => void;
}

function DashboardEmpty({
  isAuthenticated,
  onCreate,
  onSignIn,
}: DashboardEmptyProps) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-default-200 bg-white/60 px-6 py-16 text-center dark:border-zinc-700 dark:bg-zinc-900/60">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500/15 to-fuchsia-500/15 text-violet-700">
        <Sparkles size={22} />
      </div>
      <h3 className="text-lg font-semibold tracking-tight dark:text-zinc-100">
        {ui.dashboard.emptyTitle}
      </h3>
      <p className="max-w-md text-sm text-default-500 dark:text-zinc-400">
        {ui.dashboard.emptyBody}
      </p>
      {isAuthenticated ? (
        <Button variant="primary" size="lg" onPress={onCreate}>
          <PlusCircle size={18} />
          {ui.dashboard.emptyCta}
        </Button>
      ) : (
        <Button variant="primary" size="lg" onPress={onSignIn}>
          {ui.auth.signInToParticipate}
        </Button>
      )}
    </div>
  );
}
