"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function ConfirmAction({
  matiereId,
  action,
  label,
  variant = "primary",
}: {
  matiereId: string;
  action: "confirmer-livraison" | "confirmer-reception";
  label: string;
  variant?: "primary" | "accent" | "ghost";
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch(`/api/matieres/${matiereId}/${action}`, {
        method: "POST",
      });
      const data = await res.json();

      if (res.ok) {
        setMessage(data.message ?? "Confirmé");
        setDone(true);
        if (data.bothConfirmed) {
          window.location.reload();
        }
      } else {
        setError(data.error ?? "Échec");
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
      <Button variant={variant} onClick={handleConfirm} disabled={loading}>
        {loading ? "..." : label}
      </Button>
    </>
  );
}