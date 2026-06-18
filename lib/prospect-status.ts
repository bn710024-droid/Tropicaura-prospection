import { type ProspectStatus } from "@/types";

/**
 * Machine à états du prospect (cf. docs/architecture.md §7).
 *
 * - Forward-only : on avance d'une étape à la fois.
 * - `lost` / `dnc` accessibles depuis TOUT statut non-terminal (sortie possible à tout moment).
 * - `won` / `lost` / `dnc` sont TERMINAUX (aucune transition sortante).
 * - Pas de retour arrière, pas de réactivation d'un `lost` (on recrée un prospect au besoin).
 */
const FORWARD_TRANSITIONS: Record<ProspectStatus, ProspectStatus[]> = {
  new: ["verified"],
  verified: ["qualified"],
  qualified: ["contacted"],
  contacted: ["replied"],
  replied: ["hot"],
  hot: ["contacted_whatsapp"],
  contacted_whatsapp: ["meeting_scheduled"],
  meeting_scheduled: ["quotation_sent"],
  quotation_sent: ["sample_sent", "won"],
  sample_sent: ["won"],
  won: [],
  lost: [],
  dnc: [],
};

const TERMINAL_STATUSES: readonly ProspectStatus[] = ["won", "lost", "dnc"];
const ALWAYS_ALLOWED_EXITS: readonly ProspectStatus[] = ["lost", "dnc"];

export function isTerminal(status: ProspectStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

/** Liste des transitions autorisées depuis un statut (forward + sorties lost/dnc). */
export function allowedTransitions(from: ProspectStatus): ProspectStatus[] {
  if (isTerminal(from)) return [];
  const exits = ALWAYS_ALLOWED_EXITS.filter((s) => s !== from);
  return Array.from(new Set<ProspectStatus>([...FORWARD_TRANSITIONS[from], ...exits]));
}

export function canTransition(from: ProspectStatus, to: ProspectStatus): boolean {
  if (from === to) return false;
  return allowedTransitions(from).includes(to);
}
