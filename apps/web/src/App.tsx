import { Navigate, Route, Routes } from "react-router-dom";
import { useLanguage } from "./app-config/language-context";
import { PrivateRoute } from "./app-config/PrivateRoute";
import { AuthLayout } from "./features/auth/AuthLayout";
import { LoginPage } from "./features/auth/LoginPage";
import { RegisterPage } from "./features/auth/RegisterPage";
import { DashboardPage } from "./features/dashboard/DashboardPage";
import { CreateDebatePage } from "./features/debates/CreateDebatePage";
import { DebatePage } from "./features/debates/DebatePage";
import { GroupDetailPage } from "./features/groups/GroupDetailPage";
import { GroupsPage } from "./features/groups/GroupsPage";
import { InvitationsPage } from "./features/invitations/InvitationsPage";
import { AppShell } from "./layout/AppShell";

function App() {
  // `key={lang}` on Routes forces a full remount of the route tree whenever
  // the language changes, guaranteeing every page component re-renders and
  // picks up fresh strings from the ui Proxy.
  const { lang } = useLanguage();

  return (
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
  );
}

export default App;
