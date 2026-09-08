import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
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
import {
  Bot,
  ChevronDown,
  CornerUpRight,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import type {
  ArgumentDto,
  CreateArgumentDto,
  LlmProviderDto,
} from "@brainstorm/core";
import { ARGUMENT_MAX, ARGUMENT_MIN, ArgumentSide } from "@brainstorm/core";
import { createArgument } from "../../../api/arguments.api";
import {
  checkArgumentSide,
  checkDuplicate,
  generateArgument,
  listProviders,
} from "../../../api/ai.api";
import { apiErrorMessage } from "../../../api/http-client";
import { useTypewriter } from "../../../hooks/useTypewriter";
import { ui } from "../../../texts/ui";
import { MergeOrNuanceDialog } from "./MergeOrNuanceDialog";
import { SideMismatchDialog } from "./SideMismatchDialog";
import { ModelPicker } from "./ModelPicker";


interface AddArgumentFormProps {
  debateId: string;
  parent: ArgumentDto | null;
  defaultSide?: ArgumentSide;
  onClearParent: () => void;
  onCreated: (created: ArgumentDto) => void;
  onCancel?: () => void;
}

type SideValue = "pro" | "against";

export function AddArgumentForm({
  debateId,
  parent,
  defaultSide,
  onClearParent,
  onCreated,
  onCancel,
}: AddArgumentFormProps) {
  const [side, setSide] = useState<SideValue>(
    (defaultSide as SideValue | undefined) ?? "pro",
  );
  const [content, setContent] = useState("");
  const [contentError, setContentError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // AI generation
  const [aiMode, setAiMode] = useState(false);
  const [providers, setProviders] = useState<LlmProviderDto[]>([]);
  const [modelId, setModelId] = useState("");
  const [generating, setGenerating] = useState(false);
  // Provenance of the text currently in the textarea, not the state of the
  // toggle: an argument typed by hand while the panel happens to be open
  // must not be badged as model output, and a proposal kept after the
  // toggle is switched off still is one.
  const [fromModel, setFromModel] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Duplicate dialog
  const [duplicate, setDuplicate] = useState<ArgumentDto | null>(null);
  const [pendingPayload, setPendingPayload] =
    useState<CreateArgumentDto | null>(null);

  // Side mismatch dialog
  const [sideMismatch, setSideMismatch] = useState<ArgumentSide | null>(null);

  // Parent preview expand/collapse - long parents clamp to 3 lines otherwise.
  // `parentClamped` is measured from actual overflow (scrollHeight vs
  // clientHeight) rather than a character-count guess, because the sidebar is
  // narrow and a clamped block can hold far fewer chars than expected.
  // Expansion is stored as "which parent is expanded" rather than a boolean, so
  // switching to another parent collapses the preview by derivation instead of
  // by resetting state from an effect.
  const [expandedParentId, setExpandedParentId] = useState<string | null>(null);
  const parentExpanded = parent !== null && expandedParentId === parent.id;
  const [parentClamped, setParentClamped] = useState(false);
  const parentTextRef = useRef<HTMLParagraphElement>(null);

  // Typewriter animation for AI-generated content. The textarea stays
  // disabled (generating=true) while the animation plays so the user
  // doesn't fight the streaming cursor.
  const { animate: animateContent } = useTypewriter(setContent);

  // Re-measure overflow whenever the parent changes. Measuring against the
  // clamped element tells us whether a "show more" toggle is actually needed
  // for this specific content + container width. The measurement has to live
  // in an effect because it reads the laid-out DOM (scrollHeight vs
  // clientHeight); the expand/collapse state itself is derived during render
  // from `expandedParentId` above.
  //
  // No reset when `parent` is null: the whole preview is rendered inside a
  // `parent ?` branch, so a stale value is unobservable, and the next parent
  // re-measures synchronously below before it can be read.
  useEffect(() => {
    const el = parentTextRef.current;
    if (!parent || !el) return;
    const measure = () =>
      setParentClamped(el.scrollHeight > el.clientHeight + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [parent?.id, parent?.content]);

  useEffect(() => {
    if (!aiMode || providers.length > 0) return;
    listProviders()
      .then((list) => {
        setProviders(list);
        if (list.length > 0) setModelId(list[0]!.id);
      })
      .catch(() => {});
  }, [aiMode]);

  function validate(): string | null {
    const trimmed = content.trim();
    if (trimmed.length < ARGUMENT_MIN)
      return ui.debates.argumentForm.contentTooShort;
    if (trimmed.length > ARGUMENT_MAX)
      return ui.debates.argumentForm.contentTooLong;
    return null;
  }

  async function handleGenerate() {
    if (!modelId) return;
    setGenerating(true);
    setAiError(null);
    try {
      const result = await generateArgument({
        debateId,
        side: side === "pro" ? ArgumentSide.Pro : ArgumentSide.Against,
        modelId,
        parentContent: parent?.content,
      });
      // Hold `generating` for the typewriter so the textarea stays locked
      // until the streaming animation completes.
      setFromModel(true);
      animateContent(result.content, () => setGenerating(false));
    } catch (err) {
      setAiError(apiErrorMessage(err) ?? ui.debates.argumentForm.aiGenerateError);
      setGenerating(false);
    }
  }

  async function submitWithPayload(payload: CreateArgumentDto) {
    setSubmitting(true);
    setFormError(null);
    try {
      const created = await createArgument(debateId, payload);
      setContent("");
      setFromModel(false);
      onCreated(created);
    } catch {
      setFormError(ui.debates.argumentForm.genericError);
    } finally {
      setSubmitting(false);
    }
  }

  // Side-mismatch gate — runs the AI check and either shows the mismatch
  // dialog (halting submission) or proceeds to the final submit.  Every
  // submission path must go through this function so the check is never
  // accidentally bypassed (e.g. after the duplicate-check nuance path).
  async function submitWithSideCheck(payload: CreateArgumentDto) {
    setSubmitting(true);
    try {
      const sideResult = await checkArgumentSide({
        debateId,
        selectedSide: payload.side,
        content: payload.content,
        parentContent: parent?.content,
        // The server needs the id, not just the text: `selectedSide` is relative
        // to this parent, while the model is asked about the thesis, and
        // reconciling the two means walking the parent chain.
        parentArgumentId: payload.parentArgumentId ?? null,
      });
      if (sideResult.isMismatch && sideResult.suggestedSide) {
        setSideMismatch(sideResult.suggestedSide);
        setPendingPayload(payload);
        setSubmitting(false);
        return;
      }
    } catch {
      // If the check fails, allow submission to proceed.
    }
    setSubmitting(false);
    await submitWithPayload(payload);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationError = validate();
    setContentError(validationError);
    if (validationError) return;

    const parentId = typeof parent?.id === "string" ? parent.id : null;

    const payload: CreateArgumentDto = {
      side: side === "pro" ? ArgumentSide.Pro : ArgumentSide.Against,
      content: content.trim(),
      parentArgumentId: parentId,
      isAiGenerated: fromModel,
    };

    // Duplicate check gate
    setSubmitting(true);
    setFormError(null);
    try {
      const dupResult = await checkDuplicate({
        debateId,
        side: payload.side,
        content: payload.content,
        parentArgumentId: parentId,
      });
      if (dupResult.duplicateOf) {
        setDuplicate(dupResult.duplicateOf);
        setPendingPayload(payload);
        setSubmitting(false);
        return;
      }
    } catch {
      // If the check fails, allow submission to proceed.
    }
    setSubmitting(false);

    await submitWithSideCheck(payload);
  }

  const charsLeft = ARGUMENT_MAX - content.length;
  const submitLabel =
    side === "pro"
      ? ui.debates.argumentForm.submitPro
      : ui.debates.argumentForm.submitAgainst;

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {parent ? (
          <div className="rounded-2xl border border-violet-200 bg-violet-50/60 p-3 text-xs dark:border-violet-800 dark:bg-violet-900/20">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 font-medium text-violet-700 dark:text-violet-300">
                <CornerUpRight size={12} />
                {ui.debates.graph.replyingToEyebrow}
              </span>
              <button
                type="button"
                onClick={onClearParent}
                className="rounded-md text-violet-700 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 dark:text-violet-400"
              >
                {ui.debates.graph.attachToThesis}
              </button>
            </div>
            <p
              ref={parentTextRef}
              className={`mt-1.5 text-sm text-default-700 dark:text-zinc-300 ${
                parentExpanded ? "" : "line-clamp-3"
              }`}
            >
              {parent.content}
            </p>
            {parentClamped || parentExpanded ? (
              <button
                type="button"
                onClick={() =>
                  setExpandedParentId(parentExpanded ? null : parent.id)
                }
                className="mt-1 inline-flex items-center gap-1 rounded-md text-[11px] font-medium text-violet-700 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 dark:text-violet-400"
                aria-expanded={parentExpanded}
              >
                <ChevronDown
                  size={11}
                  className={`shrink-0 transition-transform duration-150 ${
                    parentExpanded ? "rotate-180" : ""
                  }`}
                />
                {parentExpanded
                  ? ui.debates.graph.parentShowLess
                  : ui.debates.graph.parentShowMore}
              </button>
            ) : null}
          </div>
        ) : (
          <p className="text-xs text-default-500">
            {ui.debates.graph.thesisSelectedHint}
          </p>
        )}

        <RadioGroup
          value={side}
          onChange={(value) => setSide(value as SideValue)}
          isDisabled={submitting || generating}
          aria-label={ui.debates.argumentForm.sideLabel}
          className="space-y-2"
        >
          <Label className="text-sm font-medium text-default-800">
            {ui.debates.argumentForm.sideLabel}
          </Label>
          <div className="grid grid-cols-2 gap-2">
            <Radio
              value="pro"
              className="group relative flex cursor-pointer items-center gap-2 rounded-2xl border border-default-100 bg-default-50/60 p-3 text-sm leading-none transition-colors hover:border-pro-300 data-[selected]:border-pro-400 data-[selected]:bg-pro-50/70 dark:border-zinc-700 dark:bg-zinc-800/60 dark:hover:border-pro-600 dark:data-[selected]:border-pro-500 dark:data-[selected]:bg-pro-900/30"
            >
              <RadioControl className="shrink-0 self-center">
                <RadioIndicator />
              </RadioControl>
              <RadioContent className="flex items-center gap-1.5 font-semibold leading-none text-default-900 dark:text-zinc-100">
                <ThumbsUp
                  size={12}
                  className="text-pro-600 dark:text-pro-400"
                />
                <span>{ui.debates.argumentForm.sidePro}</span>
              </RadioContent>
            </Radio>
            <Radio
              value="against"
              className="group relative flex cursor-pointer items-center gap-2 rounded-2xl border border-default-100 bg-default-50/60 p-3 text-sm leading-none transition-colors hover:border-against-300 data-[selected]:border-against-400 data-[selected]:bg-against-50/70 dark:border-zinc-700 dark:bg-zinc-800/60 dark:hover:border-against-600 dark:data-[selected]:border-against-500 dark:data-[selected]:bg-against-900/30"
            >
              <RadioControl className="shrink-0 self-center">
                <RadioIndicator />
              </RadioControl>
              <RadioContent className="flex items-center gap-1.5 font-semibold leading-none text-default-900 dark:text-zinc-100">
                <ThumbsDown
                  size={12}
                  className="text-against-600 dark:text-against-400"
                />
                <span>{ui.debates.argumentForm.sideAgainst}</span>
              </RadioContent>
            </Radio>
          </div>
        </RadioGroup>

        {/* AI generation section */}
        <div className="rounded-2xl border border-default-100 bg-default-50/40 p-3 dark:border-zinc-700 dark:bg-zinc-800/40">
          <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-default-700 dark:text-zinc-300">
            <input
              type="checkbox"
              checked={aiMode}
              onChange={(e) => {
                setAiMode(e.target.checked);
                setAiError(null);
              }}
              className="rounded accent-violet-600"
            />
            <Bot size={12} className="text-violet-600 dark:text-violet-400" />
            {ui.debates.argumentForm.aiToggleLabel}
          </label>

          {aiMode ? (
            <div className="mt-3 space-y-2">
              <div className="flex gap-2">
                <ModelPicker
                  providers={providers}
                  value={modelId}
                  onChange={setModelId}
                  disabled={generating}
                />
                <button
                  type="button"
                  onClick={() => void handleGenerate()}
                  disabled={generating || !modelId}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700 transition-colors hover:bg-violet-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-violet-700 dark:bg-violet-900/30 dark:text-violet-300 dark:hover:bg-violet-900/50"
                >
                  <Sparkles size={11} />
                  {generating
                    ? ui.debates.argumentForm.aiGenerating
                    : ui.debates.argumentForm.aiGenerateButton}
                </button>
              </div>
              {aiError ? (
                <p className="text-[11px] text-red-600 dark:text-red-400">
                  {aiError}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        <TextField
          value={content}
          onChange={setContent}
          isInvalid={!!contentError}
          isDisabled={submitting || generating}
          fullWidth
        >
          <div className="flex items-baseline justify-between">
            <Label>{ui.debates.argumentForm.contentLabel}</Label>
            <span
              className={`text-xs ${
                charsLeft < 0 ? "text-against-600" : "text-default-400"
              }`}
            >
              {charsLeft}
            </span>
          </div>
          <TextArea
            rows={5}
            placeholder={ui.debates.argumentForm.contentPlaceholder}
          />
          {contentError ? <FieldError>{contentError}</FieldError> : null}
        </TextField>

        {formError ? (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
          >
            {formError}
          </div>
        ) : null}

        <div className="flex flex-col-reverse items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end">
          {onCancel ? (
            <Button
              type="button"
              variant="outline"
              size="md"
              isDisabled={submitting || generating}
              onPress={onCancel}
            >
              {ui.debates.argumentForm.cancel}
            </Button>
          ) : null}
          <Button
            type="submit"
            variant="primary"
            size="md"
            isDisabled={submitting || generating}
          >
            {submitting ? ui.debates.argumentForm.submitting : submitLabel}
          </Button>
        </div>
      </form>

      {sideMismatch && pendingPayload ? (
        <SideMismatchDialog
          selectedSide={pendingPayload.side}
          suggestedSide={sideMismatch}
          argumentContent={pendingPayload.content}
          onSwitch={() => {
            const switched = { ...pendingPayload, side: sideMismatch };
            setSideMismatch(null);
            setPendingPayload(null);
            setSide(sideMismatch === ArgumentSide.Pro ? "pro" : "against");
            void submitWithPayload(switched);
          }}
          onKeepOriginal={() => {
            const payload = pendingPayload;
            setSideMismatch(null);
            setPendingPayload(null);
            void submitWithPayload(payload);
          }}
          onClose={() => {
            setSideMismatch(null);
            setPendingPayload(null);
          }}
        />
      ) : null}

      {duplicate && pendingPayload ? (
        <MergeOrNuanceDialog
          original={duplicate}
          newContent={pendingPayload.content}
          onMerged={() => {
            setDuplicate(null);
            setPendingPayload(null);
            setContent("");
            setFromModel(false);
            // Notify parent that the interaction is "done" - user chose merge
            // so no new argument is created; close the panel.
            onCancel?.();
          }}
          onNuance={() => {
            const payload = pendingPayload;
            setDuplicate(null);
            setPendingPayload(null);
            void submitWithSideCheck(payload);
          }}
          onClose={() => {
            setDuplicate(null);
            setPendingPayload(null);
          }}
        />
      ) : null}
    </>
  );
}
