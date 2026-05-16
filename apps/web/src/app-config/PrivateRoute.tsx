import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./auth-context";

// Wrap pages that require a signed-in user. Routing decisions wait until
// AuthProvider has finished its bootstrap so a still-loading session
// doesn't get bounced to /logowanie on the first render after refresh.
export function PrivateRoute({ children }: { children: ReactNode }) {
  const { status, isAuthenticated } = useAuth();
  const location = useLocation();

  if (status !== "ready") {
    return null;
  }

  if (!isAuthenticated) {
    const redirect = `${location.pathname}${location.search}`;
    return (
      <Navigate
        to={`/logowanie?redirect=${encodeURIComponent(redirect)}`}
        replace
      />
    );
  }

  return children;
}
