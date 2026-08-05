# ECOLOOP VISION 2.0 — PLAN DE TRAVAIL MASTER (handoff-proof)

> **Ce fichier est le point d'entrée de tout agent qui reprend le travail.**
> Lis §1 (état des lieux) → §3 (décisions) → §6 (table de suivi). Reprends au premier ☐.
> Dernière mise à jour : 03/08/2026 — rédaction initiale (pré-exécution).

---

## 1. ÉTAT DES LIEUX — LE PROJET RÉEL AU 03/08/2026

### 1.1 Structure actuelle (monorepo, commit `4d19274`)

```
ecocycle-ci/
├── .agents/skills/         ← supabase + supabase-postgres-best-practices (trackés git)
├── frontend/               ← Next.js 16.2.10 + React 19.2.4 + CSS Modules + Supabase SSR
│   ├── src/app/(auth)/     ← login + register (tunnel 3 étapes, téléphone only)
│   ├── src/app/(dashboard)/← producteur, collecteur, recycleur, acheteur, mairie, admin
│   ├── src/app/api/        ← lots/*, matieres/*, signalements, ia/analyze, notifications, admin/*
│   ├── src/components/     ← shell (MobileShell, AppHeader, BottomTabBar, Sidebar, Topbar),
│   │                         lot (LotStepper…), collecteur (MissionCard, BluetoothScaleMock…),
│   │                         notification/, confirmation/, map/, matiere/, ui/, signalement/
│   ├── src/lib/            ← supabase/ (INTOUCHABLE), auth-actions.ts, nav.ts
│   ├── src/types/          ← role.ts (6 rôles, citoyen supprimé), database.types.ts…
│   ├── test_gemini.js      ← script debug (à trier)
│   └── test_vision.js      ← script debug (à trier)
├── backend/
│   ├── supabase/           ← schema.sql + migrations 02, 03, 04, 05_ecoloop (idempotentes)
│   └── scripts/seed_ecoloop.js  ← purge + 6 comptes démo (0100000000→05 / EcoLoop2026!)
├── DEPLOIEMENT.md          ← checklist déploiement (mise à jour EcoLoop)
└── README.md
```

**Commandes de build** (nouvelles, post-restructure) :
- Frontend : `cd frontend; npm run build` (doit passer — exit 0)
- Seed : `cd backend; node --env-file=.env.local scripts/seed_ecoloop.js`
- Migration SQL : à exécuter manuellement dans Supabase SQL Editor.

### 1.2 Ce qui est déjà livré (v1 EcoLoop, 3 phases validées par builds)

- Auth 100 % téléphone + mot de passe (plus d'email visible), inscription 3 étapes (producteur/collecteur uniquement), autres rôles via back-office admin (`/admin/creer-compte` → `/api/admin/creer-compte`).
- Fusion citoyen→producteur (rôle citoyen retiré du code ; enum DB conservé ; `/citoyen` = 404).
- Migration 05 : tables `notifications`, `appels_offres`, `propositions_offres`, colonne `users.niveau`, triggers notif (lot réservé/collecté, niveau atteint), realtime notifications.
- Producteur : dashboard (niveau + jauge + activité), stepper publication lot (photo → IA Gemini → récap → INSERT réel), `/producteur/activite`, `/producteur/notifications`.
- Collecteur : marketplace missions groupées par commune + filtre, détail mission + acceptation réelle (`/api/lots/[id]/reserver`), carte déplacée sur `/collecteur/carte`, dashboard sans carte, BluetoothScaleMock (UI simulée → vraie API `confirmer-collecte`).
- Notifications : cloche avec badge (AppHeader mobile + Topbar desktop), pages notifications producteur/collecteur, PATCH mark-as-read.
- Design tokens v1 : palette forest/amber claire, Inter + IBM Plex Mono, CSS Modules.
- Renommage EcoLoop partout (sauf identifiants externes : repo GitHub, URL Supabase, bucket `lots-photos`, nom du package).

### 1.3 🔴 BUG CRITIQUE OUVERT — schéma d'email incohérent

**Constat** : après la v1, un commit (`ea8d027`) a modifié `frontend/src/lib/auth-actions.ts` :
- `phoneToEmail()` génère maintenant `<tel>.ecoloop@gmail.com` (contournement de la validation email Supabase)
- MAIS `frontend/src/app/api/admin/creer-compte/route.ts` crée encore `<tel>@ecoloop.ci`
- ET `backend/scripts/seed_ecoloop.js` crée encore `<tel>@ecoloop.ci`

**Conséquence** : aucun compte créé par le seed ou par l'admin ne peut se connecter (le login cherche l'email gmail). Le test de validation « login 0100000002 → Mairie Cocody » **échoue**.

**Décision requise (D1, §3)** — les deux seules options cohérentes :
- **Option A (recommandée)** : revenir à `<tel>@ecoloop.ci` PARTOUT (auth-actions + admin route + seed) ET désactiver « Confirm email » dans Supabase Dashboard → Authentication → Providers → Email. Justification : le téléphone est l'identifiant, l'email est interne, aucune confirmation n'est souhaitée (inscription instantanée).
- **Option B** : garder le plus-addressing gmail PARTOUT (auth-actions + admin route + seed). Acceptable seulement si la confirmation email reste activée.

### 1.4 Points de dette connus (à intégrer dans l'audit)

- `analyse_ia` : l'INSERT de la route `/api/ia/analyze` échoue silencieusement (pas de policy INSERT RLS) — les données IA vivent sur `lots` (score_tri, volume_ia). À trancher : policy insert ou table morte.
- `test_gemini.js` / `test_vision.js` à la racine de `frontend/` — scripts de debug à déplacer dans `backend/scripts/` ou supprimer.
- README.md décrit encore partiellement l'ancienne architecture (FastAPI/YOLO/Render) alors que l'IA = Gemini in-app.
- Acheteur : onglets Accueil/Marketplace pointent tous deux vers `/acheteur` (pas de page d'accueil distincte).
- `confirmer-producteur/route.ts` contient encore le texte « EcoCycle CI » (règle v1 : routes API existantes non modifiées).
- Landing page : liste ROLES (2 rôles publics) — l'ancienne vitrine des 6 rôles a disparu ; la landing n'est pas au niveau « investisseur ».

---

## 2. NATURE DU LIVRABLE VISION 2.0

Le prompt « ECOLOOP VISION 2.0 » demande un **document stratégique complet** (13 phases : audit → stratégie → architecture → design system → copywriting → pages → micro-UX → motion → gamification → confiance → frontend → mobile → localisation), niveau consulting, **avant toute réécriture de code**.

➡️ **Le code de la refonte NE DÉMARRE PAS tant que les documents ne sont pas validés par l'utilisateur.**
Exception : le fix du bug email (§1.3) est du code correctif immédiat, indépendant de Vision 2.0.

Les livrables sont des fichiers Markdown dans `docs/vision-2.0/` (dans le repo, versionnés, lisibles par toute l'équipe) :

```
docs/vision-2.0/
├── 00_PLAN.md              ← ce fichier
├── 01_AUDIT.md             ← Phase 1
├── 02_STRATEGIE.md         ← Phase 2
├── 03_ARCHITECTURE.md      ← Phase 3
├── 04_DESIGN_SYSTEM.md     ← Phase 4
├── 05_COPYWRITING.md       ← Phase 5
├── 06_PAGES.md             ← Phase 6
├── 07_MICRO_UX.md          ← Phase 7
├── 08_MOTION.md            ← Phase 8
├── 09_GAMIFICATION.md      ← Phase 9
├── 10_CONFIANCE.md         ← Phase 10
├── 11_FRONTEND_ARCHI.md    ← Phase 11
├── 12_MOBILE_FIRST.md      ← Phase 12
└── 13_LOCALISATION.md      ← Phase 13
```

**Format obligatoire de chaque document** (sinon la phase n'est pas terminée) :
1. `## Objectif` — pourquoi cette phase existe
2. `## Analyse / Décisions` — le fond, avec le POURQUOI de chaque choix (mode avocat du diable : chaque élément justifié ou supprimé)
3. `## Spécifications` — le contenu actionnable (tokens, textes, wireframes ASCII, tables…)
4. `## Impact code` — ce que ça changera concrètement dans `frontend/` (fichiers, composants)
5. `## Ouvert / Questions` — ce qui reste à trancher

---

## 3. DÉCISIONS BLOQUANTES (à trancher par l'utilisateur — consignées ici)

| # | Question | Options | Statut |
|---|----------|---------|--------|
| D1 | Schéma email canonique (bug §1.3) | A: `@ecoloop.ci` partout + confirm email OFF (recommandé) / B: gmail plus-addressing partout | ☐ EN ATTENTE |
| D2 | Dépendances motion (Framer Motion, Lottie) | Autorisées / Interdites (CSS only) / Framer Motion seul | ☐ EN ATTENTE |
| D3 | Périmètre rôles Vision 2.0 | Rester sur 6 rôles v1 (recommandé) / Réintroduire citoyen, « entreprise », messagerie | ☐ EN ATTENTE |
| D4 | Dark Mode | Inclus dans le design system / Reporté post-MVP | ☐ EN ATTENTE |
| D5 | Emails/SMS/Push (Phase 5) | Rédiger les gabarits seulement (pas de provider) / Intégrer un provider (lequel ?) | ☐ EN ATTENTE |

---

## 4. ORDRE D'EXÉCUTION (vagues + dépendances)

```
Wave 0  D1-D5 tranchées + FIX BUG EMAIL (code, ~15 min, build de validation)
Wave 1  01_AUDIT            (aucune dépendance — s'appuie sur §1 de ce plan)
Wave 2  02_STRATEGIE        (dépend de 01)
Wave 3  03_ARCHITECTURE     (dépend de 02)
        04_DESIGN_SYSTEM    (dépend de 02, parallélisable avec 03)
Wave 4  05_COPYWRITING      (dépend de 02)
Wave 5  06_PAGES            (dépend de 03 + 04 + 05)
Wave 6  07_MICRO_UX         (dépend de 04 + 06)
        08_MOTION           (dépend de 04 + 06, soumis à D2)
        09_GAMIFICATION     (dépend de 06 — étendre niveau/points existants)
        10_CONFIANCE        (dépend de 06)
Wave 7  11_FRONTEND_ARCHI   (dépend de 03 + 04 + 06)
        12_MOBILE_FIRST     (dépend de 06 + 11)
        13_LOCALISATION     (dépend de 02 + 11)
Wave 8  Synthèse + validation utilisateur → puis PLAN D'IMPLÉMENTATION CODE
```

---

## 5. RÈGLES D'EXÉCUTION (non négociables)

1. **Aucun code de refonte avant validation** des docs (sauf fix D1).
2. Tout code ultérieur : `cd frontend; npm run build` doit passer (exit 0) après chaque modification.
3. CSS Modules uniquement. Pas de Tailwind, pas de styled-components.
4. Aucune nouvelle dépendance npm sans accord explicite (D2).
5. Ne jamais modifier `frontend/src/lib/supabase/*` ni les routes API existantes (`/api/lots/*`, `/api/matieres/*`, `/api/ia/analyze`…).
6. Zéro simulation : tout bouton appelle une vraie API / vraie donnée Supabase.
7. Ne jamais lire/afficher `frontend/.env.local` (secrets).
8. SQL : idempotent (`IF NOT EXISTS`, `DROP POLICY IF EXISTS`), jamais de `DROP TABLE` sur l'existant.
9. Chaque doc terminée → mettre à jour la table §6 (☐→☑) + date.
10. Commits git : uniquement sur demande explicite de l'utilisateur.

---

## 6. TABLE DE SUIVI (reprise par un autre agent)

| Fichier | Phase | Statut | Date | Notes |
|---------|-------|--------|------|-------|
| — | D1-D5 décisions | ☐ | | Bloquant Wave 0 |
| — | Fix bug email (§1.3) | ☐ | | Code — build requis |
| 01_AUDIT.md | Audit sans compromis | ☐ | | §1.3 + §1.4 déjà rédigés ici → les intégrer |
| 02_STRATEGIE.md | Stratégie produit | ☐ | | |
| 03_ARCHITECTURE.md | Architecture / navigation | ☐ | | |
| 04_DESIGN_SYSTEM.md | Design system | ☐ | | Tokens v1 existants dans globals.css |
| 05_COPYWRITING.md | Copywriting complet | ☐ | | |
| 06_PAGES.md | Redesign des pages | ☐ | | |
| 07_MICRO_UX.md | Micro UX | ☐ | | |
| 08_MOTION.md | Motion design | ☐ | | Soumis à D2 |
| 09_GAMIFICATION.md | Gamification | ☐ | | Base existante : niveau 1-5 + points |
| 10_CONFIANCE.md | Confiance | ☐ | | |
| 11_FRONTEND_ARCHI.md | Frontend React | ☐ | | |
| 12_MOBILE_FIRST.md | Mobile first | ☐ | | MobileShell déjà en place |
| 13_LOCALISATION.md | Localisation Afrique | ☐ | | |

**Procédure de reprise** : ouvrir ce fichier → §3 vérifier décisions → premier ☐ de la table → produire le doc au format §2 → cocher → commit uniquement si demandé.
