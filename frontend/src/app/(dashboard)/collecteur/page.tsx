import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { MissionCard } from "@/components/collecteur/MissionCard";
import type { LotRow } from "@/types/database.types";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

type MissionLot = Pick<
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

export default async function CollecteurPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/collecteur");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role, name, commune")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "collecteur") {
    redirect("/login");
  }

  // Missions disponibles (toutes communes)
  const { data: lotsRaw } = await supabase
    .from("lots")
    .select(
      "id, type_dechet, volume_ia, weight_real, commune, quartier, photo_url, date_publication",
    )
    .eq("status", "publie")
    .order("date_publication", { ascending: false });

  const missions = (lotsRaw ?? []) as unknown as MissionLot[];
  const missionsCount = missions.length;
  const recentes = missions.slice(0, 3);

  // Stats : missions terminées ce mois + kg collectés
  const debutMois = new Date();
  debutMois.setDate(1);
  debutMois.setHours(0, 0, 0, 0);

  const { data: collectesRaw } = await supabase
    .from("lots")
    .select("id, weight_real, volume_ia, date_collecte")
    .eq("collecteur_id", user.id)
    .in("status", ["collecte", "livre_recycleur", "traite"])
    .gte("date_collecte", debutMois.toISOString());

  const collectes = collectesRaw ?? [];
  const missionsTerminees = collectes.length;
  const kgCollectes = collectes.reduce(
    (sum, l) => sum + (l.weight_real ?? l.volume_ia ?? 0),
    0,
  );

  return (
    <>
      <div className="pageHead">
        <h1>Bonjour, {profile.name} 👋</h1>
        <p className="muted">Prêt à faire la différence ?</p>
      </div>

      {/* Bannière alerte missions */}
      {missionsCount > 0 && (
        <Link href="/collecteur/missions" className={styles.banner}>
          <span className={styles.bannerIcon}>
            <Icon name="bell" size={20} />
          </span>
          <span className={styles.bannerText}>
            <strong>
              {missionsCount} nouvelle{missionsCount > 1 ? "s" : ""} mission
              {missionsCount > 1 ? "s" : ""} disponible
              {missionsCount > 1 ? "s" : ""}
            </strong>
            <span>des producteurs attendent un collecteur</span>
          </span>
          <span className={styles.bannerArrow}>→</span>
        </Link>
      )}

      {/* Dernières missions publiées */}
      {recentes.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>Dernières missions publiées</h2>
            <Link href="/collecteur/missions" className={styles.sectionLink}>
              Tout voir →
            </Link>
          </div>
          <div className={styles.missionsList}>
            {recentes.map((lot) => (
              <MissionCard key={lot.id} lot={lot} />
            ))}
          </div>
        </section>
      )}

      {/* Stats */}
      <div className={styles.statsRow}>
        <Card elevated={false}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{missionsTerminees}</span>
            <span className={styles.statLabel}>
              mission{missionsTerminees > 1 ? "s" : ""} terminée
              {missionsTerminees > 1 ? "s" : ""} ce mois
            </span>
          </div>
        </Card>
        <Card elevated={false}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{Math.round(kgCollectes)}</span>
            <span className={styles.statLabel}>kg collectés ce mois</span>
          </div>
        </Card>
      </div>
    </>
  );
}
