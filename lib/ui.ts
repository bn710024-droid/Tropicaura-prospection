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

// Couleurs du score : vert ≥7, orange 4-6, rouge <4, neutre si null.
export function scoreColor(score: number | null): { text: string; bar: string; ring: string } {
  if (score === null) return { text: "text-gray-400", bar: "bg-gray-300", ring: "ring-gray-200" };
  if (score >= 7) return { text: "text-green-600", bar: "bg-green-500", ring: "ring-green-200" };
  if (score >= 4) return { text: "text-orange-600", bar: "bg-orange-500", ring: "ring-orange-200" };
  return { text: "text-red-600", bar: "bg-red-500", ring: "ring-red-200" };
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

export function statusBadgeClass(status: ProspectStatus): string {
  switch (status) {
    case "hot":
      return "bg-orange-100 text-orange-700 border-orange-200";
    case "won":
      return "bg-green-100 text-green-700 border-green-200";
    case "lost":
    case "dnc":
      return "bg-red-100 text-red-700 border-red-200";
    case "contacted":
    case "replied":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "qualified":
      return "bg-green-50 text-green-700 border-green-200";
    default:
      return "bg-gray-100 text-gray-600 border-gray-200";
  }
}
