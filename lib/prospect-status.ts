import { type ProspectStatus } from "@/types";

/**
 * Cycle de prospection export — saisie manuelle, aucune automatisation.
 *
 * Changement libre : tous les statuts sont accessibles depuis n'importe quel
 * statut (sauf soi-même). Plus de restriction de progression forward-only.
 */
const ALL_STATUSES: readonly ProspectStatus[] = [
  "new",
  "first_contact_sent",
  "response_received",
  "interested",
  "offer_sent",
  "negotiation",
  "first_order",
  "active_client",
  "refused",
];

const TERMINAL_STATUSES: readonly ProspectStatus[] = ["active_client", "refused"];

export function isTerminal(status: ProspectStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

/** Liste de tous les statuts accessibles depuis un statut donné (tous, sauf soi-même). */
export function allowedTransitions(from: ProspectStatus): ProspectStatus[] {
  return ALL_STATUSES.filter((s) => s !== from);
}

export function canTransition(from: ProspectStatus, to: ProspectStatus): boolean {
  if (from === to) return false;
  return allowedTransitions(from).includes(to);
}
