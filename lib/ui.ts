import type { ProspectStatus } from "@/types";

// Drapeaux emoji par code pays ISO. 🏳️ si inconnu.
const FLAGS: Record<string, string> = {
  NL: "🇳🇱", FR: "🇫🇷", BE: "🇧🇪", DE: "🇩🇪", ES: "🇪🇸", IT: "🇮🇹",
  PT: "🇵🇹", GB: "🇬🇧", UK: "🇬🇧", CH: "🇨🇭", PL: "🇵🇱", AT: "🇦🇹",
  SE: "🇸🇪", DK: "🇩🇰", SN: "🇸🇳",
};

export function countryFlag(code: string | null): string {
  if (!code) return "🏳️";
  return FLAGS[code.trim().toUpperCase()] ?? "🏳️";
}

const COUNTRY_NAMES: Record<string, string> = {
  NL: "Netherlands", FR: "France", BE: "Belgium", DE: "Germany", ES: "Spain",
  IT: "Italy", PT: "Portugal", GB: "United Kingdom", UK: "United Kingdom",
  CH: "Switzerland", PL: "Poland", AT: "Austria", SE: "Sweden", DK: "Denmark",
  SN: "Senegal",
};

export function countryName(code: string | null): string {
  if (!code) return "";
  return COUNTRY_NAMES[code.trim().toUpperCase()] ?? code;
}

// ── Statuts prospect : cycle export (source unique de vérité pour label/emoji/couleur) ──
interface StatusMeta {
  label: string;
  emoji: string;
  badgeClass: string; // pill teinté (dark)
  hex: string; // carte du monde / graphiques
}

const STATUS_META: Record<ProspectStatus, StatusMeta> = {
  new: { label: "Nouveau prospect", emoji: "🟦", badgeClass: "border-blue-500/20 bg-blue-500/10 text-blue-400", hex: "#3b82f6" },
  first_contact_sent: {
    label: "Premier contact envoyé",
    emoji: "🟨",
    badgeClass: "border-yellow-500/20 bg-yellow-500/10 text-yellow-400",
    hex: "#eab308",
  },
  response_received: {
    label: "Réponse reçue",
    emoji: "🟧",
    badgeClass: "border-orange-500/20 bg-orange-500/10 text-orange-400",
    hex: "#f97316",
  },
  interested: { label: "Intéressé", emoji: "🟩", badgeClass: "border-green-500/20 bg-green-500/10 text-green-400", hex: "#22c55e" },
  offer_sent: { label: "Offre envoyée", emoji: "📄", badgeClass: "border-cyan-500/20 bg-cyan-500/10 text-cyan-400", hex: "#06b6d4" },
  negotiation: {
    label: "Négociation",
    emoji: "🤝",
    badgeClass: "border-purple-500/20 bg-purple-500/10 text-purple-400",
    hex: "#a855f7",
  },
  first_order: {
    label: "Première commande",
    emoji: "🚢",
    badgeClass: "border-teal-500/20 bg-teal-500/10 text-teal-400",
    hex: "#14b8a6",
  },
  active_client: {
    label: "Client actif",
    emoji: "⭐",
    badgeClass: "border-amber-400/25 bg-amber-400/10 text-amber-300",
    hex: "#ffd700",
  },
  refused: { label: "Refus", emoji: "❌", badgeClass: "border-red-500/20 bg-red-500/10 text-red-400", hex: "#ef4444" },
};

export function statusLabel(status: ProspectStatus): string {
  return STATUS_META[status]?.label ?? status;
}

export function statusEmoji(status: ProspectStatus): string {
  return STATUS_META[status]?.emoji ?? "⬜";
}

// Badge statut (dark, style pill teinté).
export function statusBadgeClass(status: ProspectStatus): string {
  return STATUS_META[status]?.badgeClass ?? "border-white/10 bg-white/5 text-zinc-400";
}

// Couleur hex du statut (carte du monde, graphiques, points).
export function statusColorHex(status: ProspectStatus): string {
  return STATUS_META[status]?.hex ?? "#71717a";
}
