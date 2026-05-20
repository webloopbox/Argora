import { Button } from "@heroui/react";
import { ArrowRight, PlusCircle } from "lucide-react";
import { motion } from "framer-motion";
import { ui } from "../../texts/ui";

interface HeroSectionProps {
  isAuthenticated: boolean;
  onSignIn: () => void;
  onCreateDebate: () => void;
}

export function HeroSection({
  isAuthenticated,
  onSignIn,
  onCreateDebate,
}: HeroSectionProps) {
  const title = ui.dashboard.heroTitle;
  const accent = ui.dashboard.heroTitleAccent;
  const titleHead = title.slice(0, title.length - accent.length).trim();

  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-violet-400/30 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-10 h-80 w-80 rounded-full bg-fuchsia-400/25 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/3 top-40 h-64 w-64 rounded-full bg-indigo-400/20 blur-3xl"
      />

      <div className="relative mx-auto w-full max-w-7xl px-4 pb-10 pt-14 sm:px-6 sm:pt-20">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="max-w-3xl"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-default-200 bg-white/60 px-3 py-1 text-xs font-medium text-default-600 backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-400">
            <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500" />
            {ui.dashboard.heroEyebrow}
          </span>
          <h1 className="mt-4 text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl dark:text-zinc-100">
            {titleHead}{" "}
            <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
              {accent}
            </span>
          </h1>
          <p className="mt-5 max-w-2xl text-base text-default-600 sm:text-lg dark:text-zinc-400">
            {ui.dashboard.heroSubtitle}
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            {isAuthenticated ? (
              <Button
                variant="primary"
                size="lg"
                onPress={onCreateDebate}
                className="shadow-lg shadow-violet-500/20"
              >
                <PlusCircle size={18} />
                {ui.dashboard.startDebate}
              </Button>
            ) : (
              <Button
                variant="primary"
                size="lg"
                onPress={onSignIn}
                className="shadow-lg shadow-violet-500/20"
              >
                {ui.auth.signInToParticipate}
                <ArrowRight size={18} />
              </Button>
            )}
            <Button
              variant="outline"
              size="lg"
              onPress={() => {
                const el = document.getElementById("debates-grid");
                el?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
            >
              {ui.dashboard.browseFeed}
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
