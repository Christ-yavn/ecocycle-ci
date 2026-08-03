"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { Icon } from "@/components/ui/Icon";
import styles from "./LotPhotoUpload.module.css";

export type PhotoFile = {
  file: File;
  preview: string;
};

export function LotPhotoUpload({
  onChange,
  maxPhotos = 3,
}: {
  onChange: (photos: PhotoFile[]) => void;
  maxPhotos?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<PhotoFile[]>([]);
  const [error, setError] = useState<string | null>(null);

  function handleFiles(e: ChangeEvent<HTMLInputElement>) {
    setError(null);
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    const remaining = maxPhotos - photos.length;
    if (remaining <= 0) {
      setError(`Maximum ${maxPhotos} photos autorisées.`);
      return;
    }

    const toAdd = files.slice(0, remaining);
    const newPhotos: PhotoFile[] = [];

    for (const f of toAdd) {
      if (!f.type.startsWith("image/")) {
        setError("Veuillez sélectionner des images uniquement.");
        continue;
      }
      if (f.size > 10 * 1024 * 1024) {
        setError("Chaque image doit faire moins de 10 Mo.");
        continue;
      }
      newPhotos.push({ file: f, preview: URL.createObjectURL(f) });
    }

    const updated = [...photos, ...newPhotos];
    setPhotos(updated);
    onChange(updated);
  }

  function removePhoto(idx: number) {
    const updated = photos.filter((_, i) => i !== idx);
    setPhotos(updated);
    onChange(updated);
    setError(null);
  }

  function triggerInput() {
    inputRef.current?.click();
  }

  return (
    <div className={styles.wrap}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        capture="environment"
        onChange={handleFiles}
        className={styles.input}
        aria-label="Photos du lot"
      />

      <div className={styles.grid}>
        {photos.map((p, i) => (
          <div key={i} className={styles.thumb}>
            {/* eslint-disable-next-line @next/next/no-img-element -- blob URL preview, next/image ne gère pas les blob sans loader custom */}
            <img src={p.preview} alt={`Photo ${i + 1}`} className={styles.img} />
            <button
              type="button"
              onClick={() => removePhoto(i)}
              className={styles.remove}
              aria-label="Supprimer cette photo"
            >
              <Icon name="close" size={16} />
            </button>
          </div>
        ))}

        {photos.length < maxPhotos && (
          <button type="button" onClick={triggerInput} className={styles.addBtn}>
            <Icon name="plus" size={24} />
            <span>{photos.length === 0 ? "Prendre une photo" : "Ajouter"}</span>
          </button>
        )}
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {photos.length > 0 && (
        <p className={styles.hint}>
          {photos.length}/{maxPhotos} photo(s) — Cliquez sur une photo pour la
          supprimer.
        </p>
      )}
    </div>
  );
}
