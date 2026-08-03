import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { NotificationRow } from "@/types/database.types";

// GET /api/notifications
// Récupère les 50 dernières notifications de l'utilisateur connecté.
// Retour : { notifications: NotificationRow[], unread_count: number }
//
// PATCH /api/notifications
// Marque comme lue(s). Body : { id: string } ou { all: true }

export async function GET() {
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

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json(
      { error: "Lecture des notifications échouée", detail: error.message },
      { status: 500 },
    );
  }

  const { count, error: countErr } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("read", false);

  if (countErr) {
    return NextResponse.json(
      { error: "Comptage des notifications échoué", detail: countErr.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    notifications: (data ?? []) as NotificationRow[],
    unread_count: count ?? 0,
  });
}

export async function PATCH(request: NextRequest) {
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
  const id = typeof body.id === "string" ? body.id : null;
  const all = body.all === true;

  if (!all && !id) {
    return NextResponse.json(
      { error: "Body attendu : { id: string } ou { all: true }" },
      { status: 400 },
    );
  }

  // RLS (notif_update_own) restreint déjà aux notifications de l'utilisateur
  let query = supabase.from("notifications").update({ read: true });
  if (id) {
    query = query.eq("id", id);
  } else {
    query = query.eq("read", false);
  }

  const { error } = await query;

  if (error) {
    return NextResponse.json(
      { error: "Mise à jour échouée", detail: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
