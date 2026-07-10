"use client";

import { useState, useCallback } from "react";
import { SignalementsMapDynamic } from "./SignalementsMapDynamic";
import type { SignalementMapItem } from "@/types/map";

export function MairieMap({
  signalements,
}: {
  signalements: SignalementMapItem[];
}) {
  const [items, setItems] = useState<SignalementMapItem[]>(signalements);
  const [message, setMessage] = useState<string | null>(null);

  const handleUpdate = useCallback(async (id: string, status: string) => {
    setMessage(null);
    try {
      const res = await fetch(`/api/signalements/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();

      if (res.ok) {
        setItems((prev) =>
          prev.map((s) => (s.id === id ? { ...s, status } : s)),
        );
        setMessage(
          status === "resolu"
            ? "Signalement marqué comme résolu."
            : "Signalement pris en charge.",
        );
      } else {
        setMessage(data.error ?? "Mise à jour échouée.");
      }
    } catch {
      setMessage("Erreur réseau.");
    }
  }, []);

  return (
    <>
      {message && (
        <div
          style={{
            background: "rgba(63,163,77,0.15)",
            color: "var(--ec-signal)",
            borderRadius: "var(--radius-sm)",
            padding: "0.6rem 0.8rem",
            fontSize: "var(--fs-body)",
            marginBottom: "var(--space-3)",
          }}
        >
          {message}
        </div>
      )}
      <div style={{ height: "50vh", minHeight: 350 }}>
        <SignalementsMapDynamic
          signalements={items}
          onUpdateStatus={handleUpdate}
        />
      </div>
    </>
  );
}
