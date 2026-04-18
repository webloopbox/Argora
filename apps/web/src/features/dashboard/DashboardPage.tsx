import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../app-config/auth-context";
import { ui } from "../../texts/ui";
import { HeroSection } from "./HeroSection";
import { StatsStrip } from "./StatsStrip";
import { FiltersBar, type DebateFilter } from "./FiltersBar";
import { DebateCard } from "./DebateCard";
import { mockPublicDebates } from "./mock-debates";

const gridVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};

export function DashboardPage() {
  const { isAuthenticated, signIn } = useAuth();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<DebateFilter>("hottest");

  const debates = useMemo(() => {
    const items = [...mockPublicDebates];
    if (filter === "hottest") {
      return items.sort(
        (a, b) => b.proCount + b.againstCount - (a.proCount + a.againstCount),
      );
    }
    if (filter === "newest") {
      return items.reverse();
    }
    return items.sort((a, b) => {
      const balance = (x: typeof a) => Math.abs(x.proCount - x.againstCount);
      return balance(a) - balance(b);
    });
  }, [filter]);

  return (
    <div className="pb-16">
      <HeroSection
        isAuthenticated={isAuthenticated}
        onSignIn={signIn}
        onCreateDebate={() => navigate("/dyskusje/nowa")}
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

        <motion.div
          variants={gridVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {debates.map((debate) => (
            <DebateCard
              key={debate.id}
              debate={debate}
              canParticipate={isAuthenticated}
              onOpen={(id) => navigate(`/dyskusje/${id}`)}
            />
          ))}
        </motion.div>
      </section>
    </div>
  );
}
