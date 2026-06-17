# Tropic-Aura B.C. — Plateforme de Prospection & Gestion Commerciale Export

**Architecture multi-rôles orientée production**

Stack : Next.js 16 (App Router) · Supabase · Claude API · Resend · Vercel + Vercel Cron

---

## Vision & principes d'architecture

Ce projet est une plateforme de prospection export assistée par IA pour
Tropic-Aura B.C. L'IA (Claude) est utilisée UNIQUEMENT là où elle apporte
une valeur de jugement ou de langage : Qualification, Rédaction, Lecture
des réponses, Briefing. Les autres rôles sont des services et workflows
classiques (CRM, envoi, relances, reporting, anti-spam) — et doivent le
rester tant qu'un SELECT ou une condition suffit.

Principes à respecter dès le départ (bon découpage, indépendamment de l'IA) :
- séparation claire des responsabilités (un module = un rôle) ;
- modules découplés, communiquant par API et base de données ;
- une fonction qui n'a pas besoin de l'IA n'appelle pas l'IA.

Règle anti-dérive : on n'ajoute pas de capacité IA à un rôle sans un besoin
réel démontré. La place est réservée dans l'arborescence (`lib/ai/`), pas
pré-remplie de complexité spéculative.

---

## 0. Principe directeur

Un « agent » n'est pas forcément une IA. Dans cette architecture, on distingue trois types de composants :

- **AI-agents** : un appel raisonné à Claude est justifié (jugement, langage, classification fine).
- **Services** : logique déterministe, appels d'API externes, calculs. Aucun LLM.
- **Workflows / Cron** : orchestration et déclenchement temporel.

**Règle d'or** : l'IA coûte de l'argent et introduit de la latence et de l'imprévisibilité. On ne l'utilise que lorsqu'un `SELECT`, une regex ou une condition `if` ne suffisent pas.

---

## 1. Classification des 15 rôles

| # | Rôle | Type réel | IA ? | Justification |
|---|------|-----------|------|---------------|
| 1 | Directeur Commercial | Workflow + Cron | ❌ | Agrégation de données + dashboard. `SELECT COUNT()`. |
| 2 | Veille Marché | Service (+ IA légère optionnelle) | ⚠️ | Récupération de données (search/scrape) ; IA seulement pour résumer. **Module le plus fragile — optionnel.** |
| 3 | Recherche Prospects | Service | ❌ | Import CSV de bases qualifiées + recherche. Pas de LLM. |
| 4 | Vérification | Service | ❌ | Ping site, DNS, statut HTTP, registres. Déterministe. |
| 5 | **Qualification** | **AI-agent** | ✅ | Lire un site, juger la pertinence, noter 1-10. |
| 6 | Enrichissement | Service | ❌ | Coordonnées **publiques** uniquement. ⚠️ cadre RGPD strict. |
| 7 | **Rédaction Commerciale** | **AI-agent** | ✅ | Email personnalisé non générique. |
| 8 | Contrôle Anti-Spam | Service + Cron | ❌ | Vérif SPF/DKIM/DMARC, taux de rebond. DNS + maths. |
| 9 | Envoi | Service | ❌ | API Resend (gère déjà débit, rebonds). |
| 10 | Relance | Workflow + Cron | ❌ | Condition de date. `if dernière_relance + 5j`. |
| 11 | **Lecture des Réponses** | **AI-agent** | ✅ | Classifier l'intention d'un email entrant. |
| 12 | ~~Négociation Assistée~~ → **Handoff + Briefing** | Workflow + AI-agent | ✅ | L'IA ne négocie PAS. Elle détecte l'intérêt, arrête les robots, et produit un briefing avant ta prise de contact humaine. |
| 13 | Documents Export | Service | ❌ | Templating (proforma, packing list). Tu sais déjà faire. |
| 14 | CRM | Service (DB) | ❌ | Tables Supabase + historique. |
| 15 | Reporting | Service (SQL) | ❌ | Requêtes d'agrégation. |

**Bilan : 3,5 vrais AI-agents sur 15 rôles.** C'est exactement là que se concentre la valeur de Claude. Tout le reste, c'est de l'ingénierie logicielle classique — plus rapide à construire, plus robuste, gratuit à l'exécution.

---

## 2. Architecture système (vue d'ensemble)

```
┌─────────────────────────────────────────────────────────────┐
│                        VERCEL (Next.js)                       │
│                                                               │
│  ┌──────────────┐   ┌──────────────────────────────────┐    │
│  │  FRONTEND     │   │  API ROUTES (app/api/*)           │    │
│  │  Dashboard    │──▶│                                   │    │
│  │  Pipeline     │   │  /prospects   /emails             │    │
│  │  Inbox        │   │  /qualify*    /draft*  /classify* │    │
│  │  Documents    │   │  /negotiation* /documents         │    │
│  │  Reports      │   │  /deliverability /reports         │    │
│  └──────────────┘   │  /cron/*                           │    │
│                     └──────────────────────────────────┘    │
│         │                    │            │         │         │
└─────────┼────────────────────┼────────────┼─────────┼─────────┘
          │                    │            │         │
          ▼                    ▼            ▼         ▼
   ┌────────────┐      ┌──────────────┐  ┌────────┐ ┌─────────┐
   │  SUPABASE  │      │ CLAUDE API   │  │ RESEND │ │ VERCEL  │
   │  Postgres  │      │ (anthropic)  │  │ emails │ │ CRON    │
   │  + Auth    │      │ qualif/draft │  │ +webhook│ │ déclen- │
   │  + RLS     │      │ classify/nego│  │        │ │ cheurs  │
   └────────────┘      └──────────────┘  └────────┘ └─────────┘
  (* = route qui appelle Claude)
```

**Flux de webhook entrant** : Resend → webhook `/api/webhooks/resend` → enregistre l'email reçu → déclenche `/api/responses/classify` (IA).

---

## 3. Schéma Supabase

### Tables principales

```sql
-- ─── PROSPECTS (cœur du CRM) ─────────────────────────────
create table prospects (
  id            uuid primary key default gen_random_uuid(),
  company_name  text not null,
  website       text,
  country       text,                     -- ISO: BE, FR, NL, DE
  city          text,
  segment       text,                     -- importateur / grossiste / distributeur / centrale
  source        text,                     -- csv_eurofruit / salon / referral / manual
  status        text not null default 'new',
    -- ── Phase IA (automatique) ──
    -- new → verified → qualified → contacted → replied
    -- ── Handoff ──
    -- → hot
    -- ── Phase humaine (transitions manuelles dans l'UI) ──
    -- → contacted_whatsapp → meeting_scheduled → quotation_sent
    --   → sample_sent → won
    -- ── Sortie possible à tout moment ──
    -- → lost / dnc
  score         int,                      -- 0..10 (rempli par Qualification IA)
  score_detail  jsonb,                    -- {importateur:3, europe:2, taille:2, mangue:3}
  verified_at   timestamptz,
  qualified_at  timestamptz,
  notes         text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
-- ─── CONTACTS (personnes — données publiques pro uniquement) ──
create table contacts (
  id           uuid primary key default gen_random_uuid(),
  prospect_id  uuid references prospects(id) on delete cascade,
  full_name    text,
  role_title   text,                      -- ex: "Purchasing Manager"
  email        text,
  phone        text,
  linkedin_url text,
  is_public_source boolean default true,  -- traçabilité RGPD
  created_at   timestamptz default now()
);
-- ─── EMAILS (envoyés ET reçus) ───────────────────────────
create table emails (
  id            uuid primary key default gen_random_uuid(),
  prospect_id   uuid references prospects(id) on delete cascade,
  contact_id    uuid references contacts(id),
  direction     text not null,            -- 'outbound' | 'inbound'
  resend_id     text,                     -- id Resend pour tracking
  subject       text,
  body          text,
  sequence_step int,                      -- 0=initial, 1=J+5, 2=J+12, 3=J+25
  status        text,                     -- queued/sent/delivered/opened/bounced/replied
  intent        text,                     -- (inbound, rempli par IA) interested/not/info/sample/price
  sent_at       timestamptz,
  received_at   timestamptz,
  created_at    timestamptz default now()
);
-- ─── CAMPAGNES ───────────────────────────────────────────
create table campaigns (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  daily_limit  int default 25,            -- garde-fou anti-spam
  status       text default 'active',
  created_at   timestamptz default now()
);
-- ─── SÉQUENCES DE RELANCE (par prospect) ─────────────────
create table sequences (
  id            uuid primary key default gen_random_uuid(),
  prospect_id   uuid references prospects(id) on delete cascade,
  campaign_id   uuid references campaigns(id),
  current_step  int default 0,
  next_action_at timestamptz,             -- quand la prochaine relance est due
  stopped       boolean default false,    -- STOP si réponse ou désinscription
  created_at    timestamptz default now()
);
-- ─── DOCUMENTS EXPORT ────────────────────────────────────
create table documents (
  id           uuid primary key default gen_random_uuid(),
  prospect_id  uuid references prospects(id),
  type         text,                      -- proforma / packing_list / quote / product_sheet
  ref          text,                      -- TP-2026-00X
  payload      jsonb,                     -- données structurées (incoterm, prix, calibre…)
  file_url     text,                      -- lien stockage si PDF généré
  created_at   timestamptz default now()
);
-- ─── VEILLE MARCHÉ ───────────────────────────────────────
create table market_data (
  id           uuid primary key default gen_random_uuid(),
  product      text default 'mango',
  variety      text,                      -- Kent / Keitt / Palmer
  market        text,                     -- Rungis / Anvers / Rotterdam
  price_eur     numeric,
  unit          text,                     -- /kg, /4kg
  observed_at   date,
  summary       text,                     -- résumé IA optionnel
  source        text,
  created_at    timestamptz default now()
);
-- ─── RAPPORTS QUOTIDIENS ─────────────────────────────────
create table daily_reports (
  id           uuid primary key default gen_random_uuid(),
  report_date  date unique,
  metrics      jsonb,   -- {prospects_new, qualified, sent, opened, replied, meetings}
  summary      text,    -- texte du "Directeur Commercial"
  created_at   timestamptz default now()
);
-- ─── TÂCHES (handoff vers l'humain) ─────────────────────
create table tasks (
  id           uuid primary key default gen_random_uuid(),
  prospect_id  uuid references prospects(id) on delete cascade,
  type         text default 'hot_lead',
  title        text,        -- "Prospect chaud — contact WhatsApp recommandé"
  priority     text default 'high',
  briefing     text,        -- briefing IA en français (5 lignes)
  dossier      jsonb,       -- historique, score, infos société, points détectés
  status       text default 'open',  -- open / in_progress / done
  created_at   timestamptz default now()
);
-- ─── LOG D'ACTIVITÉ (audit + debug) ──────────────────────
create table activity_log (
  id           uuid primary key default gen_random_uuid(),
  agent        text,                      -- 'qualification', 'sender', 'cron_followup'...
  action       text,
  prospect_id  uuid,
  meta         jsonb,
  created_at   timestamptz default now()
);
```

### Index recommandés

```sql
create index idx_prospects_status      on prospects(status);
create index idx_prospects_score       on prospects(score desc);
create index idx_sequences_due         on sequences(next_action_at) where stopped = false;
create index idx_emails_prospect        on emails(prospect_id);
create index idx_emails_inbound_unclass on emails(direction, intent) where direction='inbound' and intent is null;
create index idx_tasks_open             on tasks(status, priority) where status = 'open';
```

> **RLS** : active Row Level Security sur toutes les tables. Au départ, une seule policy `auth.uid() = owner` ou accès service-role côté serveur uniquement.

---

## 4. API Routes Next.js (App Router)

| Route | Méthode | Type | Rôle couvert |
|-------|---------|------|--------------|
| `/api/prospects` | GET/POST | Service | CRM (14) |
| `/api/prospects/[id]` | GET/PATCH/DELETE | Service | CRM (14) |
| `/api/prospects/import` | POST | Service | Recherche (3) — upload CSV |
| `/api/prospects/[id]/verify` | POST | Service | Vérification (4) |
| `/api/prospects/[id]/enrich` | POST | Service | Enrichissement (6) |
| `/api/prospects/[id]/qualify` | POST | **IA** | Qualification (5) |
| `/api/emails/draft` | POST | **IA** | Rédaction (7) |
| `/api/emails/send` | POST | Service | Envoi (9) |
| `/api/responses/classify` | POST | **IA** | Lecture réponses (11) |
| `/api/negotiation/analyze` | POST | Service + **IA** | Négociation (12) |
| `/api/documents/generate` | POST | Service | Documents (13) |
| `/api/deliverability/check` | GET | Service | Anti-Spam (8) |
| `/api/reports/daily` | GET | Service | Reporting (15) |
| `/api/webhooks/resend` | POST | Service | reçoit ouvertures/rebonds/réponses |
| `/api/cron/followups` | GET | Cron | Relance (10) |
| `/api/cron/daily-report` | GET | Cron | Directeur (1) + Reporting (15) |
| `/api/cron/market-watch` | GET | Cron | Veille (2) |
| `/api/cron/deliverability` | GET | Cron | Anti-Spam (8) |

> Toutes les routes `/api/cron/*` sont protégées par un header `Authorization: Bearer ${CRON_SECRET}` (Vercel l'envoie automatiquement).

---

## 5. Cron jobs (`vercel.json`)

```json
{
  "crons": [
    { "path": "/api/cron/followups",      "schedule": "0 8 * * 1-5" },
    { "path": "/api/cron/daily-report",   "schedule": "0 19 * * *" },
    { "path": "/api/cron/deliverability", "schedule": "0 6 * * 1" },
    { "path": "/api/cron/market-watch",   "schedule": "0 7 * * 1" }
  ]
}
```

- **followups** : du lundi au vendredi à 8h. Lit `sequences` où `next_action_at <= now()` et `stopped=false`, respecte le `daily_limit` de la campagne, déclenche l'envoi de la relance, incrémente `current_step`.
- **daily-report** : 19h tous les jours. Agrège les métriques, appelle (optionnellement) Claude pour 2 phrases de synthèse → écrit dans `daily_reports`.
- **deliverability** : lundi 6h. Vérifie SPF/DKIM/DMARC + taux de rebond de la semaine, alerte si > seuil.
- **market-watch** : lundi 7h (le plus optionnel — à activer en dernier).

---

## 6. Les 4 vrais AI-agents (contrats d'interface)

Tous utilisent `claude-sonnet-4-6` (bon rapport coût/qualité pour ces tâches).

### 6.1 Qualification (rôle 5)

```
ENTRÉE  : { company_name, website_text (scrapé), country, segment }
PROMPT  : "Tu es analyste sourcing fruits frais. Note ce prospect de 0 à 10
           selon 4 critères (importateur réel de fruits /3, zone Europe ciblée /2,
           taille /2, lien avec la mangue ou les tropicaux /3).
           Réponds UNIQUEMENT en JSON: {score, detail:{...}, reasoning}"
SORTIE  : { score: 8, detail: {...}, reasoning: "..." }
ACTION  : UPDATE prospects SET score, score_detail, status='qualified'
```

### 6.2 Rédaction Commerciale (rôle 7)

```
ENTRÉE  : { prospect (nom, pays, segment, site résumé), notre_offre, langue }
PROMPT  : "Rédige un email B2B court (≤150 mots), dans la langue du prospect,
           personnalisé avec un détail réel de son activité. Mentionne :
           mangues Kent/Keitt du Sénégal, FOB Dakar, calibres dispo, certifs.
           Ton professionnel, pas de superlatifs creux. Pas de pièce jointe."
SORTIE  : { subject, body }
NOTE    : 1 email = 1 génération unique → évite la signature spam du copier-coller.
```

### 6.3 Lecture des Réponses (rôle 11)

```
ENTRÉE  : { email_body reçu }
PROMPT  : "Classe l'intention de cet email en UNE catégorie:
           interested / not_interested / needs_info / wants_sample /
           price_negotiation / unsubscribe / out_of_office.
           Réponds en JSON: {intent, confidence, key_points[]}"
SORTIE  : { intent: 'wants_sample', confidence: 0.9, key_points: [...] }
ACTION  : UPDATE emails SET intent ; si intent ∈ {interested, wants_sample,
          price_negotiation} → sequences.stopped=true + notif au Directeur.
```

### 6.4 Handoff + Briefing (rôle 12 redéfini)

L'IA **ne négocie pas**. Quand un prospect devient chaud, elle s'efface et te prépare le terrain. C'est la philosophie « l'IA remplit le pipeline, l'humain convertit ».

```
DÉCLENCHEUR (sortie de l'agent Lecture des Réponses 11) :
  intent ∈ {interested, needs_info, wants_sample, price_negotiation}
       │
       ├─▶ sequences.stopped = true        (arrêt immédiat des robots)
       ├─▶ prospects.status   = 'hot'
       └─▶ création d'une task + briefing IA
BRIEFING (dernier appel Claude, en français) :
  ENTRÉE : historique complet du prospect (emails, score, infos société)
  PROMPT : "Produis un briefing de 5 lignes maximum en français pour préparer
            une prise de contact commerciale. Inclus : profil de l'entreprise,
            score et pourquoi, intention détectée, point d'attention éventuel,
            action recommandée. Style télégraphique, factuel."
  SORTIE : texte → tasks.briefing
  ex: "Importateur belge, fruits tropicaux, score 9/10 (importe déjà mangue +
       ananas). A répondu en 6h, demande prix CIF Anvers + échantillon Kent.
       ⚠️ mentionne un fournisseur ivoirien actuel. → Contact WhatsApp prioritaire,
       préparer grille CIF Anvers et dispo échantillon."
```

Le calcul de marge déterministe (`lib/margin.ts`) reste disponible **pour toi** dans la fiche prospect quand tu négocies — mais c'est un outil que tu consultes, pas un agent qui agit seul.

> **Garde-fou** : tous les emails générés par IA passent en **revue humaine** (toi) avant envoi, au moins en Phase 1-2. Jamais d'envoi 100 % autonome à froid.

---

## 7. Flux de données (pipeline complet)

```
   [CSV importateurs]                 [Veille marché]
          │                                  │
          ▼                                  ▼
   ┌─────────────┐                    ┌──────────────┐
   │ Recherche(3)│                    │  market_data │
   │  → prospects│                    └──────────────┘
   └─────────────┘
          │  status=new
          ▼
   ┌─────────────┐   site mort/faux
   │Vérification │ ──────────────────▶ status=lost
   │     (4)     │
   └─────────────┘
          │  status=verified
          ▼
   ┌─────────────┐
   │Enrichissmt(6)│ → contacts (emails publics)
   └─────────────┘
          │
          ▼
   ┌─────────────┐ 🧠 IA
   │Qualification│ → score, status=qualified
   │     (5)     │   (si score < seuil → status=lost)
   └─────────────┘
          │  score ≥ 7
          ▼
   ┌─────────────┐ 🧠 IA
   │ Rédaction(7)│ → email draft
   └─────────────┘
          │  [REVUE HUMAINE]
          ▼
   ┌─────────────┐    ┌──────────────┐
   │  Envoi (9)  │───▶│ Anti-Spam(8) │ (vérif avant + monitoring après)
   │  → Resend   │    └──────────────┘
   └─────────────┘
          │  status=contacted ; crée sequences
          ▼
   ┌─────────────┐
   │ Relance(10) │ ◀── Cron J+5 / J+12 / J+25
   └─────────────┘
          │
   [Resend webhook: réponse reçue]
          ▼
   ┌─────────────┐ 🧠 IA
   │Lecture rép. │ → intent
   │    (11)     │
   └─────────────┘
          │
   ┌──────┴───────────────────────────────────┐
   │                  │                        │
   ▼ négatif/unsub    ▼ pas de réponse         ▼ intéressé / prix / échantillon
[lost]            [relances continuent]   ┌────────────────────────┐
(fermeture auto)                          │   HANDOFF (rôle 12)     │
                                          │ • sequences.stopped=true│
                                          │ • status = 'hot'        │
                                          │ • briefing IA (français)│
                                          │ • task créée            │
                                          └────────────────────────┘
                                                     │
                                                     ▼
                                          ┌────────────────────────┐
                                          │ DASHBOARD "Prospects    │
                                          │ chauds" (tu prends la   │
                                          │ main) → WhatsApp → appel│
                                          │ → négo humaine → [won]  │
                                          └────────────────────────┘
          │
          ▼
   ┌─────────────┐         ┌──────────────┐
   │ Documents   │────────▶│   CRM (14)    │
   │ Export (13) │         │  historique   │
   └─────────────┘         └──────────────┘
          │                        │
          └────────┬───────────────┘
                   ▼
          ┌─────────────────┐ ◀── Cron 19h
          │ Reporting (15)  │
          │ + Directeur (1) │ → daily_reports + dashboard
          └─────────────────┘
```

### Machine à états du prospect (règles de transition)

**Zone IA (automatique)** — l'IA fait avancer le prospect :

```
new → verified → qualified → contacted → replied
not_interested / unsubscribe   → status='lost',  stopped=true   (fermeture auto)
out_of_office / aucune réponse → relances J+5/J+12/J+25 jusqu'à épuisement → 'lost'
interested / needs_info /
wants_sample / price_negotiation → status='hot', stopped=true, task+briefing
```

**━━━ FRONTIÈRE HANDOFF ━━━** (l'IA s'arrête définitivement ici)

**Zone humaine (transitions manuelles dans l'UI)** — c'est toi qui cliques :

```
hot → contacted_whatsapp → meeting_scheduled → quotation_sent
    → sample_sent → won
                  (ou → lost à n'importe quelle étape)
```

> Ces statuts post-handoff servent ton **suivi de tunnel** : voir combien de prospects sont bloqués à chaque étape (ex. 4 en `quotation_sent` depuis +15j = relance commerciale à faire toi-même). L'IA ne touche jamais à ces transitions — elle a fini son travail à `hot`.

> **Notification = dashboard seul.** Pas de service de notif externe (ni email, ni WhatsApp API). La vue d'accueil affiche les `tasks` ouvertes triées par priorité, avec un compteur. Le plus simple et le plus robuste : rien ne peut tomber en panne entre l'IA et toi.

---

## 8. Arborescence du projet

```
tropicaura-prospection/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                  # Dashboard = "Prospects chauds" en tête (handoff)
│   ├── prospects/
│   │   ├── page.tsx                  # Pipeline / liste
│   │   └── [id]/page.tsx             # Fiche prospect (+ briefing + calc marge)
│   ├── inbox/page.tsx                # Réponses classées
│   ├── documents/page.tsx           # Génération docs export
│   ├── reports/page.tsx             # Reporting
│   └── api/
│       ├── prospects/
│       │   ├── route.ts              # GET, POST
│       │   ├── import/route.ts       # POST (CSV)
│       │   └── [id]/
│       │       ├── route.ts          # GET, PATCH, DELETE
│       │       ├── verify/route.ts
│       │       ├── enrich/route.ts
│       │       └── qualify/route.ts  # 🧠 IA
│       ├── emails/
│       │   ├── draft/route.ts        # 🧠 IA
│       │   └── send/route.ts
│       ├── responses/
│       │   └── classify/route.ts     # 🧠 IA
│       ├── negotiation/
│       │   └── analyze/route.ts      # ⚙️+🧠
│       ├── documents/
│       │   └── generate/route.ts
│       ├── deliverability/
│       │   └── check/route.ts
│       ├── reports/
│       │   └── daily/route.ts
│       ├── webhooks/
│       │   └── resend/route.ts
│       └── cron/
│           ├── followups/route.ts
│           ├── daily-report/route.ts
│           ├── deliverability/route.ts
│           └── market-watch/route.ts
├── lib/
│   ├── supabase/
│   │   ├── client.ts                 # client navigateur
│   │   └── server.ts                 # client service-role (API)
│   ├── ai/
│   │   ├── claude.ts                 # wrapper appel Anthropic
│   │   ├── qualify.ts                # prompt + parse Qualification
│   │   ├── draft.ts                  # prompt Rédaction
│   │   ├── classify.ts               # prompt Lecture réponses
│   │   └── briefing.ts               # prompt Briefing handoff (français)
│   ├── services/
│   │   ├── verify.ts                 # ping site, DNS, HTTP
│   │   ├── enrich.ts                 # coordonnées publiques
│   │   ├── deliverability.ts         # SPF/DKIM/DMARC + rebonds
│   │   ├── sender.ts                 # Resend wrapper + débit
│   │   ├── sequences.ts              # logique relances
│   │   ├── documents.ts              # templating proforma/packing
│   │   └── reporting.ts              # agrégations SQL
│   ├── margin.ts                     # calcul marge (déterministe)
│   └── utils.ts
├── components/
│   ├── PipelineBoard.tsx
│   ├── HotLeadsBoard.tsx             # vue prospects chauds (handoff)
│   ├── BriefingCard.tsx              # briefing IA avant prise de contact
│   ├── ProspectCard.tsx
│   ├── EmailReviewModal.tsx          # revue humaine avant envoi
│   ├── InboxList.tsx
│   ├── MetricsCards.tsx
│   └── DocumentForm.tsx
├── types/
│   └── index.ts                      # types partagés (Prospect, Email…)
├── supabase/
│   └── migrations/
│       └── 0001_init.sql
├── vercel.json                       # crons
├── .env.local
│     # ANTHROPIC_API_KEY, RESEND_API_KEY,
│     # NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
│     # CRON_SECRET, RESEND_WEBHOOK_SECRET
├── package.json
└── README.md
```

---

## 9. Plan de développement étape par étape

### Phase 0 — Validation (avant tout code lourd) · ~3 jours

Objectif : prouver que l'offre intéresse, sans usine.

1. Importer 30 prospects ultra-ciblés (à la main, sources fiables).
2. Brancher **uniquement** : Supabase (table `prospects`) + Rédaction IA + envoi manuel.
3. Réviser et envoyer 30 emails toi-même.
4. **Critère de passage** : ≥ 2-3 réponses sérieuses. Sinon → on retravaille l'offre, pas le code.

### Phase 1 — Noyau CRM + IA · ~1 semaine

5. Schéma Supabase complet (section 3) + RLS.
6. CRUD prospects + import CSV (rôles 3, 14).
7. AI-agent **Qualification** (5) + **Rédaction** (7).
8. UI : Pipeline + fiche prospect + `EmailReviewModal`.

### Phase 2 — Envoi fiable + délivrabilité · ~1 semaine

9. Config domaine : **SPF, DKIM, DMARC** sur Cloudflare (tropic-aura.com). *Bloquant.*
10. Service **Envoi** via Resend (9) + webhook ouvertures/rebonds.
11. Service **Anti-Spam** (8) + cron deliverability.
12. **Relance** (10) : `sequences` + cron J+5/J+12/J+25.

### Phase 3 — Boucle entrante · ~4 jours

13. Webhook Resend → emails inbound.
14. AI-agent **Lecture des Réponses** (11) → classification + STOP séquence.
15. Inbox UI + notifications.

### Phase 4 — Handoff vers l'humain · ~4 jours

16. Table `tasks` + machine à états (règles de transition section 7).
17. AI-agent **Briefing** (12 redéfini) : à la détection « chaud », arrêt des relances + génération du briefing français.
18. **HotLeadsBoard** : vue d'accueil des prospects chauds triés par priorité.
19. `lib/margin.ts` (calcul déterministe, consultable dans la fiche) + **Documents Export** (13) — réutilise tes templates proforma existants.

### Phase 5 — Pilotage · ~3 jours

20. **Reporting** (15) : requêtes d'agrégation.
21. **Directeur Commercial** (1) : dashboard + cron daily-report.

### Phase 6 — Optionnel · à activer en dernier

22. **Veille Marché** (2) : module le plus fragile. À ne construire que si le reste tourne et qu'un besoin réel apparaît.

---

## 10. Points de vigilance (résumé)

1. **Délivrabilité** : sans SPF/DKIM/DMARC corrects, tout le reste est inutile. Phase 2 est non négociable avant le moindre volume.
2. **Revue humaine** : garde un humain dans la boucle avant chaque envoi tant que le système n'a pas fait ses preuves. L'autonomie totale se mérite après des dizaines de cycles réussis.
3. **RGPD / Enrichissement** : ne collecte que des coordonnées professionnelles publiques, trace la source (`is_public_source`), respecte les demandes de désinscription (statut `dnc`). Le marché européen est le plus strict — c'est aussi ta cible.
4. **Recherche prospects** : privilégie les bases CSV qualifiées (annuaires d'importateurs, salons) au scraping fragile et juridiquement risqué.
5. **Coût IA maîtrisé** : seuls 3,5 rôles appellent Claude. Mets un cache sur la qualification (ne re-qualifie pas un prospect déjà noté) et batch les classifications.

---

*Architecture conçue pour démarrer petit (Phase 0) et grandir par couches, chaque couche n'étant ajoutée que lorsque la précédente prouve sa valeur.*
