import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// POST /api/matieres/[id]/confirmer-livraison
// Le recycleur confirme qu'il a livré la matière première à l'acheteur.
// Marque actor_a_confirmed = true dans la confirmation couche_3.
// Si l'acheteur a déjà confirmé (actor_b_confirmed = true), passe status = 'valide'.

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: matiereId } = await params;

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

  if (!profile || profile.role !== "recycleur") {
    return NextResponse.json(
      { error: "Réservé aux recycleurs" },
      { status: 403 },
    );
  }

  // Récupérer la matière
  const { data: matiere } = await supabase
    .from("matiere_premiere")
    .select("id, status, recycleur_id, acheteur_id")
    .eq("id", matiereId)
    .single();

  if (!matiere) {
    return NextResponse.json(
      { error: "Matière introuvable" },
      { status: 404 },
    );
  }

  if (matiere.recycleur_id !== user.id) {
    return NextResponse.json(
      { error: "Vous n'êtes pas le propriétaire" },
      { status: 403 },
    );
  }

  if (matiere.status !== "reservee") {
    return NextResponse.json(
      { error: "Cette matière n'est pas réservée" },
      { status: 409 },
    );
  }

  // Trouver la confirmation couche_3
  const { data: conf } = await supabase
    .from("confirmations")
    .select("id, actor_b_confirmed, status")
    .eq("step", "couche_3")
    .eq("actor_a_id", user.id)
    .eq("actor_b_id", matiere.acheteur_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!conf) {
    return NextResponse.json(
      { error: "Confirmation introuvable" },
      { status: 404 },
    );
  }

  const bothConfirmed = conf.actor_b_confirmed === true;
  const newStatus = bothConfirmed ? "valide" : "en_attente";

  const { error: updateError } = await supabase
    .from("confirmations")
    .update({
      actor_a_confirmed: true,
      actor_a_at: new Date().toISOString(),
      status: newStatus,
    })
    .eq("id", conf.id);

  if (updateError) {
    return NextResponse.json(
      { error: "Échec de la confirmation", detail: updateError.message },
      { status: 500 },
    );
  }

  // Si les deux ont confirmé, marquer la matière comme vendue
  if (bothConfirmed) {
    await supabase
      .from("matiere_premiere")
      .update({
        status: "vendue",
        date_vente: new Date().toISOString(),
      })
      .eq("id", matiereId);
  }

  return NextResponse.json({
    success: true,
    confirmed: true,
    bothConfirmed,
    status: newStatus,
    message: bothConfirmed
      ? "Livraison confirmée. Les deux parties ont validé — vente finalisée."
      : "Livraison confirmée. En attente de la confirmation de l'acheteur.",
  });
}