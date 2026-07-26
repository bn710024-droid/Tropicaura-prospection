import { type ProspectStatus } from "@/types";

/**
 * Cycle de prospection export — saisie manuelle, aucune automatisation.
 *
 * - Forward-only : on avance d'une étape à la fois.
 * - `refused` accessible depuis TOUT statut non-terminal (sortie possible à tout moment).
 * - `active_client` / `refused` sont TERMINAUX.
 */
const FORWARD_TRANSITIONS: Record<ProspectStatus, ProspectStatus[]> = {
  new: ["first_contact_sent"],
  first_contact_sent: ["response_received"],
  response_received: ["interested"],
  interested: ["offer_sent"],
  offer_sent: ["negotiation"],
  negotiation: ["first_order"],
  first_order: ["active_client"],
  active_client: [],
  refused: [],
};

const TERMINAL_STATUSES: readonly ProspectStatus[] = ["active_client", "refused"];
const ALWAYS_ALLOWED_EXITS: readonly ProspectStatus[] = ["refused"];

export function isTerminal(status: ProspectStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

/** Liste des transitions autorisées depuis un statut (forward + sortie refus). */
export function allowedTransitions(from: ProspectStatus): ProspectStatus[] {
  if (isTerminal(from)) return [];
  const exits = ALWAYS_ALLOWED_EXITS.filter((s) => s !== from);
  return Array.from(new Set<ProspectStatus>([...FORWARD_TRANSITIONS[from], ...exits]));
}

export function canTransition(from: ProspectStatus, to: ProspectStatus): boolean {
  if (from === to) return false;
  return allowedTransitions(from).includes(to);
}
