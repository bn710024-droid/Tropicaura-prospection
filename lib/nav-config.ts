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
      { label: "Entreprises", href: "/entreprises", icon: Building2 },
      { label: "Contacts", href: "/contacts", icon: Contact },
      { label: "Campagnes", href: "/campagnes", icon: Megaphone },
      { label: "Tâches", href: "/taches", icon: CheckSquare },
      { label: "Rappels", href: "/rappels", icon: BellRing },
    ],
  },
  {
    label: "Analytiques",
    items: [
      { label: "Statistiques", href: "/statistiques", icon: BarChart3 },
      { label: "Rapports", href: "/rapports", icon: FileText },
      { label: "Prévisions", href: "/previsions", icon: TrendingUp },
    ],
  },
  {
    label: "Paramètres",
    items: [{ label: "Paramètres", href: "/parametres", icon: Settings }],
  },
];
