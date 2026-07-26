// Structure de navigation du CRM de prospection internationale.
// `href` présent + `disabled` absent = page réelle. Les entrées `disabled` sont des
// pages prévues (prochaines phases) mais pas encore construites : visibles pour la
// cohérence de la maquette, non cliquables.
import {
  LayoutDashboard,
  Globe2,
  Building2,
  Contact,
  Megaphone,
  CheckSquare,
  BellRing,
  BarChart3,
  FileText,
  TrendingUp,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href?: string;
  icon: LucideIcon;
  disabled?: boolean;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Prospection",
    items: [
      { label: "Tableau de bord", href: "/", icon: LayoutDashboard },
      { label: "Prospects", href: "/prospects", icon: Globe2 },
      { label: "Entreprises", icon: Building2, disabled: true },
      { label: "Contacts", icon: Contact, disabled: true },
      { label: "Campagnes", icon: Megaphone, disabled: true },
      { label: "Tâches", icon: CheckSquare, disabled: true },
      { label: "Rappels", icon: BellRing, disabled: true },
    ],
  },
  {
    label: "Analytiques",
    items: [
      { label: "Statistiques", icon: BarChart3, disabled: true },
      { label: "Rapports", icon: FileText, disabled: true },
      { label: "Prévisions", icon: TrendingUp, disabled: true },
    ],
  },
  {
    label: "Paramètres",
    items: [{ label: "Paramètres", icon: Settings, disabled: true }],
  },
];
