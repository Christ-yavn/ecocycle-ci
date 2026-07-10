import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// POST /api/matieres/[id]/commander — L'acheteur commande une matière.
// - Update matiere_premiere: status='reservee', acheteur_id.
// - Crée confirmation couche_3 (recycleur=actor_a, acheteur=actor_b).

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

  if (!profile || profile.role !== "acheteur") {
    return NextResponse.json(
      { error: "Réservé aux acheteurs" },
      { status: 403 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const volumeDemande = typeof body.volumeKg === "number" ? body.volumeKg : null;

  if (!volumeDemande || volumeDemande <= 0) {
    return NextResponse.json(
      { error: "Volume demandé requis" },
      { status: 400 },
    );
  }

  const { data: matiere } = await supabase
    .from("matiere_premiere")
    .select("id, status, recycleur_id, volume_disponible_kg")
    .eq("id", matiereId)
    .single();

  if (!matiere) {
    return NextResponse.json(
      { error: "Matière introuvable" },
      { status: 404 },
    );
  }

  if (matiere.status !== "disponible") {
    return NextResponse.json(
      { error: "Cette matière n'est plus disponible" },
      { status: 409 },
    );
  }

  // Réserver la matière
  await supabase
    .from("matiere_premiere")
    .update({
      status: "reservee",
      acheteur_id: user.id,
    })
    .eq("id", matiereId)
    .eq("status", "disponible");

  // Créer la confirmation couche_3
  await supabase.from("confirmations").insert({
    lot_id: null, // Pas de lot_id pour la couche 3 (c'est une matière, pas un lot)
    step: "couche_3",
    actor_a_id: matiere.recycleur_id,
    actor_a_confirmed: false,
    actor_b_id: user.id,
    actor_b_confirmed: true,
    actor_b_at: new Date().toISOString(),
    status: "en_attente",
    poids_reel_kg: volumeDemande,
    note: `Commande matière: ${matiereId}`,
  });

  return NextResponse.json({
    success: true,
    matiereId,
    status: "reservee",
    message: "Commande envoyée. Le recycleur doit confirmer la livraison.",
  });
}