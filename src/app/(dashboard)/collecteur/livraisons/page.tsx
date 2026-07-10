import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";

export const dynamic = "force-dynamic";

export default async function LivraisonsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/collecteur/livraisons");
  }

  // Lots collectés (en stock, prêts à livrer aux recycleurs)
  const { data: collected } = await supabase
    .from("lots")
    .select(
      "id, type_dechet, status, weight_real, volume_ia, commune, quartier, date_collecte",
    )
    .eq("collecteur_id", user.id)
    .eq("status", "collecte")
    .order("date_collecte", { ascending: false });

  const { data: delivered } = await supabase
    .from("lots")
    .select("id, type_dechet, weight_real, date_livraison")
    .eq("collecteur_id", user.id)
    .in("status", ["livre_recycleur", "traite"])
    .order("date_livraison", { ascending: false });

  const collectedList = collected ?? [];
  const deliveredList = delivered ?? [];

  return (
    <>
      <div className="pageHead">
        <h1>Livraisons aux recycleurs</h1>
        <p className="muted">
          Suivez les commandes des recycleurs et confirmez vos livraisons de
          stock (double confirmation couche 2).
        </p>
      </div>

      {collectedList.length === 0 && deliveredList.length === 0 ? (
        <EmptyState
          icon="truck"
          title="Aucune livraison en cours"
          action={
            <a href="/collecteur/stock" className="btn-primary">
              <Icon name="box" size={16} />
              Voir mon stock
            </a>
          }
        >
          Collectez d&apos;abord des lots, puis les recycleurs pourront vous
          envoyer des commandes.
        </EmptyState>
      ) : (
        <>
          {collectedList.length > 0 && (
            <>
              <h2 className="font-fraunces" style={{ fontSize: "1.2rem" }}>
                En attente de commande recycleur ({collectedList.length})
              </h2>
              <div className="grid-cards">
                {collectedList.map((lot) => (
                  <Card key={lot.id} elevated={false}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                      <Badge tone="forest" dot>
                        En stock
                      </Badge>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--fs-label)", color: "var(--ec-ink-soft)" }}>
                        {lot.date_collecte
                          ? new Date(lot.date_collecte).toLocaleDateString("fr-FR")
                          : ""}
                      </span>
                    </div>
                    <h3 style={{ fontFamily: "var(--font-fraunces)", marginBottom: "0.25rem" }}>
                      {lot.type_dechet}
                    </h3>
                    <p style={{ fontSize: "var(--fs-body)", margin: 0 }}>
                      {lot.weight_real
                        ? `${lot.weight_real} kg`
                        : lot.volume_ia
                          ? `~${lot.volume_ia} kg`
                          : "—"}
                    </p>
                  </Card>
                ))}
              </div>
            </>
          )}

          {deliveredList.length > 0 && (
            <>
              <h2 className="font-fraunces" style={{ fontSize: "1.2rem", marginTop: "1.5rem" }}>
                Livraisons effectuées ({deliveredList.length})
              </h2>
              <div className="grid-cards">
                {deliveredList.map((lot) => (
                  <Card key={lot.id} elevated={false}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                      <Badge tone="paper">Livré</Badge>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--fs-label)", color: "var(--ec-ink-soft)" }}>
                        {lot.date_livraison
                          ? new Date(lot.date_livraison).toLocaleDateString("fr-FR")
                          : ""}
                      </span>
                    </div>
                    <h3 style={{ fontFamily: "var(--font-fraunces)", marginBottom: "0.25rem" }}>
                      {lot.type_dechet}
                    </h3>
                    <p style={{ fontSize: "var(--fs-body)", margin: 0 }}>
                      {lot.weight_real ? `${lot.weight_real} kg` : "—"}
                    </p>
                  </Card>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </>
  );
}
