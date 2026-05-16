import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Button,
  FieldError,
  Input,
  Label,
  TextField,
} from "@heroui/react";
import { AxiosError } from "axios";
import { useAuth } from "../../app-config/auth-context";
import { ui } from "../../texts/ui";

interface FieldErrors {
  displayName?: string;
  email?: string;
  password?: string;
}

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirectTo = params.get("redirect") ?? "/";

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (!displayName.trim()) next.displayName = ui.auth.validation.required;
    else if (displayName.trim().length < 2)
      next.displayName = ui.auth.validation.displayNameTooShort;
    if (!email.trim()) next.email = ui.auth.validation.required;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      next.email = ui.auth.validation.emailInvalid;
    if (!password) next.password = ui.auth.validation.required;
    else if (password.length < 8)
      next.password = ui.auth.validation.passwordTooShort;
    return next;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    setFormError(null);
    try {
      await register({
        displayName: displayName.trim(),
        email: email.trim(),
        password,
      });
      navigate(redirectTo, { replace: true });
    } catch (err) {
      const status = err instanceof AxiosError ? err.response?.status : null;
      setFormError(
        status === 409
          ? ui.auth.register.emailTaken
          : ui.auth.register.genericError,
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          {ui.auth.register.title}
        </h1>
        <p className="text-sm text-default-500">{ui.auth.register.subtitle}</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <TextField
          value={displayName}
          onChange={setDisplayName}
          isInvalid={!!errors.displayName}
          isDisabled={submitting}
          autoComplete="name"
          fullWidth
        >
          <Label>{ui.auth.register.displayNameLabel}</Label>
          <Input
            type="text"
            placeholder={ui.auth.register.displayNamePlaceholder}
            autoFocus
          />
          {errors.displayName ? (
            <FieldError>{errors.displayName}</FieldError>
          ) : null}
        </TextField>

        <TextField
          value={email}
          onChange={setEmail}
          isInvalid={!!errors.email}
          isDisabled={submitting}
          autoComplete="email"
          fullWidth
        >
          <Label>{ui.auth.register.emailLabel}</Label>
          <Input
            type="email"
            placeholder={ui.auth.register.emailPlaceholder}
            inputMode="email"
          />
          {errors.email ? <FieldError>{errors.email}</FieldError> : null}
        </TextField>

        <TextField
          value={password}
          onChange={setPassword}
          isInvalid={!!errors.password}
          isDisabled={submitting}
          autoComplete="new-password"
          fullWidth
        >
          <Label>{ui.auth.register.passwordLabel}</Label>
          <Input
            type="password"
            placeholder={ui.auth.register.passwordPlaceholder}
          />
          {errors.password ? <FieldError>{errors.password}</FieldError> : null}
        </TextField>

        {formError ? (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {formError}
          </div>
        ) : null}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          isDisabled={submitting}
        >
          {submitting ? ui.auth.register.submitting : ui.auth.register.submit}
        </Button>
      </form>

      <p className="text-center text-sm text-default-500">
        {ui.auth.register.switchPrompt}{" "}
        <Link
          to="/logowanie"
          className="font-medium text-violet-600 hover:text-violet-700"
        >
          {ui.auth.register.switchAction}
        </Link>
      </p>
    </div>
  );
}
