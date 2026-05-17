import { createContext, useContext } from "react";
import type { ArgumentDto } from "@brainstorm/core";

// Bridges interaction-time concerns (auth state, optimistic updates) from
// DebatePage into the React Flow node components without smuggling
// callbacks through node `data` props (which would force dagre layout to
// resolve identity churn on every render). A single context entry per
// debate keeps the wiring obvious.
export interface DebateGraphContextValue {
  isAuthenticated: boolean;
  onArgumentUpdated: (argument: ArgumentDto) => void;
  onSignInClick: () => void;
}

export const DebateGraphContext =
  createContext<DebateGraphContextValue | null>(null);

export function useDebateGraphContext(): DebateGraphContextValue {
  const ctx = useContext(DebateGraphContext);
  if (!ctx) {
    throw new Error(
      "useDebateGraphContext must be used inside <DebateGraphContext.Provider>",
    );
  }
  return ctx;
}
