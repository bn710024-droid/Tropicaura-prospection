// Identités des agents IA (mascottes robot). Réutilisé par la carte "Mon Équipe IA"
// et par les états de chargement (SCOUT analyse…, PLUME rédige…).
export type AgentStatus = "active" | "soon";

export interface AgentInfo {
  id: string;
  emoji: string;
  name: string;
  role: string;
  status: AgentStatus;
}

export const AGENTS: AgentInfo[] = [
  { id: "scout", emoji: "🤖", name: "SCOUT", role: "Qualification des prospects", status: "active" },
  { id: "plume", emoji: "✍️", name: "PLUME", role: "Rédaction commerciale", status: "active" },
  { id: "trieur", emoji: "📨", name: "TRIEUR", role: "Lecture des réponses", status: "soon" },
  { id: "briefer", emoji: "📋", name: "BRIEFER", role: "Briefing handoff", status: "soon" },
];

export const SCOUT = AGENTS[0];
export const PLUME = AGENTS[1];
