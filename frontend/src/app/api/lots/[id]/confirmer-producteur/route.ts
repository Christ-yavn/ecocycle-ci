import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// POST /api/lots/[id]/confirmer-producteur
// Le PRODUCTEUR confirme que le collecteur est bien passé.
// - Valide session producteur + propriétaire du lot.
// - Update confirmations couche_1: actor_b_confirmed=true.
// - Si les deux acteurs ont confirmé → status='valide' → trigger SQL crédite les points.
// - Si le producteur refuse → status='litige'.

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
  const confirme = typeof body.confirme === "boolean" ? body.confirme : true;
  const note = typeof body.note === "string" ? body.note : null;

  // Vérifier le lot
  const { data: lot } = await supabase
    .from("lots")
    .select("id, status, producteur_id, collecteur_id")
    .eq("id", lotId)
    .single();

  if (!lot) {
    return NextResponse.json({ error: "Lot introuvable" }, { status: 404 });
  }

  if (lot.producteur_id !== user.id) {
    return NextResponse.json(
      { error: "Vous n'êtes pas le producteur de ce lot" },
      { status: 403 },
    );
  }

  if (lot.status !== "collecte") {
    return NextResponse.json(
      { error: "Ce lot n'est pas en attente de confirmation" },
      { status: 409 },
    );
  }

  // Récupérer la confirmation couche_1
  const { data: conf } = await supabase
    .from("confirmations")
    .select("id, actor_a_confirmed, actor_b_confirmed")
    .eq("lot_id", lotId)
    .eq("step", "couche_1")
    .single();

  if (!conf) {
    return NextResponse.json(
      { error: "Confirmation couche_1 introuvable" },
      { status: 404 },
    );
  }

  if (confirme) {
    // Producteur confirme
    const bothConfirmed = conf.actor_a_confirmed === true;
    const newStatus = bothConfirmed ? "valide" : "en_attente";

    const { error: updateErr } = await supabase
      .from("confirmations")
      .update({
        actor_b_id: user.id,
        actor_b_confirmed: true,
        actor_b_at: new Date().toISOString(),
        status: newStatus,
        note: note ?? null,
      })
      .eq("id", conf.id);

    if (updateErr) {
      return NextResponse.json(
        { error: "Confirmation échouée", detail: updateErr.message },
        { status: 500 },
      );
    }

    // Si double confirmation valide, le trigger SQL crédite les points automatiquement.
    return NextResponse.json({
      success: true,
      lotId,
      confirmationStatus: newStatus,
      message:
        newStatus === "valide"
          ? "Double confirmation validée ! Vos points ont été crédités."
          : "Confirmation enregistrée. En attente de la confirmation du collecteur.",
    });
  } else {
    // Producteur refuse → litige
    const { error: updateErr } = await supabase
      .from("confirmations")
      .update({
        actor_b_id: user.id,
        actor_b_confirmed: false,
        actor_b_at: new Date().toISOString(),
        status: "litige",
        note: note ?? "Producteur signale un problème",
      })
      .eq("id", conf.id);

    if (updateErr) {
      return NextResponse.json(
        { error: "Signalement échoué", detail: updateErr.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      lotId,
      confirmationStatus: "litige",
      message: "Litige ouvert. L'équipe EcoCycle CI sera notifiée pour arbitrage.",
    });
  }
}
