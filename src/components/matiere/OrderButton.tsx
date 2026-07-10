"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function OrderButton({ matiereId }: { matiereId: string }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleOrder = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch(`/api/matieres/${matiereId}/commander`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ volumeKg: 0 }),
      });
      const data = await res.json();

      if (res.ok) {
        setMessage(data.message ?? "Commande envoyée");
        setDone(true);
      } else {
        setError(data.error ?? "Commande échouée");
      }
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <span style={{ color: "var(--ec-signal)", fontSize: "var(--fs-label)" }}>
        ✓ {message}
      </span>
    );
  }

  return (
    <>
      {error && (
        <span style={{ color: "var(--ec-rust)", fontSize: "var(--fs-label)", display: "block", marginBottom: "0.4rem" }}>
          {error}
        </span>
      )}
      <Button variant="primary" onClick={handleOrder} disabled={loading}>
        {loading ? "Envoi..." : "Commander"}
      </Button>
    </>
  );
}