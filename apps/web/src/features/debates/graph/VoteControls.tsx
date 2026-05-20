import { useState } from "react";
import { AxiosError } from "axios";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import type {
  ArgumentDto,
  ArgumentSentiment,
  VoteValue,
} from "@brainstorm/core";
import { castVote, retractVote } from "../../../api/votes.api";
import { useDebateGraphContext } from "./debate-graph-context";
import { ui } from "../../../texts/ui";

interface VoteControlsProps {
  argument: ArgumentDto;
}

// Single merged widget: ▲ button + weight circle + ▼ button, all sharing
// one outer pill. The center circle is the visual sum of the flanking
// counts so users see immediately that it's the result of the votes, not
// (say) a count of child arguments. Sentiment colours the circle in the
// reserved palette per CLAUDE.md - orange exclusively for `controversy`.
export function VoteControls({ argument }: VoteControlsProps) {
  const { isAuthenticated, onArgumentUpdated, onSignInClick } =
    useDebateGraphContext();
  const [pending, setPending] = useState<VoteValue | "retract" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleClick(value: VoteValue) {
    if (!isAuthenticated) {
      onSignInClick();
      return;
    }
    if (pending) return;

    const original = argument;
    const sameAsCurrent = argument.userVote === value;
    setError(null);
    setPending(sameAsCurrent ? "retract" : value);

    const optimistic = applyOptimistic(argument, sameAsCurrent ? null : value);
    onArgumentUpdated(optimistic);

    try {
      const serverState = sameAsCurrent
        ? await retractVote(argument.id)
        : await castVote(argument.id, value);
      onArgumentUpdated(serverState);
    } catch (err) {
      onArgumentUpdated(original);
      const status =
        err instanceof AxiosError ? err.response?.status : undefined;
      setError(
        status === 401
          ? ui.debates.graph.voteRequiresLogin
          : ui.debates.graph.voteFailed,
      );
    } finally {
      setPending(null);
    }
  }

  const proActive = argument.userVote === 1;
  const againstActive = argument.userVote === -1;
  const proPending = pending === 1 || (pending === "retract" && proActive);
  const againstPending =
    pending === -1 || (pending === "retract" && againstActive);

  return (
    <div className="inline-flex flex-col items-end gap-1">
      <div
        role="group"
        aria-label={ui.debates.graph.voteWidgetAriaLabel}
        className="inline-flex items-center gap-0.5 rounded-xl border border-default-200 bg-white p-0.5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
      >
        <VoteButton
          side="pro"
          active={proActive}
          pending={proPending}
          disabled={!!pending && !proPending}
          count={argument.forCount}
          ariaLabel={
            proActive
              ? ui.debates.graph.voteProActive
              : ui.debates.graph.voteProInactive
          }
          onClick={(event) => {
            event.stopPropagation();
            void handleClick(1);
          }}
        />
        <WeightCenter
          weight={argument.weight}
          sentiment={argument.sentiment}
        />
        <VoteButton
          side="against"
          active={againstActive}
          pending={againstPending}
          disabled={!!pending && !againstPending}
          count={argument.againstCount}
          ariaLabel={
            againstActive
              ? ui.debates.graph.voteAgainstActive
              : ui.debates.graph.voteAgainstInactive
          }
          onClick={(event) => {
            event.stopPropagation();
            void handleClick(-1);
          }}
        />
      </div>
      {error ? (
        <span
          role="status"
          className="text-[10px] text-red-600"
          aria-live="polite"
        >
          {error}
        </span>
      ) : null}
    </div>
  );
}

interface VoteButtonProps {
  side: "pro" | "against";
  active: boolean;
  pending: boolean;
  disabled: boolean;
  count: number;
  ariaLabel: string;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

function VoteButton({
  side,
  active,
  pending,
  disabled,
  count,
  ariaLabel,
  onClick,
}: VoteButtonProps) {
  const Icon = side === "pro" ? ThumbsUp : ThumbsDown;
  const activeClass =
    side === "pro"
      ? "bg-pro-500 text-white shadow-sm"
      : "bg-against-500 text-white shadow-sm";
  const idleClass =
    side === "pro"
      ? "text-default-500 hover:bg-pro-50 hover:text-pro-600 dark:text-zinc-400 dark:hover:bg-pro-900/30 dark:hover:text-pro-300"
      : "text-default-500 hover:bg-against-50 hover:text-against-600 dark:text-zinc-400 dark:hover:bg-against-900/30 dark:hover:text-against-300";
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-pressed={active}
      onClick={onClick}
      disabled={disabled || pending}
      className={`group inline-flex items-center gap-1 rounded-lg p-1 text-[11px] font-semibold tabular-nums transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 disabled:cursor-not-allowed disabled:opacity-60 ${
        active ? activeClass : idleClass
      }`}
    >
      <Icon
        size={11}
        strokeWidth={active ? 2.5 : 2}
        className={
          side === "pro"
            ? "transition-transform group-hover:-translate-y-px"
            : "transition-transform group-hover:translate-y-px"
        }
      />
      <span>{count}</span>
    </button>
  );
}

// Sits inside the same pill as the buttons. Bigger than the buttons so the
// eye locks onto it as the "result"; non-interactive so it doesn't compete
// with the cast/retract controls. Title carries the sentiment + weight
// pair for hover discovery; aria-label exposes the same for screen readers.
const SENTIMENT_STYLES: Record<
  ArgumentSentiment,
  { circle: string; label: string }
> = {
  pro: {
    circle: "border-pro-300 bg-pro-50 text-pro-700",
    label: ui.debates.graph.sentimentPro,
  },
  against: {
    circle: "border-against-300 bg-against-50 text-against-700",
    label: ui.debates.graph.sentimentAgainst,
  },
  controversy: {
    circle: "border-orange-300 bg-orange-50 text-orange-700",
    label: ui.debates.graph.sentimentControversy,
  },
  neutral: {
    circle: "border-default-200 bg-default-50 text-default-500",
    label: ui.debates.graph.sentimentNeutral,
  },
};

function WeightCenter({
  weight,
  sentiment,
}: {
  weight: number;
  sentiment: ArgumentSentiment;
}) {
  const style = SENTIMENT_STYLES[sentiment];
  const ariaLabel = `${style.label} · ${ui.debates.graph.weightAriaLabel}: ${weight}`;
  return (
    <span className="group/weight relative">
      <span
        aria-label={ariaLabel}
        className={`grid h-6 min-w-6 cursor-default select-none place-items-center rounded-full border px-1.5 text-[11px] font-bold tabular-nums ${style.circle}`}
      >
        {weight}
      </span>
      <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-48 -translate-x-1/2 rounded-xl bg-gray-800 px-3 py-2 text-xs text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover/weight:opacity-100">
        <p className="mb-0.5 font-semibold">{style.label}</p>
        <p className="leading-snug text-gray-300">
          {ui.debates.graph.weightTooltip}
        </p>
        <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
      </div>
    </span>
  );
}

function applyOptimistic(
  argument: ArgumentDto,
  next: VoteValue | null,
): ArgumentDto {
  const previous = argument.userVote;
  let forCount = argument.forCount;
  let againstCount = argument.againstCount;

  if (previous === 1) forCount = Math.max(0, forCount - 1);
  if (previous === -1) againstCount = Math.max(0, againstCount - 1);
  if (next === 1) forCount += 1;
  if (next === -1) againstCount += 1;

  const weight = forCount + againstCount;
  return {
    ...argument,
    forCount,
    againstCount,
    weight,
    sentiment: computeSentiment(forCount, againstCount),
    userVote: next,
  };
}

// Mirrors the backend formula so optimistic UI matches the server echo.
// Keep this in sync with ArgumentsService.computeSentiment in apps/api.
const CONTROVERSY_MAX_RATIO = 0.2;

function computeSentiment(
  forCount: number,
  againstCount: number,
): ArgumentSentiment {
  const weight = forCount + againstCount;
  if (weight === 0) return "neutral";
  const balance = Math.abs(forCount - againstCount) / weight;
  if (balance < CONTROVERSY_MAX_RATIO) return "controversy";
  return forCount >= againstCount ? "pro" : "against";
}
