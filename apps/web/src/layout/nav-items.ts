import type { LucideIcon } from "lucide-react";
import { Compass, Mail, Users } from "lucide-react";
import { ui } from "../texts/ui";

export interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
  requiresAuth?: boolean;
}

export const navItems: NavItem[] = [
  { path: "/", label: ui.nav.discover, icon: Compass },
  { path: "/grupy", label: ui.nav.groups, icon: Users, requiresAuth: true },
  { path: "/zaproszenia", label: ui.nav.invitations, icon: Mail, requiresAuth: true },
];
