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

// Couleurs du score (dark) : vert ≥7, orange 4-6, rouge <4, neutre si null.
// `stroke` = couleur hex pour l'anneau SVG ; `pill` = classes du badge.
export function scoreColor(score: number | null): {
  text: string;
  bar: string;
  stroke: string;
  pill: string;
} {
  if (score === null)
    return { text: "text-zinc-500", bar: "bg-zinc-700", stroke: "#3f3f46", pill: "border-white/10 bg-white/5 text-zinc-400" };
  if (score >= 7)
    return { text: "text-green-400", bar: "bg-green-500", stroke: "#22c55e", pill: "border-green-500/20 bg-green-500/10 text-green-400" };
  if (score >= 4)
    return { text: "text-orange-400", bar: "bg-orange-500", stroke: "#f97316", pill: "border-orange-500/20 bg-orange-500/10 text-orange-400" };
  return { text: "text-red-400", bar: "bg-red-500", stroke: "#ef4444", pill: "border-red-500/20 bg-red-500/10 text-red-400" };
}

const STATUS_LABELS: Record<ProspectStatus, string> = {
  new: "Nouveau",
  verified: "Vérifié",
  qualified: "Qualifié",
  contacted: "Contacté",
  replied: "A répondu",
  hot: "Chaud",
  contacted_whatsapp: "WhatsApp",
  meeting_scheduled: "RDV planifié",
  quotation_sent: "Devis envoyé",
  sample_sent: "Échantillon envoyé",
  won: "Gagné",
  lost: "Perdu",
  dnc: "Ne pas contacter",
};

export function statusLabel(status: ProspectStatus): string {
  return STATUS_LABELS[status] ?? status;
}

// Badge statut (dark, style pill teinté).
export function statusBadgeClass(status: ProspectStatus): string {
  switch (status) {
    case "hot":
      return "border-orange-500/20 bg-orange-500/10 text-orange-400";
    case "won":
    case "qualified":
      return "border-green-500/20 bg-green-500/10 text-green-400";
    case "lost":
    case "dnc":
      return "border-red-500/20 bg-red-500/10 text-red-400";
    case "contacted":
    case "replied":
      return "border-blue-500/20 bg-blue-500/10 text-blue-400";
    default:
      return "border-white/10 bg-white/5 text-zinc-400";
  }
}
