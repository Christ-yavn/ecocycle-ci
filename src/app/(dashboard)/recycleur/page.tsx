import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Stat } from "@/components/ui/Stat";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

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

export default async function RecycleurPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/recycleur");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role, name, commune")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "recycleur") {
    redirect("/login");
  }

  // Marketplace : lots collectés par les collecteurs (status='collecte')
  // = stocks disponibles pour le recycleur
  const { data: stocks } = await supabase
    .from("lots")
    .select(
      "id, type_dechet, weight_real, volume_ia, score_tri, commune, quartier, date_collecte, collecteur_id",
    )
    .eq("status", "collecte")
    .order("date_collecte", { ascending: false });

  // Récupérer les noms des collecteurs
  const collecteurIds = [...new Set((stocks ?? []).map((s) => s.collecteur_id).filter(Boolean))];
  const { data: collecteurs } = await supabase
    .from("users")
    .select("id, name, commune")
    .in("id", collecteurIds);

  const collecteurMap = new Map(
    (collecteurs ?? []).map((c) => [c.id, c]),
  );

  const stockList = stocks ?? [];
  const totalKg = stockList.reduce(
    (sum, s) => sum + (s.weight_real ?? s.volume_ia ?? 0),
    0,
  );
  const byType = new Map<string, number>();
  stockList.forEach((s) => {
    const t = s.type_dechet;
    byType.set(t, (byType.get(t) ?? 0) + (s.weight_real ?? s.volume_ia ?? 0));
  });

  // Commandes en attente de réception (lots livrés au recycleur, pas encore confirmés)
  const { data: livraisonsEnAttente } = await supabase
    .from("lots")
    .select("id, type_dechet, weight_real, date_livraison")
    .eq("status", "livre_recycleur")
    .order("date_livraison", { ascending: false });

  return (
    <>
      <div className="pageHead">
        <div className="row">
          <Badge tone="signal" dot>
            Recycleur · {profile.name}
          </Badge>
        </div>
        <h1>Marketplace des stocks</h1>
        <p className="muted">
          Consultez les déchets triés collectés et disponibles. Contactez le
          collecteur pour organiser la livraison (la négociation se fait hors
          plateforme).
        </p>
      </div>

      <div className="grid-stats">
        <Stat label="Stocks disponibles" value={stockList.length} hint="Lots collectés" />
        <Stat label="Volume total" value={Math.round(totalKg)} unit="kg" />
        <Stat label="Types distincts" value={byType.size} />
        <Stat
          label="Livraisons en attente"
          value={(livraisonsEnAttente ?? []).length}
          hint="À confirmer"
        />
      </div>

      {byType.size > 0 && (
        <Card title="Répartition par type">
          <div className={styles.typeList}>
            {Array.from(byType.entries()).map(([type, kg]) => (
              <div key={type} className={styles.typeRow}>
                <span className={styles.typeLabel}>
                  {TYPE_LABELS[type] ?? type}
                </span>
                <span className={styles.typeKg}>{Math.round(kg)} kg</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {stockList.length === 0 ? (
        <EmptyState
          icon="recycle"
          title="Aucun stock disponible"
        >
          Les déchets triés collectés par les collecteurs apparaîtront ici.
          Patientez le temps que les collecteurs effectuent leurs tournées.
        </EmptyState>
      ) : (
        <div className={styles.grid}>
          {stockList.map((lot) => {
            const collecteur = lot.collecteur_id
              ? collecteurMap.get(lot.collecteur_id)
              : null;
            return (
              <Card key={lot.id} elevated={false}>
                <div className={styles.head}>
                  <Badge tone="forest" dot>
                    Disponible
                  </Badge>
                  <span className={styles.date}>
                    {lot.date_collecte
                      ? new Date(lot.date_collecte).toLocaleDateString("fr-FR")
                      : ""}
                  </span>
                </div>
                <div className={styles.body}>
                  <span className={styles.type}>
                    {TYPE_LABELS[lot.type_dechet] ?? lot.type_dechet}
                  </span>
                  <span className={styles.weight}>
                    {lot.weight_real
                      ? `${lot.weight_real} kg`
                      : lot.volume_ia
                        ? `~${lot.volume_ia} kg`
                        : "—"}
                  </span>
                </div>
                {lot.score_tri && (
                  <div className={styles.score}>
                    {"★".repeat(lot.score_tri)}
                    {"☆".repeat(5 - lot.score_tri)} · Tri niveau {lot.score_tri}
                  </div>
                )}
                <div className={styles.collecteur}>
                  <Icon name="truck" size={14} />
                  {collecteur?.name ?? "Collecteur"} ·{" "}
                  {lot.commune ?? collecteur?.commune ?? "—"}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
