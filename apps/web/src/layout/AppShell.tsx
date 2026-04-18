import { Outlet } from "react-router-dom";
import { TopBar } from "./TopBar";

export function AppShell() {
  return (
    <div className="relative flex min-h-full flex-col bg-gradient-to-b from-white via-default-50 to-white text-default-900">
      <TopBar />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
