import { motion } from "framer-motion";
import { ui } from "../../texts/ui";

export type DebateFilter = "hottest" | "newest" | "divisive";

interface FiltersBarProps {
  value: DebateFilter;
  onChange: (next: DebateFilter) => void;
}

export function FiltersBar({ value, onChange }: FiltersBarProps) {
  // Built during render, not at module scope: `ui` resolves the active locale
  // when a property is read, so a module-level array would capture whichever
  // language happened to be loaded first and never update on a locale switch.
  const filters: { key: DebateFilter; label: string }[] = [
    { key: "hottest", label: ui.dashboard.filters.hottest },
    { key: "newest", label: ui.dashboard.filters.newest },
    { key: "divisive", label: ui.dashboard.filters.mostDivisive },
  ];

  return (
    <div
      role="tablist"
      aria-label={ui.dashboard.filters.groupAriaLabel}
      className="inline-flex rounded-full border border-default-100 bg-white/70 p-1 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/70"
    >
      {filters.map((filter) => {
        const isActive = filter.key === value;
        return (
          <button
            key={filter.key}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(filter.key)}
            className={`relative rounded-full px-4 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 ${
              isActive
                ? "text-default-900 dark:text-zinc-100"
                : "text-default-500 hover:text-default-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            }`}
          >
            {isActive && (
              <motion.span
                layoutId="filter-active-pill"
                className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500/10 via-violet-500/10 to-fuchsia-500/10 ring-1 ring-violet-300/50"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
            <span className="relative">{filter.label}</span>
          </button>
        );
      })}
    </div>
  );
}
