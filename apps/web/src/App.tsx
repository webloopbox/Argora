import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useLanguage } from "./app-config/language-context";
import { PrivateRoute } from "./app-config/PrivateRoute";
import { AuthLayout } from "./features/auth/AuthLayout";
import { LoginPage } from "./features/auth/LoginPage";
import { RegisterPage } from "./features/auth/RegisterPage";
import { DashboardPage } from "./features/dashboard/DashboardPage";
import { AppShell } from "./layout/AppShell";
import { ui } from "./texts/ui";

// The dashboard and the two auth screens are the entry points, so they stay in
// the initial bundle. Everything behind them is split out: the debate view
// alone pulls React Flow, dagre and the Markdown renderer, which is the bulk
// of the application code and is dead weight for a visitor who only browses
// the public feed.
const CreateDebatePage = lazy(() =>
  import("./features/debates/CreateDebatePage").then((m) => ({
    default: m.CreateDebatePage,
  })),
);
const DebatePage = lazy(() =>
  import("./features/debates/DebatePage").then((m) => ({
    default: m.DebatePage,
  })),
);
const GroupsPage = lazy(() =>
  import("./features/groups/GroupsPage").then((m) => ({
    default: m.GroupsPage,
  })),
);
const GroupDetailPage = lazy(() =>
  import("./features/groups/GroupDetailPage").then((m) => ({
    default: m.GroupDetailPage,
  })),
);
const InvitationsPage = lazy(() =>
  import("./features/invitations/InvitationsPage").then((m) => ({
    default: m.InvitationsPage,
  })),
);

function RouteFallback() {
  return (
    <div className="grid min-h-[60vh] place-items-center text-sm text-default-500">
      {ui.common.loading}
    </div>
  );
}

function App() {
  // `key={lang}` on Routes forces a full remount of the route tree whenever
  // the language changes, guaranteeing every page component re-renders and
  // picks up fresh strings from the ui Proxy.
  const { lang } = useLanguage();

  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes key={lang}>
        <Route element={<AuthLayout />}>
          <Route path="/logowanie" element={<LoginPage />} />
          <Route path="/rejestracja" element={<RegisterPage />} />
        </Route>

        <Route element={<AppShell />}>
          <Route path="/" element={<DashboardPage />} />
          <Route
            path="/dyskusje/utworz"
            element={
              <PrivateRoute>
                <CreateDebatePage />
              </PrivateRoute>
            }
          />
          <Route path="/dyskusje/:id" element={<DebatePage />} />
          <Route
            path="/grupy"
            element={
              <PrivateRoute>
                <GroupsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/grupy/:id"
            element={
              <PrivateRoute>
                <GroupDetailPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/zaproszenia"
            element={
              <PrivateRoute>
                <InvitationsPage />
              </PrivateRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default App;
