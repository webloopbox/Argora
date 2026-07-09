import type { LucideIcon } from "lucide-react";
import { Compass, Mail, Users } from "lucide-react";
import { ui } from "../texts/ui";

export interface NavItem {
  readonly path: string;
  readonly label: string;
  readonly icon: LucideIcon;
  readonly requiresAuth?: boolean;
}

// Use getters so labels are re-evaluated on every render (picks up lang changes).
export const navItems: NavItem[] = [
  {
    path: "/",
    get label() { return ui.nav.discover; },
    icon: Compass,
  },
  {
    path: "/grupy",
    get label() { return ui.nav.groups; },
    icon: Users,
    requiresAuth: true,
  },
  {
    path: "/zaproszenia",
    get label() { return ui.nav.invitations; },
    icon: Mail,
    requiresAuth: true,
  },
];
