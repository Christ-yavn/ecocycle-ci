"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import styles from "./AcceptMissionButton.module.css";

export function AcceptMissionButton({ lotId }: { lotId: string }) {
  const [loading, setLoading] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAccept() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/lots/${lotId}/reserver`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Réservation échouée. Réessayez.");
        setLoading(false);
        return;
      }
      setAccepted(true);
    } catch {
      setError("Erreur réseau. Réessayez.");
      setLoading(false);
    }
  }

  if (accepted) {
    return (
      <div className={styles.success}>
        <div className={styles.successIcon}>
          <Icon name="check" size={28} />
        </div>
        <h2 className={styles.successTitle}>✓ Mission acceptée</h2>
        <p className={styles.successText}>
          Le producteur a été informé. Présentez-vous sur place pour collecter
          le lot, puis confirmez la pesée.
        </p>
        <Link href="/collecteur/carte" className={styles.mapBtn}>
          Ouvrir la carte →
        </Link>
      </div>
    );
  }

  return (
    <>
      {error && <p className={styles.error}>{error}</p>}
      <button
        type="button"
        className={styles.acceptBtn}
        onClick={handleAccept}
        disabled={loading}
      >
        {loading ? (
          <>
            <span className={styles.spinner} />
            Réservation…
          </>
        ) : (
          "✓ Accepter la mission"
        )}
      </button>
    </>
  );
}
