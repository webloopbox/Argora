import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Button, FieldError, Input, Label, TextField } from "@heroui/react";
import { AnimatePresence, motion } from "framer-motion";
import { Users, X } from "lucide-react";
import type { GroupDetailDto } from "@brainstorm/core";
import { createGroup } from "../../api/groups.api";
import { ui } from "../../texts/ui";

interface CreateGroupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (group: GroupDetailDto) => void;
}

const NAME_MIN = 3;
const NAME_MAX = 64;

// The form lives in a child that is mounted only while the dialog is open, so
// a reopened dialog starts empty by construction - no effect that resets four
// pieces of state on close, and no cascading render to pay for it.
export function CreateGroupDialog({
  isOpen,
  onClose,
  onCreated,
}: CreateGroupDialogProps) {
  // Scroll-lock the page underneath while the dialog is open.
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen ? (
        <>
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px]"
            onClick={onClose}
          />
          <CreateGroupPanel key="panel" onClose={onClose} onCreated={onCreated} />
        </>
      ) : null}
    </AnimatePresence>
  );
}

function CreateGroupPanel({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (group: GroupDetailDto) => void;
}) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < NAME_MIN) {
      setError(ui.groups.create.nameTooShort);
      return;
    }
    if (trimmed.length > NAME_MAX) {
      setError(ui.groups.create.nameTooLong);
      return;
    }
    setError(null);
    setFormError(null);
    setSubmitting(true);
    try {
      const group = await createGroup({ name: trimmed });
      onCreated(group);
    } catch {
      setFormError(ui.groups.create.genericError);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: 8 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      role="dialog"
      aria-label={ui.groups.create.title}
      className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl border border-default-100 bg-white shadow-2xl shadow-violet-500/10 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <header className="flex items-start justify-between gap-3 border-b border-default-100 px-5 py-4 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-indigo-500/15 to-fuchsia-500/15 text-violet-700 dark:text-violet-300">
            <Users size={14} />
          </span>
          <div>
            <h2 className="text-base font-semibold tracking-tight dark:text-zinc-100">
              {ui.groups.create.title}
            </h2>
            <p className="text-xs text-default-500 dark:text-zinc-400">
              {ui.groups.create.subtitle}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={ui.common.close}
          className="rounded-full p-1.5 text-default-500 transition-colors hover:bg-default-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          <X size={16} />
        </button>
      </header>

      <form onSubmit={handleSubmit} className="space-y-5 px-5 py-5" noValidate>
        <TextField
          value={name}
          onChange={setName}
          isInvalid={!!error}
          isDisabled={submitting}
          fullWidth
        >
          <Label>{ui.groups.create.nameLabel}</Label>
          <Input
            type="text"
            placeholder={ui.groups.create.namePlaceholder}
            autoFocus
          />
          {error ? <FieldError>{error}</FieldError> : null}
        </TextField>

        {formError ? (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
          >
            {formError}
          </div>
        ) : null}

        <div className="flex flex-col-reverse items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end">
          <Button
            type="button"
            variant="outline"
            size="md"
            isDisabled={submitting}
            onPress={onClose}
          >
            {ui.common.cancel}
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            isDisabled={submitting}
          >
            {submitting
              ? ui.groups.create.submitting
              : ui.groups.create.submit}
          </Button>
        </div>
      </form>
    </motion.div>
  );
}
