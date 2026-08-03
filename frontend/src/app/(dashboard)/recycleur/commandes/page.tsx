import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Stat } from "@/components/ui/Stat";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmAction } from "@/components/matiere/ConfirmAction";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function RecycleurCommandesPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/recycleur/commandes");

  const { data: profile } = await supabase
    .from("users")
    .select("role, name")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "recycleur") redirect("/login");

  // Matières réservées par des acheteurs (en attente de confirmation livraison)
  const { data: reservedMatieres } = await supabase
    .from("matiere_premiere")
    .select("id, type_matiere, volume_disponible_kg, grade, conditionnement, date_publication, acheteur_id")
    .eq("recycleur_id", user.id)
    .eq("status", "reservee")
    .order("date_publication", { ascending: false });

  // Récupérer les noms des acheteurs
  const acheteurIds = [...new Set((reservedMatieres ?? []).map((m) => m.acheteur_id).filter(Boolean))];
  const { data: acheteurs } = await supabase
    .from("users")
    .select("id, name, commune, phone")
    .in("id", acheteurIds);

  const acheteurMap = new Map((acheteurs ?? []).map((a) => [a.id, a]));

  // Vérifier le statut de confirmation pour chaque matière
  const { data: confirmations } = await supabase
    .from("confirmations")
    .select("id, actor_a_confirmed, actor_b_confirmed, status, note")
    .eq("step", "couche_3")
    .in("actor_a_id", [user.id]);

  const confMap = new Map(
    (confirmations ?? []).map((c) => {
      const matiereId = c.note?.replace("Commande matière: ", "");
      return [matiereId, c];
    }),
  );

  // Matières déjà vendues (historique)
  const { data: vendues } = await supabase
    .from("matiere_premiere")
    .select("id, type_matiere, volume_disponible_kg, date_vente")
    .eq("recycleur_id", user.id)
    .eq("status", "vendue")
    .order("date_vente", { ascending: false })
    .limit(10);

  const reservedList = reservedMatieres ?? [];
  const venduesList = vendues ?? [];

  return (
    <>
      <div className="pageHead">
        <div className="row">
          <Badge tone="signal" dot>
            Recycleur · {profile.name}
          </Badge>
        </div>
        <h1>Commandes reçues</h1>
        <p className="muted">
          Les acheteurs ont commandé vos matières. Confirmez la livraison pour finaliser la vente (double confirmation couche 3).
        </p>
      </div>

      <div className="grid-stats">
        <Stat label="Commandes en cours" value={reservedList.length} hint="À confirmer" />
        <Stat label="Ventes finalisées" value={venduesList.length} hint="Historique" />
      </div>

      {reservedList.length === 0 ? (
        <EmptyState icon="order" title="Aucune commande en cours">
          Quand un acheteur commandera l{"'"}une de vos matières, elle apparaîtra ici. Vous devrez confirmer la livraison.
        </EmptyState>
      ) : (
        <div className={styles.grid}>
          {reservedList.map((m) => {
            const acheteur = m.acheteur_id ? acheteurMap.get(m.acheteur_id) : null;
            const conf = confMap.get(m.id);
            const alreadyConfirmed = conf?.actor_a_confirmed === true;
            const acheteurConfirmed = conf?.actor_b_confirmed === true;

            return (
              <Card key={m.id} elevated={false}>
                <div className={styles.head}>
                  <Badge tone="amber" dot>
                    Réservée
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

                <div className={styles.acheteur}>
                  <strong>{acheteur?.name ?? "Acheteur"}</strong>
                  {acheteur?.commune && ` · ${acheteur.commune}`}
                  {acheteur?.phone && ` · ${acheteur.phone}`}
                </div>

                <div className={styles.confirmStatus}>
                  {acheteurConfirmed ? (
                    <span className={styles.confirmed}>✓ Acheteur a confirmé la réception</span>
                  ) : (
                    <span className={styles.pending}>En attente de confirmation de l{"'"}acheteur</span>
                  )}
                </div>

                <div className={styles.action}>
                  {alreadyConfirmed ? (
                    <span className={styles.confirmed}>✓ Livraison confirmée de votre côté</span>
                  ) : (
                    <ConfirmAction
                      matiereId={m.id}
                      action="confirmer-livraison"
                      label="Confirmer la livraison"
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
          <h3 style={{ marginTop: "var(--space-6)" }}>Historique des ventes</h3>
          <Card title="Ventes finalisées" elevated={false}>
            <div className={styles.historyList}>
              {venduesList.map((m) => (
                <div key={m.id} className={styles.historyRow}>
                  <span className={styles.type}>{m.type_matiere}</span>
                  <span className={styles.weight}>{Math.round(m.volume_disponible_kg)} kg</span>
                  <span className={styles.date}>
                    {m.date_vente ? new Date(m.date_vente).toLocaleDateString("fr-FR") : "—"}
                  </span>
                  <Badge tone="signal">Vendue</Badge>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </>
  );
}