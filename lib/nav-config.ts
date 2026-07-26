// Structure de navigation du CRM. `href` présent + `disabled` absent = page réelle.
// Les entrées `disabled` sont des sections prévues mais pas encore construites :
// elles restent visibles (cohérence visuelle avec la maquette premium) mais non cliquables.
import {
  LayoutDashboard,
  Users,
  Building2,
  Contact,
  Megaphone,
  CheckSquare,
  BellRing,
  Target,
  FileText,
  ShoppingCart,
  Truck,
  Receipt,
  BarChart3,
  TrendingUp,
  LineChart,
  UserCog,
  Settings,
  Plug,
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
      { label: "Prospects", href: "/prospects", icon: Users },
      { label: "Entreprises", icon: Building2, disabled: true },
      { label: "Contacts", icon: Contact, disabled: true },
      { label: "Campagnes", icon: Megaphone, disabled: true },
      { label: "Tâches", icon: CheckSquare, disabled: true },
      { label: "Rappels", icon: BellRing, disabled: true },
    ],
  },
  {
    label: "Ventes",
    items: [
      { label: "Opportunités", icon: Target, disabled: true },
      { label: "Devis", icon: FileText, disabled: true },
      { label: "Commandes", icon: ShoppingCart, disabled: true },
      { label: "Expéditions", icon: Truck, disabled: true },
      { label: "Factures", icon: Receipt, disabled: true },
    ],
  },
  {
    label: "Analytiques",
    items: [
      { label: "Statistiques", icon: BarChart3, disabled: true },
      { label: "Rapports", icon: LineChart, disabled: true },
      { label: "Prévisions", icon: TrendingUp, disabled: true },
    ],
  },
  {
    label: "Paramètres",
    items: [
      { label: "Utilisateurs", icon: UserCog, disabled: true },
      { label: "Paramètres", icon: Settings, disabled: true },
      { label: "Intégrations", icon: Plug, disabled: true },
    ],
  },
];
