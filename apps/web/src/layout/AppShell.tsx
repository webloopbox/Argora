import { Outlet } from "react-router-dom";
import { TopBar } from "./TopBar";

export function AppShell() {
  return (
    <div className="relative flex min-h-full flex-col bg-gradient-to-b from-white via-default-50 to-white text-default-900 dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-900 dark:text-zinc-100">
      <TopBar />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
