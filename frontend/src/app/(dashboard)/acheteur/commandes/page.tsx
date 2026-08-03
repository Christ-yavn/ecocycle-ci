import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Stat } from "@/components/ui/Stat";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmAction } from "@/components/matiere/ConfirmAction";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function AcheteurCommandesPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/acheteur/commandes");

  const { data: profile } = await supabase
    .from("users")
    .select("role, name")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "acheteur") redirect("/login");

  // Matières commandées par cet acheteur (réservées)
  const { data: reservedMatieres } = await supabase
    .from("matiere_premiere")
    .select("id, type_matiere, volume_disponible_kg, grade, conditionnement, date_publication, recycleur_id")
    .eq("acheteur_id", user.id)
    .eq("status", "reservee")
    .order("date_publication", { ascending: false });

  // Récupérer les noms des recycleurs
  const recycleurIds = [...new Set((reservedMatieres ?? []).map((m) => m.recycleur_id).filter(Boolean))];
  const { data: recycleurs } = await supabase
    .from("users")
    .select("id, name, commune, phone")
    .in("id", recycleurIds);

  const recycleurMap = new Map((recycleurs ?? []).map((r) => [r.id, r]));

  // Vérifier le statut des confirmations couche_3
  const { data: confirmations } = await supabase
    .from("confirmations")
    .select("id, actor_a_confirmed, actor_b_confirmed, status, note")
    .eq("step", "couche_3")
    .eq("actor_b_id", user.id);

  const confMap = new Map(
    (confirmations ?? []).map((c) => {
      const matiereId = c.note?.replace("Commande matière: ", "");
      return [matiereId, c];
    }),
  );

  // Historique des matières achetées (vendues)
  const { data: vendues } = await supabase
    .from("matiere_premiere")
    .select("id, type_matiere, volume_disponible_kg, date_vente")
    .eq("acheteur_id", user.id)
    .eq("status", "vendue")
    .order("date_vente", { ascending: false })
    .limit(10);

  const reservedList = reservedMatieres ?? [];
  const venduesList = vendues ?? [];
  const totalAcheteKg = venduesList.reduce((sum, m) => sum + m.volume_disponible_kg, 0);

  return (
    <>
      <div className="pageHead">
        <div className="row">
          <Badge tone="signal" dot>
            Acheteur · {profile.name}
          </Badge>
        </div>
        <h1>Mes commandes</h1>
        <p className="muted">
          Suivez vos commandes de matières premières recyclées. Confirmez la réception pour finaliser la vente (double confirmation couche 3).
        </p>
      </div>

      <div className="grid-stats">
        <Stat label="Commandes en cours" value={reservedList.length} hint="À confirmer" />
        <Stat label="Achats finalisés" value={venduesList.length} />
        <Stat label="Volume acheté" value={Math.round(totalAcheteKg)} unit="kg" hint="Total" />
      </div>

      {reservedList.length === 0 ? (
        <EmptyState icon="order" title="Aucune commande en cours">
          Parcourez le catalogue et commandez une matière première recyclée. Vos commandes apparaîtront ici.
        </EmptyState>
      ) : (
        <div className={styles.grid}>
          {reservedList.map((m) => {
            const recycleur = m.recycleur_id ? recycleurMap.get(m.recycleur_id) : null;
            const conf = confMap.get(m.id);
            const alreadyConfirmed = conf?.actor_b_confirmed === true;
            const recycleurConfirmed = conf?.actor_a_confirmed === true;

            return (
              <Card key={m.id} elevated={false}>
                <div className={styles.head}>
                  <Badge tone="amber" dot>
                    En cours
                  </Badge>
                  <span className={styles.date}>
                    {new Date(m.date_publication).toLocaleDateString("fr-FR")}
                  </span>
                </div>
                <div className={styles.body}>
                  <span className={styles.type}>{m.type_matiere}</span>
                  <span className={styles.weight}>{Math.round(m.volume_disponible_kg)} kg</span>
                </div>
                {m.grade && <div className={styles.meta}>Grade : {m.grade}</div>}
                {m.conditionnement && <div className={styles.meta}>Conditionnement : {m.conditionnement}</div>}

                <div className={styles.recycleur}>
                  <strong>{recycleur?.name ?? "Recycleur"}</strong>
                  {recycleur?.commune && ` · ${recycleur.commune}`}
                  {recycleur?.phone && ` · ${recycleur.phone}`}
                </div>

                <div className={styles.confirmStatus}>
                  {recycleurConfirmed ? (
                    <span className={styles.confirmed}>✓ Recycleur a confirmé la livraison</span>
                  ) : (
                    <span className={styles.pending}>En attente de confirmation du recycleur</span>
                  )}
                </div>

                <div className={styles.action}>
                  {alreadyConfirmed ? (
                    <span className={styles.confirmed}>✓ Réception confirmée de votre côté</span>
                  ) : (
                    <ConfirmAction
                      matiereId={m.id}
                      action="confirmer-reception"
                      label="Confirmer la réception"
                      variant="primary"
                    />
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {venduesList.length > 0 && (
        <>
          <h3 style={{ marginTop: "var(--space-6)" }}>Historique des achats</h3>
          <Card title="Achats finalisés" elevated={false}>
            <div className={styles.historyList}>
              {venduesList.map((m) => (
                <div key={m.id} className={styles.historyRow}>
                  <span className={styles.type}>{m.type_matiere}</span>
                  <span className={styles.weight}>{Math.round(m.volume_disponible_kg)} kg</span>
                  <span className={styles.date}>
                    {m.date_vente ? new Date(m.date_vente).toLocaleDateString("fr-FR") : "—"}
                  </span>
                  <Badge tone="signal">Reçu</Badge>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </>
  );
}