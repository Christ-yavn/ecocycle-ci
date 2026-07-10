"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import styles from "./ConfirmationCollecte.module.css";

export function ConfirmationCollecte({
  lotId,
  typeDechet,
  poidsReel,
  collecteurName,
}: {
  lotId: string;
  typeDechet: string;
  poidsReel: number | null;
  collecteurName: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<"oui" | "non" | null>(null);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  async function confirmer(confirme: boolean) {
    setLoading(confirme ? "oui" : "non");
    setResult(null);

    try {
      const res = await fetch(`/api/lots/${lotId}/confirmer-producteur`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirme }),
      });
      const data = await res.json();

      setResult({
        success: res.ok,
        message: data.message ?? data.error ?? "Réponse enregistrée",
      });

      if (res.ok) {
        setTimeout(() => router.push("/producteur/lots"), 2500);
      }
    } catch {
      setResult({
        success: false,
        message: "Erreur réseau. Réessayez.",
      });
    }
    setLoading(null);
  }

  if (result) {
    return (
      <div className={styles.result}>
        <div
          className={styles.resultIcon}
          style={{
            background: result.success
              ? "rgba(63,163,77,0.15)"
              : "rgba(180,82,47,0.12)",
            color: result.success ? "var(--ec-signal)" : "var(--ec-rust)",
          }}
        >
          <Icon name={result.success ? "star" : "alert"} size={32} />
        </div>
        <h2 className="font-fraunces">{result.message}</h2>
        <p className="muted">Redirection vers vos lots…</p>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <Badge tone="amber" dot>
          Action requise
        </Badge>
        <h1 className="font-fraunces">Confirmer la collecte</h1>
      </div>

      <div className={styles.info}>
        <p>
          <strong>{collecteurName ?? "Un collecteur"}</strong> signale avoir
          collecté votre lot de <strong>{typeDechet}</strong>.
        </p>
        {poidsReel && (
          <p>
            Poids pesé par le collecteur :{" "}
            <strong>{poidsReel} kg</strong>
          </p>
        )}
        <p className="muted">
          Confirmez-vous que le collecteur est bien passé récupérer vos déchets ?
          Vos points seront crédités après confirmation.
        </p>
      </div>

      <div className={styles.actions}>
        <Button
          variant="primary"
          full
          disabled={loading !== null}
          onClick={() => confirmer(true)}
        >
          {loading === "oui" ? "Confirmation…" : "Oui, il est bien passé"}
        </Button>
        <Button
          variant="danger"
          full
          disabled={loading !== null}
          onClick={() => confirmer(false)}
        >
          {loading === "non" ? "Signalement…" : "Non, personne n'est venu"}
        </Button>
      </div>

      <p className={styles.delay}>
        En l&apos;absence de réponse sous 72h, la confirmation sera considérée
        comme tacite.
      </p>
    </div>
  );
}
