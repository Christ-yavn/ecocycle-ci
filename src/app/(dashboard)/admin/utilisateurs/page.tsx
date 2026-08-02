import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ROLE_LABELS, type Role } from "@/types/role";

export const dynamic = "force-dynamic";

const ROLE_TONE: Record<
  Role,
  "signal" | "amber" | "forest" | "rust" | "paper"
> = {
  producteur: "signal",
  collecteur: "amber",
  recycleur: "forest",
  acheteur: "paper",
  mairie: "rust",
  citoyen: "signal",
  admin: "forest",
};

export default async function AdminUtilisateursPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/admin/utilisateurs");
  }

  const { data: users } = await supabase
    .from("users")
    .select(
      "id, role, name, phone, email, commune, quartier, sous_activite, statut_abonnement, date_inscription",
    )
    .order("date_inscription", { ascending: false })
    .limit(200);

  return (
    <>
      <div className="pageHead">
        <div className="row">
          <Badge tone="signal" dot>
            {users?.length ?? 0} comptes
          </Badge>
        </div>
        <h1>Utilisateurs de la plateforme</h1>
        <p className="muted">
          Liste des comptes enregistrés (200 derniers). La gestion fine
          (suspension, litiges) arrive dans la prochaine itération.
        </p>
      </div>

      <Card elevated={false}>
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "var(--fs-body)",
            }}
          >
            <thead>
              <tr
                style={{
                  textAlign: "left",
                  borderBottom: "1px solid var(--ec-line-dark)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--fs-label)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "var(--ec-ink-soft)",
                }}
              >
                <th style={{ padding: "0.5rem" }}>Nom</th>
                <th style={{ padding: "0.5rem" }}>Profil</th>
                <th style={{ padding: "0.5rem" }}>Contact</th>
                <th style={{ padding: "0.5rem" }}>Zone</th>
                <th style={{ padding: "0.5rem" }}>Inscription</th>
              </tr>
            </thead>
            <tbody>
              {(users ?? []).map((u) => (
                <tr
                  key={u.id}
                  style={{ borderBottom: "1px dashed rgba(20,37,27,0.08)" }}
                >
                  <td style={{ padding: "0.5rem", fontWeight: 600 }}>
                    {u.name || "—"}
                  </td>
                  <td style={{ padding: "0.5rem" }}>
                    <Badge tone={ROLE_TONE[u.role as Role] ?? "paper"}>
                      {ROLE_LABELS[u.role as Role] ?? u.role}
                      {u.sous_activite ? ` · ${u.sous_activite}` : ""}
                    </Badge>
                  </td>
                  <td style={{ padding: "0.5rem", color: "var(--ec-ink-soft)" }}>
                    {u.email ?? u.phone ?? "—"}
                  </td>
                  <td style={{ padding: "0.5rem", color: "var(--ec-ink-soft)" }}>
                    {[u.commune, u.quartier].filter(Boolean).join(" · ") || "—"}
                  </td>
                  <td style={{ padding: "0.5rem", color: "var(--ec-ink-soft)" }}>
                    {new Date(u.date_inscription).toLocaleDateString("fr-FR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
