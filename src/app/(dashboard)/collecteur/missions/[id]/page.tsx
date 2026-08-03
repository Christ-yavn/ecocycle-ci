import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { AcceptMissionButton } from "@/components/collecteur/AcceptMissionButton";
import { DistanceBadge } from "@/components/collecteur/DistanceBadge";
import { TYPE_BADGE, formatAnciennete } from "@/components/collecteur/MissionCard";
import type { LotRow } from "@/types/database.types";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function MissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/collecteur/missions/${id}`);
  }

  const { data: lotRaw } = await supabase
    .from("lots")
    .select(
      "id, producteur_id, type_dechet, status, score_tri, volume_ia, weight_real, latitude, longitude, commune, quartier, adresse_texte, photo_url, note, disponibilite, date_publication",
    )
    .eq("id", id)
    .single();

  if (!lotRaw) {
    notFound();
  }

  const lot = lotRaw as unknown as LotRow;
  const type = TYPE_BADGE[lot.type_dechet] ?? TYPE_BADGE.inconnu;
  const poids = lot.weight_real ?? lot.volume_ia;
  const dejaPris = lot.status !== "publie";

  return (
    <>
      <div className="pageHead">
        <Link href="/collecteur/missions" className={styles.backLink}>
          ← Missions
        </Link>
        <div className="row">
          <Badge tone={type.tone}>{type.label}</Badge>
          <Badge tone="amber" dot>
            {formatAnciennete(lot.date_publication)}
          </Badge>
        </div>
        <h1>Détail de la mission</h1>
      </div>

      <Card elevated={false}>
        <div className={styles.detail}>
          {lot.photo_url ? (
            /* eslint-disable-next-line @next/next/no-img-element -- URL Supabase Storage dynamique */
            <img src={lot.photo_url} alt={type.label} className={styles.photo} />
          ) : (
            <div className={styles.photoPlaceholder}>📦</div>
          )}

          <div className={styles.info}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Type</span>
              <span className={styles.infoValue}>{type.label}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Poids estimé</span>
              <span className={styles.infoValue}>
                {poids != null ? `~${Math.round(poids)} kg` : "Non estimé"}
              </span>
            </div>
            {lot.score_tri != null && (
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Niveau de tri</span>
                <span className={styles.infoValue}>
                  {"★".repeat(lot.score_tri)}
                  {"☆".repeat(5 - lot.score_tri)}
                </span>
              </div>
            )}
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Localisation</span>
              <span className={styles.infoValue}>
                {[lot.quartier, lot.commune].filter(Boolean).join(", ") ||
                  lot.adresse_texte ||
                  "Abidjan"}
              </span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Distance</span>
              <span className={styles.infoValue}>
                <DistanceBadge
                  latitude={lot.latitude}
                  longitude={lot.longitude}
                />
              </span>
            </div>
            {lot.disponibilite && (
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Disponibilité</span>
                <span className={styles.infoValue}>
                  {lot.disponibilite.replace("|", " · ")}
                </span>
              </div>
            )}
            {lot.note && (
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Note</span>
                <span className={styles.infoValue}>{lot.note}</span>
              </div>
            )}
          </div>
        </div>
      </Card>

      <Card elevated={false}>
        {dejaPris ? (
          <p className="muted" style={{ margin: 0, textAlign: "center" }}>
            Ce lot n&apos;est plus disponible — il a déjà été réservé par un
            autre collecteur.
          </p>
        ) : (
          <AcceptMissionButton lotId={lot.id} />
        )}
      </Card>
    </>
  );
}
