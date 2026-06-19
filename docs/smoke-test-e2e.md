# Smoke test end-to-end — Phase 1

Checklist de validation manuelle du parcours complet, à dérouler dans le navigateur.

## Prérequis
- `.env.local` rempli : `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
- Migration `supabase/migrations/0001_init.sql` exécutée dans Supabase.
- `ANTHROPIC_API_KEY` : **optionnelle**. Sans elle, les actions IA renvoient un **503 propre** (l'UI affiche l'erreur sans planter) ; le reste du parcours reste testable.
- Lancer : `npm run dev` puis ouvrir http://localhost:3000 (redirige vers `/prospects`).

## Parcours

| # | Étape | Résultat attendu |
|---|-------|------------------|
| 1 | Ouvrir `/prospects` | Header « Tropic-Aura », carte **Mon Équipe IA** (SCOUT + PLUME en couleur, TRIEUR + BRIEFER grisés « Bientôt »), 4 KPI, pipeline en 5 colonnes. |
| 2 | Préparer un CSV (`company_name, website, country, city, segment, source`) avec ~5 importateurs réels (sites valides). | — |
| 3 | Importer le CSV via le bouton orange | Rapport « X créés / Y doublons / Z invalides ». Les cartes apparaissent dans la colonne **Nouveaux**. |
| 4 | Vérifier une carte | Nom, drapeau pays, badge statut, barre de score (vide tant que non qualifié). |
| 5 | Cliquer **🤖 Qualifier** sur un prospect | Animation « SCOUT analyse le site… ». Puis : **avec clé** → score affiché + carte déplacée en **Qualifiés** ; **sans clé** → bandeau rouge « ANTHROPIC_API_KEY not configured ». |
| 6 | Ouvrir la fiche d'un prospect qualifié | En-tête + score en cercle coloré, section **Analyse de SCOUT** (reasoning, 4 critères en barres, tags), carte **Recommandation SCOUT** (verte si ≥8, orange 5-7, rouge ≤4). |
| 7 | Cliquer **✍️ Rédiger email** (statut `qualified`) | Animation « PLUME rédige l'email… » puis la **modale PLUME** s'ouvre. |
| 8 | Modifier l'objet et le corps dans la modale | Le texte est éditable. Mention « Envoi réel : Phase 2 (désactivé) ». |
| 9 | Cliquer **✅ Approuver** | L'email est sauvegardé (`status = ready_to_send`), la modale se ferme, l'email apparaît dans la section **Emails** de la fiche. |
| 10 | Cliquer **❌ Annuler** (sur un autre brouillon) | La modale se ferme sans erreur ; le brouillon reste en `status = draft`. |
| 11 | Sur la fiche, ouvrir le dropdown **Changer le statut** | Ne propose que les transitions valides (machine à états) — ex. pas de saut direct `qualified → won`. |
| 12 | Marquer un prospect `lost` via le dropdown | Statut mis à jour, carte retirée du board (zone non affichée). |

## Critères de réussite
- Le parcours import → qualif → rédaction → revue fonctionne **sans intervention manuelle en base**.
- Les scores sont cohérents (somme des 4 critères = score total).
- Les emails sont personnalisés (un détail réel du prospect) et ≤ 150 mots.
- Aucune action ne « plante » l'UI : les erreurs (dont 503 sans clé) s'affichent proprement.
- Utilisable au téléphone (colonnes scrollables, modale plein écran en mobile).
