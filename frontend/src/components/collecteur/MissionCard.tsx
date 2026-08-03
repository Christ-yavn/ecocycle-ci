import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import type { LotRow } from "@/types/database.types";
import styles from "./MissionCard.module.css";

export const TYPE_BADGE: Record<
  string,
  { label: string; tone: "signal" | "amber" | "forest" | "rust" | "paper" }
> = {
  plastique: { label: "Plastique", tone: "signal" },
  papier_carton: { label: "Carton", tone: "amber" },
  metal: { label: "Métal", tone: "paper" },
  verre: { label: "Verre", tone: "paper" },
  organique: { label: "Organique", tone: "forest" },
  electronique: { label: "Électronique", tone: "forest" },
  textile: { label: "Textile", tone: "forest" },
  mixte: { label: "Mixte", tone: "amber" },
  inconnu: { label: "Inconnu", tone: "paper" },
};

export function formatAnciennete(datePublication: string): string {
  const diffMs = Date.now() - new Date(datePublication).getTime();
  const heures = Math.floor(diffMs / 3_600_000);
  if (heures < 1) return "à l'instant";
  if (heures < 24) return `il y a ${heures} h`;
  const jours = Math.floor(heures / 24);
  return `il y a ${jours} j`;
}

export function MissionCard({
  lot,
}: {
  lot: Pick<
    LotRow,
    | "id"
    | "type_dechet"
    | "volume_ia"
    | "weight_real"
    | "commune"
    | "quartier"
    | "photo_url"
    | "date_publication"
  >;
}) {
  const type = TYPE_BADGE[lot.type_dechet] ?? TYPE_BADGE.inconnu;
  const poids = lot.weight_real ?? lot.volume_ia;

  return (
    <div className={styles.card}>
      <div className={styles.photoWrap}>
        {lot.photo_url ? (
          /* eslint-disable-next-line @next/next/no-img-element -- URL Supabase Storage dynamique */
          <img src={lot.photo_url} alt={type.label} className={styles.photo} />
        ) : (
          <div className={styles.photoPlaceholder}>📦</div>
        )}
      </div>

      <div className={styles.body}>
        <div className={styles.head}>
          <Badge tone={type.tone}>{type.label}</Badge>
          <span className={styles.poids}>
            {poids != null ? `~${Math.round(poids)} kg` : "—"}
          </span>
        </div>
        <div className={styles.meta}>
          📍 {[lot.quartier, lot.commune].filter(Boolean).join(", ") || "Abidjan"}
        </div>
        <div className={styles.meta}>
          🕐 {formatAnciennete(lot.date_publication)}
        </div>
        <Link href={`/collecteur/missions/${lot.id}`} className={styles.cta}>
          Voir la mission →
        </Link>
      </div>
    </div>
  );
}
