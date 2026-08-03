import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Route Handler : réserver un lot par le collecteur.
// POST /api/lots/[id]/reserver
// - Valide la session collecteur.
// - Vérifie que le lot est en statut "publie".
// - Met à jour : status='reserve', collecteur_id=auth.uid().
// - Retourne le lot mis à jour.

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

  // Vérifier le rôle
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "collecteur") {
    return NextResponse.json(
      { error: "Réservé aux collecteurs" },
      { status: 403 },
    );
  }

  // Vérifier que le lot est disponible
  const { data: lot } = await supabase
    .from("lots")
    .select("id, status, collecteur_id, producteur_id")
    .eq("id", lotId)
    .single();

  if (!lot) {
    return NextResponse.json({ error: "Lot introuvable" }, { status: 404 });
  }

  if (lot.status !== "publie") {
    return NextResponse.json(
      { error: "Ce lot n'est plus disponible" },
      { status: 409 },
    );
  }

  // Réserver
  const { error: updateErr } = await supabase
    .from("lots")
    .update({
      status: "reserve",
      collecteur_id: user.id,
    })
    .eq("id", lotId)
    .eq("status", "publie"); // Safety: only update if still published

  if (updateErr) {
    return NextResponse.json(
      { error: "Réservation échouée", detail: updateErr.message },
      { status: 500 },
    );
  }

  // Créer une confirmation couche 1 (en attente)
  await supabase.from("confirmations").insert({
    lot_id: lotId,
    step: "couche_1",
    actor_a_id: user.id, // collecteur = actor A
    actor_b_id: lot.producteur_id ?? null, // producteur = actor B (sera confirmé plus tard)
    status: "en_attente",
  });

  return NextResponse.json({ success: true, lotId });
}
