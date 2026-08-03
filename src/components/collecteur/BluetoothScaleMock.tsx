"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import styles from "./BluetoothScaleMock.module.css";

type ScaleState = "idle" | "searching" | "manual" | "submitting" | "done";

// Mockup visuel de pesée Bluetooth.
// N'appelle PAS l'API Web Bluetooth — mais le poids saisi manuellement
// est bien envoyé à la vraie API POST /api/lots/[id]/confirmer-collecte.
export function BluetoothScaleMock({
  lotId,
  volumeEstime,
}: {
  lotId: string;
  volumeEstime?: number | null;
}) {
  const router = useRouter();
  const [state, setState] = useState<ScaleState>("idle");
  const [poids, setPoids] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleConnect() {
    setError(null);
    setState("searching");
    // Simulation visuelle uniquement (2 s), puis saisie manuelle
    setTimeout(() => setState("manual"), 2000);
  }

  async function handleValidate() {
    setError(null);
    const poidsNum = parseFloat(poids.replace(",", "."));
    if (!poidsNum || poidsNum <= 0) {
      setError("Saisissez un poids valide (kg).");
      return;
    }

    setState("submitting");
    try {
      const res = await fetch(`/api/lots/${lotId}/confirmer-collecte`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ poidsReel: poidsNum }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error ?? "Validation échouée. Réessayez.");
        setState("manual");
        return;
      }

      setState("done");
      setTimeout(() => router.refresh(), 1500);
    } catch {
      setError("Erreur réseau. Réessayez.");
      setState("manual");
    }
  }

  if (state === "done") {
    return (
      <div className={styles.done}>
        <Icon name="check" size={18} />
        <span>Poids validé — lot marqué comme collecté.</span>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      {state === "idle" && (
        <button
          type="button"
          className={styles.connectBtn}
          onClick={handleConnect}
        >
          <Icon name="scale" size={18} />
          Connecter une balance
        </button>
      )}

      {state === "searching" && (
        <div className={styles.searching}>
          <span className={styles.spinner} />
          <span>Recherche d&apos;appareils Bluetooth…</span>
        </div>
      )}

      {(state === "manual" || state === "submitting") && (
        <div className={styles.manual}>
          <p className={styles.manualHint}>
            Aucune balance détectée. Saisissez le poids manuellement.
          </p>
          <div className={styles.manualRow}>
            <input
              type="text"
              inputMode="decimal"
              className={styles.input}
              placeholder={volumeEstime ? `~${volumeEstime}` : "Ex : 25"}
              aria-label="Poids en kg"
              value={poids}
              onChange={(e) => setPoids(e.target.value)}
              disabled={state === "submitting"}
            />
            <span className={styles.unit}>kg</span>
            <button
              type="button"
              className={styles.validateBtn}
              onClick={handleValidate}
              disabled={state === "submitting"}
            >
              {state === "submitting" ? (
                <span className={styles.spinnerLight} />
              ) : (
                "Valider le poids"
              )}
            </button>
          </div>
        </div>
      )}

      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
