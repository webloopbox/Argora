import { useEffect } from "react";
import { NavLink } from "react-router-dom";
import { Avatar, AvatarFallback, Button } from "@heroui/react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { ui } from "../texts/ui";
import { navItems } from "./nav-items";

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  isAuthenticated: boolean;
  displayName: string | null;
  onSignIn: () => void;
  onSignOut: () => void;
}

export function MobileDrawer({
  isOpen,
  onClose,
  isAuthenticated,
  displayName,
  onSignIn,
  onSignOut,
}: MobileDrawerProps) {
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  const visibleNav = navItems.filter((item) => !item.requiresAuth || isAuthenticated);
  const initials = displayName
    ? displayName
        .split(/\s+/)
        .filter(Boolean)
        .map((p) => p[0]!.toUpperCase())
        .slice(0, 2)
        .join("")
    : "";

  return (
    <AnimatePresence>
      {isOpen ? (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] md:hidden"
            onClick={onClose}
          />
          <motion.aside
            key="drawer"
            role="dialog"
            aria-label={ui.nav_aria.openMenu}
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            className="fixed inset-y-0 left-0 z-50 flex w-[min(320px,85vw)] flex-col overflow-hidden bg-white shadow-2xl dark:bg-zinc-950 md:hidden"
          >
            <header className="flex items-center justify-between border-b border-default-100 px-5 py-4 dark:border-zinc-800">
              <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 bg-clip-text text-lg font-semibold tracking-tight text-transparent">
                {ui.app.name}
              </span>
              <button
                type="button"
                onClick={onClose}
                aria-label={ui.nav_aria.closeMenu}
                className="grid h-8 w-8 place-items-center rounded-full text-default-500 transition-colors hover:bg-default-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                <X size={16} />
              </button>
            </header>

            {isAuthenticated ? (
              <div className="flex items-center gap-3 border-b border-default-100 px-5 py-4 dark:border-zinc-800">
                <Avatar size="md">
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-default-800 dark:text-zinc-200">
                  {displayName}
                </span>
              </div>
            ) : null}

            <nav className="flex-1 overflow-y-auto px-3 py-3">
              <ul className="space-y-1">
                {visibleNav.map((item) => (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      end={item.path === "/"}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                          isActive
                            ? "bg-violet-50 font-semibold text-violet-700 dark:bg-violet-900/30 dark:text-violet-200"
                            : "text-default-700 hover:bg-default-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                        }`
                      }
                    >
                      <item.icon size={16} />
                      {item.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>

            <footer className="border-t border-default-100 px-5 py-4 dark:border-zinc-800">
              {isAuthenticated ? (
                <Button
                  variant="outline"
                  size="md"
                  onPress={() => {
                    onClose();
                    onSignOut();
                  }}
                  className="w-full"
                >
                  {ui.auth.signOut}
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="md"
                  onPress={() => {
                    onClose();
                    onSignIn();
                  }}
                  className="w-full"
                >
                  {ui.auth.signIn}
                </Button>
              )}
            </footer>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
