import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { SignalementForm } from "@/components/citoyen/SignalementForm";

export const dynamic = "force-dynamic";

export default async function CitoyenPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/citoyen");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role, name")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "citoyen") {
    redirect("/login");
  }

  // Compter les signalements du citoyen
  const { count: total } = await supabase
    .from("signalements")
    .select("id", { count: "exact", head: true })
    .eq("citoyen_id", user.id);

  const { count: resolu } = await supabase
    .from("signalements")
    .select("id", { count: "exact", head: true })
    .eq("citoyen_id", user.id)
    .eq("status", "resolu");

  return (
    <>
      <div className="pageHead">
        <div className="row">
          <Badge tone="signal" dot>
            Citoyen · {profile.name}
          </Badge>
        </div>
        <h1>Signaler un dépôt sauvage</h1>
        <p className="muted">
          Photographiez un dépôt sauvage dans votre quartier. Votre mairie sera
          notifiée en temps réel pour intervenir.
        </p>
      </div>

      {total !== null && total > 0 && (
        <Card elevated={false}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div>
              <h3 style={{ marginBottom: "0.25rem" }}>Vos signalements</h3>
              <p style={{ margin: 0, fontSize: "var(--fs-body)" }}>
                {total} signalement(s) · {resolu ?? 0} résolu(s)
              </p>
            </div>
            <a
              href="/citoyen/suivi"
              className="btn-primary"
              style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
            >
              <Icon name="follow" size={16} />
              Suivre mes signalements
            </a>
          </div>
        </Card>
      )}

      <Card elevated={false}>
        <SignalementForm userId={user.id} />
      </Card>
    </>
  );
}
