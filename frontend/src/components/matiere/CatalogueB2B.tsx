"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { OrderButton } from "@/components/matiere/OrderButton";
import styles from "./CatalogueB2B.module.css";

export type MatiereItem = {
  id: string;
  typeMatiere: string;
  volumeKg: number;
  specifications: string | null;
  grade: string | null;
  conditionnement: string | null;
  datePublication: string;
  recycleurName: string | null;
  recycleurCommune: string | null;
  recycleurPhone: string | null;
};

type VolumeFilter = "tous" | "petit" | "moyen" | "gros";

const VOLUME_FILTERS: { value: VolumeFilter; label: string }[] = [
  { value: "tous", label: "Tous volumes" },
  { value: "petit", label: "< 100 kg" },
  { value: "moyen", label: "100 kg – 1 t" },
  { value: "gros", label: "> 1 t" },
];

function matchVolume(kg: number, filter: VolumeFilter): boolean {
  switch (filter) {
    case "petit":
      return kg < 100;
    case "moyen":
      return kg >= 100 && kg <= 1000;
    case "gros":
      return kg > 1000;
    default:
      return true;
  }
}

// Construit un numéro WhatsApp international (Côte d'Ivoire)
function toWhatsAppNumber(phone: string): string | null {
  let digits = phone.replace(/\D/g, "");
  if (digits.length === 0) return null;
  if (digits.startsWith("00225")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = `225${digits.slice(1)}`;
  if (!digits.startsWith("225")) digits = `225${digits}`;
  return digits.length >= 11 ? digits : null;
}

export function CatalogueB2B({ items }: { items: MatiereItem[] }) {
  const [typeFilter, setTypeFilter] = useState("tous");
  const [gradeFilter, setGradeFilter] = useState("tous");
  const [volumeFilter, setVolumeFilter] = useState<VolumeFilter>("tous");

  const types = useMemo(
    () => [...new Set(items.map((i) => i.typeMatiere))].sort(),
    [items],
  );
  const grades = useMemo(
    () =>
      [...new Set(items.map((i) => i.grade).filter((g): g is string => !!g))].sort(),
    [items],
  );

  const filtered = useMemo(
    () =>
      items.filter(
        (i) =>
          (typeFilter === "tous" || i.typeMatiere === typeFilter) &&
          (gradeFilter === "tous" || i.grade === gradeFilter) &&
          matchVolume(i.volumeKg, volumeFilter),
      ),
    [items, typeFilter, gradeFilter, volumeFilter],
  );

  const hasActiveFilter =
    typeFilter !== "tous" || gradeFilter !== "tous" || volumeFilter !== "tous";

  return (
    <>
      {/* Barre de filtres */}
      <div className={styles.filterBar}>
        <div className={styles.filterField}>
          <Icon name="filter" size={15} />
          <select
            className={styles.select}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            aria-label="Filtrer par matière"
          >
            <option value="tous">Toutes matières</option>
            {types.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filterField}>
          <select
            className={styles.select}
            value={volumeFilter}
            onChange={(e) => setVolumeFilter(e.target.value as VolumeFilter)}
            aria-label="Filtrer par volume"
          >
            {VOLUME_FILTERS.map((v) => (
              <option key={v.value} value={v.value}>
                {v.label}
              </option>
            ))}
          </select>
        </div>

        {grades.length > 0 && (
          <div className={styles.filterField}>
            <select
              className={styles.select}
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              aria-label="Filtrer par grade"
            >
              <option value="tous">Tous grades</option>
              {grades.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
        )}

        {hasActiveFilter && (
          <button
            type="button"
            className={styles.resetBtn}
            onClick={() => {
              setTypeFilter("tous");
              setGradeFilter("tous");
              setVolumeFilter("tous");
            }}
          >
            <Icon name="close" size={14} />
            Réinitialiser
          </button>
        )}

        <span className={styles.resultCount}>
          {filtered.length} offre(s)
        </span>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="catalog" title="Aucune offre ne correspond">
          Modifiez vos filtres pour élargir la recherche.
        </EmptyState>
      ) : (
        <div className={styles.grid}>
          {filtered.map((m) => {
            const waNumber = m.recycleurPhone
              ? toWhatsAppNumber(m.recycleurPhone)
              : null;
            const waMessage = encodeURIComponent(
              `Bonjour ${m.recycleurName ?? ""}, je suis intéressé par votre offre « ${m.typeMatiere} » (${Math.round(m.volumeKg)} kg) publiée sur EcoLoop CI.`,
            );

            return (
              <Card key={m.id} elevated={false}>
                <div className={styles.head}>
                  <Badge tone="forest" dot>
                    Disponible
                  </Badge>
                  <span className={styles.date}>
                    {new Date(m.datePublication).toLocaleDateString("fr-FR")}
                  </span>
                </div>
                <div className={styles.body}>
                  <span className={styles.type}>{m.typeMatiere}</span>
                  <span className={styles.weight}>
                    {Math.round(m.volumeKg)} kg
                  </span>
                </div>
                {m.grade && (
                  <div className={styles.meta}>Grade : {m.grade}</div>
                )}
                {m.conditionnement && (
                  <div className={styles.meta}>
                    Conditionnement : {m.conditionnement}
                  </div>
                )}
                {m.specifications && (
                  <div className={styles.specs}>{m.specifications}</div>
                )}

                <div className={styles.recycleur}>
                  <strong>{m.recycleurName ?? "Recycleur"}</strong>
                  {m.recycleurCommune && ` · ${m.recycleurCommune}`}
                </div>

                <div className={styles.actions}>
                  <OrderButton matiereId={m.id} />
                  {waNumber && (
                    <a
                      href={`https://wa.me/${waNumber}?text=${waMessage}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.waBtn}
                    >
                      <Icon name="phone" size={15} />
                      Contacter
                    </a>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
