import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// PATCH /api/signalements/[id] — Mettre à jour le statut (mairie)
// Body: { status: 'pris_en_charge' | 'resolu' }

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

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

  // Vérifier que l'utilisateur est mairie
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "mairie") {
    return NextResponse.json(
      { error: "Réservé aux mairies" },
      { status: 403 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const newStatus = body.status as string;

  if (!["pris_en_charge", "resolu"].includes(newStatus)) {
    return NextResponse.json(
      { error: "Statut invalide. Valeurs acceptées : pris_en_charge, resolu" },
      { status: 400 },
    );
  }

  const updateData: Record<string, unknown> = {
    status: newStatus,
  };

  if (newStatus === "pris_en_charge") {
    updateData.date_prise_en_charge = new Date().toISOString();
  } else if (newStatus === "resolu") {
    updateData.date_resolution = new Date().toISOString();
  }

  const { error } = await supabase
    .from("signalements")
    .update(updateData)
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: "Mise à jour échouée", detail: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, id, status: newStatus });
}
