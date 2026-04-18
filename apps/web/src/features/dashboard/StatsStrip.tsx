import { motion } from "framer-motion";
import { Flame, MessageSquareQuote, ThumbsUp, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ui } from "../../texts/ui";
import { dashboardStats } from "./mock-debates";

interface StatEntry {
  label: string;
  value: number;
  icon: LucideIcon;
}

const nfmt = new Intl.NumberFormat("pl-PL");

const entries: StatEntry[] = [
  { label: ui.dashboard.stats.activeDebates, value: dashboardStats.activeDebates, icon: Flame },
  { label: ui.dashboard.stats.participants, value: dashboardStats.participants, icon: Users },
  { label: ui.dashboard.stats.arguments, value: dashboardStats.arguments, icon: MessageSquareQuote },
  { label: ui.dashboard.stats.votes, value: dashboardStats.votes, icon: ThumbsUp },
];

export function StatsStrip() {
  return (
    <section
      aria-label={ui.dashboard.heroEyebrow}
      className="mx-auto w-full max-w-7xl px-4 sm:px-6"
    >
      <div className="grid grid-cols-2 gap-3 rounded-3xl border border-default-100 bg-white/70 p-3 shadow-sm backdrop-blur md:grid-cols-4">
        {entries.map((entry, idx) => (
          <motion.div
            key={entry.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 * idx, ease: "easeOut" }}
            className="flex items-center gap-3 rounded-2xl px-3 py-2"
          >
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-500/10 to-fuchsia-500/10 text-violet-700">
              <entry.icon size={18} />
            </div>
            <div>
              <div className="text-lg font-semibold leading-tight tracking-tight">
                {nfmt.format(entry.value)}
              </div>
              <div className="text-xs text-default-500">{entry.label}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
