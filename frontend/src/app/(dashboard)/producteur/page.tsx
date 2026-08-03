import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import type { LotRow } from "@/types/database.types";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

// Seuils de niveau (alignés sur le trigger update_user_level)
const SEUILS = [0, 50, 200, 500, 1000];

function niveauInfo(points: number, niveau: number) {
  const idx = Math.min(Math.max(niveau, 1), 5) - 1;
  const seuilActuel = SEUILS[idx];
  const prochainSeuil = idx < SEUILS.length - 1 ? SEUILS[idx + 1] : null;
  const restant = prochainSeuil != null ? Math.max(prochainSeuil - points, 0) : 0;
  const progression =
    prochainSeuil != null
      ? Math.min(
          100,
          Math.round(
            ((points - seuilActuel) / (prochainSeuil - seuilActuel)) * 100,
          ),
        )
      : 100;
  return { prochainSeuil, restant, progression };
}

const STATUS_BADGE: Record<
  string,
  { label: string; tone: "primary" | "warning" | "success" | "danger" | "outline" }
> = {
  publie: { label: "En attente", tone: "warning" },
  reserve: { label: "Réservé", tone: "warning" },
  collecte: { label: "Collecté", tone: "success" },
  livre_recycleur: { label: "Livré", tone: "success" },
  traite: { label: "Traité", tone: "outline" },
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

export default async function ProducteurDashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/producteur");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("name, points_total, points_balance, niveau")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/login?mode=complete");
  }

  const { data: lotsRaw } = await supabase
    .from("lots")
    .select("id, type_dechet, status, volume_ia, weight_real, date_publication")
    .eq("producteur_id", user.id)
    .order("date_publication", { ascending: false });

  const lots = (lotsRaw ?? []) as unknown as Pick<
    LotRow,
    "id" | "type_dechet" | "status" | "volume_ia" | "weight_real" | "date_publication"
  >[];

  const lotsPublies = lots.length;
  const lotsCollectes = lots.filter((l) =>
    ["collecte", "livre_recycleur", "traite"].includes(l.status),
  ).length;
  const recents = lots.slice(0, 3);

  const points = profile.points_total ?? 0;
  const niveau = profile.niveau ?? 1;
  const { prochainSeuil, restant, progression } = niveauInfo(points, niveau);

  return (
    <>
      {/* Header */}
      <div className="pageHead">
        <h1>Bienvenue, {profile.name}</h1>
        <p className="muted">
          Le bon déchet, au bon endroit, au bon moment.
        </p>
      </div>

      {/* 2 cartes d'action */}
      <div className={styles.actions}>
        <Link href="/producteur/lots/nouveau" className={styles.actionGreen}>
          <span className={styles.actionIcon}>
            <Icon name="plus" size={26} />
          </span>
          <span className={styles.actionTitle}>Publier un lot</span>
          <span className={styles.actionText}>
            Photo + analyse IA en 30 secondes
          </span>
        </Link>
        <Link href="/producteur/signaler" className={styles.actionAmber}>
          <span className={styles.actionIcon}>
            <Icon name="alertTriangle" size={26} />
          </span>
          <span className={styles.actionTitle}>Signaler un dépôt</span>
          <span className={styles.actionText}>
            Alertez votre mairie en temps réel
          </span>
        </Link>
      </div>

      {/* Carte Niveau */}
      <Card elevated={false}>
        <div className={styles.niveauWrap}>
          <div className={styles.niveauBadge}>{niveau}</div>
          <div className={styles.niveauBody}>
            <div className={styles.niveauHead}>
              <span className={styles.niveauTitle}>Niveau {niveau}</span>
              <span className={styles.niveauPoints}>
                {points} point{points > 1 ? "s" : ""}
              </span>
            </div>
            <div
              className={styles.jauge}
              role="progressbar"
              aria-valuenow={progression}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className={styles.jaugeFill}
                style={{ width: `${progression}%` }}
              />
            </div>
            <p className={styles.niveauHint}>
              {prochainSeuil != null
                ? `${restant} point${restant > 1 ? "s" : ""} avant le niveau ${niveau + 1}`
                : "Niveau maximum atteint — bravo !"}
            </p>
          </div>
        </div>
      </Card>

      {/* Activité récente */}
      <Card elevated={false}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>Activité récente</h2>
          <Link href="/producteur/lots" className={styles.sectionLink}>
            Tout voir →
          </Link>
        </div>
        {recents.length === 0 ? (
          <p className="muted" style={{ margin: 0 }}>
            Aucun lot pour le moment. Publiez votre premier lot pour démarrer.
          </p>
        ) : (
          <ul className={styles.activiteList}>
            {recents.map((lot) => {
              const st = STATUS_BADGE[lot.status] ?? STATUS_BADGE.publie;
              return (
                <li key={lot.id} className={styles.activiteItem}>
                  <div className={styles.activiteInfo}>
                    <span className={styles.activiteType}>
                      {TYPE_LABELS[lot.type_dechet] ?? lot.type_dechet}
                    </span>
                    <span className={styles.activiteMeta}>
                      {lot.weight_real != null
                        ? `${lot.weight_real} kg`
                        : lot.volume_ia != null
                          ? `~${lot.volume_ia} kg`
                          : "—"}{" "}
                      ·{" "}
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

      {/* Stats bas */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{lotsPublies}</span>
          <span className={styles.statLabel}>
            lot{lotsPublies > 1 ? "s" : ""} publié{lotsPublies > 1 ? "s" : ""}
          </span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{lotsCollectes}</span>
          <span className={styles.statLabel}>
            collecté{lotsCollectes > 1 ? "s" : ""}
          </span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{profile.points_balance ?? 0}</span>
          <span className={styles.statLabel}>points disponibles</span>
        </div>
      </div>
    </>
  );
}
