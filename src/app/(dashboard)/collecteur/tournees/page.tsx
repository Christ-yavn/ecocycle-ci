import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";

export const dynamic = "force-dynamic";

export default async function TourneesPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/collecteur/tournees");
  }

  // Lots réservés (à collecter aujourd'hui)
  const { data: reserved } = await supabase
    .from("lots")
    .select(
      "id, type_dechet, score_tri, volume_ia, latitude, longitude, commune, quartier, disponibilite, date_publication",
    )
    .eq("collecteur_id", user.id)
    .eq("status", "reserve")
    .not("latitude", "is", null)
    .order("date_publication", { ascending: false });

  const reservedList = reserved ?? [];

  return (
    <>
      <div className="pageHead">
        <h1>Mes tournées</h1>
        <p className="muted">
          Lots réservés en attente de collecte physique. Rendez-vous sur place,
          pesez le lot et confirmez la collecte.
        </p>
      </div>

      {reservedList.length === 0 ? (
        <EmptyState
          icon="route"
          title="Aucune tournée planifiée"
          action={
            <a href="/collecteur" className="btn-primary">
              <Icon name="map" size={16} />
              Voir la carte des gisements
            </a>
          }
        >
          Réservez des lots sur la carte pour planifier votre tournée de
          collecte.
        </EmptyState>
      ) : (
        <>
          <Card>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <div>
                <h3 style={{ marginBottom: "0.25rem" }}>
                  {reservedList.length} lot(s) à collecter
                </h3>
                <p style={{ margin: 0, fontSize: "var(--fs-body)" }}>
                  Retournez sur la carte pour calculer votre itinéraire
                  optimisé.
                </p>
              </div>
              <a href="/collecteur" className="btn-accent">
                <Icon name="map" size={16} />
                Calculer l&apos;itinéraire
              </a>
            </div>
          </Card>

          <div className="grid-cards">
            {reservedList.map((lot, i) => (
              <Card key={lot.id} elevated={false}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.6rem",
                    marginBottom: "0.5rem",
                  }}
                >
                  <span
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: "var(--ec-forest)",
                      color: "var(--ec-paper)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {i + 1}
                  </span>
                  <Badge tone="amber" dot>
                    Réservé
                  </Badge>
                </div>
                <h3 style={{ fontFamily: "var(--font-fraunces)", marginBottom: "0.25rem" }}>
                  {lot.commune ?? "Commune inconnue"}
                  {lot.quartier ? ` · ${lot.quartier}` : ""}
                </h3>
                <p style={{ fontSize: "var(--fs-body)", margin: 0 }}>
                  Type : {lot.type_dechet} · {lot.volume_ia ? `~${lot.volume_ia} kg` : "Volume inconnu"}
                </p>
                {lot.score_tri && (
                  <p
                    style={{
                      fontSize: "var(--fs-label)",
                      color: "var(--ec-amber-dark)",
                      marginTop: "0.25rem",
                    }}
                  >
                    {"★".repeat(lot.score_tri)}
                    {"☆".repeat(5 - lot.score_tri)} · Tri niveau {lot.score_tri}
                  </p>
                )}
              </Card>
            ))}
          </div>
        </>
      )}
    </>
  );
}
