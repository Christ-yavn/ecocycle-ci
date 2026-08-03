import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import type { LotRow, PointTransactionRow } from "@/types/database.types";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

const STATUS_BADGE: Record<
  string,
  { label: string; tone: "signal" | "amber" | "forest" | "rust" | "paper" }
> = {
  publie: { label: "En attente", tone: "amber" },
  reserve: { label: "Réservé", tone: "amber" },
  collecte: { label: "Collecté", tone: "forest" },
  livre_recycleur: { label: "Livré", tone: "forest" },
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

const MOTIF_LABELS: Record<string, string> = {
  collecte_couche_1: "Lot collecté",
  signalement_resolu: "Signalement résolu",
};

export default async function ProducteurActivitePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/producteur/activite");
  }

  const [{ data: lotsRaw }, { data: txRaw }] = await Promise.all([
    supabase
      .from("lots")
      .select(
        "id, type_dechet, status, volume_ia, weight_real, date_publication, date_collecte",
      )
      .eq("producteur_id", user.id)
      .order("date_publication", { ascending: false })
      .limit(50),
    supabase
      .from("point_transactions")
      .select("id, points, motif, date_credit")
      .eq("producteur_id", user.id)
      .order("date_credit", { ascending: false })
      .limit(50),
  ]);

  const lots = (lotsRaw ?? []) as unknown as Pick<
    LotRow,
    | "id"
    | "type_dechet"
    | "status"
    | "volume_ia"
    | "weight_real"
    | "date_publication"
    | "date_collecte"
  >[];
  const transactions = (txRaw ?? []) as unknown as Pick<
    PointTransactionRow,
    "id" | "points" | "motif" | "date_credit"
  >[];

  return (
    <>
      <div className="pageHead">
        <h1>Activité</h1>
        <p className="muted">
          Historique de vos lots et de vos points EcoLoop.
        </p>
      </div>

      <Card elevated={false}>
        <h2 className={styles.sectionTitle}>Mes points</h2>
        {transactions.length === 0 ? (
          <p className="muted" style={{ margin: 0 }}>
            Aucun point gagné pour le moment. Les points sont crédités après
            chaque collecte confirmée.
          </p>
        ) : (
          <ul className={styles.list}>
            {transactions.map((tx) => (
              <li key={tx.id} className={styles.item}>
                <div className={styles.itemInfo}>
                  <span className={styles.itemTitle}>
                    {MOTIF_LABELS[tx.motif] ?? tx.motif}
                  </span>
                  <span className={styles.itemMeta}>
                    {new Date(tx.date_credit).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <span className={styles.points}>+{tx.points} pts</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card elevated={false}>
        <h2 className={styles.sectionTitle}>Historique des lots</h2>
        {lots.length === 0 ? (
          <EmptyState
            icon="lot"
            title="Aucun lot publié"
            action={
              <Button href="/producteur/lots/nouveau" variant="primary">
                <Icon name="plus" size={16} />
                Publier mon premier lot
              </Button>
            }
          >
            Vos lots publiés apparaîtront ici avec leur statut.
          </EmptyState>
        ) : (
          <ul className={styles.list}>
            {lots.map((lot) => {
              const st = STATUS_BADGE[lot.status] ?? STATUS_BADGE.publie;
              return (
                <li key={lot.id} className={styles.item}>
                  <div className={styles.itemInfo}>
                    <span className={styles.itemTitle}>
                      {TYPE_LABELS[lot.type_dechet] ?? lot.type_dechet}
                    </span>
                    <span className={styles.itemMeta}>
                      {lot.weight_real != null
                        ? `${lot.weight_real} kg`
                        : lot.volume_ia != null
                          ? `~${lot.volume_ia} kg`
                          : "—"}{" "}
                      · publié le{" "}
                      {new Date(lot.date_publication).toLocaleDateString(
                        "fr-FR",
                      )}
                    </span>
                  </div>
                  <Badge tone={st.tone} dot>
                    {st.label}
                  </Badge>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </>
  );
}
