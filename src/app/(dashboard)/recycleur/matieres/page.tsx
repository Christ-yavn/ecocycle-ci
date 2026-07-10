import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { MatiereForm } from "@/components/matiere/MatiereForm";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, { label: string; tone: "forest" | "amber" | "signal" | "rust" }> = {
  disponible: { label: "Disponible", tone: "forest" },
  reservee: { label: "Réservée", tone: "amber" },
  vendue: { label: "Vendue", tone: "signal" },
};

export default async function RecycleurMatieresPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/recycleur/matieres");

  const { data: profile } = await supabase
    .from("users")
    .select("role, name")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "recycleur") redirect("/login");

  const { data: matieres } = await supabase
    .from("matiere_premiere")
    .select("id, type_matiere, volume_disponible_kg, specifications, grade, conditionnement, status, date_publication, date_vente")
    .eq("recycleur_id", user.id)
    .order("date_publication", { ascending: false });

  const matiereList = matieres ?? [];

  return (
    <>
      <div className="pageHead">
        <div className="row">
          <Badge tone="signal" dot>
            Recycleur · {profile.name}
          </Badge>
        </div>
        <h1>Mes matières premières</h1>
        <p className="muted">
          Publiez les matières recyclées que vous produisez. Les acheteurs verront votre catalogue et pourront passer commande.
        </p>
      </div>

      <MatiereForm />

      {matiereList.length === 0 ? (
        <EmptyState icon="recycle" title="Aucune matière publiée">
          Cliquez sur « Publier une matière » ci-dessus pour ajouter votre première matière première recyclée.
        </EmptyState>
      ) : (
        <div className={styles.grid}>
          {matiereList.map((m) => {
            const statusInfo = STATUS_LABELS[m.status] ?? { label: m.status, tone: "forest" as const };
            return (
              <Card key={m.id} elevated={false}>
                <div className={styles.head}>
                  <Badge tone={statusInfo.tone} dot>
                    {statusInfo.label}
                  </Badge>
                  <span className={styles.date}>
                    {new Date(m.date_publication).toLocaleDateString("fr-FR")}
                  </span>
                </div>
                <div className={styles.body}>
                  <span className={styles.type}>{m.type_matiere}</span>
                  <span className={styles.weight}>{Math.round(m.volume_disponible_kg)} kg</span>
                </div>
                {m.grade && (
                  <div className={styles.meta}>Grade : {m.grade}</div>
                )}
                {m.conditionnement && (
                  <div className={styles.meta}>Conditionnement : {m.conditionnement}</div>
                )}
                {m.specifications && (
                  <div className={styles.specs}>{m.specifications}</div>
                )}
                {m.status === "vendue" && m.date_vente && (
                  <div className={styles.meta}>
                    Vendue le {new Date(m.date_vente).toLocaleDateString("fr-FR")}
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