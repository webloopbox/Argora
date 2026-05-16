import { Navigate, Route, Routes } from "react-router-dom";
import { PrivateRoute } from "./app-config/PrivateRoute";
import { AuthLayout } from "./features/auth/AuthLayout";
import { LoginPage } from "./features/auth/LoginPage";
import { RegisterPage } from "./features/auth/RegisterPage";
import { DashboardPage } from "./features/dashboard/DashboardPage";
import { CreateDebatePage } from "./features/debates/CreateDebatePage";
import { DebatePage } from "./features/debates/DebatePage";
import { GroupsPage } from "./features/groups/GroupsPage";
import { InvitationsPage } from "./features/invitations/InvitationsPage";
import { AppShell } from "./layout/AppShell";

function App() {
  return (
    <Routes>
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
