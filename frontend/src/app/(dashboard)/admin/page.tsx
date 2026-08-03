import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Stat } from "@/components/ui/Stat";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { ROLES, ROLE_LABELS } from "@/types/role";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/admin");
  }

  // Utilisateurs par rôle
  const { data: users } = await supabase.from("users").select("role");

  const byRole = new Map<string, number>();
  (users ?? []).forEach((u) => {
    byRole.set(u.role, (byRole.get(u.role) ?? 0) + 1);
  });

  const { count: lotsCount } = await supabase
    .from("lots")
    .select("id", { count: "exact", head: true });

  const { count: signalementsCount } = await supabase
    .from("signalements")
    .select("id", { count: "exact", head: true });

  const { count: prixCount } = await supabase
    .from("market_prices")
    .select("id", { count: "exact", head: true });

  return (
    <>
      <div className="pageHead">
        <div className="row">
          <Badge tone="signal" dot>
            Administration EcoLoop
          </Badge>
        </div>
        <h1>Supervision de la plateforme</h1>
        <p className="muted">
          Vue globale de l&apos;écosystème et paramétrage des prix du marché.
        </p>
      </div>

      <div className="grid-stats">
        <Stat label="Utilisateurs" value={users?.length ?? 0} />
        <Stat label="Lots publiés" value={lotsCount ?? 0} />
        <Stat label="Signalements" value={signalementsCount ?? 0} />
        <Stat
          label="Prix du marché"
          value={prixCount ?? 0}
          hint="Matières suivies"
        />
      </div>

      <Card title="Utilisateurs par profil">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: "0.75rem",
          }}
        >
          {ROLES.map((r) => (
            <div
              key={r}
              style={{
                border: "1px solid var(--ec-line-dark)",
                borderRadius: "var(--radius-sm)",
                padding: "0.75rem",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "1.4rem",
                  fontWeight: 700,
                  color: "var(--ec-forest)",
                }}
              >
                {byRole.get(r) ?? 0}
              </div>
              <div
                style={{
                  fontSize: "var(--fs-body)",
                  color: "var(--ec-ink-soft)",
                }}
              >
                {ROLE_LABELS[r]}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card elevated={false}>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <div>
            <h3 style={{ marginBottom: "0.25rem" }}>Prix du marché au kilo</h3>
            <p style={{ margin: 0, fontSize: "var(--fs-body)" }}>
              Ces prix servent à estimer la rentabilité des lots pour tous les
              acteurs. Toute modification est immédiate.
            </p>
          </div>
          <Button href="/admin/prix" variant="primary">
            <Icon name="coins" size={16} />
            Gérer les prix
          </Button>
        </div>
      </Card>
    </>
  );
}
