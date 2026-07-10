import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Stat } from "@/components/ui/Stat";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

const STATUS_CONFIG: Record<
  string,
  { label: string; tone: "signal" | "amber" | "forest" | "rust" | "paper" }
> = {
  reserve: { label: "Réservé", tone: "amber" },
  collecte: { label: "Collecté", tone: "forest" },
  livre_recycleur: { label: "Livré", tone: "paper" },
  traite: { label: "Traité", tone: "paper" },
};

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

export default async function StockPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/collecteur/stock");
  }

  // Lots réservés ou collectés par ce collecteur
  const { data: lots } = await supabase
    .from("lots")
    .select(
      "id, type_dechet, status, score_tri, volume_ia, weight_real, commune, quartier, date_publication, date_collecte",
    )
    .eq("collecteur_id", user.id)
    .in("status", ["reserve", "collecte", "livre_recycleur", "traite"])
    .order("date_publication", { ascending: false });

  const stockList = lots ?? [];
  const totalKg = stockList.reduce(
    (sum, l) => sum + (l.weight_real ?? l.volume_ia ?? 0),
    0,
  );
  const byType = new Map<string, number>();
  stockList.forEach((l) => {
    const t = l.type_dechet;
    byType.set(t, (byType.get(t) ?? 0) + (l.weight_real ?? l.volume_ia ?? 0));
  });

  return (
    <>
      <div className="pageHead">
        <h1>Mon stock</h1>
        <p className="muted">
          Lots réservés et collectés. Les volumes sont visibles par les
          recycleurs sur la marketplace.
        </p>
      </div>

      <div className="grid-stats">
        <Stat label="Total lots" value={stockList.length} />
        <Stat label="Volume total" value={Math.round(totalKg)} unit="kg" />
        <Stat label="Types distincts" value={byType.size} />
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
          icon="box"
          title="Aucun lot dans votre stock"
          action={
            <a href="/collecteur" className="btn-primary">
              <Icon name="map" size={16} />
              Voir la carte des gisements
            </a>
          }
        >
          Réservez des lots sur la carte pour les voir apparaître dans votre
          stock.
        </EmptyState>
      ) : (
        <div className={styles.grid}>
          {stockList.map((lot) => {
            const st = STATUS_CONFIG[lot.status] ?? STATUS_CONFIG.reserve;
            return (
              <Card key={lot.id} elevated={false}>
                <div className={styles.head}>
                  <Badge tone={st.tone} dot>
                    {st.label}
                  </Badge>
                  <span className={styles.date}>
                    {new Date(lot.date_publication).toLocaleDateString("fr-FR")}
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
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
