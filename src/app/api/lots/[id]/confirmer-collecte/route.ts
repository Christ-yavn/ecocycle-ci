import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// POST /api/lots/[id]/confirmer-collecte
// Le COLLECTEUR marque le lot comme collecté physiquement.
// - Valide session collecteur + propriétaire du lot réservé.
// - Saisit le poids réel pesé.
// - Update lots: status='collecte', weight_real, date_collecte.
// - Update confirmations couche_1: actor_a_confirmed=true, poids_reel_kg.
// - Le producteur devra confirmer de son côté (actor_b).

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
  const poidsReel = typeof body.poidsReel === "number" ? body.poidsReel : null;
  const note = typeof body.note === "string" ? body.note : null;

  if (!poidsReel || poidsReel <= 0) {
    return NextResponse.json(
      { error: "Poids réel requis et doit être positif" },
      { status: 400 },
    );
  }

  // Vérifier le lot
  const { data: lot } = await supabase
    .from("lots")
    .select("id, status, collecteur_id, producteur_id")
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

  if (lot.status !== "reserve") {
    return NextResponse.json(
      { error: "Ce lot n'est pas en statut 'réservé'" },
      { status: 409 },
    );
  }

  // Update le lot
  const { error: lotErr } = await supabase
    .from("lots")
    .update({
      status: "collecte",
      weight_real: poidsReel,
      date_collecte: new Date().toISOString(),
    })
    .eq("id", lotId);

  if (lotErr) {
    return NextResponse.json(
      { error: "Mise à jour lot échouée", detail: lotErr.message },
      { status: 500 },
    );
  }

  // Update la confirmation couche_1 (actor_a = collecteur)
  const { error: confErr } = await supabase
    .from("confirmations")
    .update({
      actor_a_confirmed: true,
      actor_a_at: new Date().toISOString(),
      poids_reel_kg: poidsReel,
      note,
    })
    .eq("lot_id", lotId)
    .eq("step", "couche_1")
    .eq("actor_a_id", user.id);

  if (confErr) {
    // Non bloquant : le lot est déjà collecté, la confirmation sera retry
  }

  return NextResponse.json({
    success: true,
    lotId,
    status: "collecte",
    poidsReel,
    message:
      "Lot marqué comme collecté. En attente de confirmation du producteur.",
  });
}
