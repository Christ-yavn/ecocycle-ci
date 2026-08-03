import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// POST /api/signalements — Créer un signalement de dépôt sauvage (citoyen)
// PATCH /api/signalements/[id] — Mettre à jour le statut (mairie)

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

  const body = await request.json().catch(() => ({}));
  const { latitude, longitude, description, photoUrl, commune, quartier } = body as {
    latitude?: number;
    longitude?: number;
    description?: string;
    photoUrl?: string;
    commune?: string;
    quartier?: string;
  };

  if (latitude == null || longitude == null) {
    return NextResponse.json(
      { error: "Géolocalisation requise" },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("signalements")
    .insert({
      citoyen_id: user.id,
      latitude,
      longitude,
      description: description ?? null,
      photo_url: photoUrl ?? null,
      commune: commune ?? null,
      quartier: quartier ?? null,
      status: "nouveau",
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Création signalement échouée", detail: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, id: data.id });
}
