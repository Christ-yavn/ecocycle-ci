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
  { label: string; tone: "rust" | "amber" | "signal" | "paper" }
> = {
  nouveau: { label: "Nouveau", tone: "rust" },
  pris_en_charge: { label: "Pris en charge", tone: "amber" },
  resolu: { label: "Résolu", tone: "signal" },
};

export default async function AlertesPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/mairie/alertes");
  }

  const { data: signalements } = await supabase
    .from("signalements")
    .select(
      "id, latitude, longitude, commune, quartier, description, photo_url, status, date_signalement, date_prise_en_charge, date_resolution",
    )
    .order("date_signalement", { ascending: false });

  const list = signalements ?? [];
  const nouveau = list.filter((s) => s.status === "nouveau").length;
  const enCours = list.filter((s) => s.status === "pris_en_charge").length;
  const resolu = list.filter((s) => s.status === "resolu").length;

  // Temps moyen de résolution
  const resolus = list.filter(
    (s) => s.status === "resolu" && s.date_resolution && s.date_signalement,
  );
  let tempsMoyenHeures = "—";
  if (resolus.length > 0) {
    const totalMs = resolus.reduce((sum, s) => {
      const diff =
        new Date(s.date_resolution!).getTime() -
        new Date(s.date_signalement).getTime();
      return sum + diff;
    }, 0);
    const avgHours = totalMs / resolus.length / (1000 * 60 * 60);
    tempsMoyenHeures = avgHours < 24
      ? `${Math.round(avgHours)} h`
      : `${Math.round(avgHours / 24)} j`;
  }

  return (
    <>
      <div className="pageHead">
        <h1>Dépôts sauvages signalés</h1>
        <p className="muted">
          Signalements citoyens sur votre commune. Cliquez sur un signalement
          pour le prendre en charge ou le marquer comme résolu (depuis la carte
          du tableau de bord).
        </p>
      </div>

      <div className="grid-stats">
        <Stat label="Nouveaux" value={nouveau} hint="À traiter" />
        <Stat label="En cours" value={enCours} hint="Pris en charge" />
        <Stat label="Résolus" value={resolu} hint="Ce mois" />
        <Stat label="Temps moyen" value={tempsMoyenHeures} hint="Résolution" />
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon="alert"
          title="Aucun signalement"
        >
          Aucun dépôt sauvage n&apos;a été signalé sur votre commune pour le
          moment. Les citoyens peuvent signaler via l&apos;espace citoyen.
        </EmptyState>
      ) : (
        <div className={styles.grid}>
          {list.map((s) => {
            const st = STATUS_CONFIG[s.status] ?? STATUS_CONFIG.nouveau;
            return (
              <Card key={s.id} elevated={false}>
                <div className={styles.head}>
                  <Badge tone={st.tone} dot>
                    {st.label}
                  </Badge>
                  <span className={styles.date}>
                    {new Date(s.date_signalement).toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                {s.description && (
                  <p className={styles.desc}>{s.description}</p>
                )}
                <div className={styles.meta}>
                  {s.commune && (
                    <span>
                      <Icon name="map" size={14} /> {s.commune}
                      {s.quartier ? ` · ${s.quartier}` : ""}
                    </span>
                  )}
                  {s.latitude && s.longitude && (
                    <span className={styles.coords}>
                      {s.latitude.toFixed(4)}, {s.longitude.toFixed(4)}
                    </span>
                  )}
                </div>
                {s.date_resolution && (
                  <div className={styles.resolution}>
                    Résolu le{" "}
                    {new Date(s.date_resolution).toLocaleDateString("fr-FR")}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
