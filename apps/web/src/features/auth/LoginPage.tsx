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
  email?: string;
  password?: string;
}

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirectTo = params.get("redirect") ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (!email.trim()) next.email = ui.auth.validation.required;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      next.email = ui.auth.validation.emailInvalid;
    if (!password) next.password = ui.auth.validation.required;
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
      await login({ email: email.trim(), password });
      navigate(redirectTo, { replace: true });
    } catch (err) {
      const status = err instanceof AxiosError ? err.response?.status : null;
      setFormError(
        status === 401 || status === 400
          ? ui.auth.login.invalidCredentials
          : ui.auth.login.genericError,
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          {ui.auth.login.title}
        </h1>
        <p className="text-sm text-default-500">{ui.auth.login.subtitle}</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <TextField
          value={email}
          onChange={setEmail}
          isInvalid={!!errors.email}
          isDisabled={submitting}
          autoComplete="email"
          fullWidth
        >
          <Label>{ui.auth.login.emailLabel}</Label>
          <Input
            type="email"
            placeholder={ui.auth.login.emailPlaceholder}
            inputMode="email"
            autoFocus
          />
          {errors.email ? <FieldError>{errors.email}</FieldError> : null}
        </TextField>

        <TextField
          value={password}
          onChange={setPassword}
          isInvalid={!!errors.password}
          isDisabled={submitting}
          autoComplete="current-password"
          fullWidth
        >
          <Label>{ui.auth.login.passwordLabel}</Label>
          <Input
            type="password"
            placeholder={ui.auth.login.passwordPlaceholder}
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
          {submitting ? ui.auth.login.submitting : ui.auth.login.submit}
        </Button>
      </form>

      <p className="text-center text-sm text-default-500">
        {ui.auth.login.switchPrompt}{" "}
        <Link
          to="/rejestracja"
          className="font-medium text-violet-600 hover:text-violet-700"
        >
          {ui.auth.login.switchAction}
        </Link>
      </p>
    </div>
  );
}
