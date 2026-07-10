"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import styles from "./GeolocPicker.module.css";

export type Coords = {
  lat: number;
  lng: number;
};

export function GeolocPicker({
  onChange,
  defaultCoords,
}: {
  onChange: (coords: Coords | null) => void;
  defaultCoords?: Coords | null;
}) {
  const [coords, setCoords] = useState<Coords | null>(defaultCoords ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function getLocation() {
    setError(null);
    setLoading(true);

    if (!("geolocation" in navigator)) {
      setError("Géolocalisation non supportée par votre navigateur.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setCoords(c);
        onChange(c);
        setLoading(false);
      },
      (err) => {
        const messages: Record<number, string> = {
          1: "Permission refusée. Autorisez la géolocalisation ou saisissez manuellement.",
          2: "Position indisponible. Vérifiez votre GPS ou saisissez manuellement.",
          3: "Délai dépassé. Réessayez ou saisissez manuellement.",
        };
        setError(messages[err.code] ?? "Erreur de géolocalisation.");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.row}>
        <Button
          type="button"
          variant={coords ? "ghost" : "primary"}
          onClick={getLocation}
          disabled={loading}
        >
          <Icon name="map" size={18} />
          {loading ? "Localisation…" : coords ? "Re-localiser" : "Utiliser ma position"}
        </Button>

        {coords && (
          <span className={styles.coords}>
            {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
          </span>
        )}
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {coords && (
        <p className={styles.hint}>
          Position capturée. Le nom du quartier sera déterminé à la publication.
        </p>
      )}

      <div className={styles.manual}>
        <span className={styles.label}>Ou saisir manuellement :</span>
        <div className={styles.inputs}>
          <input
            type="number"
            step="any"
            placeholder="Latitude"
            className={styles.input}
            value={coords?.lat ?? ""}
            onChange={(e) => {
              const lat = parseFloat(e.target.value);
              if (!isNaN(lat) && coords) {
                const updated = { ...coords, lat };
                setCoords(updated);
                onChange(updated);
              } else if (!isNaN(lat)) {
                const updated = { lat, lng: coords?.lng ?? 0 };
                setCoords(updated);
                onChange(updated);
              }
            }}
          />
          <input
            type="number"
            step="any"
            placeholder="Longitude"
            className={styles.input}
            value={coords?.lng ?? ""}
            onChange={(e) => {
              const lng = parseFloat(e.target.value);
              if (!isNaN(lng) && coords) {
                const updated = { ...coords, lng };
                setCoords(updated);
                onChange(updated);
              } else if (!isNaN(lng)) {
                const updated = { lat: coords?.lat ?? 0, lng };
                setCoords(updated);
                onChange(updated);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
