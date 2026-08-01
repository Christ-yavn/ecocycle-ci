# PLAN.md — Remise en état ECOCYCLE CI (login production)

> Plan-and-Solve (CONSTITUTION Loi 5). Objectif unique : **le login fonctionne en production sur Vercel, avec l'API IA sur Render.**

## Diagnostic (cause racine)

| # | Cause | Preuve | Confiance |
|---|-------|--------|-----------|
| 1 | Variables `NEXT_PUBLIC_SUPABASE_*` absentes sur Vercel → `/` et le proxy crashent en 500 ; le submit login lève une exception | Aucun `.env*` dans le repo ; page `/debug` créée pour ce problème | 85 % |
| 2 | Comptes démo jamais créés sur le projet Supabase de prod → "Invalid login credentials" | `scripts/seed_test_users.js` nécessite une exécution manuelle locale | 70 % |
| 3 | `schema.sql` / migrations 02-03 jamais exécutés → pas de profil → boucle silencieuse `/` ↔ `/login` | Le login redirigeait vers `/` si pas de profil, qui renvoie vers `/login` | 40 % |
| 4 | Page `/debug` inaccessible en prod si vars manquantes (le proxy crashait aussi sur `/debug`) | `matcher` n'excluait pas `debug` | corrigé |

## Correctifs code appliqués (2026-08-01)

- `src/proxy.ts` : try/catch global — plus de 500 si config absente (routes publiques OK, protégées → `/login?error=config`) ; `/debug` exclu du matcher ; try/catch sur `getUserRole`.
- `src/app/page.tsx` : landing affichée même si Supabase est mal configuré (plus de 500 sur le lien officiel).
- `src/app/(auth)/login/page.tsx` : messages explicites pour `error=config`, `error=no_profile`, `mode=complete` ; plus de boucle silencieuse si profil introuvable.
- `src/app/debug/page.tsx` : valeurs secrètes hardcodées supprimées (elles étaient publiques).
- `README.md` : mot de passe DB fuité remplacé par un placeholder (**à rotationner dans Supabase**).
- Créés : `.env.example`, `DEPLOIEMENT.md`.

## Étapes restantes (action utilisateur — dashboards)

1. **Supabase** : exécuter `supabase/schema.sql` → `migration_02_couche3.sql` → `migration_03_rls_demo.sql` (SQL Editor).
2. **Vercel** : ajouter les 7 variables de `.env.example` → Redeploy.
3. **Seed** : en local, remplir `.env.local` puis `node --env-file=.env.local scripts/seed_test_users.js`.
4. **Render** : vérifier le service `ecocycle-ia` (healthcheck `/api/health`), mettre `IA_API_URL` sur Vercel.
5. **Recette prod** : `/debug` → 2 ✓ ; login `producteur@ecocycle.ci` / mot de passe démo → dashboard ; refresh ; logout.

## Critères de succès

- [ ] `https://<app>.vercel.app` affiche la landing (pas de 500)
- [ ] `https://<app>.vercel.app/debug` → 2 variables ✓
- [ ] Login démo → redirection `/<role>` ; session persiste au refresh ; logout OK
- [ ] Analyse photo IA OK (Render en ligne)

## Risques

- Free tier Render : cold start ~30 s sur l'IA (déjà géré par le code avec message dédié).
- Mot de passe DB ayant fuité dans l'historique git : **rotation obligatoire**.
