import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./layout/AppShell";
import { DashboardPage } from "./features/dashboard/DashboardPage";
import { GroupsPage } from "./features/groups/GroupsPage";
import { InvitationsPage } from "./features/invitations/InvitationsPage";

function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/grupy" element={<GroupsPage />} />
        <Route path="/zaproszenia" element={<InvitationsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
