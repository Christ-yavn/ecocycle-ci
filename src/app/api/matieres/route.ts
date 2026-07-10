import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// POST /api/matieres — Le recycleur publie une matière première recyclée.
export async function POST(request: NextRequest) {
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

  const body = await request.json().catch(() => ({}));
  const { typeMatiere, volumeKg, specifications, grade, conditionnement, photoUrl } = body as {
    typeMatiere?: string;
    volumeKg?: number;
    specifications?: string;
    grade?: string;
    conditionnement?: string;
    photoUrl?: string;
  };

  if (!typeMatiere || !volumeKg || volumeKg <= 0) {
    return NextResponse.json(
      { error: "Type de matière et volume (kg) requis" },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("matiere_premiere")
    .insert({
      recycleur_id: user.id,
      type_matiere: typeMatiere,
      volume_disponible_kg: volumeKg,
      specifications: specifications ?? null,
      grade: grade ?? null,
      conditionnement: conditionnement ?? null,
      photo_url: photoUrl ?? null,
      status: "disponible",
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Publication échouée", detail: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, id: data.id });
}