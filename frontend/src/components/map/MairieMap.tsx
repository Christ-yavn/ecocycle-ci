"use client";

import { useState, useCallback, useEffect } from "react";
import { SignalementsMapDynamic } from "./SignalementsMapDynamic";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { SignalementMapItem } from "@/types/map";

type SignalementRow = {
  id: string;
  latitude: number | null;
  longitude: number | null;
  commune: string | null;
  quartier: string | null;
  description: string | null;
  photo_url: string | null;
  status: string;
  date_signalement: string;
};

function rowToItem(row: SignalementRow): SignalementMapItem | null {
  if (row.latitude == null || row.longitude == null) return null;
  return {
    id: row.id,
    latitude: row.latitude,
    longitude: row.longitude,
    commune: row.commune,
    quartier: row.quartier,
    description: row.description,
    photoUrl: row.photo_url,
    status: row.status,
    dateSignalement: row.date_signalement,
  };
}

export function MairieMap({
  signalements,
}: {
  signalements: SignalementMapItem[];
}) {
  const [items, setItems] = useState<SignalementMapItem[]>(signalements);
  const [message, setMessage] = useState<string | null>(null);

  // --- Temps réel : un dépôt signalé apparaît instantanément ---
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    const channel = supabase
      .channel("signalements-mairie-map")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "signalements" },
        (payload) => {
          const item = rowToItem(payload.new as SignalementRow);
          if (!item) return;
          setItems((prev) =>
            prev.some((s) => s.id === item.id) ? prev : [item, ...prev],
          );
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "signalements" },
        (payload) => {
          const item = rowToItem(payload.new as SignalementRow);
          if (!item) return;
          setItems((prev) =>
            prev.map((s) => (s.id === item.id ? item : s)),
          );
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "signalements" },
        (payload) => {
          const old = payload.old as { id?: string };
          if (old.id) {
            setItems((prev) => prev.filter((s) => s.id !== old.id));
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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
