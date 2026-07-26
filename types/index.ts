// Types partagés — miroir du schéma Supabase (supabase/migrations/0001_init.sql + 0002_prospection_pivot.sql).
// Const-arrays + union types : idiomatique, compatible zod, aucun artefact runtime.
//
// CRM de prospection internationale à saisie 100% manuelle — aucune IA, aucune API payante.
// `prospects` sert de table unique aux deux vues "Prospects" (pipeline) et "Entreprises" (annuaire).

// ── Statuts prospect (cycle export, machine à états : cf. lib/prospect-status.ts) ──
export const PROSPECT_STATUSES = [
  "new",
  "first_contact_sent",
  "response_received",
  "interested",
  "offer_sent",
  "negotiation",
  "first_order",
  "active_client",
  // Sortie possible à tout moment
  "refused",
] as const;
export type ProspectStatus = (typeof PROSPECT_STATUSES)[number];

export function isProspectStatus(v: unknown): v is ProspectStatus {
  return typeof v === "string" && (PROSPECT_STATUSES as readonly string[]).includes(v);
}

// ── Entités ──
export interface Prospect {
  id: string;
  company_name: string;
  website: string | null;
  country: string | null;
  city: string | null;
  address: string | null;
  segment: string | null;
  source: string | null;
  status: ProspectStatus;
  contact_name: string | null;
  contact_role: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  products: string[];
  notes: string | null;
  last_contact_at: string | null;
  next_reminder_at: string | null;
  campaign_id: string | null;
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
  whatsapp: string | null;
  linkedin_url: string | null;
  created_at: string;
}

export interface Campaign {
  id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  objective_text: string | null;
  target_products: string[];
  target_countries: string[];
  target_company_count: number | null;
  created_at: string;
}

export const TASK_PRIORITIES = ["low", "medium", "high"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const TASK_STATUSES = ["open", "in_progress", "done"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export interface Task {
  id: string;
  prospect_id: string;
  campaign_id: string | null;
  title: string | null;
  description: string | null;
  priority: TaskPriority;
  due_date: string | null;
  status: TaskStatus;
  created_at: string;
}

export interface Reminder {
  id: string;
  prospect_id: string;
  note: string;
  due_at: string;
  done: boolean;
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
