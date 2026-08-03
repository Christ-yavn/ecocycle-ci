# DEPLOIEMENT.md — Checklist complète EcoLoop CI

Suivre ces étapes **dans l'ordre**. Chaque étape est vérifiable.

---

## ÉTAPE 1 — Supabase (base de données + auth)

Dashboard : https://supabase.com → projet EcoCycle → **SQL Editor**

1. Coller + exécuter `supabase/schema.sql` (tables + RLS + trigger `handle_new_user`).
2. Coller + exécuter `supabase/migration_02_couche3.sql`.
3. Coller + exécuter `supabase/migration_03_rls_demo.sql`.
4. Coller + exécuter `supabase/migration_04_ecosysteme.sql` (Nouvelles tables 6 acteurs, admin, RLS).
5. Coller + exécuter `supabase/migration_05_ecoloop.sql` (notifications, appels d'offres, niveaux, fusion citoyen→producteur).

**Vérification** : Table Editor → la table `users` existe.

> ⚠️ Sécurité : un ancien mot de passe DB est visible dans l'historique git du README.
> Changez-le : Settings → Database → Reset database password.

---

## ÉTAPE 2 — Vercel (frontend)

Dashboard : https://vercel.com → projet `ecocycle-ci` → **Settings → Environment Variables**

Ajouter (environnement : **Production** + Preview) :

| Name | Où trouver la valeur |
|------|---------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → Publishable key (`sb_publishable_...`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → Secret key (`sb_secret_...`) |
| `SUPABASE_DB_PASSWORD` | Supabase → Settings → Database |
| `IA_API_URL` | URL Render de l'étape 4 (ex. `https://ecocycle-ia.onrender.com`) |
| `IA_JWT_SECRET` | Chaîne secrète — **identique** au `JWT_SECRET` de Render |
| `CRON_SECRET` | Chaîne secrète quelconque |
| `GEMINI_API_KEY` | Google AI Studio → API Keys (analyse IA photo) |

Puis : **Deployments → ⋯ → Redeploy** (obligatoire : les `NEXT_PUBLIC_*` sont injectées au build).

**Vérification** : ouvrir `https://<votre-app>.vercel.app/debug` → les 2 variables doivent être ✓.

---

## ÉTAPE 3 — Comptes de démonstration (seed)

Le login affiche 6 comptes démo — ils doivent exister dans Supabase. En local :

```bash
# 1. Créer .env.local à la racine du projet (copier .env.example) et remplir :
#    NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
# 2. Exécuter :
node --env-file=.env.local scripts/seed_ecoloop.js
```

**Vérification** : le script affiche « ✅ TOUS LES COMPTES SONT CRÉÉS ».
Comptes démo : `0100000000` (admin) à `0100000005` (recycleur) — mot de passe unique `EcoLoop2026!`.

---

## ÉTAPE 4 — Render (API IA)

Le fichier `ecocycle-ia/render.yaml` configure déjà le service.

1. Dashboard https://render.com → service `ecocycle-ia` → vérifier :
   - Build : `pip install -r requirements.txt`
   - Start : `uvicorn api.ai_server:app --host 0.0.0.0 --port $PORT`
   - Env : `JWT_SECRET` (identique à `IA_JWT_SECRET` Vercel), `ALLOWED_ORIGINS=https://<votre-app>.vercel.app`, `ENV=production`
2. **Vérification** : `https://ecocycle-ia.onrender.com/api/health` doit répondre (1er appel = cold start ~30 s sur le free tier).
3. Reporter l'URL exacte dans `IA_API_URL` sur Vercel (étape 2) + Redeploy Vercel si changée.

---

## ÉTAPE 5 — Recette finale en production

| Test | Résultat attendu |
|------|------------------|
| `https://<app>.vercel.app` | Landing page affichée (pas d'erreur 500) |
| `https://<app>.vercel.app/debug` | 2 variables ✓ |
| Login `0100000002` + `EcoLoop2026!` | Accès Mairie Cocody (`/mairie`) |
| F5 (refresh) sur le dashboard | Session conservée |
| Logout | Retour `/login` |
| Analyse photo (espace producteur) | Résultat IA (sinon message cold start, réessayer 30 s) |

---

## Dépannage rapide

| Symptôme | Cause | Fix |
|----------|-------|-----|
| Page blanche / erreur 500 partout | Étape 2 non faite | Ajouter les variables + **Redeploy** |
| « Invalid login credentials » | Étape 3 non faite | Lancer le seed |
| « aucun profil trouvé en base » | Étape 1 non faite | Exécuter les SQL dans l'ordre |
| « IA en cours de démarrage » | Cold start Render (normal) | Attendre 30 s, réessayer |
| Login OK mais retour à l'accueil | RLS non appliquée | Exécuter `migration_03_rls_demo.sql` |
