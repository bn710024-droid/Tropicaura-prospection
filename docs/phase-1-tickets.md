# Tropic-Aura B.C. — Phase 1 : Tickets de développement

**Objectif de la Phase 1** : un noyau fonctionnel où tu peux importer des prospects, les faire qualifier et rédiger par l'IA, et réviser les emails — le tout dans une UI propre. **L'envoi réel est en Phase 2** (il dépend de la config SPF/DKIM/DMARC).

**Definition of Done globale (Phase 1)** : tu importes un CSV de 30 importateurs réels → l'IA les note 0-10 → l'IA rédige un email personnalisé pour ceux ≥ 7 → tu lis et valides chaque email dans l'interface. (Pas encore d'envoi.)

**Stack** : Next.js 16 (App Router, TypeScript) · Supabase · Claude API · Tailwind · Vercel.

---

## Ordre d'exécution (dépendances)

```
P1-00 ─▶ P1-01 ─▶ P1-02 ─▶ P1-03 ─┬─▶ P1-04 ─▶ P1-05 ─▶ P1-09 ─▶ P1-10
                                    └─▶ P1-06 ─▶ P1-07 ─┐
                                                  P1-08 ─┴─▶ P1-11 ─▶ P1-12
```

---

## P1-00 · Bootstrap du projet Next.js

**Description** : initialiser un projet Next.js propre.

**Tâches**
- `npx create-next-app@latest tropicaura-prospection` (App Router, TypeScript, Tailwind, ESLint, `src/` non — on garde `app/` à la racine). Version actuelle : **Next.js 16**, où Turbopack est le bundler par défaut (stable) — on le garde activé.
- Structure de dossiers vide selon l'arborescence de l'architecture (`lib/`, `components/`, `types/`, `supabase/migrations/`).
- `.env.local` avec les clés (placeholders pour l'instant).
- Git init + premier commit + repo GitHub `BN710024-Droide/tropicaura-prospection`.

**Critères d'acceptation**
- `npm run dev` démarre sans erreur sur `localhost:3000`.
- Le repo est poussé sur GitHub.

**Variables d'environnement à prévoir**
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
RESEND_API_KEY=          # Phase 2
CRON_SECRET=             # Phase 2
```

---

## P1-01 · Connexion Supabase

**Description** : créer le projet Supabase et les clients d'accès.

**Tâches**
- Créer le projet Supabase, récupérer URL + clés.
- `lib/supabase/client.ts` : client navigateur (anon key).
- `lib/supabase/server.ts` : client serveur (service-role key, usage API routes uniquement).
- Installer `@supabase/supabase-js`.

**Critères d'acceptation**
- Un appel test (ex. `select 1`) renvoie une réponse depuis une API route.
- La service-role key n'est **jamais** exposée côté client (pas de `NEXT_PUBLIC_`).

---

## P1-02 · Migration SQL initiale + RLS

**Description** : créer le schéma de base de données.

**Tâches**
- `supabase/migrations/0001_init.sql` avec les tables : `prospects`, `contacts`, `emails`, `campaigns`, `sequences`, `tasks`, `activity_log` (les autres viendront en Phase 2+).
- Copier les définitions depuis le document d'architecture (section 3).
- Créer les index recommandés.
- Activer RLS sur toutes les tables. Pour démarrer : accès via service-role côté serveur uniquement (pas d'accès client direct).

**Critères d'acceptation**
- La migration s'exécute sans erreur dans l'éditeur SQL Supabase.
- Les 7 tables existent avec les bons types.
- RLS activé (les requêtes anon échouent, les requêtes service-role passent).

---

## P1-03 · Types partagés

**Description** : définir les types TypeScript miroir du schéma.

**Tâches**
- `types/index.ts` : `Prospect`, `Contact`, `Email`, `Sequence`, `Task`, et les enums de statut (`ProspectStatus`, `EmailIntent`).
- Idéalement, générer depuis Supabase (`supabase gen types typescript`) puis exposer des types métier propres par-dessus.

**Critères d'acceptation**
- `ProspectStatus` couvre tous les statuts (new → won/lost, y compris les statuts humains post-handoff).
- Aucun `any` dans les types principaux.

---

## P1-04 · CRUD Prospects (API + données)

**Description** : routes de gestion des prospects (rôle CRM 14).

**Tâches**
- `app/api/prospects/route.ts` : `GET` (liste filtrable par statut/score) + `POST` (création).
- `app/api/prospects/[id]/route.ts` : `GET` + `PATCH` (notamment changement de statut) + `DELETE`.
- Validation des entrées (zod recommandé).
- Chaque mutation écrit une ligne dans `activity_log`.

**Critères d'acceptation**
- Créer, lire, modifier, supprimer un prospect via les routes fonctionne.
- Le changement de statut est validé contre la machine à états (ex. on ne passe pas de `new` à `won` directement).

---

## P1-05 · Import CSV de prospects (rôle Recherche 3)

**Description** : charger une base d'importateurs depuis un CSV.

**Tâches**
- `app/api/prospects/import/route.ts` : `POST` reçoit un CSV, parse (papaparse), insère en masse.
- Colonnes attendues : `company_name, website, country, city, segment, source`.
- Déduplication sur `website` ou `company_name + country`.
- Composant UI d'upload (`components/ImportButton`).

**Critères d'acceptation**
- Importer un CSV de 30 lignes crée 30 prospects en statut `new`.
- Les doublons ne sont pas réinsérés.
- Un rapport d'import s'affiche (X créés, Y doublons ignorés).

> **Rappel** : privilégie les CSV d'annuaires d'importateurs qualifiés. Pas de scraping LinkedIn.

---

## P1-06 · Wrapper Claude API

**Description** : un point d'entrée unique vers l'API Anthropic.

**Tâches**
- `lib/ai/claude.ts` : fonction `callClaude({ system, user, maxTokens })` utilisant `claude-sonnet-4-6`.
- Gestion d'erreur + retry simple (1 retry sur 429/500).
- Helper `parseJSON()` qui nettoie d'éventuels backticks ```` ```json ```` avant `JSON.parse`.
- Log du coût/tokens dans `activity_log` (optionnel mais utile).

**Critères d'acceptation**
- Un appel test renvoie une réponse texte.
- Un appel demandant du JSON renvoie un objet parsé proprement.

---

## P1-07 · AI-agent Qualification (rôle 5) 🧠

**Description** : noter la pertinence d'un prospect de 0 à 10.

**Tâches**
- `lib/ai/qualify.ts` : prompt selon l'architecture (4 critères : importateur fruits /3, Europe /2, taille /2, lien mangue/tropicaux /3). Sortie JSON `{score, detail, reasoning}`.
- Récupération du texte du site : `fetch` de l'URL publique du prospect + extraction du texte (strip HTML). **Site du prospect uniquement**, rien d'autre.
- `app/api/prospects/[id]/qualify/route.ts` : `POST` → fetch site → appel Claude → `UPDATE prospects SET score, score_detail, status='qualified'`.
- Cache : ne pas re-qualifier un prospect déjà noté (sauf forçage).

**Critères d'acceptation**
- Qualifier un importateur de fruits tropicaux donne un score élevé (8-10).
- Qualifier un restaurant ou un site hors sujet donne un score bas (1-4).
- Le score et son détail sont persistés et le statut passe à `qualified`.

---

## P1-08 · AI-agent Rédaction Commerciale (rôle 7) 🧠

**Description** : générer un email B2B personnalisé.

**Tâches**
- `lib/ai/draft.ts` : prompt selon l'architecture (≤150 mots, langue du prospect, un détail réel de son activité, mention mangues Kent/Keitt Sénégal, FOB Dakar, calibres, certifs). Sortie `{subject, body}`.
- `app/api/emails/draft/route.ts` : `POST` (prospect_id) → appel Claude → crée une ligne `emails` en `direction='outbound'`, `status='queued'` (pas envoyé).
- Injection des données réelles de ton offre (volumes, calibres, certifs) via un objet de config `lib/offer.ts`.

**Critères d'acceptation**
- L'email généré mentionne un élément spécifique du prospect (pas un template générique).
- Deux prospects différents produisent deux emails différents.
- L'email est en statut `queued`, jamais envoyé en Phase 1.

> **`lib/offer.ts`** : centralise ici ton offre exportable (variétés, calibres, volumes mensuels, certifications, conditions FOB Dakar). C'est la source de vérité commerciale réutilisée par la rédaction et plus tard les documents export.

---

## P1-09 · UI Pipeline (PipelineBoard)

**Description** : vue principale listant les prospects par statut.

**Tâches**
- `components/PipelineBoard.tsx` : colonnes ou liste filtrable par statut.
- Affichage : nom société, pays, segment, score (badge couleur selon 0-4 / 5-6 / 7-10).
- Tri par score décroissant.
- Boutons d'action par prospect : « Qualifier », « Rédiger email ».

**Critères d'acceptation**
- Les 30 prospects importés s'affichent.
- Le filtre par statut fonctionne.
- Cliquer « Qualifier » déclenche P1-07 et met à jour le score à l'écran.

---

## P1-10 · UI Fiche prospect

**Description** : page détail d'un prospect.

**Tâches**
- `app/prospects/[id]/page.tsx` : infos société, score + détail, historique des emails, statut courant.
- Sélecteur de statut respectant la machine à états.
- Bouton « Rédiger email » → ouvre la modale de revue (P1-11).

**Critères d'acceptation**
- Toutes les infos d'un prospect sont visibles sur une page.
- Le changement de statut manuel fonctionne et est tracé.

---

## P1-11 · UI Revue d'email (EmailReviewModal) — la pièce clé

**Description** : revue humaine obligatoire avant tout envoi.

**Tâches**
- `components/EmailReviewModal.tsx` : affiche `subject` + `body` générés, éditables.
- Actions : « Modifier », « Valider » (passe en `ready_to_send` — l'envoi réel est Phase 2), « Régénérer » (rappelle P1-08).
- Aucun bouton « Envoyer » fonctionnel en Phase 1 (placeholder désactivé).

**Critères d'acceptation**
- L'email généré s'affiche et est modifiable.
- « Régénérer » produit une nouvelle version.
- Le bouton d'envoi est visiblement désactivé avec mention « Activé en Phase 2 ».

---

## P1-12 · Smoke test end-to-end

**Description** : valider le parcours complet Phase 1.

**Tâches**
- Importer un CSV réel de 30 importateurs européens.
- Qualifier les 30.
- Rédiger un email pour tous ceux ≥ 7.
- Réviser 5 emails à la main.
- Vérifier la cohérence des données en base.

**Critères d'acceptation**
- Le parcours import → qualif → rédaction → revue fonctionne sans intervention manuelle en base.
- Les scores sont cohérents (les bons prospects remontent).
- Les emails sont personnalisés et exploitables.

---

## Ce qui N'EST PAS dans la Phase 1 (pour rester discipliné)

- ❌ Envoi réel d'emails (Phase 2 — après SPF/DKIM/DMARC)
- ❌ Relances automatiques (Phase 2)
- ❌ Webhook Resend / lecture des réponses (Phase 3)
- ❌ Handoff / tasks / briefing (Phase 4)
- ❌ Reporting / dashboard Directeur (Phase 5)
- ❌ Veille Marché (Phase 6, optionnel)

> Si une idée d'ajout surgit pendant la Phase 1, note-la dans un backlog et **continue**. L'architecture est gelée en v1.

---

## Estimation

Phase 1 complète : **~5 à 7 jours** de travail effectif avec Claude Code, en suivant l'ordre des tickets. Le chemin critique est P1-02 (schéma) → P1-07/08 (les 2 agents IA) → P1-11 (revue).
