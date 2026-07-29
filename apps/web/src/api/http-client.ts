import axios, { AxiosError } from "axios";
import type { AxiosRequestConfig, InternalAxiosRequestConfig } from "axios";
import { toast } from "sonner";
import { ui } from "../texts/ui";

const TOKEN_STORAGE_KEY = "brainstorm.token";

const baseURL =
  (import.meta.env.VITE_API_URL as string | undefined) ??
  "http://localhost:3000";

// Per-request flag: passing `{ silent: true }` in a request config suppresses
// the centralised error toast. Use for endpoints whose pages already render
// an inline error state (auth forms, debate detail 404/403 etc).
declare module "axios" {
  export interface AxiosRequestConfig {
    silent?: boolean;
  }
}

export const httpClient = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

export const tokenStore = {
  read(): string | null {
    try {
      return window.localStorage.getItem(TOKEN_STORAGE_KEY);
    } catch {
      return null;
    }
  },
  write(token: string): void {
    try {
      window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } catch {
      /* storage unavailable - session lives only in memory */
    }
  },
  clear(): void {
    try {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch {
      /* ignored */
    }
  },
};

type UnauthorizedHandler = () => void;
const unauthorizedHandlers = new Set<UnauthorizedHandler>();

export function onUnauthorized(handler: UnauthorizedHandler): () => void {
  unauthorizedHandlers.add(handler);
  return () => unauthorizedHandlers.delete(handler);
}

httpClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStore.read();
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const config = error.config as
      | (AxiosRequestConfig & { silent?: boolean })
      | undefined;

    if (error.response?.status === 401) {
      tokenStore.clear();
      unauthorizedHandlers.forEach((fn) => fn());
      // Silent on 401 - the redirect to login is the user-visible signal.
      return Promise.reject(error);
    }

    if (config?.silent) {
      return Promise.reject(error);
    }

    toast.error(messageFor(error));
    return Promise.reject(error);
  },
);

function messageFor(error: AxiosError): string {
  if (!error.response) return ui.toast.networkError;
  const status = error.response.status;
  const serverMessage = extractServerMessage(error.response.data);
  if (serverMessage) return serverMessage;
  if (status === 403) return ui.toast.forbidden;
  if (status === 404) return ui.toast.notFound;
  if (status === 429) return ui.toast.rateLimited;
  if (status >= 400 && status < 500) return ui.toast.validationError;
  if (status >= 500) return ui.toast.serverError;
  return ui.toast.unknownError;
}

/**
 * The message the API sent for a rejected request, or `null` when it did not send
 * one (network failure, opaque 5xx). For panels that render an inline error state
 * next to the failed action and would otherwise flatten every cause into one
 * generic sentence - a rate limit reads very differently from a real outage.
 * The centralised toast still fires; this only sharpens the inline copy.
 */
export function apiErrorMessage(error: unknown): string | null {
  if (!axios.isAxiosError(error)) return null;
  return extractServerMessage(error.response?.data);
}

function extractServerMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const message = (payload as { message?: unknown }).message;
  if (typeof message === "string") return message;
  if (Array.isArray(message) && typeof message[0] === "string")
    return message[0];
  return null;
}
