// ============================================================
// EcoLoop CI — Seed de démonstration
// Remplace scripts/seed_test_users.js (EcoCycle CI).
//
// Ce script :
//   1. Purge toutes les données métier (ordre FK-safe)
//   2. Supprime TOUS les auth.users via l'API admin
//   3. Crée les 6 comptes de démo (email interne <tel>@ecoloop.ci)
//
// Exécution (depuis la racine du projet) :
//   node --env-file=.env.local scripts/seed_ecoloop.js
//
// Idempotent : peut être exécuté plusieurs fois sans erreur.
// ============================================================

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Variables NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requises.");
  console.error("Chargez .env.local avant d'exécuter : node --env-file=.env.local scripts/seed_ecoloop.js");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const PASSWORD = "EcoLoop2026!";

const DEMO_ACCOUNTS = [
  { name: "Admin EcoLoop", phone: "0100000000", role: "admin", commune: "Abidjan", password: PASSWORD },
  { name: "AcheteurTest CI", phone: "0100000001", role: "acheteur", commune: "Abidjan", password: PASSWORD },
  { name: "Mairie Cocody", phone: "0100000002", role: "mairie", commune: "Cocody", password: PASSWORD },
  { name: "Mairie Yopougon", phone: "0100000003", role: "mairie", commune: "Yopougon", password: PASSWORD },
  { name: "EcoRecycle SARL", phone: "0100000004", role: "recycleur", commune: "Cocody", sous_activite: "mixte", password: PASSWORD },
  { name: "GreenTech CI", phone: "0100000005", role: "recycleur", commune: "Yopougon", sous_activite: "mixte", password: PASSWORD },
];

// Tables métier à purger, dans l'ordre des dépendances FK (enfants → parents).
// market_prices est conservée (référentiel géré par l'admin).
const TABLES_A_PURGER = [
  "notifications",
  "propositions_offres",
  "appels_offres",
  "confirmations",
  "analyse_ia",
  "point_transactions",
  "lots",
  "stocks",
  "matiere_premiere",
  "signalements",
  "abonnements",
  "users",
];

async function purgeTable(table) {
  // .not("id", "is", null) = filtre "toutes les lignes" (supabase-js exige un filtre)
  const { error } = await supabase.from(table).delete().not("id", "is", null);
  if (error) {
    // Table absente (migration 05 pas encore exécutée) → avertissement, pas bloquant
    if (error.message.includes("does not exist") || error.code === "42P01") {
      console.log(`  ⚠️ Table ${table} absente — ignorée (migration 05 exécutée ?)`);
      return;
    }
    throw new Error(`Purge ${table}: ${error.message}`);
  }
  console.log(`  ✓ ${table} purgée`);
}

async function purgeAuthUsers() {
  let total = 0;
  let page = 1;
  // Pagination : listUsers retourne max 1000 par page
  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(`listUsers: ${error.message}`);
    const users = data?.users ?? [];
    if (users.length === 0) break;
    for (const u of users) {
      const { error: delErr } = await supabase.auth.admin.deleteUser(u.id);
      if (delErr) throw new Error(`deleteUser ${u.email}: ${delErr.message}`);
      total++;
    }
    if (users.length < 1000) break;
    page++;
  }
  console.log(`  ✓ ${total} auth.users supprimés`);
}

async function createAccount(account) {
  const email = `${account.phone}@ecoloop.ci`;
  console.log(`→ Création: ${email} (${account.role})...`);

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: account.password,
    email_confirm: true,
    user_metadata: {
      name: account.name,
      phone: account.phone,
      role: account.role,
      commune: account.commune ?? null,
      sous_activite: account.sous_activite ?? null,
    },
  });

  if (error) {
    console.log(`  ❌ Erreur création: ${error.message}`);
    return { ...account, email, status: "ERROR", detail: error.message };
  }

  console.log(`  ✓ User créé: ${data.user.id}`);

  // Attendre que le trigger handle_new_user crée le profil public.users
  await new Promise((r) => setTimeout(r, 500));

  // Forcer statut_abonnement = 'actif' (comptes de démo, pas de paiement)
  const { error: upErr } = await supabase
    .from("users")
    .update({ statut_abonnement: "actif" })
    .eq("id", data.user.id);

  if (upErr) {
    console.log(`  ⚠️ Maj abonnement: ${upErr.message}`);
  }

  return { ...account, email, status: "OK" };
}

async function main() {
  console.log("\n=== EcoLoop CI — Seed de démonstration ===\n");

  console.log("Étape 1/3 — Purge des tables métier...");
  for (const t of TABLES_A_PURGER) {
    await purgeTable(t);
  }

  console.log("\nÉtape 2/3 — Suppression des auth.users...");
  await purgeAuthUsers();

  console.log("\nÉtape 3/3 — Création des comptes de démo...");
  const results = [];
  for (const account of DEMO_ACCOUNTS) {
    results.push(await createAccount(account));
  }

  // Résumé
  console.log("\n=== RÉSUMÉ ===\n");
  for (const r of results) {
    const icon = r.status === "OK" ? "✓" : "❌";
    console.log(`  ${icon} ${r.email} — ${r.role} — ${r.status}${r.detail ? ` (${r.detail})` : ""}`);
  }
  console.log(`\nMot de passe unique : ${PASSWORD}`);
  console.log("Connexion : numéro de téléphone (ex. 0100000002) + mot de passe.\n");

  // Vérification finale
  const { data: profiles, error: profErr } = await supabase
    .from("users")
    .select("id, email, role, name, commune, niveau, statut_abonnement")
    .in("email", DEMO_ACCOUNTS.map((a) => `${a.phone}@ecoloop.ci`));

  if (profErr) {
    console.log(`❌ Erreur vérification: ${profErr.message}`);
  } else {
    console.log("=== Vérification finale ===\n");
    for (const p of profiles ?? []) {
      console.log(`  ✓ ${p.email} — ${p.role} — ${p.name} — ${p.commune} — niveau ${p.niveau ?? 1} — ${p.statut_abonnement}`);
    }
    const ok = (profiles ?? []).length === DEMO_ACCOUNTS.length;
    console.log(`\n${ok ? "✅ TOUS LES COMPTES SONT CRÉÉS" : "⚠️ Comptes manquants — vérifiez ci-dessus"}\n`);
  }
}

main().catch((err) => {
  console.error("\n❌ ÉCHEC DU SEED:", err.message ?? err);
  process.exit(1);
});
