# PLAN.md — EcoCycle CI (v2 Écosystème 6 acteurs + Admin)

> Plan-and-Solve (CONSTITUTION Loi 5). Validé par l'utilisateur le 2026-08-01.
> Objectif : porter la plateforme au niveau "MVP incubateur" — 100 % fonctionnel, zéro mock, sans casser la prod.

## Décisions d'architecture validées

| Sujet | Décision | Raison |
|---|---|---|
| Cartographie | **Leaflet + OSRM** (conservé) | Gratuit, déjà en prod, endpoint `/trip` = TSP natif |
| Clustering | **Supercluster** (ajout léger) | Clusters de volumes (kg) sans dépendre de Mapbox |
| Rôles collecteur/recycleur | **Hybride** : rôles DB inchangés + `sous_activite` (collecte/recyclage/mixte) | Ne casse pas les comptes existants |
| Signalement citoyen | Compte conservé **+ espace "Signaler" aussi dans le dashboard producteur** | Demande explicite utilisateur |
| Design | **CSS Modules EcoLoop conservé, refonte pro** : suppression emojis, icônes SVG, finition startup | Demande explicite utilisateur |
| Admin | Nouveau rôle `admin` (7e) + table `market_prices` | Vision MEGAPROMPT |
| Validation collecte | **QR Code dynamique + PIN 4 chiffres fallback** | Vision MEGAPROMPT |
| Gamification | **EcoCoins civiques** : points crédités au citoyen quand la mairie résout un signalement | Amélioration 2 validée |
| Temps réel | `supabase.channel()` sur `lots` + `signalements` | Vision MEGAPROMPT |

## Phases d'exécution

- [x] **P1 — BDD** : `supabase/migration_04_ecosysteme.sql` (admin, sous_activite, capacité véhicule, PIN/QR hash, market_prices, realtime, trigger EcoCoins citoyen, RLS)
- [x] **P2 — Fondations** : types `admin`, proxy `/admin`, register (cases sous-activité, sans emojis), signUp metadata, trigger `handle_new_user` maj
- [x] **P3 — Collecteur** : clustering volumes + toggle gros/détaillé + itinéraire TSP (OSRM `/trip`) + realtime lots
- [x] **P4 — Double validation QR/PIN** : page validation producteur (QR + PIN), scan collecteur (BarcodeDetector + fallback PIN), API dédiée
- [x] **P5 — Producteur "Signaler"** : réutilisation SignalementForm dans l'espace producteur + nav
- [x] **P6 — Mairie** : heatmap dépotoirs (leaflet.heat) + graphiques KPIs (recharts)
- [x] **P7 — Admin** : dashboard prix du marché (CRUD market_prices) + stats utilisateurs
- [x] **P8 — Acheteur B2B** : filtres catalogue + contact recycleur (lien WhatsApp pré-rempli)
- [x] **P9 — Refonte design pro** : purge emojis → Icon SVG partout (login, register, dashboards), polish spacing/typo
- [x] **P10 — Vérification** : lint + build 0 erreur, DEPLOIEMENT.md maj (migration 04), rapport final

## Risques

- Migration 04 non appliquée sur Supabase → nouvelles colonnes absentes (documenté dans DEPLOIEMENT.md, étape à ajouter).
- BarcodeDetector non supporté sur certains navigateurs → fallback PIN obligatoire (prévu).
- Realtime nécessite d'activer la publication sur Supabase (inclus dans le SQL).

## Critères de succès

- [x] `npm run lint` 0 erreur · `npm run build` 0 erreur
- [x] Register avec cases sous-activité fonctionne, rôle admin redirige vers `/admin`
- [x] Carte collecteur : clusters de volumes + TSP tracé depuis GPS réel
- [x] Validation collecte par PIN (fallback) de bout en bout
- [x] Zéro emoji dans l'UI, icônes SVG partout
- [x] Aucune régression sur les flux existants (login, IA, confirmations)
