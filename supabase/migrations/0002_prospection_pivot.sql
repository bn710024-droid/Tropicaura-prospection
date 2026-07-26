-- 0002_prospection_pivot.sql — Pivot : CRM de prospection internationale manuelle
-- Retire tout le sous-système IA (Phase 1) au profit d'une saisie 100% manuelle.
-- Base vide au moment de cette migration : aucune donnée à préserver/transformer.

-- ── Tables IA supprimées (drafting/qualification automatiques) ──
drop table if exists emails;
drop table if exists sequences;

-- ── PROSPECTS : retrait des champs IA, ajout des champs de prospection manuelle ──
-- Cette même table sert aux deux vues "Prospects" (pipeline) et "Entreprises" (annuaire).
alter table prospects
  drop column if exists score,
  drop column if exists score_detail,
  drop column if exists verified_at,
  drop column if exists qualified_at,
  add column if not exists contact_name     text,
  add column if not exists contact_role     text,
  add column if not exists phone            text,
  add column if not exists whatsapp         text,
  add column if not exists email            text,
  add column if not exists address          text,
  add column if not exists products         text[] not null default '{}',
  add column if not exists last_contact_at  timestamptz,
  add column if not exists next_reminder_at timestamptz,
  add column if not exists campaign_id      uuid references campaigns(id) on delete set null;

alter table prospects alter column status set default 'new';
-- Valeurs applicatives (validées côté TypeScript, cf. types/index.ts) :
-- new / first_contact_sent / response_received / interested / offer_sent /
-- negotiation / first_order / active_client / refused

drop index if exists idx_prospects_score;
create index if not exists idx_prospects_next_reminder on prospects(next_reminder_at) where next_reminder_at is not null;
create index if not exists idx_prospects_campaign on prospects(campaign_id);

-- ── CONTACTS : + whatsapp, retrait de la traçabilité IA (is_public_source) ──
alter table contacts
  add column if not exists whatsapp text,
  drop column if exists is_public_source;

-- ── CAMPAGNES : redéfinition (campagne de prospection définie par l'utilisateur, ──
-- ── plus un paramètre d'envoi automatisé) ──
alter table campaigns
  drop column if exists daily_limit,
  drop column if exists status,
  add column if not exists start_date            date,
  add column if not exists end_date              date,
  add column if not exists objective_text        text,
  add column if not exists target_products       text[] not null default '{}',
  add column if not exists target_countries      text[] not null default '{}',
  add column if not exists target_company_count  int;

-- ── TÂCHES : + description/échéance/campagne, retrait des champs IA ──
alter table tasks
  add column if not exists description text,
  add column if not exists due_date    date,
  add column if not exists campaign_id uuid references campaigns(id) on delete set null,
  drop column if exists type,
  drop column if exists briefing,
  drop column if exists dossier;
alter table tasks alter column priority set default 'medium';

-- ── RAPPELS : nouvelle table, indépendante des tâches (relances commerciales) ──
create table if not exists reminders (
  id          uuid primary key default gen_random_uuid(),
  prospect_id uuid not null references prospects(id) on delete cascade,
  note        text not null,
  due_at      timestamptz not null,
  done        boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists idx_reminders_due on reminders(due_at) where done = false;

alter table reminders enable row level security;
-- RLS activé, aucune policy : service-role uniquement (cohérent avec le reste du schéma).
