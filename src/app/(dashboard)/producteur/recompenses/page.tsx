import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Stat } from "@/components/ui/Stat";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

type Palier = {
  seuil: number;
  recompense: string;
  description: string;
  icon: string;
};

const PALIERS: Palier[] = [
  { seuil: 100, recompense: "Bon d'achat 1 000 FCFA", description: "Chez les commerçants partenaires", icon: "star" },
  { seuil: 300, recompense: "T-shirt EcoCycle CI", description: "Coton bio, édition limitée", icon: "star" },
  { seuil: 500, recompense: "Kit de tri complet", description: "Sacs colorés + bac de compostage", icon: "box" },
  { seuil: 1000, recompense: "Bon d'achat 10 000 FCFA", description: "Chez les commerçants partenaires", icon: "star" },
  { seuil: 2000, recompense: "Bon d'achat 25 000 FCFA", description: "Chez les commerçants partenaires", icon: "star" },
  { seuil: 5000, recompense: "Tablette + accès premium", description: "Formation gestion des déchets", icon: "dashboard" },
];

const MOTIF_LABELS: Record<string, string> = {
  collecte_couche_1: "Collecte confirmée (couche 1)",
  collecte_couche_2: "Livraison confirmée (couche 2)",
  collecte: "Collecte",
  bonus: "Bonus",
};

export default async function RecompensesPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/producteur/recompenses");

  const { data: profile } = await supabase
    .from("users")
    .select("role, name, points_balance, points_total")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "producteur") redirect("/login");

  // Historique des transactions de points
  const { data: transactions } = await supabase
    .from("point_transactions")
    .select("id, points, motif, date_credit, lot_id")
    .eq("producteur_id", user.id)
    .order("date_credit", { ascending: false })
    .limit(20);

  const solde = profile.points_balance ?? 0;
  const total = profile.points_total ?? 0;
  const txList = transactions ?? [];

  // Calculer le prochain palier
  const prochainPalier = PALIERS.find((p) => p.seuil > total);
  const pointsRestants = prochainPalier ? prochainPalier.seuil - total : 0;

  // Paliers déjà atteints
  const paliersAtteints = PALIERS.filter((p) => p.seuil <= total);

  return (
    <>
      <div className="pageHead">
        <div className="row">
          <Badge tone="signal" dot>
            Producteur · {profile.name}
          </Badge>
        </div>
        <h1>Mes récompenses</h1>
        <p className="muted">
          Gagnez des points à chaque lot collecté. Plus vous triez, plus vous montez dans les paliers et débloquez des récompenses.
        </p>
      </div>

      <div className="grid-stats">
        <Stat label="Solde de points" value={solde} hint="Disponible" />
        <Stat label="Points cumulés (total)" value={total} hint="Depuis le début" />
        <Stat
          label="Prochain palier"
          value={prochainPalier ? pointsRestants : 0}
          unit="pts"
          hint={prochainPalier ? prochainPalier.recompense : "Tous débloqués !"}
        />
        <Stat label="Paliers atteints" value={paliersAtteints.length} hint={`sur ${PALIERS.length}`} />
      </div>

      {/* Barre de progression globale */}
      <Card title="Progression vers les paliers" elevated>
        <div className={styles.progressTrack}>
          <div
            className={styles.progressFill}
            style={{
              width: `${Math.min(100, (total / PALIERS[PALIERS.length - 1].seuil) * 100)}%`,
            }}
          />
          <span className={styles.progressLabel}>
            {total} / {PALIERS[PALIERS.length - 1].seuil} pts
          </span>
        </div>
      </Card>

      {/* Liste des paliers */}
      <div className={styles.paliersGrid}>
        {PALIERS.map((palier) => {
          const atteint = total >= palier.seuil;
          const progress = Math.min(100, (total / palier.seuil) * 100);

          return (
            <Card key={palier.seuil} elevated={false} className={atteint ? styles.palierAtteint : ""}>
              <div className={styles.palierHead}>
                <div className={styles.palierIcon}>
                  {atteint ? "★" : "☆"}
                </div>
                <div className={styles.palierSeuil}>
                  {palier.seuil} pts
                </div>
              </div>
              <h4 className={styles.palierRecompense}>{palier.recompense}</h4>
              <p className={styles.palierDesc}>{palier.description}</p>

              <div className={styles.palierBar}>
                <div
                  className={atteint ? styles.palierBarFillDone : styles.palierBarFill}
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className={styles.palierStatus}>
                {atteint ? (
                  <Badge tone="signal" dot>Débloqué</Badge>
                ) : (
                  <span className={styles.palierRestant}>
                    {palier.seuil - total} pts restants
                  </span>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Historique des transactions */}
      <Card title="Historique des points" action="Voir mes lots" actionHref="/producteur/lots" elevated>
        {txList.length === 0 ? (
          <EmptyState icon="star" title="Aucun point gagné pour l'instant">
            Publiez un lot de déchets triés. Quand un collecteur le collecte et que la collecte est confirmée (couche 1), vous gagnez des points.
          </EmptyState>
        ) : (
          <div className={styles.txList}>
            {txList.map((tx) => (
              <div key={tx.id} className={styles.txRow}>
                <div className={styles.txLeft}>
                  <span className={styles.txPoints}>+{tx.points}</span>
                  <span className={styles.txMotif}>
                    {MOTIF_LABELS[tx.motif] ?? tx.motif}
                  </span>
                </div>
                <span className={styles.txDate}>
                  {new Date(tx.date_credit).toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className={styles.ctaRow}>
        <Button href="/producteur/lots/nouveau" variant="primary">
          + Publier un lot pour gagner des points
        </Button>
      </div>
    </>
  );
}