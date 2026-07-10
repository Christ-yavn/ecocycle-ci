import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CollecteurMap } from "@/components/map/CollecteurMap";
import { Card } from "@/components/ui/Card";
import { Stat } from "@/components/ui/Stat";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import type { MapLot } from "@/types/map";

export const dynamic = "force-dynamic";

export default async function CollecteurPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/collecteur");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role, name, commune, quartier")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "collecteur") {
    redirect("/login");
  }

  // Récupérer les lots publiés avec coordonnées (st_x=lng, st_y=lat)
  const { data: lotsData } = await supabase
    .from("lots")
    .select(
      "id, type_dechet, status, score_tri, volume_ia, weight_real, latitude, longitude, commune, quartier, photo_url, disponibilite, date_publication, producteur_id",
    )
    .eq("status", "publie")
    .not("latitude", "is", null)
    .not("longitude", "is", null)
    .order("date_publication", { ascending: false });

  // Récupérer les noms des producteurs (via une seconde requête pour éviter les jointes complexes RLS)
  const producteurIds = [...new Set((lotsData ?? []).map((l) => l.producteur_id))];
  const { data: producteurs } = await supabase
    .from("users")
    .select("id, name")
    .in("id", producteurIds);

  const producteurMap = new Map((producteurs ?? []).map((p) => [p.id, p.name]));

  const mapLots: MapLot[] = (lotsData ?? []).map((l) => ({
    id: l.id,
    typeDechet: l.type_dechet,
    status: l.status,
    scoreTri: l.score_tri,
    volumeIa: l.volume_ia,
    weightReal: l.weight_real,
    latitude: l.latitude!,
    longitude: l.longitude!,
    commune: l.commune,
    quartier: l.quartier,
    photoUrl: l.photo_url,
    disponibilite: l.disponibilite,
    datePublication: l.date_publication,
    producteurName: producteurMap.get(l.producteur_id) ?? null,
  }));

  // Récupérer les lots déjà réservés par ce collecteur
  const { data: reservedLots } = await supabase
    .from("lots")
    .select("id")
    .eq("collecteur_id", user.id)
    .eq("status", "reserve");

  const reservedIds = (reservedLots ?? []).map((l) => l.id);

  // Stats
  const availableCount = mapLots.length;
  const reservedCount = reservedIds.length;
  const totalVolumeKg = mapLots.reduce(
    (sum, l) => sum + (l.weightReal ?? l.volumeIa ?? 0),
    0,
  );

  return (
    <>
      <div className="pageHead">
        <div className="row">
          <Badge tone="signal" dot>
            {profile.commune ?? "Abidjan"}
          </Badge>
          <Badge tone="paper">Collecteur · {profile.name}</Badge>
        </div>
        <h1>Carte des gisements</h1>
        <p className="muted">
          Visualisez les lots de déchets disponibles dans votre zone. Cliquez
          sur un marqueur pour réserver, puis calculez votre itinéraire
          optimisé.
        </p>
      </div>

      <div className="grid-stats">
        <Stat label="Lots disponibles" value={availableCount} hint="Dans ma zone" />
        <Stat label="Mes réservations" value={reservedCount} />
        <Stat label="Volume estimé" value={Math.round(totalVolumeKg)} unit="kg" />
        <Stat label="Commune" value={profile.commune ?? "—"} />
      </div>

      <Card elevated={false}>
        <CollecteurMap lots={mapLots} reservedIds={reservedIds} />
      </Card>

      <Card>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <div>
            <h3 style={{ marginBottom: "0.25rem" }}>Comment ça marche ?</h3>
            <p style={{ margin: 0, fontSize: "var(--fs-body)" }}>
              1. Cliquez sur un marqueur pour voir le détail du lot.{" "}
              <br />
              2. Cliquez sur &quot;Réserver&quot; dans la popup.{" "}
              <br />
              3. Sélectionnez plusieurs lots puis cliquez sur
              &quot;Calculer l&apos;itinéraire&quot; pour tracer le trajet
              optimisé (OSRM).
            </p>
          </div>
          <Icon name="route" size={32} />
        </div>
      </Card>
    </>
  );
}
