// Types partagés — miroir du schéma Supabase (supabase/migrations/0001_init.sql).
// Const-arrays + union types : idiomatique, compatible zod, aucun artefact runtime.

// ── Statuts prospect (machine à états : cf. lib/prospect-status.ts) ──
export const PROSPECT_STATUSES = [
  // Zone IA (automatique)
  "new",
  "verified",
  "qualified",
  "contacted",
  "replied",
  // Handoff
  "hot",
  // Zone humaine (transitions manuelles)
  "contacted_whatsapp",
  "meeting_scheduled",
  "quotation_sent",
  "sample_sent",
  "won",
  // Sorties possibles à tout moment
  "lost",
  "dnc",
] as const;
export type ProspectStatus = (typeof PROSPECT_STATUSES)[number];

export function isProspectStatus(v: unknown): v is ProspectStatus {
  return typeof v === "string" && (PROSPECT_STATUSES as readonly string[]).includes(v);
}

// ── Emails ──
export const EMAIL_DIRECTIONS = ["outbound", "inbound"] as const;
export type EmailDirection = (typeof EMAIL_DIRECTIONS)[number];

export const EMAIL_INTENTS = [
  "interested",
  "not_interested",
  "needs_info",
  "wants_sample",
  "price_negotiation",
  "unsubscribe",
  "out_of_office",
] as const;
export type EmailIntent = (typeof EMAIL_INTENTS)[number];

// ── Entités ──
export interface Prospect {
  id: string;
  company_name: string;
  website: string | null;
  country: string | null;
  city: string | null;
  segment: string | null;
  source: string | null;
  status: ProspectStatus;
  score: number | null;
  score_detail: Record<string, number> | null;
  verified_at: string | null;
  qualified_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  prospect_id: string;
  full_name: string | null;
  role_title: string | null;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  is_public_source: boolean;
  created_at: string;
}

export interface Email {
  id: string;
  prospect_id: string;
  contact_id: string | null;
  direction: EmailDirection;
  resend_id: string | null;
  subject: string | null;
  body: string | null;
  sequence_step: number | null;
  status: string | null;
  intent: EmailIntent | null;
  sent_at: string | null;
  received_at: string | null;
  created_at: string;
}

export interface Campaign {
  id: string;
  name: string;
  daily_limit: number;
  status: string;
  created_at: string;
}

export interface Sequence {
  id: string;
  prospect_id: string;
  campaign_id: string | null;
  current_step: number;
  next_action_at: string | null;
  stopped: boolean;
  created_at: string;
}

export interface Task {
  id: string;
  prospect_id: string;
  type: string;
  title: string | null;
  priority: string;
  briefing: string | null;
  dossier: Record<string, unknown> | null;
  status: string;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  agent: string | null;
  action: string | null;
  prospect_id: string | null;
  meta: Record<string, unknown> | null;
  created_at: string;
}
