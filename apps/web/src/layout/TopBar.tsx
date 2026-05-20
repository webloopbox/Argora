import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, Button } from "@heroui/react";
import { Menu, Moon, Sparkles, Sun } from "lucide-react";
import { motion } from "framer-motion";
import { navItems } from "./nav-items";
import { useAuth } from "../app-config/auth-context";
import { useTheme } from "../app-config/theme-context";
import { MobileDrawer } from "./MobileDrawer";
import { ui } from "../texts/ui";

export function TopBar() {
  const { isAuthenticated, displayName, signOut } = useAuth();
  const { theme, toggle: toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const visibleNav = navItems.filter(
    (item) => !item.requiresAuth || isAuthenticated,
  );

  function initialsFor(name: string | null): string {
    if (!name) return "";
    return name
      .split(/\s+/)
      .filter(Boolean)
      .map((p) => p[0]!.toUpperCase())
      .slice(0, 2)
      .join("");
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-default-100 bg-white/70 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/70">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-3 px-4 sm:gap-6 sm:px-6">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label={ui.nav_aria.openMenu}
            className="grid h-9 w-9 place-items-center rounded-xl text-default-700 transition-colors hover:bg-default-100 dark:text-zinc-300 dark:hover:bg-zinc-800 md:hidden"
          >
            <Menu size={18} />
          </button>

          <NavLink to="/" className="group flex items-center gap-2">
            <div className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 text-white shadow-md shadow-violet-500/20 transition-transform group-hover:scale-[1.04]">
              <Sparkles size={18} strokeWidth={2.5} />
            </div>
            <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 bg-clip-text text-lg font-semibold tracking-tight text-transparent">
              {ui.app.name}
            </span>
          </NavLink>

          <nav className="hidden flex-1 md:flex md:items-center md:justify-center">
            <ul className="flex items-center gap-1 rounded-full border border-default-100 bg-default-50/60 p-1 dark:border-zinc-800 dark:bg-zinc-900/60">
              {visibleNav.map((item) => (
                <li key={item.path}>
                  <NavLink to={item.path} end={item.path === "/"}>
                    {({ isActive }) => (
                      <span
                        className={`relative flex items-center gap-2 rounded-full px-4 py-1.5 text-sm transition-colors ${
                          isActive
                            ? "text-default-900 dark:text-zinc-100"
                            : "text-default-500 hover:text-default-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                        }`}
                      >
                        {isActive && (
                          <motion.span
                            layoutId="nav-active-pill"
                            className="absolute inset-0 rounded-full bg-white shadow-sm ring-1 ring-default-200 dark:bg-zinc-800 dark:ring-zinc-700"
                            transition={{ type: "spring", stiffness: 400, damping: 32 }}
                          />
                        )}
                        <item.icon size={14} className="relative" />
                        <span className="relative">{item.label}</span>
                      </span>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={ui.theme.toggle}
              title={ui.theme.toggle}
              className="grid h-9 w-9 place-items-center rounded-xl text-default-600 transition-colors hover:bg-default-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {isAuthenticated ? (
              <>
                <div className="hidden items-center gap-2 sm:flex">
                  <Avatar size="sm">
                    <AvatarFallback>{initialsFor(displayName)}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-default-700 dark:text-zinc-300">
                    {displayName}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onPress={signOut}
                  className="hidden sm:inline-flex"
                >
                  {ui.auth.signOut}
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                variant="primary"
                onPress={() => navigate("/logowanie")}
                className="hidden sm:inline-flex"
              >
                {ui.auth.signIn}
              </Button>
            )}
          </div>
        </div>
      </header>

      <MobileDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        isAuthenticated={isAuthenticated}
        displayName={displayName}
        onSignIn={() => navigate("/logowanie")}
        onSignOut={signOut}
      />
    </>
  );
}
