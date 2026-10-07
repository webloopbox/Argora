import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Flame, MessageSquareQuote, ThumbsUp, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { StatsDto } from "@argora/core";
import { fetchStats } from "../../api/stats.api";
import { ui } from "../../texts/ui";

interface StatEntry {
  label: string;
  value: number | null;
  icon: LucideIcon;
}

const nfmt = new Intl.NumberFormat("pl-PL");

export function StatsStrip() {
  const [stats, setStats] = useState<StatsDto | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchStats()
      .then((data) => {
        if (!cancelled) setStats(data);
      })
      .catch(() => {
        // Silent failure - strip renders skeletons until next render.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const entries: StatEntry[] = [
    {
      label: ui.dashboard.stats.activeDebates,
      value: stats?.activeDebates ?? null,
      icon: Flame,
    },
    {
      label: ui.dashboard.stats.participants,
      value: stats?.participants ?? null,
      icon: Users,
    },
    {
      label: ui.dashboard.stats.arguments,
      value: stats?.arguments ?? null,
      icon: MessageSquareQuote,
    },
    {
      label: ui.dashboard.stats.votes,
      value: stats?.votes ?? null,
      icon: ThumbsUp,
    },
  ];

  return (
    <section
      aria-label={ui.dashboard.heroEyebrow}
      className="mx-auto w-full max-w-7xl px-4 sm:px-6"
    >
      <div className="grid grid-cols-2 gap-3 rounded-3xl border border-default-100 bg-white/70 p-3 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/70 md:grid-cols-4">
        {entries.map((entry, idx) => (
          <motion.div
            key={entry.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 * idx, ease: "easeOut" }}
            className="flex items-center gap-3 rounded-2xl px-3 py-2"
          >
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-500/10 to-fuchsia-500/10 text-violet-700 dark:text-violet-300">
              <entry.icon size={18} />
            </div>
            <div>
              <div className="text-lg font-semibold leading-tight tracking-tight dark:text-zinc-100">
                {entry.value === null ? (
                  <span
                    aria-hidden
                    className="inline-block h-5 w-12 animate-pulse rounded bg-default-200/70 dark:bg-zinc-800"
                  />
                ) : (
                  nfmt.format(entry.value)
                )}
              </div>
              <div className="text-xs text-default-500 dark:text-zinc-400">
                {entry.label}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
