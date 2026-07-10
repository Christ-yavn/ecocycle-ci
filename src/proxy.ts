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
];

const ROLE_PREFIXES: Record<string, Role> = {
  "/producteur": "producteur",
  "/collecteur": "collecteur",
  "/recycleur": "recycleur",
  "/acheteur": "acheteur",
  "/mairie": "mairie",
  "/citoyen": "citoyen",
};

export async function proxy(request: NextRequest) {
  const { supabase, user, response } = await updateSession(request);
  const pathname = request.nextUrl.pathname;

  // --- Routes publiques : laisser passer ---
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (!isProtected) {
    return response;
  }

  // --- Non connecté sur route protégée → login ---
  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // --- Connecté : vérifier le rôle ---
  const role = await getUserRole(supabase, user.id);

  // Rôle non trouvé (profil pas encore créé) → page de complétion
  if (!role) {
    const completeUrl = new URL("/login?mode=complete", request.url);
    return NextResponse.redirect(completeUrl);
  }

  // Vérifier que le path correspond au rôle de l'utilisateur
  for (const [prefix, expectedRole] of Object.entries(ROLE_PREFIXES)) {
    if (pathname.startsWith(prefix) && role !== expectedRole) {
      // Rediriger vers l'accueil du bon rôle
      const homeUrl = new URL(`/${role}`, request.url);
      return NextResponse.redirect(homeUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|manifest.webmanifest|icon.svg|login|register).*)",
  ],
};
