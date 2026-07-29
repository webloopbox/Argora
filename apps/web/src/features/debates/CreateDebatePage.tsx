import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Button,
  FieldError,
  Label,
  Radio,
  RadioContent,
  RadioControl,
  RadioGroup,
  RadioIndicator,
  TextArea,
  TextField,
} from "@heroui/react";
import { motion } from "framer-motion";
import { ArrowLeft, Lock, Sparkles, Users } from "lucide-react";
import type { CreateDebateDto, GroupDetailDto } from "@brainstorm/core";
import { DebateLanguage, DebateVisibility } from "@brainstorm/core";
import { createDebate } from "../../api/debates.api";
import { fetchGroupDetail } from "../../api/groups.api";
import { useLanguage } from "../../app-config/language-context";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { ui } from "../../texts/ui";

const THESIS_MIN = 8;
const THESIS_MAX = 280;

type VisibilityValue = "public" | "private";

interface FieldErrors {
  thesis?: string;
}

export function CreateDebatePage() {
  useDocumentTitle(ui.debates.create.title);
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const groupIdParam = params.get("grupa");

  const { lang } = useLanguage();

  const [thesis, setThesis] = useState("");
  const [visibility, setVisibility] = useState<VisibilityValue>(
    groupIdParam ? "private" : "public",
  );
  // Seeded from the interface locale because that is the best available guess
  // at what the author will type, but kept separate from it: the debate keeps
  // this language for good, while the interface can be switched at any time.
  const [language, setLanguage] = useState<DebateLanguage>(
    lang === "en" ? DebateLanguage.En : DebateLanguage.Pl,
  );
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [group, setGroup] = useState<GroupDetailDto | null>(null);
  const [groupLoading, setGroupLoading] = useState(false);
  const [groupError, setGroupError] = useState<string | null>(null);

  useEffect(() => {
    if (!groupIdParam) {
      setGroup(null);
      setGroupError(null);
      return;
    }
    let cancelled = false;
    setGroupLoading(true);
    setGroupError(null);
    fetchGroupDetail(groupIdParam)
      .then((g) => {
        if (cancelled) return;
        setGroup(g);
        setGroupLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setGroup(null);
        setGroupError(ui.debates.create.groupContextFailed);
        setGroupLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [groupIdParam]);

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    const trimmed = thesis.trim();
    if (!trimmed) next.thesis = ui.auth.validation.required;
    else if (trimmed.length < THESIS_MIN)
      next.thesis = ui.debates.create.thesisTooShort;
    else if (trimmed.length > THESIS_MAX)
      next.thesis = ui.debates.create.thesisTooLong;
    return next;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    if (visibility === "private" && !group) {
      setFormError(ui.debates.create.privateNeedsGroup);
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      const payload: CreateDebateDto =
        visibility === "private" && group
          ? {
              thesis: thesis.trim(),
              visibility: DebateVisibility.Private,
              language,
              groupId: group.id,
            }
          : {
              thesis: thesis.trim(),
              visibility: DebateVisibility.Public,
              language,
            };
      const debate = await createDebate(payload);
      navigate(`/dyskusje/${debate.id}`, { replace: true });
    } catch {
      setFormError(ui.debates.create.genericError);
    } finally {
      setSubmitting(false);
    }
  }

  const charsLeft = THESIS_MAX - thesis.length;
  const privateAvailable = Boolean(group);

  const backTarget = useMemo(
    () => (group ? `/grupy/${group.id}` : "/"),
    [group],
  );

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <button
        type="button"
        onClick={() => navigate(backTarget)}
        className="mb-6 inline-flex items-center gap-2 text-sm text-default-500 transition-colors hover:text-default-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 rounded-md dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        <ArrowLeft size={14} />
        {group
          ? ui.debates.create.backToGroup
          : ui.debates.detail.backToFeed}
      </button>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="rounded-3xl border border-default-100 bg-white/80 p-6 shadow-sm backdrop-blur sm:p-8 dark:border-zinc-800 dark:bg-zinc-900/80"
      >
        <header className="space-y-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-default-200 bg-default-50 px-3 py-1 text-xs font-medium text-violet-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-violet-300">
            <Sparkles size={12} />
            {ui.dashboard.heroEyebrow}
          </span>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl dark:text-zinc-100">
            {ui.debates.create.title}
          </h1>
          <p className="text-sm text-default-500 dark:text-zinc-400">
            {ui.debates.create.subtitle}
          </p>
        </header>

        {group ? (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-violet-200 bg-violet-50/60 px-4 py-3 dark:border-violet-700/40 dark:bg-violet-900/30">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-violet-500/15 text-violet-700 dark:text-violet-300">
              <Users size={14} />
            </span>
            <div className="text-sm">
              <p className="font-medium text-default-900 dark:text-zinc-100">
                {ui.debates.create.inGroupEyebrow}
              </p>
              <p className="text-xs text-default-600 dark:text-zinc-400">
                {ui.debates.create.inGroupHint} <strong>{group.name}</strong>.
              </p>
            </div>
          </div>
        ) : groupLoading ? (
          <div
            aria-hidden
            className="mt-6 h-12 animate-pulse rounded-2xl bg-default-100 dark:bg-zinc-800"
          />
        ) : groupError ? (
          <div
            role="alert"
            className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-700/40 dark:bg-amber-900/30 dark:text-amber-200"
          >
            {groupError}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-8 space-y-7" noValidate>
          <TextField
            value={thesis}
            onChange={setThesis}
            isInvalid={!!errors.thesis}
            isDisabled={submitting}
            fullWidth
          >
            <div className="flex items-baseline justify-between">
              <Label>{ui.debates.create.thesisLabel}</Label>
              <span
                className={`text-xs ${
                  charsLeft < 0 ? "text-against-600" : "text-default-400"
                }`}
              >
                {charsLeft}
              </span>
            </div>
            <TextArea
              rows={4}
              placeholder={ui.debates.create.thesisPlaceholder}
              autoFocus
            />
            <p className="mt-2 text-xs text-default-400 dark:text-zinc-500">
              {ui.debates.create.thesisHint}
            </p>
            {errors.thesis ? <FieldError>{errors.thesis}</FieldError> : null}
          </TextField>

          <RadioGroup
            value={visibility}
            onChange={(value) => setVisibility(value as VisibilityValue)}
            isDisabled={submitting}
            aria-label={ui.debates.create.visibilityLabel}
            className="space-y-2"
          >
            <Label className="text-sm font-medium text-default-800 dark:text-zinc-200">
              {ui.debates.create.visibilityLabel}
            </Label>
            <div className="grid gap-3 sm:grid-cols-2">
              <Radio
                value="public"
                className="group relative flex cursor-pointer items-start gap-3 rounded-2xl border border-default-100 bg-default-50/60 p-4 transition-colors hover:border-violet-300 data-[selected]:border-violet-400 data-[selected]:bg-violet-50/60 dark:border-zinc-700 dark:bg-zinc-800/40 dark:hover:border-violet-500 dark:data-[selected]:border-violet-500 dark:data-[selected]:bg-violet-900/30"
              >
                <RadioControl className="mt-0.5">
                  <RadioIndicator />
                </RadioControl>
                <RadioContent className="flex min-w-0 flex-col">
                  <span className="text-sm font-semibold text-default-900 dark:text-zinc-100">
                    {ui.debates.create.visibilityPublic}
                  </span>
                  <span className="text-xs text-default-500 dark:text-zinc-400">
                    {ui.debates.create.visibilityPublicHint}
                  </span>
                </RadioContent>
              </Radio>

              <Radio
                value="private"
                isDisabled={!privateAvailable}
                className={
                  privateAvailable
                    ? "group relative flex cursor-pointer items-start gap-3 rounded-2xl border border-default-100 bg-default-50/60 p-4 transition-colors hover:border-violet-300 data-[selected]:border-violet-400 data-[selected]:bg-violet-50/60 dark:border-zinc-700 dark:bg-zinc-800/40 dark:hover:border-violet-500 dark:data-[selected]:border-violet-500 dark:data-[selected]:bg-violet-900/30"
                    : "group relative flex cursor-not-allowed items-start gap-3 rounded-2xl border border-default-100 bg-default-50/40 p-4 opacity-60 dark:border-zinc-700 dark:bg-zinc-800/40"
                }
              >
                <RadioControl className="mt-0.5">
                  <RadioIndicator />
                </RadioControl>
                <RadioContent className="flex min-w-0 flex-col">
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-default-700 dark:text-zinc-200">
                    <Lock size={12} />
                    {ui.debates.create.visibilityPrivate}
                  </span>
                  <span className="text-xs text-default-500 dark:text-zinc-400">
                    {privateAvailable
                      ? ui.debates.create.visibilityPrivateHint
                      : ui.debates.create.visibilityPrivateLocked}
                  </span>
                </RadioContent>
              </Radio>
            </div>
          </RadioGroup>

          <RadioGroup
            value={language}
            onChange={(value) => setLanguage(value as DebateLanguage)}
            isDisabled={submitting}
            aria-label={ui.debates.create.languageLabel}
            className="space-y-2"
          >
            <Label className="text-sm font-medium text-default-800 dark:text-zinc-200">
              {ui.debates.create.languageLabel}
            </Label>
            <div className="grid gap-3 sm:grid-cols-2">
              <Radio
                value={DebateLanguage.Pl}
                className="group relative flex cursor-pointer items-center gap-3 rounded-2xl border border-default-100 bg-default-50/60 p-4 transition-colors hover:border-violet-300 data-[selected]:border-violet-400 data-[selected]:bg-violet-50/60 dark:border-zinc-700 dark:bg-zinc-800/40 dark:hover:border-violet-500 dark:data-[selected]:border-violet-500 dark:data-[selected]:bg-violet-900/30"
              >
                <RadioControl>
                  <RadioIndicator />
                </RadioControl>
                <RadioContent className="flex min-w-0 flex-col">
                  <span className="text-sm font-semibold text-default-900 dark:text-zinc-100">
                    {ui.debates.create.languagePl}
                  </span>
                </RadioContent>
              </Radio>

              <Radio
                value={DebateLanguage.En}
                className="group relative flex cursor-pointer items-center gap-3 rounded-2xl border border-default-100 bg-default-50/60 p-4 transition-colors hover:border-violet-300 data-[selected]:border-violet-400 data-[selected]:bg-violet-50/60 dark:border-zinc-700 dark:bg-zinc-800/40 dark:hover:border-violet-500 dark:data-[selected]:border-violet-500 dark:data-[selected]:bg-violet-900/30"
              >
                <RadioControl>
                  <RadioIndicator />
                </RadioControl>
                <RadioContent className="flex min-w-0 flex-col">
                  <span className="text-sm font-semibold text-default-900 dark:text-zinc-100">
                    {ui.debates.create.languageEn}
                  </span>
                </RadioContent>
              </Radio>
            </div>
            <p className="text-xs text-default-400 dark:text-zinc-500">
              {ui.debates.create.languageHint}
            </p>
          </RadioGroup>

          {formError ? (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
            >
              {formError}
            </div>
          ) : null}

          <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-end">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onPress={() => navigate(backTarget)}
              isDisabled={submitting}
            >
              {ui.debates.create.cancel}
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isDisabled={submitting}
            >
              {submitting
                ? ui.debates.create.submitting
                : ui.debates.create.submit}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
