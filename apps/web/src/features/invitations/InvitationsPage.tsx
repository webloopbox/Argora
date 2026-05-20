import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@heroui/react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Clock, Mail, User as UserIcon, X } from "lucide-react";
import type { InvitationDto } from "@brainstorm/core";
import {
  acceptInvitation,
  declineInvitation,
  listMyInvitations,
} from "../../api/invitations.api";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { ui } from "../../texts/ui";

type LoadState =
  | { kind: "loading" }
  | { kind: "ready"; invitations: InvitationDto[] }
  | { kind: "error" };

const dateFormatter = new Intl.DateTimeFormat("pl-PL", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function InvitationsPage() {
  useDocumentTitle(ui.invitations.pageTitle);
  const navigate = useNavigate();
  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listMyInvitations()
      .then((invitations) => {
        if (!cancelled) setState({ kind: "ready", invitations });
      })
      .catch(() => {
        if (!cancelled) setState({ kind: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleAccept(invitation: InvitationDto) {
    setRespondingId(invitation.id);
    setErrorId(null);
    try {
      await acceptInvitation(invitation.id);
      setState((prev) =>
        prev.kind === "ready"
          ? {
              ...prev,
              invitations: prev.invitations.filter(
                (i) => i.id !== invitation.id,
              ),
            }
          : prev,
      );
      navigate(`/grupy/${invitation.group.id}`);
    } catch {
      setErrorId(invitation.id);
    } finally {
      setRespondingId(null);
    }
  }

  async function handleDecline(invitationId: string) {
    setRespondingId(invitationId);
    setErrorId(null);
    try {
      await declineInvitation(invitationId);
      setState((prev) =>
        prev.kind === "ready"
          ? {
              ...prev,
              invitations: prev.invitations.filter(
                (i) => i.id !== invitationId,
              ),
            }
          : prev,
      );
    } catch {
      setErrorId(invitationId);
    } finally {
      setRespondingId(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      <motion.header
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="mb-8 max-w-3xl"
      >
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl dark:text-zinc-100">
          {ui.invitations.pageTitle}
        </h1>
        <p className="mt-3 text-default-600 dark:text-zinc-400">
          {ui.invitations.pageSubtitle}
        </p>
      </motion.header>

      {state.kind === "loading" ? (
        <InvitationsLoading />
      ) : state.kind === "error" ? (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 px-4 py-6 text-center text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
        >
          {ui.invitations.loadFailed}
        </div>
      ) : state.invitations.length === 0 ? (
        <InvitationsEmpty />
      ) : (
        <ul className="space-y-3">
          <AnimatePresence initial={false}>
            {state.invitations.map((invitation) => (
              <InvitationRow
                key={invitation.id}
                invitation={invitation}
                isResponding={respondingId === invitation.id}
                hasError={errorId === invitation.id}
                onAccept={() => handleAccept(invitation)}
                onDecline={() => handleDecline(invitation.id)}
              />
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}

interface InvitationRowProps {
  invitation: InvitationDto;
  isResponding: boolean;
  hasError: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

function InvitationRow({
  invitation,
  isResponding,
  hasError,
  onAccept,
  onDecline,
}: InvitationRowProps) {
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -12 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="rounded-3xl border border-default-100 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500/15 to-fuchsia-500/15 text-violet-700 dark:text-violet-300">
            <Mail size={18} />
          </span>
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wider text-default-500 dark:text-zinc-400">
              {ui.invitations.fromEyebrow}
            </p>
            <p className="mt-0.5 truncate text-base font-semibold tracking-tight text-default-900 dark:text-zinc-100">
              {invitation.group.name}
            </p>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-default-500 dark:text-zinc-400">
              <span className="inline-flex items-center gap-1">
                <UserIcon size={11} />
                {invitation.inviter.displayName}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock size={11} />
                {dateFormatter.format(new Date(invitation.createdAt))}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="md"
            isDisabled={isResponding}
            onPress={onDecline}
          >
            <X size={14} />
            {ui.invitations.decline}
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            isDisabled={isResponding}
            onPress={onAccept}
          >
            <Check size={14} />
            {isResponding
              ? ui.invitations.responding
              : ui.invitations.accept}
          </Button>
        </div>
      </div>

      {hasError ? (
        <div
          role="alert"
          className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
        >
          {ui.invitations.respondError}
        </div>
      ) : null}
    </motion.li>
  );
}

function InvitationsLoading() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, idx) => (
        <div
          key={idx}
          aria-hidden
          className="h-24 animate-pulse rounded-3xl border border-default-100 bg-white/60 dark:border-zinc-800 dark:bg-zinc-900/60"
        />
      ))}
      <span className="sr-only">{ui.invitations.loading}</span>
    </div>
  );
}

function InvitationsEmpty() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.05, ease: "easeOut" }}
      className="flex flex-col items-center rounded-3xl border border-default-100 bg-white/70 px-6 py-16 text-center shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/70"
    >
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500/10 to-fuchsia-500/10 text-violet-700 dark:text-violet-300">
        <Mail size={26} />
      </div>
      <h2 className="mt-5 text-lg font-semibold dark:text-zinc-100">
        {ui.invitations.emptyTitle}
      </h2>
      <p className="mt-2 max-w-md text-sm text-default-600 dark:text-zinc-400">
        {ui.invitations.emptyBody}
      </p>
      <Link
        to="/grupy"
        className="mt-6 inline-flex items-center gap-2 rounded-xl border border-default-200 bg-white px-4 py-2 text-sm font-medium text-default-800 transition-colors hover:border-violet-300 hover:text-violet-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-violet-500 dark:hover:text-violet-300"
      >
        {ui.invitations.goToGroups}
      </Link>
    </motion.div>
  );
}
