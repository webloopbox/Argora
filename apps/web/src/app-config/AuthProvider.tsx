import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { LoginDto, RegisterDto, UserDto } from "@brainstorm/core";
import {
  fetchCurrentUser,
  loginRequest,
  registerRequest,
} from "../api/auth.api";
import { onUnauthorized, tokenStore } from "../api/http-client";
import { AuthContext, type AuthState, type AuthStatus } from "./auth-context";

// Lazy initial state lets us decide bootstrap status synchronously
// before the first render: when there is no token we can declare the
// provider "ready" immediately and skip the verify effect entirely.
function initialStatus(): AuthStatus {
  return tokenStore.read() ? "loading" : "ready";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserDto | null>(null);
  const [status, setStatus] = useState<AuthStatus>(initialStatus);

  // Bootstrap: re-verify a leftover token against /users/me before
  // trusting it. A locally valid JWT can still be rejected by the server
  // (revoked / user archived) so sign-in state must match server reality.
  // Effect only runs when there is something to verify; otherwise the
  // initialStatus() already set "ready" and we never enter this branch.
  useEffect(() => {
    if (status !== "loading") return;
    let cancelled = false;
    fetchCurrentUser()
      .then((profile) => {
        if (!cancelled) setUser(profile);
      })
      .catch(() => {
        if (!cancelled) {
          tokenStore.clear();
          setUser(null);
        }
      })
      .finally(() => {
        if (!cancelled) setStatus("ready");
      });
    return () => {
      cancelled = true;
    };
  }, [status]);

  // Server-side 401 from any endpoint forces a local sign-out so the
  // UI never lingers in a "logged in" state with a stale token.
  useEffect(() => {
    return onUnauthorized(() => {
      setUser(null);
    });
  }, []);

  const login = useCallback(async (input: LoginDto) => {
    const { accessToken } = await loginRequest(input);
    tokenStore.write(accessToken);
    const profile = await fetchCurrentUser();
    setUser(profile);
  }, []);

  const register = useCallback(async (input: RegisterDto) => {
    const { accessToken } = await registerRequest(input);
    tokenStore.write(accessToken);
    const profile = await fetchCurrentUser();
    setUser(profile);
  }, []);

  const signOut = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      status,
      user,
      isAuthenticated: user !== null,
      displayName: user?.displayName ?? null,
      login,
      register,
      signOut,
    }),
    [status, user, login, register, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
