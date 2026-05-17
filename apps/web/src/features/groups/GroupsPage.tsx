import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@heroui/react";
import { motion } from "framer-motion";
import {
  Crown,
  MessageSquareQuote,
  Plus,
  Users,
} from "lucide-react";
import type { GroupDetailDto, GroupSummaryDto } from "@brainstorm/core";
import { listMyGroups } from "../../api/groups.api";
import { ui } from "../../texts/ui";
import { CreateGroupDialog } from "./CreateGroupDialog";

type LoadState =
  | { kind: "loading" }
  | { kind: "ready"; groups: GroupSummaryDto[] }
  | { kind: "error" };

const gridVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
};

export function GroupsPage() {
  const navigate = useNavigate();
  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listMyGroups()
      .then((groups) => {
        if (!cancelled) setState({ kind: "ready", groups });
      })
      .catch(() => {
        if (!cancelled) setState({ kind: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function handleCreated(group: GroupDetailDto) {
    setDialogOpen(false);
    navigate(`/grupy/${group.id}`);
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <motion.header
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
      >
        <div className="max-w-3xl">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {ui.groups.pageTitle}
          </h1>
          <p className="mt-3 text-default-600">{ui.groups.pageSubtitle}</p>
        </div>
        <Button
          variant="primary"
          size="md"
          onPress={() => setDialogOpen(true)}
        >
          <Plus size={16} />
          {ui.groups.createCta}
        </Button>
      </motion.header>

      {state.kind === "loading" ? (
        <GroupsLoading />
      ) : state.kind === "error" ? (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 px-4 py-6 text-center text-sm text-red-700"
        >
          {ui.groups.loadFailed}
        </div>
      ) : state.kind === "ready" && state.groups.length === 0 ? (
        <GroupsEmpty onCreate={() => setDialogOpen(true)} />
      ) : (
        <motion.div
          variants={gridVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {state.groups.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}
        </motion.div>
      )}

      <CreateGroupDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreated={handleCreated}
      />
    </div>
  );
}

const cardVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

interface GroupCardProps {
  group: GroupSummaryDto;
}

function GroupCard({ group }: GroupCardProps) {
  return (
    <motion.article
      variants={cardVariants}
      className="group flex flex-col rounded-3xl border border-default-100 bg-white/80 p-5 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500/15 to-fuchsia-500/15 text-violet-700">
          <Users size={18} />
        </span>
        {group.isOwner ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800">
            <Crown size={10} />
            {ui.groups.ownerBadge}
          </span>
        ) : null}
      </div>

      <h3 className="mt-4 line-clamp-2 text-lg font-semibold tracking-tight">
        {group.name}
      </h3>
      <p className="mt-1 text-xs text-default-500">
        {ui.groups.ownerEyebrow}{" "}
        <span className="font-medium text-default-700">
          {group.ownerDisplayName}
        </span>
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-default-500">
        <span className="inline-flex items-center gap-1">
          <Users size={12} />
          {group.memberCount} {ui.groups.membersShort}
        </span>
        <span className="inline-flex items-center gap-1">
          <MessageSquareQuote size={12} />
          {group.debateCount} {ui.groups.debatesShort}
        </span>
      </div>

      <div className="mt-5">
        <Link
          to={`/grupy/${group.id}`}
          className="inline-flex items-center justify-center rounded-xl border border-default-200 bg-white px-3 py-1.5 text-sm font-medium text-default-800 transition-colors hover:border-violet-300 hover:text-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
        >
          {ui.groups.openCta}
        </Link>
      </div>
    </motion.article>
  );
}

function GroupsLoading() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, idx) => (
        <div
          key={idx}
          aria-hidden
          className="h-48 animate-pulse rounded-3xl border border-default-100 bg-white/60"
        />
      ))}
      <span className="sr-only">{ui.groups.loading}</span>
    </div>
  );
}

function GroupsEmpty({ onCreate }: { onCreate: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.05, ease: "easeOut" }}
      className="flex flex-col items-center rounded-3xl border border-default-100 bg-white/70 px-6 py-16 text-center shadow-sm backdrop-blur"
    >
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500/10 to-fuchsia-500/10 text-violet-700">
        <Users size={26} />
      </div>
      <h2 className="mt-5 text-lg font-semibold">{ui.groups.emptyTitle}</h2>
      <p className="mt-2 max-w-md text-sm text-default-600">
        {ui.groups.emptyBody}
      </p>
      <Button variant="primary" size="md" className="mt-6" onPress={onCreate}>
        <Plus size={16} />
        {ui.groups.createFirst}
      </Button>
    </motion.div>
  );
}
