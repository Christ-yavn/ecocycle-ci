import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Role } from "@/types/role";

// Met à jour la session Supabase dans les cookies et retourne
// l'utilisateur + le rôle si connecté. À appeler dans proxy.ts.

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Supabase (proxy) : NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY sont requises pour exécuter le proxy. Configurez-les dans les variables d'environnement Vercel.",
    );
  }

  const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set({ name, value, ...options }),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: ne pas exécuter entre les composants serveur qui suivent.
  // getUser() contacte le serveur Auth et valide le token.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, user, response };
}

// Récupère le rôle d'un utilisateur depuis la table public.users.
export async function getUserRole(
  supabase: ReturnType<typeof createServerClient>,
  userId: string,
): Promise<Role | null> {
  const { data } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .single();
  return (data?.role as Role | null) ?? null;
}
