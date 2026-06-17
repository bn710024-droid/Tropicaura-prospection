-- 0001_init.sql — Tropic-Aura B.C. · Phase 1 (7 tables)
-- Postgres / Supabase · gen_random_uuid() dispo nativement (PG13+)
-- `unique nulls not distinct` requiert PG15+ (Supabase est sur PG15+).

-- ── PROSPECTS (cœur du CRM) ──────────────────────────────
create table prospects (
  id            uuid primary key default gen_random_uuid(),
  company_name  text not null,
  website       text,
  country       text,                     -- ISO: BE, FR, NL, DE
  city          text,
  segment       text,                     -- importateur / grossiste / distributeur / centrale
  source        text,                     -- csv_eurofruit / salon / referral / manual
  status        text not null default 'new',
  score         int check (score is null or score between 0 and 10),
  score_detail  jsonb,                    -- {importateur:3, europe:2, taille:2, mangue:3}
  verified_at   timestamptz,
  qualified_at  timestamptz,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  -- Dédup (P1-05) garantie en base. NULLS NOT DISTINCT : deux prospects de même
  -- nom SANS pays renseigné sont aussi considérés comme doublons (trou fermé).
  constraint prospects_company_country_unique
    unique nulls not distinct (company_name, country)
);

-- ── CONTACTS (personnes — données publiques pro uniquement) ──
create table contacts (
  id           uuid primary key default gen_random_uuid(),
  prospect_id  uuid not null references prospects(id) on delete cascade,
  full_name    text,
  role_title   text,                      -- ex: "Purchasing Manager"
  email        text,
  phone        text,
  linkedin_url text,
  is_public_source boolean not null default true,  -- traçabilité RGPD
  created_at   timestamptz not null default now()
);

-- ── EMAILS (envoyés ET reçus) ────────────────────────────
create table emails (
  id            uuid primary key default gen_random_uuid(),
  prospect_id   uuid not null references prospects(id) on delete cascade,
  contact_id    uuid references contacts(id) on delete set null,
  direction     text not null check (direction in ('outbound','inbound')),
  resend_id     text,                     -- id Resend pour tracking
  subject       text,
  body          text,
  sequence_step int,                      -- 0=initial, 1=J+5, 2=J+12, 3=J+25
  status        text,                     -- queued/sent/delivered/opened/bounced/replied
  intent        text,                     -- (inbound, rempli par IA) interested/not/info/sample/price
  sent_at       timestamptz,
  received_at   timestamptz,
  created_at    timestamptz not null default now()
);

-- ── CAMPAGNES ────────────────────────────────────────────
create table campaigns (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  daily_limit  int not null default 25,   -- garde-fou anti-spam
  status       text not null default 'active',
  created_at   timestamptz not null default now()
);

-- ── SÉQUENCES DE RELANCE (par prospect) ──────────────────
create table sequences (
  id             uuid primary key default gen_random_uuid(),
  prospect_id    uuid not null references prospects(id) on delete cascade,
  campaign_id    uuid references campaigns(id) on delete set null,
  current_step   int not null default 0,
  next_action_at timestamptz,             -- quand la prochaine relance est due
  stopped        boolean not null default false,  -- STOP si réponse / désinscription
  created_at     timestamptz not null default now()
);

-- ── TÂCHES (handoff vers l'humain) ───────────────────────
create table tasks (
  id           uuid primary key default gen_random_uuid(),
  prospect_id  uuid not null references prospects(id) on delete cascade,
  type         text not null default 'hot_lead',
  title        text,                      -- "Prospect chaud — contact WhatsApp recommandé"
  priority     text not null default 'high',
  briefing     text,                      -- briefing IA en français (5 lignes)
  dossier      jsonb,                     -- historique, score, infos société, points détectés
  status       text not null default 'open',  -- open / in_progress / done
  created_at   timestamptz not null default now()
);

-- ── LOG D'ACTIVITÉ (audit + debug) ───────────────────────
-- prospect_id SANS FK volontairement : l'audit survit à la suppression d'un prospect.
create table activity_log (
  id           uuid primary key default gen_random_uuid(),
  agent        text,                      -- 'qualification', 'sender', 'cron_followup'...
  action       text,
  prospect_id  uuid,
  meta         jsonb,
  created_at   timestamptz not null default now()
);

-- ── INDEX recommandés (limités aux 7 tables Phase 1) ─────
create index idx_prospects_status       on prospects(status);
create index idx_prospects_score        on prospects(score desc);
create index idx_sequences_due          on sequences(next_action_at) where stopped = false;
create index idx_emails_prospect        on emails(prospect_id);
create index idx_emails_inbound_unclass on emails(direction, intent)
  where direction = 'inbound' and intent is null;
create index idx_tasks_open             on tasks(status, priority) where status = 'open';

-- ── updated_at automatique (Postgres ne le fait pas seul) ─
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_prospects_updated_at
  before update on prospects
  for each row execute function set_updated_at();

-- ── RLS : activé partout, AUCUNE policy ──────────────────
-- → anon/authenticated bloqués ; service-role (côté serveur) bypass RLS.
alter table prospects    enable row level security;
alter table contacts     enable row level security;
alter table emails       enable row level security;
alter table campaigns    enable row level security;
alter table sequences    enable row level security;
alter table tasks        enable row level security;
alter table activity_log enable row level security;
