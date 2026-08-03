import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// POST /api/lots/[id]/confirmer-reception
// Le RECYCLEUR confirme la réception du stock.
// - Valide session recycleur.
// - Update confirmation couche_2: actor_b_confirmed → si les deux → status='valide'.

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
  const ecart = typeof body.ecart === "number" ? body.ecart : null;

  const { data: conf } = await supabase
    .from("confirmations")
    .select("id, actor_a_confirmed, actor_b_confirmed, step")
    .eq("lot_id", lotId)
    .eq("step", "couche_2")
    .single();

  if (!conf) {
    return NextResponse.json(
      { error: "Confirmation couche_2 introuvable" },
      { status: 404 },
    );
  }

  if (confirme) {
    const bothConfirmed = conf.actor_a_confirmed === true;
    const newStatus = bothConfirmed ? "valide" : "en_attente";

    await supabase
      .from("confirmations")
      .update({
        actor_b_id: user.id,
        actor_b_confirmed: true,
        actor_b_at: new Date().toISOString(),
        status: newStatus,
      })
      .eq("id", conf.id);

    return NextResponse.json({
      success: true,
      lotId,
      confirmationStatus: newStatus,
      message:
        newStatus === "valide"
          ? "Double confirmation couche 2 validée ! Stock enregistré en usine."
          : "Réception enregistrée. En attente de confirmation du collecteur.",
    });
  } else {
    await supabase
      .from("confirmations")
      .update({
        actor_b_id: user.id,
        actor_b_confirmed: false,
        actor_b_at: new Date().toISOString(),
        status: "litige",
        note: ecart ? `Écart de poids signalé : ${ecart} kg` : "Écart signalé",
      })
      .eq("id", conf.id);

    return NextResponse.json({
      success: true,
      lotId,
      confirmationStatus: "litige",
      message: "Litige ouvert pour écart de livraison.",
    });
  }
}
