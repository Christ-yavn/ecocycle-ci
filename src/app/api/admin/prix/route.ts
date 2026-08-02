import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// PUT /api/admin/prix
// Mise à jour d'un prix du marché (admin uniquement).
// Body : { typeMatiere: string, prixFcfaKg: number }

export async function PUT(request: NextRequest) {
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

  const body = await request.json().catch(() => ({}));
  const typeMatiere =
    typeof body.typeMatiere === "string" ? body.typeMatiere.trim() : null;
  const prixFcfaKg =
    typeof body.prixFcfaKg === "number" ? Math.round(body.prixFcfaKg) : null;

  if (!typeMatiere || prixFcfaKg == null || prixFcfaKg < 0) {
    return NextResponse.json(
      { error: "typeMatiere et prixFcfaKg (>= 0) requis." },
      { status: 400 },
    );
  }

  const { error } = await supabase.from("market_prices").upsert(
    {
      type_matiere: typeMatiere,
      prix_fcfa_kg: prixFcfaKg,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "type_matiere" },
  );

  if (error) {
    return NextResponse.json(
      { error: "Mise à jour échouée", detail: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, typeMatiere, prixFcfaKg });
}
