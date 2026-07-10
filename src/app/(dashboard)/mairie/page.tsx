import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Stat } from "@/components/ui/Stat";
import { MairieMap } from "@/components/map/MairieMap";
import type { SignalementMapItem } from "@/types/map";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function MairiePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/mairie");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role, name, commune")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "mairie") {
    redirect("/login");
  }

  // --- KPIs ---

  // Volume collecté ce mois
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { data: collectedThisMonth } = await supabase
    .from("lots")
    .select("weight_real, volume_ia")
    .gte("date_collecte", monthStart)
    .not("date_collecte", "is", null);

  const volumeCollecte = (collectedThisMonth ?? []).reduce(
    (sum, l) => sum + (l.weight_real ?? l.volume_ia ?? 0),
    0,
  );

  // Volume livré au recycleur ce mois
  const { data: recycledThisMonth } = await supabase
    .from("lots")
    .select("weight_real")
    .gte("date_livraison", monthStart)
    .not("date_livraison", "is", null);

  const volumeRecycle = (recycledThisMonth ?? []).reduce(
    (sum, l) => sum + (l.weight_real ?? 0),
    0,
  );

  const tauxRecyclage =
    volumeCollecte > 0
      ? Math.round((volumeRecycle / volumeCollecte) * 100)
      : 0;

  // Producteurs actifs (inscrits)
  const { count: producteursCount } = await supabase
    .from("users")
    .select("id", { count: "exact", head: true })
    .eq("role", "producteur");

  // Collecteurs actifs
  const { count: collecteursCount } = await supabase
    .from("users")
    .select("id", { count: "exact", head: true })
    .eq("role", "collecteur");

  // Lots par statut
  const { count: lotsPublie } = await supabase
    .from("lots")
    .select("id", { count: "exact", head: true })
    .eq("status", "publie");

  const { count: lotsCollecte } = await supabase
    .from("lots")
    .select("id", { count: "exact", head: true })
    .eq("status", "collecte");

  const { count: lotsLivre } = await supabase
    .from("lots")
    .select("id", { count: "exact", head: true })
    .eq("status", "livre_recycleur");

  // --- Signalements ---
  const { data: signalements } = await supabase
    .from("signalements")
    .select(
      "id, latitude, longitude, commune, quartier, description, photo_url, status, date_signalement",
    )
    .order("date_signalement", { ascending: false });

  const signalementsList: SignalementMapItem[] = (signalements ?? [])
    .filter((s) => s.latitude != null && s.longitude != null)
    .map((s) => ({
      id: s.id,
      latitude: s.latitude!,
      longitude: s.longitude!,
      commune: s.commune,
      quartier: s.quartier,
      description: s.description,
      photoUrl: s.photo_url,
      status: s.status,
      dateSignalement: s.date_signalement,
    }));

  const signalementsNouveau = signalementsList.filter(
    (s) => s.status === "nouveau",
  ).length;
  const signalementsEnCours = signalementsList.filter(
    (s) => s.status === "pris_en_charge",
  ).length;
  const signalementsResolu = signalementsList.filter(
    (s) => s.status === "resolu",
  ).length;

  // Répartition par type de déchet collecté
  const { data: lotsByType } = await supabase
    .from("lots")
    .select("type_dechet, weight_real, volume_ia")
    .in("status", ["collecte", "livre_recycleur", "traite"]);

  const byType = new Map<string, number>();
  (lotsByType ?? []).forEach((l) => {
    const t = l.type_dechet;
    byType.set(
      t,
      (byType.get(t) ?? 0) + (l.weight_real ?? l.volume_ia ?? 0),
    );
  });

  const TYPE_LABELS: Record<string, string> = {
    plastique: "Plastique",
    metal: "Métal",
    papier_carton: "Papier / Carton",
    verre: "Verre",
    organique: "Organique",
    electronique: "Électronique",
    textile: "Textile",
    mixte: "Mixte",
    inconnu: "Inconnu",
  };

  return (
    <>
      <div className="pageHead">
        <div className="row">
          <Badge tone="signal" dot>
            Mairie de {profile.commune ?? "Abidjan"}
          </Badge>
          <Badge tone="paper">{profile.name}</Badge>
        </div>
        <h1>Tableau de bord communal</h1>
        <p className="muted">
          Statistiques en temps réel sur la collecte et le recyclage des déchets
          sur votre commune.
        </p>
      </div>

      {/* KPIs principaux */}
      <div className="grid-stats">
        <Stat
          label="Volume collecté"
          value={Math.round(volumeCollecte)}
          unit="kg"
          hint="Ce mois-ci"
        />
        <Stat
          label="Volume recyclé"
          value={Math.round(volumeRecycle)}
          unit="kg"
          hint="Livré aux recycleurs"
        />
        <Stat
          label="Taux de recyclage"
          value={`${tauxRecyclage}%`}
          hint="Recyclé / Collecté"
        />
        <Stat
          label="Producteurs actifs"
          value={producteursCount ?? 0}
          hint={`${collecteursCount ?? 0} collecteurs`}
        />
      </div>

      {/* Lots par statut */}
      <div className="grid-stats">
        <Stat label="Lots publiés" value={lotsPublie ?? 0} hint="En attente" />
        <Stat label="Lots collectés" value={lotsCollecte ?? 0} hint="En stock" />
        <Stat
          label="Lots livrés"
          value={lotsLivre ?? 0}
          hint="Aux recycleurs"
        />
        <Stat
          label="Dépôts sauvages"
          value={signalementsNouveau}
          hint={`${signalementsEnCours} en cours · ${signalementsResolu} résolus`}
        />
      </div>

      {/* Répartition par type */}
      {byType.size > 0 && (
        <Card title="Répartition par type de déchet collecté">
          <div className={styles.typeList}>
            {Array.from(byType.entries())
              .sort((a, b) => b[1] - a[1])
              .map(([type, kg]) => (
                <div key={type} className={styles.typeRow}>
                  <span className={styles.typeLabel}>
                    {TYPE_LABELS[type] ?? type}
                  </span>
                  <div className={styles.barWrap}>
                    <div
                      className={styles.bar}
                      style={{
                        width: `${Math.min(100, (kg / Math.max(...Array.from(byType.values()))) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className={styles.typeKg}>{Math.round(kg)} kg</span>
                </div>
              ))}
          </div>
        </Card>
      )}

      {/* Carte des dépôts sauvages */}
      <Card title="Carte des dépôts sauvages signalés" action="Voir détails" actionHref="/mairie/alertes">
        <MairieMap signalements={signalementsList} />
      </Card>
    </>
  );
}
