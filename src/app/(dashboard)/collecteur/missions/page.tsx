import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { MissionCard } from "@/components/collecteur/MissionCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
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

export default async function CollecteurMissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ commune?: string }>;
}) {
  const { commune: filtreCommune } = await searchParams;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/collecteur/missions");
  }

  const { data: lotsRaw } = await supabase
    .from("lots")
    .select(
      "id, type_dechet, volume_ia, weight_real, commune, quartier, photo_url, date_publication",
    )
    .eq("status", "publie")
    .order("date_publication", { ascending: false });

  const lots = (lotsRaw ?? []) as unknown as MissionLot[];

  // Regrouper par commune
  const parCommune = new Map<string, MissionLot[]>();
  for (const lot of lots) {
    const key = lot.commune ?? "Autre";
    const list = parCommune.get(key) ?? [];
    list.push(lot);
    parCommune.set(key, list);
  }

  const communes = [...parCommune.keys()].sort();
  const communesAffichees = filtreCommune
    ? communes.filter((c) => c === filtreCommune)
    : communes;

  const total = lots.length;

  return (
    <>
      <div className="pageHead">
        <div className="row">
          <Badge tone="signal" dot>
            {total} mission{total > 1 ? "s" : ""}
          </Badge>
        </div>
        <h1>Missions disponibles</h1>
        <p className="muted">
          Les lots publiés par les producteurs, regroupés par commune.
        </p>
      </div>

      {/* Filtre par commune */}
      {communes.length > 0 && (
        <div className={styles.filters}>
          <Link
            href="/collecteur/missions"
            className={`${styles.chip} ${!filtreCommune ? styles.chipActive : ""}`}
          >
            Toutes ({total})
          </Link>
          {communes.map((c) => (
            <Link
              key={c}
              href={`/collecteur/missions?commune=${encodeURIComponent(c)}`}
              className={`${styles.chip} ${filtreCommune === c ? styles.chipActive : ""}`}
            >
              {c} ({parCommune.get(c)!.length})
            </Link>
          ))}
        </div>
      )}

      {total === 0 ? (
        <EmptyState icon="map" title="Aucune mission disponible">
          Les lots publiés par les producteurs apparaîtront ici dès
          qu&apos;ils seront en ligne.
        </EmptyState>
      ) : (
        communesAffichees.map((commune) => {
          const lotsCommune = parCommune.get(commune) ?? [];
          if (lotsCommune.length === 0) return null;
          return (
            <section key={commune} className={styles.zone}>
              <div className={styles.zoneHead}>
                <h2 className={styles.zoneTitle}>{commune}</h2>
                <span className={styles.zoneCount}>
                  {lotsCommune.length} lot{lotsCommune.length > 1 ? "s" : ""}
                </span>
              </div>
              <div className={styles.zoneGrid}>
                {lotsCommune.map((lot) => (
                  <MissionCard key={lot.id} lot={lot} />
                ))}
              </div>
            </section>
          );
        })
      )}
    </>
  );
}
