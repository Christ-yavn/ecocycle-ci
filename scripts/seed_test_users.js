import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Variables NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requises.");
  console.error("Chargez .env.local avant d'exécuter : node --env-file=.env.local scripts/seed_test_users.js");
  process.exit(1);
}

const PASSWORD = "TestEcoCycle2026!";

const TEST_USERS = [
  { email: "producteur@ecocycle.ci", name: "Awa Koné", phone: "+225 07 00 00 01", role: "producteur", commune: "Cocody", quartier: "Angré" },
  { email: "collecteur@ecocycle.ci", name: "EcoCollect SARL", phone: "+225 07 00 00 02", role: "collecteur", commune: "Yopougon", quartier: "Selmer" },
  { email: "recycleur@ecocycle.ci", name: "PlastICycle Sarl", phone: "+225 07 00 00 03", role: "recycleur", commune: "Port-Bouët", quartier: "Vridi" },
  { email: "acheteur@ecocycle.ci", name: "BonDachat Industries", phone: "+225 07 00 00 04", role: "acheteur", commune: "Marcory", quartier: "Zone 4" },
  { email: "mairie@ecocycle.ci", name: "Mairie de Cocody", phone: "+225 27 22 48 00", role: "mairie", commune: "Cocody", quartier: "Riviera" },
  { email: "citoyen@ecocycle.ci", name: "Kouassi Yao", phone: "+225 07 00 00 06", role: "citoyen", commune: "Abobo", quartier: "Avocatier" },
];

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function seedTestUsers() {
  console.log("\n=== EcoCycle CI — Création des comptes de démonstration ===\n");

  const results = [];

  for (const u of TEST_USERS) {
    console.log(`→ Création: ${u.email} (${u.role})...`);

    // 1. Créer l'utilisateur dans auth.users
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email: u.email,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: {
        role: u.role,
        name: u.name,
        phone: u.phone,
      },
    });

    if (authErr) {
      if (authErr.message.includes("already") || authErr.message.includes("existe")) {
        console.log(`  ⚠️ Compte déjà existant — récupération du user ID...`);
        // List users and find by email
        const { data: listData, error: listErr } = await supabase.auth.admin.listUsers();
        if (listErr) {
          console.log(`  ❌ Impossible de lister les users: ${listErr.message}`);
          results.push({ ...u, status: "ERROR", detail: listErr.message });
          continue;
        }
        const existing = (listData.users ?? []).find((x) => x.email === u.email);
        if (!existing) {
          console.log(`  ❌ User introuvable après erreur "existe déjà"`);
          results.push({ ...u, status: "ERROR", detail: "Introuvable" });
          continue;
        }
        console.log(`  ✓ User retrouvé: ${existing.id}`);
        await updateUser(existing.id, u, results);
      } else {
        console.log(`  ❌ Erreur: ${authErr.message}`);
        results.push({ ...u, status: "ERROR", detail: authErr.message });
      }
    } else {
      console.log(`  ✓ User créé: ${authData.user.id}`);
      await updateUser(authData.user.id, u, results);
    }
  }

  // Résumé final
  console.log("\n=== RÉSUMÉ ===\n");
  console.log("┌──────────────────────────────────┬────────────────┬──────────────┬──────────────────┐");
  console.log("│ Email                            │ Rôle           │ Abonnement   │ Statut           │");
  console.log("├──────────────────────────────────┼────────────────┼──────────────┼──────────────────┤");
  for (const r of results) {
    const emailPad = r.email.padEnd(32);
    const rolePad = (r.role ?? "").padEnd(14);
    const abPad = (r.abonnement ?? "—").padEnd(12);
    const stPad = (r.status ?? "—").padEnd(16);
    console.log(`│ ${emailPad} │ ${rolePad} │ ${abPad} │ ${stPad} │`);
  }
  console.log("└──────────────────────────────────┴────────────────┴──────────────┴──────────────────┘");
  console.log(`\nMot de passe unique pour tous les comptes : ${PASSWORD}\n`);

  // Vérification : lire les profils pour confirmer
  console.log("=== Vérification finale ===\n");
  const { data: profiles, error: profErr } = await supabase
    .from("users")
    .select("id, email, role, name, statut_abonnement")
    .in("email", TEST_USERS.map((u) => u.email));

  if (profErr) {
    console.log(`❌ Erreur vérification: ${profErr.message}`);
  } else {
    for (const p of profiles ?? []) {
      console.log(`  ✓ ${p.email} — ${p.role} — ${p.name} — abonnement=${p.statut_abonnement}`);
    }
  }

  const allActive = (profiles ?? []).every((p) => p.statut_abonnement === "actif");
  console.log(`\n${allActive && (profiles ?? []).length === 6 ? "✅ TOUS LES COMPTES SONT ACTIFS" : "⚠️ Vérifiez les comptes ci-dessus"}\n`);
}

async function updateUser(userId, u, results) {
  // Attendre que le trigger handle_new_user ait créé la ligne dans public.users
  await new Promise((r) => setTimeout(r, 500));

  // Forcer statut_abonnement = 'actif' (bypass paiement)
  const { data: updated, error: upErr } = await supabase
    .from("users")
    .update({
      statut_abonnement: "actif",
      commune: u.commune,
      quartier: u.quartier,
    })
    .eq("id", userId)
    .select("id, email, role, statut_abonnement")
    .single();

  if (upErr) {
    console.log(`  ❌ Erreur maj abonnement: ${upErr.message}`);
    results.push({ ...u, status: "ERROR", detail: upErr.message });
  } else {
    console.log(`  ✓ Abonnement forcé à 'actif' — ${updated.email}`);
    results.push({ ...u, status: "OK", abonnement: "actif" });
  }
}

seedTestUsers().catch(console.error);