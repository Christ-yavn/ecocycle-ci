import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import type { Role } from "@/types/role";
import { ROLE_LABELS } from "@/types/role";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DashboardShell } from "./DashboardShell";

export async function RoleDashboardLayout({
  role,
  children,
}: {
  role: Role;
  children: ReactNode;
}) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Si non connecté → login (le proxy gère aussi, mais double sécurité)
  if (!user) {
    redirect("/login");
  }

  // Récupérer le profil
  const { data: profile } = await supabase
    .from("users")
    .select("role, name")
    .eq("id", user.id)
    .single();

  // Si le profil n'existe pas ou le rôle ne correspond pas → rediriger
  if (!profile) {
    redirect("/login?mode=complete");
  }

  if (profile.role !== role) {
    redirect(`/${profile.role}`);
  }

  return (
    <DashboardShell
      role={role}
      title={`Espace ${ROLE_LABELS[role]}`}
      userName={profile.name || user.email}
    >
      {children}
    </DashboardShell>
  );
}
