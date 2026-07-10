import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
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

export default async function SuiviPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/citoyen/suivi");
  }

  const { data: signalements } = await supabase
    .from("signalements")
    .select(
      "id, commune, quartier, description, status, date_signalement, date_prise_en_charge, date_resolution",
    )
    .eq("citoyen_id", user.id)
    .order("date_signalement", { ascending: false });

  const list = signalements ?? [];

  return (
    <>
      <div className="pageHead">
        <h1>Mes signalements</h1>
        <p className="muted">
          Suivez le statut de vos signalements de dépôts sauvages.
        </p>
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon="alert"
          title="Aucun signalement"
          action={
            <a href="/citoyen" className="btn-primary">
              <Icon name="alert" size={16} />
              Signaler un dépôt sauvage
            </a>
          }
        >
          Photographiez un dépôt sauvage dans votre quartier et signalez-le à
          votre mairie.
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
                </div>
                {s.status === "pris_en_charge" && s.date_prise_en_charge && (
                  <div className={styles.update}>
                    Pris en charge par la mairie le{" "}
                    {new Date(s.date_prise_en_charge).toLocaleDateString("fr-FR")}
                  </div>
                )}
                {s.status === "resolu" && s.date_resolution && (
                  <div className={styles.resolu}>
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
