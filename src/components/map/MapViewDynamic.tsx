"use client";

import dynamic from "next/dynamic";
import type { MapLot } from "@/types/map";

// MapView doit être chargé côté client uniquement (Leaflet utilise window).
const MapViewClient = dynamic(
  () => import("./MapView").then((m) => m.MapView),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          width: "100%",
          height: "100%",
          minHeight: 400,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--ec-paper-2)",
          borderRadius: "var(--radius-card)",
          color: "var(--ec-ink-soft)",
          fontFamily: "var(--font-mono)",
        }}
      >
        Chargement de la carte…
      </div>
    ),
  },
);

export function MapViewDynamic(props: {
  lots: MapLot[];
  onReserve?: (lotId: string) => void;
  reservedIds?: string[];
}) {
  return <MapViewClient {...props} />;
}
