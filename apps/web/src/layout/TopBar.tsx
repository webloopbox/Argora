import { NavLink, useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, Button } from "@heroui/react";
import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { navItems } from "./nav-items";
import { useAuth } from "../app-config/auth-context";
import { ui } from "../texts/ui";

export function TopBar() {
  const { isAuthenticated, displayName, signOut } = useAuth();
  const navigate = useNavigate();
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
    <header className="sticky top-0 z-40 border-b border-default-100 bg-white/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-6 px-4 sm:px-6">
        <NavLink to="/" className="group flex items-center gap-2">
          <div className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 text-white shadow-md shadow-violet-500/20 transition-transform group-hover:scale-[1.04]">
            <Sparkles size={18} strokeWidth={2.5} />
          </div>
          <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 bg-clip-text text-lg font-semibold tracking-tight text-transparent">
            {ui.app.name}
          </span>
        </NavLink>

        <nav className="hidden flex-1 md:flex md:items-center md:justify-center">
          <ul className="flex items-center gap-1 rounded-full border border-default-100 bg-default-50/60 p-1">
            {visibleNav.map((item) => (
              <li key={item.path}>
                <NavLink to={item.path} end={item.path === "/"}>
                  {({ isActive }) => (
                    <span
                      className={`relative flex items-center gap-2 rounded-full px-4 py-1.5 text-sm transition-colors ${
                        isActive
                          ? "text-default-900"
                          : "text-default-500 hover:text-default-900"
                      }`}
                    >
                      {isActive && (
                        <motion.span
                          layoutId="nav-active-pill"
                          className="absolute inset-0 rounded-full bg-white shadow-sm ring-1 ring-default-200"
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

        <div className="ml-auto flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <div className="hidden items-center gap-2 sm:flex">
                <Avatar size="sm">
                  <AvatarFallback>{initialsFor(displayName)}</AvatarFallback>
                </Avatar>
                <span className="text-sm text-default-700">{displayName}</span>
              </div>
              <Button size="sm" variant="ghost" onPress={signOut}>
                {ui.auth.signOut}
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="primary"
              onPress={() => navigate("/logowanie")}
            >
              {ui.auth.signIn}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
