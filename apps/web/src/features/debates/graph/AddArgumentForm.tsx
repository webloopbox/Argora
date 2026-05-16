import { useState } from "react";
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
import { CornerUpRight, ThumbsDown, ThumbsUp } from "lucide-react";
import type { ArgumentDto, CreateArgumentDto } from "@brainstorm/core";
import { ArgumentSide } from "@brainstorm/core";
import { createArgument } from "../../../api/arguments.api";
import { ui } from "../../../texts/ui";

const CONTENT_MIN = 4;
const CONTENT_MAX = 2000;

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

  function validate(): string | null {
    const trimmed = content.trim();
    if (trimmed.length < CONTENT_MIN)
      return ui.debates.argumentForm.contentTooShort;
    if (trimmed.length > CONTENT_MAX)
      return ui.debates.argumentForm.contentTooLong;
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationError = validate();
    setContentError(validationError);
    if (validationError) return;

    setSubmitting(true);
    setFormError(null);
    try {
      const payload: CreateArgumentDto = {
        side: side === "pro" ? ArgumentSide.Pro : ArgumentSide.Against,
        content: content.trim(),
        parentArgumentId: parent?.id ?? null,
      };
      const created = await createArgument(debateId, payload);
      setContent("");
      onCreated(created);
    } catch {
      setFormError(ui.debates.argumentForm.genericError);
    } finally {
      setSubmitting(false);
    }
  }

  const charsLeft = CONTENT_MAX - content.length;
  const submitLabel =
    side === "pro"
      ? ui.debates.argumentForm.submitPro
      : ui.debates.argumentForm.submitAgainst;

  return (
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
        isDisabled={submitting}
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

      <TextField
        value={content}
        onChange={setContent}
        isInvalid={!!contentError}
        isDisabled={submitting}
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
            isDisabled={submitting}
            onPress={onCancel}
          >
            {ui.debates.argumentForm.cancel}
          </Button>
        ) : null}
        <Button
          type="submit"
          variant="primary"
          size="md"
          isDisabled={submitting}
        >
          {submitting ? ui.debates.argumentForm.submitting : submitLabel}
        </Button>
      </div>
    </form>
  );
}
