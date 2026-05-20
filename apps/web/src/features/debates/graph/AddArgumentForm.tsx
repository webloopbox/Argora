import { useEffect, useState } from "react";
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
import { Bot, CornerUpRight, Sparkles, ThumbsDown, ThumbsUp } from "lucide-react";
import type { ArgumentDto, CreateArgumentDto, LlmProviderDto } from "@brainstorm/core";
import { ArgumentSide } from "@brainstorm/core";
import { createArgument } from "../../../api/arguments.api";
import { checkDuplicate, generateArgument, listProviders } from "../../../api/ai.api";
import { ui } from "../../../texts/ui";
import { MergeOrNuanceDialog } from "./MergeOrNuanceDialog";

const CONTENT_MIN = 4;
const CONTENT_MAX = 2000;

interface AddArgumentFormProps {
  debateId: string;
  thesis: string;
  parent: ArgumentDto | null;
  defaultSide?: ArgumentSide;
  onClearParent: () => void;
  onCreated: (created: ArgumentDto) => void;
  onCancel?: () => void;
}

type SideValue = "pro" | "against";

export function AddArgumentForm({
  debateId,
  thesis,
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
  const [aiError, setAiError] = useState<string | null>(null);

  // Duplicate dialog
  const [duplicate, setDuplicate] = useState<ArgumentDto | null>(null);
  const [pendingPayload, setPendingPayload] = useState<CreateArgumentDto | null>(null);

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
    if (trimmed.length < CONTENT_MIN) return ui.debates.argumentForm.contentTooShort;
    if (trimmed.length > CONTENT_MAX) return ui.debates.argumentForm.contentTooLong;
    return null;
  }

  async function handleGenerate() {
    if (!modelId) return;
    setGenerating(true);
    setAiError(null);
    try {
      const result = await generateArgument({
        debateId,
        thesis,
        side: side === "pro" ? ArgumentSide.Pro : ArgumentSide.Against,
        modelId,
        parentContent: parent?.content,
      });
      setContent(result.content);
    } catch {
      setAiError(ui.debates.argumentForm.aiGenerateError);
    } finally {
      setGenerating(false);
    }
  }

  async function submitWithPayload(payload: CreateArgumentDto) {
    setSubmitting(true);
    setFormError(null);
    try {
      const created = await createArgument(debateId, payload);
      setContent("");
      onCreated(created);
    } catch {
      setFormError(ui.debates.argumentForm.genericError);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationError = validate();
    setContentError(validationError);
    if (validationError) return;

    const payload: CreateArgumentDto = {
      side: side === "pro" ? ArgumentSide.Pro : ArgumentSide.Against,
      content: content.trim(),
      parentArgumentId: parent?.id ?? null,
      isAiGenerated: aiMode,
    };

    // Duplicate check gate — mandatory per CLAUDE.md
    setSubmitting(true);
    setFormError(null);
    try {
      const dupResult = await checkDuplicate({
        debateId,
        side: payload.side,
        content: payload.content,
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

    await submitWithPayload(payload);
  }

  const charsLeft = CONTENT_MAX - content.length;
  const submitLabel =
    side === "pro"
      ? ui.debates.argumentForm.submitPro
      : ui.debates.argumentForm.submitAgainst;

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {parent ? (
          <div className="rounded-2xl border border-violet-200 bg-violet-50/60 p-3 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 font-medium text-violet-700">
                <CornerUpRight size={12} />
                {ui.debates.graph.replyingToEyebrow}
              </span>
              <button
                type="button"
                onClick={onClearParent}
                className="rounded-md text-violet-700 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
              >
                {ui.debates.graph.attachToThesis}
              </button>
            </div>
            <p className="mt-1.5 line-clamp-3 text-sm text-default-700">
              {parent.content}
            </p>
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
              className="group relative flex cursor-pointer items-center gap-2 rounded-2xl border border-default-100 bg-default-50/60 p-3 text-sm leading-none transition-colors hover:border-pro-300 data-[selected]:border-pro-400 data-[selected]:bg-pro-50/70"
            >
              <RadioControl className="shrink-0 self-center">
                <RadioIndicator />
              </RadioControl>
              <RadioContent className="flex items-center gap-1.5 font-semibold leading-none text-default-900">
                <ThumbsUp size={12} className="text-pro-600" />
                <span>{ui.debates.argumentForm.sidePro}</span>
              </RadioContent>
            </Radio>
            <Radio
              value="against"
              className="group relative flex cursor-pointer items-center gap-2 rounded-2xl border border-default-100 bg-default-50/60 p-3 text-sm leading-none transition-colors hover:border-against-300 data-[selected]:border-against-400 data-[selected]:bg-against-50/70"
            >
              <RadioControl className="shrink-0 self-center">
                <RadioIndicator />
              </RadioControl>
              <RadioContent className="flex items-center gap-1.5 font-semibold leading-none text-default-900">
                <ThumbsDown size={12} className="text-against-600" />
                <span>{ui.debates.argumentForm.sideAgainst}</span>
              </RadioContent>
            </Radio>
          </div>
        </RadioGroup>

        {/* AI generation section */}
        <div className="rounded-2xl border border-default-100 bg-default-50/40 p-3">
          <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-default-700">
            <input
              type="checkbox"
              checked={aiMode}
              onChange={(e) => {
                setAiMode(e.target.checked);
                setAiError(null);
              }}
              className="rounded accent-violet-600"
            />
            <Bot size={12} className="text-violet-600" />
            {ui.debates.argumentForm.aiToggleLabel}
          </label>

          {aiMode ? (
            <div className="mt-3 space-y-2">
              <div className="flex gap-2">
                <select
                  value={modelId}
                  onChange={(e) => setModelId(e.target.value)}
                  disabled={generating || providers.length === 0}
                  className="flex-1 rounded-xl border border-default-200 bg-white px-2.5 py-1.5 text-xs text-default-900 focus:outline-none focus:ring-2 focus:ring-violet-400 disabled:opacity-50"
                >
                  {providers.length === 0 ? (
                    <option value="">{ui.debates.argumentForm.aiNoProviders}</option>
                  ) : (
                    providers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))
                  )}
                </select>
                <button
                  type="button"
                  onClick={() => void handleGenerate()}
                  disabled={generating || !modelId}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700 transition-colors hover:bg-violet-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Sparkles size={11} />
                  {generating
                    ? ui.debates.argumentForm.aiGenerating
                    : ui.debates.argumentForm.aiGenerateButton}
                </button>
              </div>
              {aiError ? (
                <p className="text-[11px] text-red-600">{aiError}</p>
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
            {submitting
              ? ui.debates.argumentForm.submitting
              : submitLabel}
          </Button>
        </div>
      </form>

      {duplicate && pendingPayload ? (
        <MergeOrNuanceDialog
          original={duplicate}
          newContent={pendingPayload.content}
          onMerged={() => {
            setDuplicate(null);
            setPendingPayload(null);
            setContent("");
            // Notify parent that the interaction is "done" — user chose merge
            // so no new argument is created; close the panel.
            onCancel?.();
          }}
          onNuance={() => {
            const payload = pendingPayload;
            setDuplicate(null);
            setPendingPayload(null);
            void submitWithPayload(payload);
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
