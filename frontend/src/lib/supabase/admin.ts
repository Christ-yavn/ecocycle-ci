import { createClient } from "@supabase/supabase-js";

// Client admin (service role) — SERVER ONLY.
// Contourne le RLS. À utiliser uniquement dans les route handlers serveur
// pour les opérations privilégiées (agrégats mairie, triggers points, etc.).
// NE JAMAIS importer ce module dans un Client Component.

export function createSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}
