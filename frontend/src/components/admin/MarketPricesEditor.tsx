"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import styles from "./MarketPricesEditor.module.css";

export type PriceItem = {
  id: string;
  typeMatiere: string;
  label: string;
  prixFcfaKg: number;
  updatedAt: string;
};

export function MarketPricesEditor({ items }: { items: PriceItem[] }) {
  const [prices, setPrices] = useState<Record<string, number>>(
    Object.fromEntries(items.map((i) => [i.typeMatiere, i.prixFcfaKg])),
  );
  const [saving, setSaving] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  async function handleSave(typeMatiere: string) {
    setError(null);
    setSaving(typeMatiere);

    try {
      const res = await fetch("/api/admin/prix", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          typeMatiere,
          prixFcfaKg: prices[typeMatiere],
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSavedAt((prev) => ({
          ...prev,
          [typeMatiere]: new Date().toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        }));
      } else {
        setError(data.error ?? "Échec de la mise à jour.");
      }
    } catch {
      setError("Erreur réseau. Réessayez.");
    }
    setSaving(null);
  }

  return (
    <Card elevated={false}>
      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.table}>
        <div className={styles.tableHead}>
          <span>Matière</span>
          <span>Prix (FCFA / kg)</span>
          <span>Action</span>
        </div>

        {items.map((item) => {
          const dirty = prices[item.typeMatiere] !== item.prixFcfaKg;
          const isSaving = saving === item.typeMatiere;
          const saved = savedAt[item.typeMatiere];

          return (
            <div key={item.id} className={styles.row}>
              <span className={styles.matiere}>{item.label}</span>

              <span className={styles.priceCell}>
                <input
                  type="number"
                  min={0}
                  step={5}
                  className={styles.priceInput}
                  value={prices[item.typeMatiere] ?? 0}
                  onChange={(e) =>
                    setPrices((prev) => ({
                      ...prev,
                      [item.typeMatiere]: Math.max(
                        0,
                        parseInt(e.target.value || "0", 10),
                      ),
                    }))
                  }
                />
                {saved && !dirty && (
                  <span className={styles.savedHint}>
                    <Icon name="check" size={13} /> {saved}
                  </span>
                )}
              </span>

              <span>
                <button
                  type="button"
                  className="btn-primary"
                  style={{
                    fontSize: "var(--fs-body)",
                    opacity: dirty ? 1 : 0.4,
                  }}
                  disabled={!dirty || isSaving}
                  onClick={() => handleSave(item.typeMatiere)}
                >
                  {isSaving ? "Enregistrement…" : "Enregistrer"}
                </button>
              </span>
            </div>
          );
        })}
      </div>

      <p className={styles.note}>
        <Icon name="shield" size={14} />
        Chaque modification est horodatée et tracée avec votre compte
        administrateur.
      </p>
    </Card>
  );
}
