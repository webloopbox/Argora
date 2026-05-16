import { createContext, useContext } from "react";
import type { LoginDto, RegisterDto, UserDto } from "@brainstorm/core";

export type AuthStatus = "idle" | "loading" | "ready";

export interface AuthState {
  status: AuthStatus;
  user: UserDto | null;
  isAuthenticated: boolean;
  displayName: string | null;
  login: (input: LoginDto) => Promise<void>;
  register: (input: RegisterDto) => Promise<void>;
  signOut: () => void;
}

export const AuthContext = createContext<AuthState | null>(null);

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
