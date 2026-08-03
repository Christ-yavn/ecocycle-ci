import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// POST /api/lots/[id]/valider-retrait
// Double validation sécurisée : le COLLECTEUR prouve sa présence physique
// via le QR Code (qr_hash) ou le PIN à 4 chiffres affiché chez le producteur,
// puis saisit le poids réel pesé.
// - Valide session collecteur + propriété du lot réservé.
// - Vérifie pin OU qrHash contre la ligne lots (service côté serveur).
// - Update lots: status='collecte', weight_real, date_collecte.
// - Update confirmations couche_1: actor_a_confirmed=true, poids_reel_kg.

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
  const pin = typeof body.pin === "string" ? body.pin.trim() : null;
  const qrHash = typeof body.qrHash === "string" ? body.qrHash.trim() : null;
  const poidsReel = typeof body.poidsReel === "number" ? body.poidsReel : null;
  const note = typeof body.note === "string" ? body.note : null;

  if (!pin && !qrHash) {
    return NextResponse.json(
      { error: "Preuve requise : scannez le QR Code ou saisissez le PIN." },
      { status: 400 },
    );
  }

  if (!poidsReel || poidsReel <= 0) {
    return NextResponse.json(
      { error: "Poids réel requis et doit être positif" },
      { status: 400 },
    );
  }

  if (pin && !/^\d{4}$/.test(pin)) {
    return NextResponse.json(
      { error: "Le PIN doit contenir exactement 4 chiffres." },
      { status: 400 },
    );
  }

  // Vérifier le lot + les secrets de validation
  const { data: lot } = await supabase
    .from("lots")
    .select(
      "id, status, collecteur_id, producteur_id, validation_pin, qr_hash",
    )
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

  // --- Vérification de la preuve physique ---
  const pinOk = pin != null && lot.validation_pin === pin;
  const qrOk = qrHash != null && lot.qr_hash === qrHash;

  if (!pinOk && !qrOk) {
    return NextResponse.json(
      {
        error:
          "Preuve invalide. Vérifiez le PIN affiché chez le producteur ou rescannez le QR Code.",
      },
      { status: 403 },
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
  await supabase
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
  // Non bloquant si la confirmation n'existe pas encore

  return NextResponse.json({
    success: true,
    lotId,
    status: "collecte",
    poidsReel,
    preuve: qrOk ? "qr" : "pin",
    message:
      "Retrait validé. En attente de la confirmation finale du producteur.",
  });
}
