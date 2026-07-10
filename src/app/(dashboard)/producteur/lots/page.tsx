import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import type { LotRow } from "@/types/database.types";
import styles from "./page.module.css";

const STATUS_CONFIG: Record<
  LotRow["status"],
  { label: string; tone: "signal" | "amber" | "forest" | "rust" | "paper" }
> = {
  publie: { label: "Publié", tone: "signal" },
  reserve: { label: "Réservé", tone: "amber" },
  collecte: { label: "Collecté", tone: "forest" },
  livre_recycleur: { label: "Livré recycleur", tone: "paper" },
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

export default async function MesLotsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: lots } = await supabase
    .from("lots")
    .select(
      "id, type_dechet, status, score_tri, volume_ia, weight_real, photo_url, date_publication, date_collecte",
    )
    .eq("producteur_id", user.id)
    .order("date_publication", { ascending: false });

  const lotsList = (lots ?? []) as unknown as Pick<
    LotRow,
    | "id"
    | "type_dechet"
    | "status"
    | "score_tri"
    | "volume_ia"
    | "weight_real"
    | "photo_url"
    | "date_publication"
    | "date_collecte"
  >[];

  return (
    <>
      <div className="pageHead">
        <h1>Mes lots</h1>
        <p className="muted">
          Suivez le statut de tous les lots que vous avez publiés.
        </p>
      </div>

      {lotsList.length === 0 ? (
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
          Triez vos déchets, prenez une photo et publiez votre premier lot pour
          gagner des points.
        </EmptyState>
      ) : (
        <div className={styles.grid}>
          {lotsList.map((lot) => {
            const st = STATUS_CONFIG[lot.status] ?? STATUS_CONFIG.publie;
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
                  <div className={styles.typeRow}>
                    <span className={styles.type}>
                      {TYPE_LABELS[lot.type_dechet] ?? lot.type_dechet}
                    </span>
                    {lot.score_tri && (
                      <span className={styles.score}>
                        {"★".repeat(lot.score_tri)}
                        {"☆".repeat(5 - lot.score_tri)}
                      </span>
                    )}
                  </div>
                  <div className={styles.meta}>
                    {lot.weight_real && (
                      <span>Pesé : {lot.weight_real} kg</span>
                    )}
                    {lot.volume_ia && !lot.weight_real && (
                      <span>Estimé : {lot.volume_ia} kg</span>
                    )}
                  </div>
                  {lot.status === "collecte" && (
                    <a
                      href={`/producteur/lots/${lot.id}/confirmation`}
                      className="btn-accent"
                      style={{
                        marginTop: "0.5rem",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        fontSize: "var(--fs-body)",
                      }}
                    >
                      <Icon name="bell" size={16} />
                      Confirmer la collecte
                    </a>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
