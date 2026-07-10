"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { LotPhotoUpload, type PhotoFile } from "@/components/lot/LotPhotoUpload";
import { GeolocPicker, type Coords } from "@/components/lot/GeolocPicker";
import { compressAndUploadPhoto } from "@/lib/auth-actions";
import styles from "./SignalementForm.module.css";

const COMMUNES_ABIDJAN = [
  "Abobo",
  "Adjamé",
  "Attécoubé",
  "Cocody",
  "Koumassi",
  "Marcory",
  "Plateau",
  "Port-Bouët",
  "Treichville",
  "Yopougon",
];

export function SignalementForm({ userId }: { userId: string }) {
  const router = useRouter();
  const [photos, setPhotos] = useState<PhotoFile[]>([]);
  const [coords, setCoords] = useState<Coords | null>(null);
  const [description, setDescription] = useState("");
  const [commune, setCommune] = useState("");
  const [quartier, setQuartier] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!coords) {
      setError("Veuillez activer la géolocalisation ou saisir manuellement.");
      return;
    }

    setLoading(true);

    try {
      let photoUrl: string | null = null;
      if (photos.length > 0) {
        const { url, error: upErr } = await compressAndUploadPhoto(
          photos[0].file,
          userId,
        );
        if (upErr || !url) {
          setError(`Upload photo : ${upErr}`);
          setLoading(false);
          return;
        }
        photoUrl = url;
      }

      const res = await fetch("/api/signalements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: coords.lat,
          longitude: coords.lng,
          description: description || null,
          photoUrl,
          commune: commune || null,
          quartier: quartier || null,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push("/citoyen/suivi"), 2000);
      } else {
        setError(data.error ?? "Signalement échoué.");
      }
    } catch {
      setError("Erreur réseau. Réessayez.");
    }
    setLoading(false);
  }

  if (success) {
    return (
      <div className={styles.success}>
        <div className={styles.successIcon}>
          <Icon name="star" size={32} />
        </div>
        <h2 className="font-fraunces">Signalement envoyé !</h2>
        <p className="muted">
          Votre mairie a été notifiée. Vous recevrez une notification quand le
          signalement sera pris en charge.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.field}>
        <label className={styles.label}>Photo du dépôt sauvage (optionnel)</label>
        <LotPhotoUpload onChange={setPhotos} maxPhotos={1} />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Localisation GPS</label>
        <GeolocPicker onChange={setCoords} />
      </div>

      <div className={styles.fieldRow}>
        <div className={styles.field}>
          <label className={styles.label}>Commune</label>
          <select
            className={styles.input}
            value={commune}
            onChange={(e) => setCommune(e.target.value)}
          >
            <option value="">— Sélectionner —</option>
            {COMMUNES_ABIDJAN.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Quartier (optionnel)</label>
          <input
            type="text"
            className={styles.input}
            placeholder="Ex : Angré"
            value={quartier}
            onChange={(e) => setQuartier(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Description (optionnel)</label>
        <textarea
          className={styles.textarea}
          placeholder="Ex : Dépôt depuis 3 jours, tas de déchets ménagers, pneus dans le caniveau…"
          maxLength={300}
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <Button type="submit" full variant="accent" disabled={loading}>
        <Icon name="alert" size={18} />
        {loading ? "Envoi…" : "Signaler ce dépôt sauvage"}
      </Button>
    </form>
  );
}
