# EcoCycle CI

Plateforme SaaS de gestion circulaire des déchets à Abidjan, connectant tous les acteurs de la filière — producteurs, collecteurs, recycleurs, acheteurs finaux et mairies — via un écosystème numérique structuré par quartier.

**Aucun flux financier sur la plateforme.** Tout repose sur un système de **double confirmation** qui garantit la traçabilité complète des déchets, du tri à la source jusqu'à la matière première recyclée.

---

## Sommaire

- [Vision](#vision)
- [Acteurs et rôles](#acteurs-et-rôles)
- [Stack technique](#stack-technique)
- [Architecture](#architecture)
- [Structure du projet](#structure-du-projet)
- [Prérequis](#prérequis)
- [Installation et lancement en local](#installation-et-lancement-en-local)
- [Base de données Supabase](#base-de-données-supabase)
- [Module IA (FastAPI + YOLO)](#module-ia-fastapi--yolo)
- [Variables d'environnement](#variables-denvironnement)
- [Déploiement sur Vercel](#déploiement-sur-vercel)
- [API IA sur Render / Railway](#api-ia-sur-render--railway)
- [Scripts disponibles](#scripts-disponibles)

---

## Vision

Abidjan produit des milliers de tonnes de déchets par jour. La chaîne de gestion est fragmentée, inefficace et largement informelle. EcoCycle CI agit sur trois leviers :

1. **Stimuler le tri à la source** : les producteurs trient et rangent leurs déchets, incités par un système de points de récompense.
2. **Optimiser la collecte** : les collecteurs ont une vision cartographique des gisements disponibles, avec volume, type et itinéraire optimisé (routage OSRM).
3. **Fluidifier le recyclage** : collecteurs, recycleurs et acheteurs finaux sont connectés via une marketplace de matières, avec confirmation sans flux financier.

---

## Acteurs et rôles

| Rôle | Accès | Rôle dans la chaîne |
|------|-------|---------------------|
| **Producteur** | Gratuit | Trie, photographie, publie des lots de déchets, gagne des points |
| **Collecteur** | Payant | Carte des gisements, itinéraire optimisé, collecte, stock, livraison |
| **Recycleur** | Payant | Commande des déchets triés, transforme, publie les matières recyclées |
| **Acheteur final** | Payant | Consulte le catalogue de matières premières recyclées |
| **Mairie** | Payant | Dashboard de supervision, alertes dépôts sauvages, statistiques |
| **Citoyen** | Gratuit | Signale les dépôts sauvages dans son quartier |

### Système de double confirmation (3 couches)

- **Couche 1** — Producteur ↔ Collecteur : confirme la collecte physique → crédite les points du producteur (trigger SQL automatique).
- **Couche 2** — Collecteur ↔ Recycleur : confirme la livraison du stock.
- **Couche 3** — Recycleur ↔ Acheteur : confirme la livraison des matières premières.

---

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Framework frontend | Next.js 16 (App Router, TypeScript, Turbopack) |
| Base de données & Auth | Supabase (PostgreSQL + PostGIS + Storage) |
| Cartographie | Leaflet.js + Leaflet Routing Machine (OSRM) |
| Module IA | FastAPI + PyTorch + Ultralytics YOLOv8 (microservice Docker) |
| Styling | CSS Modules natif (design system "EcoLoop") |
| Polices | Fraunces (titres), Manrope (corps), IBM Plex Mono (labels) — via `next/font` |
| Hébergement frontend | Vercel |
| Hébergement IA | Render / Railway / Koyeb (Docker) |

---

## Architecture

```
┌─────────────────────────────────────────┐
│  Browser (mobile / desktop)             │
│  Next.js 16 App Router (PWA)             │
├──────────────┬──────────────────────────┤
│  Pages       │  Route Handlers (API)    │
│  6 rôles     │  /api/ia/analyze (proxy) │
│  SSR + RLS   │  /api/lots/*/confirmer*  │
│              │  /api/signalements       │
├──────────────┴──────────────────────────┤
│  Proxy (middleware)                      │
│  Refresh session + redirection par rôle  │
├──────────────────────────────────────────┤
│  Supabase (PostgreSQL + PostGIS)        │
│  Tables: users, lots, confirmations,     │
│  analyse_ia, signalements, stocks,       │
│  point_transactions, abonnements         │
│  RLS complète + triggers SQL             │
├──────────────────────────────────────────┤
│  API IA (FastAPI, microservice Docker)   │
│  POST /api/classify/analyze              │
│  YOLOv8 + quality_estimator              │
│  Score tri (1-5) + type + volume         │
└──────────────────────────────────────────┘
```

---

## Structure du projet

```
ECOCYLE.CI/
├── webapp/                    # Frontend Next.js (→ Vercel)
│   ├── src/
│   │   ├── app/               # Pages (App Router)
│   │   │   ├── (auth)/        # Login + Register
│   │   │   ├── (dashboard)/   # 6 espaces rôles
│   │   │   ├── api/           # Route Handlers (proxy IA, confirmations, signalements)
│   │   │   ├── globals.css    # Design system
│   │   │   ├── layout.tsx     # Root layout + fonts
│   │   │   ├── manifest.ts    # PWA manifest
│   │   │   └── page.tsx       # Landing
│   │   ├── components/        # Composants UI + Shell + Map + Lot + Confirmation
│   │   ├── lib/               # Clients Supabase + auth-actions + nav
│   │   ├── types/             # Types TypeScript (database, role, ia, map)
│   │   └── proxy.ts           # Middleware (proxy) — redirection par rôle
│   ├── supabase/
│   │   └── schema.sql         # Schéma DB complet (tables + RLS + triggers + PostGIS)
│   ├── public/                # icon.svg (PWA)
│   ├── .env.example           # Template variables d'env
│   ├── .gitignore
│   ├── next.config.ts
│   ├── package.json
│   └── tsconfig.json
│
├── ia/                        # API IA Python (→ Render/Railway, séparé de Vercel)
│   ├── api/                   # FastAPI (ai_server.py + routes/ + middleware/)
│   ├── models/                # waste_classifier (YOLO) + prediction + fraud_detection
│   ├── config/                # settings.py (pydantic-settings)
│   ├── saved_models/          # ecoloop_yolo.pt + .pkl (gitignored)
│   ├── scripts/               # Entraînement + scraping
│   ├── Dockerfile             # Python 3.12 + PyTorch CPU
│   ├── docker-compose.yml
│   ├── requirements.txt
│   └── .env.example
│
└── master_prompt_ecocycle.md  # Document de référence
```

---

## Prérequis

- **Node.js** 20+ et npm
- **Python** 3.12+ (pour l'API IA)
- **Docker** (pour lancer l'IA en conteneur) — optionnel
- Un projet **Supabase** (gratuit tier suffisant pour le MVP)
- Un compte **Vercel** (pour le déploiement frontend)
- Un compte **Render** ou **Railway** (pour héberger l'API IA)

---

## Installation et lancement en local

### 1. Frontend Next.js

```bash
cd webapp
npm install
cp .env.example .env.local
# Éditer .env.local avec vos valeurs Supabase (voir ci-dessous)
npm run dev
```

L'application est accessible sur `http://localhost:3000`.

### 2. Base de données Supabase

1. Créez un projet sur [supabase.com](https://supabase.com).
2. Dans le **SQL Editor**, copiez-collez et exécutez le fichier `webapp/supabase/schema.sql`.
3. Récupérez l'URL du projet et les clés dans **Settings → API**.

### 3. Module IA (FastAPI + YOLO)

#### Option A — Docker (recommandé)

```bash
cd ia
cp .env.example .env
# Éditer .env avec JWT_SECRET (identique à IA_JWT_SECRET du webapp/.env.local)
docker compose up -d
```

Vérifiez : `curl http://localhost:8000/api/health`

#### Option B — Python direct

```bash
cd ia
python -m venv .venv
# Windows
.venv\Scripts\activate
# Linux/Mac
# source .venv/bin/activate

pip install -r requirements.txt
uvicorn api.ai_server:app --reload --port 8000
```

---

## Base de données Supabase

Le schéma complet est dans `webapp/supabase/schema.sql`. Il inclut :

- **9 tables** : `users`, `lots`, `analyse_ia`, `confirmations`, `stocks`, `point_transactions`, `signalements`, `abonnements`, `photos`
- **PostGIS** : colonnes `location geometry(Point,4326)` sur `lots` et `signalements`, avec triggers d'auto-géolocalisation depuis lat/lng
- **Row Level Security (RLS)** complète sur toutes les tables
- **3 triggers** :
  - `handle_new_user()` : crée le profil `public.users` à l'inscription (lit le rôle depuis `raw_user_meta_data`)
  - `credit_points_on_confirmation()` : crédite automatiquement les points du producteur après double confirmation couche 1 (calcul : `5 × coef_tri × coef_volume`)
  - `set_lot_location()` / `set_signalement_location()` : remplit `location` PostGIS depuis lat/lng
- **Storage bucket** `lots-photos` avec policies (upload auth, read public)

---

## Module IA (FastAPI + YOLO)

L'API IA est un microservice Python séparé du frontend Next.js.

### Endpoint utilisé par l'app

`POST /api/classify/analyze` (multipart `file`) → retourne :

```json
{
  "score_qualite": 75,
  "type_dominant": "plastique",
  "poids_estime_kg": 12.5,
  "etat": "trie",
  "collectable": true,
  "recommandations": [...],
  "fallback_used": false
}
```

### Mapping EcoCycle

- `score_tri (1-5)` = `clamp(round(score_qualite / 20), 1, 5)`
- `type_dechet` = `type_dominant`
- `volume_ia` = `poids_estime_kg`

### Flux d'intégration

```
Browser → POST /api/ia/analyze (Next.js, valide session)
  → POST /api/classify/analyze (FastAPI Docker)
  → YOLO + quality_estimator
  → Retour JSON → Mapping → AnalyseIa
  → Persistance analyse_ia + retour au browser
```

### Amélioration de l'entraînement

Voir `ia/docs/PROMPT_REENTRAINEMENT_ABIDJAN.md` pour le plan de ré-entraînement sur des photos de déchets d'Abidjan (sacs noirs, bidons, canettes locales).

---

## Variables d'environnement

### `webapp/.env.local`

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<votre-projet>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<votre_anon_key>
SUPABASE_SERVICE_ROLE_KEY=<votre_service_role_key>
SUPABASE_DB_PASSWORD=<votre_mot_de_passe_db>

# Module IA
IA_API_URL=http://localhost:8000
IA_JWT_SECRET=<votre_jwt_secret_ia>

# Cron (double confirmation auto)
CRON_SECRET=<votre_cron_secret>
```

### `ia/.env`

```env
API_HOST=0.0.0.0
API_PORT=8000
ENV=development
JWT_SECRET=<votre_jwt_secret_ia>    # Identique à IA_JWT_SECRET du webapp
ALLOWED_ORIGINS=*
```

> **Important** : `IA_JWT_SECRET` (webapp) et `JWT_SECRET` (ia) doivent être identiques.

---

## Déploiement sur Vercel

### 1. Push vers GitHub

```bash
cd webapp
git add -A
git commit -m "feat: EcoCycle CI — plateforme complète (couches 1-6)

- Design system EcoLoop (Fraunces/Manrope/IBM Plex Mono)
- Dashboard Shell responsive (6 rôles) avec sidebar + topbar
- Auth Supabase (login/register + redirection par rôle via proxy)
- Schéma SQL complet (9 tables + PostGIS + RLS + 3 triggers)
- Module Producteur : formulaire lot + upload photo + IA + géoloc
- Module Collecteur : carte Leaflet + routing OSRM + réservation
- Double confirmation (3 couches) + crédit points automatique (trigger SQL)
- Dashboard Recycleur : marketplace des stocks collecteurs
- Dashboard Mairie : KPIs temps réel + carte dépôts sauvages
- Module Citoyen : signalement dépôt sauvage (photo + GPS)
- 8 route handlers API (IA proxy, confirmations, signalements)
- Build Vercel : 0 erreur TS, 0 erreur ESLint, 36 routes"

git remote add origin https://github.com/Christ-yavn/ecocycle-ci.git
git branch -M main
git push -u origin main
```

### 2. Connecter à Vercel

1. Allez sur [vercel.com](https://vercel.com) → **New Project**.
2. Importez le repo `Christ-yavn/ecocycle-ci`.
3. **Root Directory** : sélectionnez `webapp` (très important — Vercel ne doit déployer que le Next.js, pas l'IA).
4. Framework Preset : Next.js (auto-détecté).
5. **Environment Variables** — ajoutez les suivantes :

| Name | Value | Note |
|------|-------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<votre-projet>.supabase.co` | 👁️ Public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_...` | 👁️ Public |
| `SUPABASE_SERVICE_ROLE_KEY` | `sb_secret_...` | 🔒 Server only |
| `SUPABASE_DB_PASSWORD` | `TQW6XorjxumsXrSq` | 🔒 Server only |
| `IA_API_URL` | `https://<votre-api-ia>.onrender.com` | URL de l'API IA déployée |
| `IA_JWT_SECRET` | `<votre_jwt_secret>` | 🔒 Identique au JWT_SECRET de l'IA |
| `CRON_SECRET` | `<votre_cron_secret>` | 🔒 Pour les cron jobs |

6. Cliquez **Deploy**. Vercel lance le build (`next build`) et déploie.

### 3. Vérification

- Vercel attribue une URL : `https://ecocycle-ci.vercel.app` (ou similaire).
- Testez : inscription producteur → publication lot (si IA en ligne) → connexion collecteur → carte.
- Mettez à jour `ALLOWED_ORIGINS` dans l'API IA avec l'URL Vercel.

---

## API IA sur Render / Railway

L'API Python ne peut pas tourner sur Vercel (PyTorch CPU ~250 Mo, fonctions serverless limitées). Elle doit être déployée séparément.

### Render (gratuit tier)

1. Créez un **Web Service** sur [render.com](https://render.com).
2. Connectez votre repo GitHub (le même, ou un repo séparé pour `ia/`).
3. **Root Directory** : `ia`.
4. **Build Command** : `pip install -r requirements.txt`
5. **Start Command** : `uvicorn api.ai_server:app --host 0.0.0.0 --port $PORT`
6. **Environment Variables** :
   - `JWT_SECRET=<votre_jwt_secret>`
   - `ALLOWED_ORIGINS=https://ecocycle-ci.vercel.app`
   - `ENV=production`
7. Déployez. Render attribue une URL `https://ecocycle-ia.onrender.com`.
8. Mettez à jour `IA_API_URL` sur Vercel avec cette URL.

### Alternative : Docker sur Railway

```bash
cd ia
railway up
```

Railway détecte automatiquement le `Dockerfile`.

---

## Scripts disponibles

| Commande | Description |
|----------|-------------|
| `npm run dev` | Lance le serveur de développement (Turbopack) |
| `npm run build` | Build de production |
| `npm run start` | Lance le serveur de production |
| `npm run lint` | Vérification ESLint (0 erreur, 0 warning attendu) |
| `npx tsc --noEmit` | Vérification TypeScript (0 erreur attendue) |

---

## Validation build

```
✓ Compiled successfully
✓ TypeScript : 0 erreur
✓ ESLint : 0 erreur, 0 warning
✓ 36 routes générées (28 pages + 8 route handlers API)
✓ Proxy (middleware) actif
```

---

## Licence

Projet EcoCycle CI — MVP Abidjan, Côte d'Ivoire.