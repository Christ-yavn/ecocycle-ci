"use client";

import { useEffect, useState } from "react";

// Distance à vol d'oiseau (Haversine) entre la position réelle du collecteur
// et le lot. Affichée uniquement si la géolocalisation est disponible.
export function DistanceBadge({
  latitude,
  longitude,
}: {
  latitude: number | null;
  longitude: number | null;
}) {
  const [distance, setDistance] = useState<number | null>(null);

  useEffect(() => {
    if (latitude == null || longitude == null) return;
    if (!("geolocation" in navigator)) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const d = haversineKm(
          pos.coords.latitude,
          pos.coords.longitude,
          latitude,
          longitude,
        );
        setDistance(d);
      },
      () => setDistance(null),
      { timeout: 8000, maximumAge: 60_000 },
    );
  }, [latitude, longitude]);

  if (distance == null) return null;

  return (
    <span>
      🧭 à {distance < 1 ? `${Math.round(distance * 1000)} m` : `${distance.toFixed(1)} km`} de vous
    </span>
  );
}

function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
