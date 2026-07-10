import { createBrowserClient } from "@supabase/ssr";

export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    console.error(
      "[supabase/browser] Variables d'environnement manquantes.",
      { NEXT_PUBLIC_SUPABASE_URL: url, NEXT_PUBLIC_SUPABASE_ANON_KEY: anonKey },
    );
    throw new Error(
      "Supabase (browser) : NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY sont requises pour créer le client navigateur.Configurez-les dans .env.local ou dans les variables d'environnement Vercel.",
    );
  }

  return createBrowserClient(url, anonKey);
}