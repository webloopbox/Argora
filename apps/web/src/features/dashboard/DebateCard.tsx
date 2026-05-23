import { Button } from "@heroui/react";
import { ArrowRight, Eye } from "lucide-react";
import { motion } from "framer-motion";
import type { DebatePreviewDto } from "@brainstorm/core";
import { ui } from "../../texts/ui";

interface DebateCardProps {
  debate: DebatePreviewDto;
  canParticipate: boolean;
  onOpen: (id: string) => void;
}

const relativeFormatter = new Intl.RelativeTimeFormat("pl-PL", {
  numeric: "auto",
});

function relativeLabel(iso: string): string {
  const created = new Date(iso).getTime();
  const diffSeconds = Math.round((created - Date.now()) / 1000);
  const abs = Math.abs(diffSeconds);
  if (abs < 60) return relativeFormatter.format(diffSeconds, "second");
  if (abs < 3600)
    return relativeFormatter.format(Math.round(diffSeconds / 60), "minute");
  if (abs < 86_400)
    return relativeFormatter.format(Math.round(diffSeconds / 3600), "hour");
  if (abs < 604_800)
    return relativeFormatter.format(Math.round(diffSeconds / 86_400), "day");
  return relativeFormatter.format(Math.round(diffSeconds / 604_800), "week");
}

function initialsFor(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0]!.toUpperCase())
    .slice(0, 2)
    .join("");
}

import { useAuth } from "../../app-config/auth-context";

export function DebateCard({ debate, canParticipate, onOpen }: DebateCardProps) {
  const { user } = useAuth();
  const isOwner = user?.id === debate.author.id;
  const total = debate.proCount + debate.againstCount;
  const proPct = total === 0 ? 50 : Math.round((debate.proCount / total) * 100);

  return (
    <motion.article
      variants={{
        hidden: { opacity: 0, y: 14 },
        visible: { opacity: 1, y: 0 },
      }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-default-100 bg-white/80 p-5 shadow-sm backdrop-blur transition-shadow hover:shadow-xl hover:shadow-violet-500/5 dark:border-zinc-800 dark:bg-zinc-900/80 dark:hover:shadow-violet-500/10"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-violet-400/70 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
      />

      <div className="flex items-center gap-2 text-xs text-default-500 dark:text-zinc-400">
        <span className="grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br from-indigo-500/15 to-fuchsia-500/15 text-[10px] font-semibold text-violet-700 dark:from-indigo-400/20 dark:to-fuchsia-400/20 dark:text-violet-300">
          {initialsFor(debate.author.displayName)}
        </span>
        <span className="font-medium text-default-700 dark:text-zinc-200">
          {debate.author.displayName}
        </span>
        <span>·</span>
        <span>{relativeLabel(debate.createdAt)}</span>
      </div>

      <h3 className="mt-3 text-base font-semibold leading-snug text-default-900 sm:text-lg dark:text-zinc-100">
        {debate.thesis}
      </h3>

      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="inline-flex items-center gap-1.5 font-medium text-pro-700">
            <span className="h-2 w-2 rounded-full bg-pro-500" />
            {ui.sides.pro} · {debate.proCount}
          </span>
          <span className="inline-flex items-center gap-1.5 font-medium text-against-700">
            {ui.sides.against} · {debate.againstCount}
            <span className="h-2 w-2 rounded-full bg-against-500" />
          </span>
        </div>
        <div
          role="img"
          aria-label={`${proPct}% ${ui.sides.pro}, ${100 - proPct}% ${ui.sides.against}`}
          className="relative h-1.5 w-full overflow-hidden rounded-full bg-against-100 dark:bg-against-900/50"
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-pro-500 to-pro-400"
            style={{ width: `${proPct}%` }}
          />
        </div>
      </div>

      <div className="mt-auto flex items-center justify-end pt-5">
        <Button
          size="sm"
          variant={canParticipate ? "primary" : "outline"}
          onPress={() => onOpen(debate.id)}
        >
          {isOwner ? (
            <>
              {ui.dashboard.cardManage}
              <ArrowRight size={14} />
            </>
          ) : canParticipate ? (
            <>
              {ui.dashboard.cardOpenParticipate}
              <ArrowRight size={14} />
            </>
          ) : (
            <>
              <Eye size={14} />
              {ui.dashboard.cardViewReadOnly}
            </>
          )}
        </Button>
      </div>
    </motion.article>
  );
}
