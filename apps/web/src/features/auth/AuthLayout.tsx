import { NavLink, Outlet } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { ui } from "../../texts/ui";

// Standalone shell for /logowanie and /rejestracja - intentionally no
// TopBar so first-time visitors aren't distracted by signed-out nav.
// Renders a single centred card on a gradient background.
export function AuthLayout() {
  return (
    <div className="relative flex min-h-full items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-fuchsia-50 px-4 py-12 text-default-900 dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-900 dark:text-zinc-100">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-violet-400/30 blur-3xl dark:bg-violet-600/20"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-fuchsia-400/25 blur-3xl dark:bg-fuchsia-600/15"
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >
        <NavLink
          to="/"
          className="mb-8 flex items-center justify-center gap-2"
        >
          <span className="relative grid h-10 w-10 place-items-center rounded-xl bg-violet-600 text-white shadow-md shadow-violet-500/30">
            <Sparkles size={20} strokeWidth={2.5} />
          </span>
          <span className="text-xl font-semibold tracking-tight text-violet-700 dark:text-violet-500">
            {ui.app.name}
          </span>
        </NavLink>

        <div className="rounded-3xl border border-default-100 bg-white/85 p-8 shadow-2xl shadow-violet-900/5 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-900/90">
          <Outlet />
        </div>
      </motion.div>
    </div>
  );
}
