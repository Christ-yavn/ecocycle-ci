"use client";

import type { AnalyseIa } from "@/types/ia";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import styles from "./IaResultCard.module.css";

const STARS = [1, 2, 3, 4, 5] as const;

const TYPE_LABELS: Record<string, string> = {
  plastique: "Plastique",
  metal: "Métal",
  papier_carton: "Papier / Carton",
  verre: "Verre",
  organique: "Organique",
  electronique: "Électronique",
  textile: "Textile",
  mixte: "Mixte",
  inconnu: "Inconnu",
  papier: "Papier",
};

const ETAT_LABELS: Record<string, { label: string; tone: "signal" | "amber" | "rust" | "paper" }> = {
  propre: { label: "Propre", tone: "signal" },
  trie: { label: "Trié", tone: "signal" },
  melange: { label: "Mélangé", tone: "amber" },
  sale: { label: "Sale", tone: "rust" },
  inconnu: { label: "Indéterminé", tone: "paper" },
};

export function IaResultCard({ result }: { result: AnalyseIa }) {
  const typeLabel = TYPE_LABELS[result.typeDechet] ?? result.typeDechet;
  const etat = ETAT_LABELS[result.etat] ?? ETAT_LABELS.inconnu;
  const collectableTone = result.collectable ? "signal" : "rust";
  const collectableLabel = result.collectable
    ? "Acceptable pour la collecte"
    : "Refusé — tri insuffisant";

  return (
    <div className={styles.card}>
      <div className={styles.head}>
        <span className="font-mono" style={{ color: "var(--ec-ink-soft)" }}>
          Analyse IA — Résultats
        </span>
        {result.fallbackUsed && (
          <Badge tone="amber" dot>
            Mode secours
          </Badge>
        )}
      </div>

      <div className={styles.section}>
        <div className={styles.row}>
          <span className={styles.label}>Niveau de tri</span>
          <div className={styles.stars}>
            {STARS.map((s) => (
              <span
                key={s}
                className={`${styles.star} ${s <= result.scoreTri ? styles.starOn : ""}`}
              >
                <Icon name="star" size={18} />
              </span>
            ))}
          </div>
        </div>

        <div className={styles.row}>
          <span className={styles.label}>Type détecté</span>
          <Badge tone="forest">{typeLabel}</Badge>
        </div>

        <div className={styles.row}>
          <span className={styles.label}>État</span>
          <Badge tone={etat.tone} dot>
            {etat.label}
          </Badge>
        </div>

        <div className={styles.row}>
          <span className={styles.label}>Volume estimé</span>
          <span className={styles.value}>
            {result.volumeIa > 0
              ? `${result.volumeIa.toFixed(1)} kg`
              : "Non estimé"}
          </span>
        </div>

        <div className={styles.row}>
          <span className={styles.label}>Qualité globale</span>
          <span className={`${styles.value} ${result.collectable ? styles.ok : styles.bad}`}>
            {collectableLabel}
          </span>
        </div>
      </div>

      {result.recommandations.length > 0 && (
        <div className={styles.recos}>
          <div className={styles.label}>Recommandations</div>
          <ul className={styles.list}>
            {result.recommandations.map((r, i) => (
              <li key={i} className={styles.li}>
                <span className={styles.bullet}>→</span>
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className={styles.foot}>
        <Badge tone={collectableTone} dot>
          {result.collectable ? "Lot publiable" : "Lot à retrier"}
        </Badge>
        <span className={styles.confidence}>
          Score IA : {result.rawScoreQualite}/100
        </span>
      </div>
    </div>
  );
}
