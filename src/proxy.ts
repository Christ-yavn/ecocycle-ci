import { NextResponse, type NextRequest } from "next/server";
import { updateSession, getUserRole } from "@/lib/supabase/proxy";
import type { Role } from "@/types/role";

const PROTECTED_PREFIXES = [
  "/producteur",
  "/collecteur",
  "/recycleur",
  "/acheteur",
  "/mairie",
  "/citoyen",
  "/admin",
];

const ROLE_PREFIXES: Record<string, Role> = {
  "/producteur": "producteur",
  "/collecteur": "collecteur",
  "/recycleur": "recycleur",
  "/acheteur": "acheteur",
  "/mairie": "mairie",
  "/citoyen": "citoyen",
  "/admin": "admin",
};

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));

  // --- Session Supabase : ne jamais crasher en 500 si la config manque ---
  let session: Awaited<ReturnType<typeof updateSession>>;
  try {
    session = await updateSession(request);
  } catch (err) {
    console.error("[proxy] updateSession a échoué (config Supabase ?) :", err);
    if (!isProtected) {
      // Routes publiques : laisser passer sans session plutôt qu'un 500.
      return NextResponse.next({ request });
    }
    // Routes protégées : renvoyer vers login avec un message explicite.
    const loginUrl = new URL("/login?error=config", request.url);
    return NextResponse.redirect(loginUrl);
  }

  const { supabase, user, response } = session;

  // --- Routes publiques : laisser passer ---
  if (!isProtected) {
    return response;
  }

  // --- Non connecté sur route protégée → login ---
  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    const redirectRes = NextResponse.redirect(loginUrl);
    response.cookies.getAll().forEach((c) => redirectRes.cookies.set(c.name, c.value, c));
    return redirectRes;
  }

  // --- Connecté : vérifier le rôle ---
  let role: Role | null = null;
  try {
    role = await getUserRole(supabase, user.id);
  } catch (err) {
    console.error("[proxy] getUserRole a échoué :", err);
    const loginUrl = new URL("/login?error=config", request.url);
    const redirectRes = NextResponse.redirect(loginUrl);
    response.cookies.getAll().forEach((c) => redirectRes.cookies.set(c.name, c.value, c));
    return redirectRes;
  }

  // Rôle non trouvé (profil pas encore créé) → page de complétion
  if (!role) {
    const completeUrl = new URL("/login?mode=complete", request.url);
    const redirectRes = NextResponse.redirect(completeUrl);
    response.cookies.getAll().forEach((c) => redirectRes.cookies.set(c.name, c.value, c));
    return redirectRes;
  }

  // Vérifier que le path correspond au rôle de l'utilisateur
  for (const [prefix, expectedRole] of Object.entries(ROLE_PREFIXES)) {
    if (pathname.startsWith(prefix) && role !== expectedRole) {
      // Rediriger vers l'accueil du bon rôle
      const homeUrl = new URL(`/${role}`, request.url);
      const redirectRes = NextResponse.redirect(homeUrl);
      response.cookies.getAll().forEach((c) => redirectRes.cookies.set(c.name, c.value, c));
      return redirectRes;
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|manifest.webmanifest|icon.svg|login|register|debug).*)",
  ],
};
