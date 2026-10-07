import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@heroui/react";
import { AxiosError } from "axios";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Clock,
  Crown,
  MessageSquareQuote,
  Plus,
  Send,
  Trash2,
  Users,
} from "lucide-react";
import type {
  DebatePreviewDto,
  GroupDetailDto,
  InvitationDto,
  UserSearchResultDto,
} from "@argora/core";
import { InvitationStatus } from "@argora/core";
import { listGroupDebates } from "../../api/debates.api";
import {
  archiveGroup,
  fetchGroupDetail,
  inviteToGroup,
  listGroupInvitations,
} from "../../api/groups.api";
import { useAuth } from "../../app-config/auth-context";
import { useLanguage } from "../../app-config/language-context";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { formatDate } from "../../lib/format";
import { ui } from "../../texts/ui";
import { UserSearchPicker } from "./UserSearchPicker";

type LoadState =
  | { kind: "loading" }
  | {
      kind: "ready";
      group: GroupDetailDto;
      debates: DebatePreviewDto[];
      invitations: InvitationDto[];
    }
  | { kind: "not-found" }
  | { kind: "forbidden" }
  | { kind: "error" };

export function GroupDetailPage() {
  const params = useParams<{ id: string }>();
  if (!params.id) {
    return <GroupErrorView kind="not-found" />;
  }
  return <GroupDetailBody key={params.id} groupId={params.id} />;
}

function GroupDetailBody({ groupId }: { groupId: string }) {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const [state, setState] = useState<LoadState>({ kind: "loading" });

  useDocumentTitle(
    state.kind === "ready" ? state.group.name : ui.groups.pageTitle,
  );

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const group = await fetchGroupDetail(groupId);
        const [debates, invitations] = await Promise.all([
          listGroupDebates(groupId).catch(() => [] as DebatePreviewDto[]),
          group.isOwner
            ? listGroupInvitations(groupId).catch(
                () => [] as InvitationDto[],
              )
            : Promise.resolve([] as InvitationDto[]),
        ]);
        if (cancelled) return;
        setState({ kind: "ready", group, debates, invitations });
      } catch (err: unknown) {
        if (cancelled) return;
        const status =
          err instanceof AxiosError ? err.response?.status : undefined;
        if (status === 404) setState({ kind: "not-found" });
        else if (status === 403) setState({ kind: "forbidden" });
        else setState({ kind: "error" });
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [groupId]);

  if (state.kind === "loading") return <GroupSkeleton />;
  if (state.kind !== "ready") return <GroupErrorView kind={state.kind} />;

  const { group, debates, invitations } = state;

  async function handleArchive() {
    if (!window.confirm(ui.groups.detail.confirmArchive)) return;
    try {
      await archiveGroup(groupId);
      navigate("/grupy", { replace: true });
    } catch {
      window.alert(ui.groups.detail.archiveFailed);
    }
  }

  function applyNewInvitation(invitation: InvitationDto) {
    setState((prev) =>
      prev.kind === "ready"
        ? { ...prev, invitations: [invitation, ...prev.invitations] }
        : prev,
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <button
        type="button"
        onClick={() => navigate("/grupy")}
        className="mb-6 inline-flex items-center gap-2 text-sm text-default-500 transition-colors hover:text-default-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 rounded-md dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        <ArrowLeft size={14} />
        {ui.groups.detail.backToList}
      </button>

      <motion.header
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="mb-8 flex flex-col gap-4 rounded-3xl border border-default-100 bg-white/80 p-6 shadow-sm backdrop-blur sm:p-8 lg:flex-row lg:items-start lg:justify-between dark:border-zinc-800 dark:bg-zinc-900/80"
      >
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-violet-700 dark:text-violet-300">
            <Users size={12} />
            <span>{ui.groups.detail.eyebrow}</span>
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl dark:text-zinc-100">
            {group.name}
          </h1>
          <p className="mt-2 text-sm text-default-500 dark:text-zinc-400">
            {ui.groups.detail.ownedBy}{" "}
            <span className="font-medium text-default-800 dark:text-zinc-200">
              {group.ownerDisplayName}
            </span>{" "}
            · {ui.groups.detail.createdAt}{" "}
            {formatDate(group.createdAt, lang)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={`/dyskusje/utworz?grupa=${group.id}`}
            className="inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-sm font-semibold text-violet-700 transition-colors hover:bg-violet-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 dark:border-violet-700/40 dark:bg-violet-900/30 dark:text-violet-300 dark:hover:bg-violet-900/50"
          >
            <Plus size={14} />
            {ui.groups.detail.createDebate}
          </Link>
          {group.isOwner ? (
            <Button
              type="button"
              variant="outline"
              size="md"
              onPress={handleArchive}
            >
              <Trash2 size={14} />
              {ui.groups.detail.archive}
            </Button>
          ) : null}
        </div>
      </motion.header>

      <div className="grid gap-6 lg:grid-cols-[1fr,360px]">
        <div className="space-y-6">
          <GroupDebatesSection
            debates={debates}
            groupId={group.id}
          />
        </div>

        <aside className="space-y-6">
          <MembersCard members={group.members} />
          {group.isOwner ? (
            <InvitationsCard
              groupId={group.id}
              invitations={invitations}
              excludeIds={[
                ...group.members.map((m) => m.id),
                ...(user ? [user.id] : []),
                ...invitations
                  .filter((i) => i.status === InvitationStatus.Pending)
                  .map((i) => i.invitee.id),
              ]}
              onCreated={applyNewInvitation}
            />
          ) : null}
        </aside>
      </div>
    </div>
  );
}

function GroupSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <div
        aria-hidden
        className="h-32 animate-pulse rounded-3xl border border-default-100 bg-white/60 dark:border-zinc-800 dark:bg-zinc-900/60"
      />
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr,360px]">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              aria-hidden
              className="h-44 animate-pulse rounded-2xl border border-default-100 bg-white/60 dark:border-zinc-800 dark:bg-zinc-900/60"
            />
          ))}
        </div>
        <div
          aria-hidden
          className="h-72 animate-pulse rounded-3xl border border-default-100 bg-white/60 dark:border-zinc-800 dark:bg-zinc-900/60"
        />
      </div>
      <span className="sr-only">{ui.groups.detail.loading}</span>
    </div>
  );
}

function GroupErrorView({
  kind,
}: {
  kind: "not-found" | "forbidden" | "error";
}) {
  const navigate = useNavigate();
  const copy =
    kind === "not-found"
      ? {
          title: ui.groups.detail.notFoundTitle,
          body: ui.groups.detail.notFoundBody,
        }
      : kind === "forbidden"
        ? {
            title: ui.groups.detail.forbiddenTitle,
            body: ui.groups.detail.forbiddenBody,
          }
        : {
            title: ui.groups.detail.errorTitle,
            body: ui.groups.detail.errorBody,
          };
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
      <div className="flex flex-col items-center rounded-3xl border border-default-100 bg-white/80 px-6 py-16 text-center shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500/10 to-fuchsia-500/10 text-violet-700 dark:text-violet-300">
          <Users size={26} />
        </div>
        <h1 className="mt-5 text-xl font-semibold tracking-tight dark:text-zinc-100">
          {copy.title}
        </h1>
        <p className="mt-2 max-w-md text-sm text-default-600 dark:text-zinc-400">
          {copy.body}
        </p>
        <Button
          variant="outline"
          size="md"
          className="mt-6"
          onPress={() => navigate("/grupy")}
        >
          {ui.groups.detail.backToList}
        </Button>
      </div>
    </div>
  );
}

interface MembersCardProps {
  members: GroupDetailDto["members"];
}

function MembersCard({ members }: MembersCardProps) {
  const { lang } = useLanguage();
  return (
    <section
      aria-label={ui.groups.detail.membersTitle}
      className="rounded-3xl border border-default-100 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80"
    >
      <header className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-tight text-default-800 dark:text-zinc-200">
          {ui.groups.detail.membersTitle}
        </h2>
        <span className="text-xs text-default-500 dark:text-zinc-400">
          {members.length}
        </span>
      </header>
      <ul className="divide-y divide-default-100 dark:divide-zinc-800">
        {members.map((member) => (
          <li
            key={member.id}
            className="flex items-center justify-between gap-3 py-2.5"
          >
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-default-900 dark:text-zinc-100">
                {member.displayName}
              </span>
              <span className="block truncate text-[11px] text-default-400 dark:text-zinc-500">
                {formatDate(member.joinedAt, lang)}
              </span>
            </span>
            {member.isOwner ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:border-amber-700/40 dark:bg-amber-900/30 dark:text-amber-200">
                <Crown size={10} />
                {ui.groups.ownerBadge}
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

interface InvitationsCardProps {
  groupId: string;
  invitations: InvitationDto[];
  excludeIds: string[];
  onCreated: (invitation: InvitationDto) => void;
}

function InvitationsCard({
  groupId,
  invitations,
  excludeIds,
  onCreated,
}: InvitationsCardProps) {
  const { lang } = useLanguage();
  const [selected, setSelected] = useState<UserSearchResultDto | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!selected) return;
    setSubmitting(true);
    setError(null);
    try {
      const invitation = await inviteToGroup(groupId, {
        inviteeId: selected.id,
      });
      onCreated(invitation);
      setSelected(null);
    } catch (err) {
      const status = err instanceof AxiosError ? err.response?.status : null;
      if (status === 409) setError(ui.groups.detail.inviteConflict);
      else if (status === 404) setError(ui.groups.detail.inviteNoUser);
      else setError(ui.groups.detail.inviteFailed);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section
      aria-label={ui.groups.detail.invitationsTitle}
      className="rounded-3xl border border-default-100 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80"
    >
      <header className="mb-3">
        <h2 className="text-sm font-semibold tracking-tight text-default-800 dark:text-zinc-200">
          {ui.groups.detail.invitationsTitle}
        </h2>
        <p className="mt-1 text-xs text-default-500 dark:text-zinc-400">
          {ui.groups.detail.invitationsSubtitle}
        </p>
      </header>

      <div className="space-y-3">
        <UserSearchPicker
          selected={selected}
          onSelect={setSelected}
          excludeIds={excludeIds}
          disabled={submitting}
        />
        <Button
          type="button"
          variant="primary"
          size="md"
          fullWidth
          isDisabled={!selected || submitting}
          onPress={handleSubmit}
        >
          <Send size={14} />
          {submitting
            ? ui.groups.detail.inviteSubmitting
            : ui.groups.detail.inviteSubmit}
        </Button>
        {error ? (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
          >
            {error}
          </div>
        ) : null}
      </div>

      <div className="mt-5 border-t border-default-100 pt-4 dark:border-zinc-800">
        <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-default-500 dark:text-zinc-400">
          {ui.groups.detail.invitationsListTitle}
        </h3>
        {invitations.length === 0 ? (
          <p className="text-xs text-default-500 dark:text-zinc-400">
            {ui.groups.detail.invitationsListEmpty}
          </p>
        ) : (
          <ul className="space-y-2">
            <AnimatePresence initial={false}>
              {invitations.map((invitation) => (
                <motion.li
                  key={invitation.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-between gap-3 rounded-xl border border-default-100 bg-white/70 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/70"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-default-900 dark:text-zinc-100">
                      {invitation.invitee.displayName}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-default-400 dark:text-zinc-500">
                      <Clock size={10} />
                      {formatDate(invitation.createdAt, lang)}
                    </span>
                  </span>
                  <InvitationStatusBadge status={invitation.status} />
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>
    </section>
  );
}

function InvitationStatusBadge({ status }: { status: InvitationStatus }) {
  if (status === InvitationStatus.Pending) {
    return (
      <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:border-amber-700/40 dark:bg-amber-900/30 dark:text-amber-200">
        {ui.invitations.status.pending}
      </span>
    );
  }
  if (status === InvitationStatus.Accepted) {
    return (
      <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800 dark:border-emerald-700/40 dark:bg-emerald-900/30 dark:text-emerald-200">
        {ui.invitations.status.accepted}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full border border-default-200 bg-default-50 px-2 py-0.5 text-[11px] font-medium text-default-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
      {ui.invitations.status.declined}
    </span>
  );
}

interface GroupDebatesSectionProps {
  debates: DebatePreviewDto[];
  groupId: string;
}

function GroupDebatesSection({ debates, groupId }: GroupDebatesSectionProps) {
  return (
    <section aria-label={ui.groups.detail.debatesTitle}>
      <header className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight dark:text-zinc-100">
          {ui.groups.detail.debatesTitle}
        </h2>
        <span className="text-xs text-default-500 dark:text-zinc-400">
          {debates.length}
        </span>
      </header>

      {debates.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-default-200 bg-white/60 px-6 py-12 text-center dark:border-zinc-700 dark:bg-zinc-900/60">
          <MessageSquareQuote size={22} className="text-violet-600 dark:text-violet-400" />
          <p className="text-sm text-default-600 dark:text-zinc-400">
            {ui.groups.detail.debatesEmpty}
          </p>
          <Link
            to={`/dyskusje/utworz?grupa=${groupId}`}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
          >
            <Plus size={14} />
            {ui.groups.detail.createDebate}
          </Link>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {debates.map((debate) => (
            <li key={debate.id}>
              <Link
                to={`/dyskusje/${debate.id}`}
                className="block rounded-2xl border border-default-100 bg-white/80 p-4 shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 dark:border-zinc-800 dark:bg-zinc-900/80"
              >
                <p className="line-clamp-3 text-sm font-medium text-default-900 dark:text-zinc-100">
                  {debate.thesis}
                </p>
                <div className="mt-3 flex items-center gap-3 text-xs text-default-500 dark:text-zinc-400">
                  <span>
                    {debate.argumentCount} {ui.groups.detail.argumentsShort}
                  </span>
                  <span className="text-pro-600 dark:text-pro-400">
                    {debate.proCount} {ui.sides.pro}
                  </span>
                  <span className="text-against-600 dark:text-against-400">
                    {debate.againstCount} {ui.sides.against}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
