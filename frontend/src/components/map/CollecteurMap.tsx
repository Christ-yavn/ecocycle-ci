"use client";

import { useState, useCallback, useEffect } from "react";
import { MapViewDynamic } from "./MapViewDynamic";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { MapLot } from "@/types/map";

// Ligne brute de la table lots (payload Realtime postgres_changes)
type LotRow = {
  id: string;
  type_dechet: MapLot["typeDechet"];
  status: string;
  score_tri: number | null;
  volume_ia: number | null;
  weight_real: number | null;
  latitude: number | null;
  longitude: number | null;
  commune: string | null;
  quartier: string | null;
  photo_url: string | null;
  disponibilite: string | null;
  date_publication: string | null;
  producteur_id: string;
};

function rowToMapLot(row: LotRow, producteurName: string | null): MapLot | null {
  if (row.latitude == null || row.longitude == null) return null;
  return {
    id: row.id,
    typeDechet: row.type_dechet,
    status: row.status,
    scoreTri: row.score_tri,
    volumeIa: row.volume_ia,
    weightReal: row.weight_real,
    latitude: row.latitude,
    longitude: row.longitude,
    commune: row.commune,
    quartier: row.quartier,
    photoUrl: row.photo_url,
    disponibilite: row.disponibilite,
    datePublication: row.date_publication ?? "",
    producteurName,
  };
}

export function CollecteurMap({
  lots: initialLots,
  reservedIds: initialReserved = [],
}: {
  lots: MapLot[];
  reservedIds?: string[];
}) {
  const [lots, setLots] = useState<MapLot[]>(initialLots);
  const [reservedIds, setReservedIds] = useState<string[]>(initialReserved);
  const [message, setMessage] = useState<string | null>(null);

  // --- Temps réel : la carte reflète instantanément les réservations ---
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    const channel = supabase
      .channel("lots-collecteur-map")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "lots" },
        (payload) => {
          const row = payload.new as LotRow;
          if (row.status !== "publie") {
            // Lot réservé/collecté (par moi ou un autre) → retiré de la carte
            setLots((prev) => prev.filter((l) => l.id !== row.id));
          } else {
            // Lot revenu en publication → ré-inséré
            setLots((prev) => {
              if (prev.some((l) => l.id === row.id)) return prev;
              const mapped = rowToMapLot(row, null);
              return mapped ? [mapped, ...prev] : prev;
            });
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "lots" },
        (payload) => {
          const row = payload.new as LotRow;
          if (row.status !== "publie") return;
          const mapped = rowToMapLot(row, null);
          if (!mapped) return;
          setLots((prev) =>
            prev.some((l) => l.id === row.id) ? prev : [mapped, ...prev],
          );
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "lots" },
        (payload) => {
          const old = payload.old as { id?: string };
          if (old.id) {
            setLots((prev) => prev.filter((l) => l.id !== old.id));
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleReserve = useCallback(async (lotId: string) => {
    setMessage(null);
    try {
      const res = await fetch(`/api/lots/${lotId}/reserver`, {
        method: "POST",
      });
      const data = await res.json();

      if (res.ok) {
        setReservedIds((prev) => [...prev, lotId]);
        setMessage("Lot réservé avec succès ! Le producteur sera notifié.");
      } else {
        setMessage(
          data.error ??
            "Réservation échouée. Le lot n'est peut-être plus disponible.",
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
            background:
              reservedIds.length > 0
                ? "rgba(63,163,77,0.15)"
                : "rgba(180,82,47,0.12)",
            color:
              reservedIds.length > 0 ? "var(--ec-signal)" : "var(--ec-rust)",
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
