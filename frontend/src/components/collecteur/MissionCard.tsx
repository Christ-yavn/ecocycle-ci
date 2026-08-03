import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import type { LotRow } from "@/types/database.types";
import styles from "./MissionCard.module.css";

export const TYPE_BADGE: Record<
  string,
  { label: string; tone: "primary" | "warning" | "success" | "danger" | "outline" }
> = {
  plastique: { label: "Plastique", tone: "primary" },
  papier_carton: { label: "Carton", tone: "warning" },
  metal: { label: "Métal", tone: "outline" },
  verre: { label: "Verre", tone: "outline" },
  organique: { label: "Organique", tone: "success" },
  electronique: { label: "Électronique", tone: "success" },
  textile: { label: "Textile", tone: "success" },
  mixte: { label: "Mixte", tone: "warning" },
  inconnu: { label: "Inconnu", tone: "outline" },
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
          <div className={styles.photoPlaceholder}>
            <Icon name="package" size={24} />
          </div>
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
          <Icon name="mapPin" size={14} /> {[lot.quartier, lot.commune].filter(Boolean).join(", ") || "Abidjan"}
        </div>
        <div className={styles.meta}>
          <Icon name="clock" size={14} /> {formatAnciennete(lot.date_publication)}
        </div>
        <Link href={`/collecteur/missions/${lot.id}`} className={styles.cta}>
          Voir la mission →
        </Link>
      </div>
    </div>
  );
}
