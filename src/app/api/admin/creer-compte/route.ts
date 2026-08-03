import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

// POST /api/admin/creer-compte
// Création d'un compte depuis le back-office admin.
// Rôles autorisés : collecteur, recycleur, acheteur, mairie.
// (producteur s'inscrit seul via /register, admin est créé manuellement)
// Body : { name, phone, password, role, commune?, quartier?, sous_activite? }

const ROLES_AUTORISES = ["collecteur", "recycleur", "acheteur", "mairie"] as const;
const SOUS_ACTIVITES = ["collecte", "recyclage", "mixte"] as const;

export async function POST(request: NextRequest) {
  // 1. Vérifier que l'appelant est connecté ET admin
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Authentification requise" },
      { status: 401 },
    );
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json(
      { error: "Accès réservé à l'administration" },
      { status: 403 },
    );
  }

  // 2. Lire et valider le body
  const body = await request.json().catch(() => ({}));

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const phone =
    typeof body.phone === "string" ? body.phone.replace(/[\s+\-]/g, "") : "";
  const password = typeof body.password === "string" ? body.password : "";
  const role = typeof body.role === "string" ? body.role : "";
  const commune =
    typeof body.commune === "string" && body.commune.trim()
      ? body.commune.trim()
      : null;
  const quartier =
    typeof body.quartier === "string" && body.quartier.trim()
      ? body.quartier.trim()
      : null;
  const sousActivite =
    typeof body.sous_activite === "string" &&
    (SOUS_ACTIVITES as readonly string[]).includes(body.sous_activite)
      ? body.sous_activite
      : null;

  if (!name || !phone || !password || !role) {
    return NextResponse.json(
      { error: "name, phone, password et role sont requis." },
      { status: 400 },
    );
  }

  if (!(ROLES_AUTORISES as readonly string[]).includes(role)) {
    return NextResponse.json(
      {
        error: `Rôle invalide. Autorisés : ${ROLES_AUTORISES.join(", ")}.`,
      },
      { status: 400 },
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Le mot de passe doit contenir au moins 8 caractères." },
      { status: 400 },
    );
  }

  // 3. Créer le compte via le service role (le trigger handle_new_user
  //    crée automatiquement le profil public.users)
  const admin = createSupabaseAdmin();

  const { data, error } = await admin.auth.admin.createUser({
    email: `${phone}@ecoloop.ci`,
    password,
    email_confirm: true,
    user_metadata: {
      name,
      phone,
      role,
      commune,
      quartier,
      sous_activite: sousActivite,
    },
  });

  if (error) {
    const isDuplicate = error.message.toLowerCase().includes("already");
    return NextResponse.json(
      {
        error: isDuplicate
          ? "Un compte existe déjà avec ce numéro de téléphone."
          : "Création du compte échouée",
        detail: error.message,
      },
      { status: isDuplicate ? 409 : 500 },
    );
  }

  // 4. Compte validé par l'admin → abonnement actif d'office
  await admin
    .from("users")
    .update({ statut_abonnement: "actif" })
    .eq("id", data.user.id);

  // 5. Retour
  return NextResponse.json({ success: true, userId: data.user.id });
}
