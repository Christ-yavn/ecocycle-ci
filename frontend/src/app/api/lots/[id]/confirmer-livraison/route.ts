import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// POST /api/lots/[id]/confirmer-livraison
// Le COLLECTEUR marque le lot comme livré au recycleur.
// - Update lots: status='livre_recycleur', date_livraison.
// - Crée/update confirmation couche_2: actor_a_confirmed (collecteur).

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: lotId } = await params;

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

  const body = await request.json().catch(() => ({}));
  const poidsLivré = typeof body.poidsLivre === "number" ? body.poidsLivre : null;
  const recycleurId =
    typeof body.recycleurId === "string" ? body.recycleurId : null;

  if (!poidsLivré || poidsLivré <= 0) {
    return NextResponse.json(
      { error: "Poids livré requis" },
      { status: 400 },
    );
  }

  const { data: lot } = await supabase
    .from("lots")
    .select("id, status, collecteur_id")
    .eq("id", lotId)
    .single();

  if (!lot) {
    return NextResponse.json({ error: "Lot introuvable" }, { status: 404 });
  }

  if (lot.collecteur_id !== user.id) {
    return NextResponse.json(
      { error: "Vous n'êtes pas le collecteur de ce lot" },
      { status: 403 },
    );
  }

  if (lot.status !== "collecte") {
    return NextResponse.json(
      { error: "Ce lot n'est pas en statut 'collecté'" },
      { status: 409 },
    );
  }

  // Update le lot
  await supabase
    .from("lots")
    .update({
      status: "livre_recycleur",
      date_livraison: new Date().toISOString(),
    })
    .eq("id", lotId);

  // Créer la confirmation couche_2
  await supabase.from("confirmations").insert({
    lot_id: lotId,
    step: "couche_2",
    actor_a_id: user.id,
    actor_a_confirmed: true,
    actor_a_at: new Date().toISOString(),
    actor_b_id: recycleurId,
    actor_b_confirmed: false,
    status: "en_attente",
    poids_reel_kg: poidsLivré,
  });

  return NextResponse.json({
    success: true,
    lotId,
    status: "livre_recycleur",
    message: "Lot marqué comme livré. En attente de confirmation du recycleur.",
  });
}
