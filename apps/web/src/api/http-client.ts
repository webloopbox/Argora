import axios, { AxiosError } from "axios";
import type { InternalAxiosRequestConfig } from "axios";

const TOKEN_STORAGE_KEY = "brainstorm.token";

const baseURL =
  (import.meta.env.VITE_API_URL as string | undefined) ??
  "http://localhost:3000";

export const httpClient = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

// Token store decoupled from React so axios interceptors can read/write
// without crossing the provider boundary. AuthProvider owns the lifecycle
// (set on login, clear on signOut) and the response interceptor below
// reaches into this same store on 401.
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

// Subscribers receive a callback when the API returns 401 so the auth
// layer can flush its state without holding a direct reference to axios.
type UnauthorizedHandler = () => void;
const unauthorizedHandlers = new Set<UnauthorizedHandler>();

export function onUnauthorized(handler: UnauthorizedHandler): () => void {
  unauthorizedHandlers.add(handler);
  return () => unauthorizedHandlers.delete(handler);
}

httpClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenStore.read();
    if (token) {
      config.headers.set("Authorization", `Bearer ${token}`);
    }
    return config;
  },
);

httpClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      tokenStore.clear();
      unauthorizedHandlers.forEach((fn) => fn());
    }
    return Promise.reject(error);
  },
);
