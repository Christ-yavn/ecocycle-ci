"use client";

import { useState, useCallback } from "react";
import { MapViewDynamic } from "./MapViewDynamic";
import type { MapLot } from "@/types/map";

export function CollecteurMap({
  lots,
  reservedIds: initialReserved = [],
}: {
  lots: MapLot[];
  reservedIds?: string[];
}) {
  const [reservedIds, setReservedIds] = useState<string[]>(initialReserved);
  const [message, setMessage] = useState<string | null>(null);

  const handleReserve = useCallback(async (lotId: string) => {
    setMessage(null);
    try {
      const res = await fetch(`/api/lots/${lotId}/reserver`, {
        method: "POST",
      });
      const data = await res.json();

      if (res.ok) {
        setReservedIds((prev) => [...prev, lotId]);
        setMessage(`Lot réservé avec succès ! Le producteur sera notifié.`);
      } else {
        setMessage(
          data.error ?? "Réservation échouée. Le lot n'est peut-être plus disponible.",
        );
      }
    } catch {
      setMessage("Erreur réseau. Réessayez.");
    }
  }, []);

  return (
    <>
      {message && (
        <div
          style={{
            background: reservedIds.length > 0 ? "rgba(63,163,77,0.15)" : "rgba(180,82,47,0.12)",
            color: reservedIds.length > 0 ? "var(--ec-signal)" : "var(--ec-rust)",
            borderRadius: "var(--radius-sm)",
            padding: "0.6rem 0.8rem",
            fontSize: "var(--fs-body)",
          }}
        >
          {message}
        </div>
      )}
      <div style={{ height: "60vh", minHeight: 400 }}>
        <MapViewDynamic
          lots={lots}
          onReserve={handleReserve}
          reservedIds={reservedIds}
        />
      </div>
    </>
  );
}
