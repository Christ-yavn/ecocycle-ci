"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { LotPhotoUpload, type PhotoFile } from "./LotPhotoUpload";
import { IaResultCard } from "./IaResultCard";
import type { AnalyseIa } from "@/types/ia";
import type { TypeDechet } from "@/types/database.types";
import { analyzePhoto, compressAndUploadPhoto } from "@/lib/auth-actions";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import styles from "./LotStepper.module.css";

type Coords = { lat: number; lng: number };

// Mapping libellés IA (français) → enum type_dechet
const TYPE_MAP: Record<string, TypeDechet> = {
  Plastique: "plastique",
  Métal: "metal",
  Metal: "metal",
  Verre: "verre",
  "Papier / Carton": "papier_carton",
  Papier: "papier_carton",
  Carton: "papier_carton",
  Organique: "organique",
  Textile: "textile",
  Électronique: "electronique",
  Electronique: "electronique",
  Dangereux: "mixte",
  Résiduel: "mixte",
  Mixte: "mixte",
};

function mapType(typeDechet: string): TypeDechet {
  return TYPE_MAP[typeDechet] ?? "inconnu";
}

function getPosition(): Promise<Coords | null> {
  return new Promise((resolve) => {
    if (!("geolocation" in navigator)) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { timeout: 8000, maximumAge: 60_000 },
    );
  });
}

export function LotStepper({
  userId,
  commune,
  quartier,
}: {
  userId: string;
  commune?: string | null;
  quartier?: string | null;
}) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [photos, setPhotos] = useState<PhotoFile[]>([]);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [coords, setCoords] = useState<Coords | null>(null);
  const [iaResult, setIaResult] = useState<AnalyseIa | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);

  // Progression de l'étape 2 (3 lignes animées)
  const [idDone, setIdDone] = useState(false);
  const [locDone, setLocDone] = useState(false);
  const [qtyDone, setQtyDone] = useState(false);

  // ===== Étape 1 → 2 : upload photo puis lancement IA + géoloc =====
  async function handleContinue() {
    setError(null);
    if (photos.length === 0) {
      setError("Prenez une photo de votre lot pour continuer.");
      return;
    }

    const { url, error: upErr } = await compressAndUploadPhoto(
      photos[0].file,
      userId,
    );
    if (upErr || !url) {
      setError(`Upload de la photo impossible : ${upErr ?? "erreur inconnue"}`);
      return;
    }
    setPhotoUrl(url);

    // Étape 2 : lancer IA + géolocalisation en parallèle
    setStep(2);
    setIdDone(false);
    setLocDone(false);
    setQtyDone(false);

    const file = photos[0].file;

    const iaPromise = analyzePhoto(file)
      .then((result) => {
        setIaResult(result);
        setIdDone(true);
        // L'estimation de quantité provient du même appel IA
        setTimeout(() => setQtyDone(true), 500);
        return result;
      })
      .catch((e) => {
        setError(
          e instanceof Error ? e.message : "L'analyse IA a échoué. Réessayez.",
        );
        return null;
      });

    const geoPromise = getPosition().then((c) => {
      setCoords(c);
      setLocDone(true);
      return c;
    });

    const [ia] = await Promise.all([iaPromise, geoPromise]);

    if (!ia) {
      // Échec IA : retour à l'étape 1 avec le message d'erreur
      setStep(1);
      return;
    }

    // Transition automatique vers l'étape 3
    setTimeout(() => setStep(3), 700);
  }

  // ===== Étape 3 : publication réelle du lot =====
  async function handlePublish() {
    if (!iaResult || !photoUrl) return;
    setError(null);
    setPublishing(true);

    const { error: insertErr } = await supabase.from("lots").insert({
      producteur_id: userId,
      type_dechet: mapType(iaResult.typeDechet),
      status: "publie",
      score_tri: iaResult.scoreTri,
      volume_ia: iaResult.volumeIa,
      latitude: coords?.lat ?? null,
      longitude: coords?.lng ?? null,
      photo_url: photoUrl,
      commune: commune ?? null,
      quartier: quartier ?? null,
    });

    if (insertErr) {
      setError(`Publication échouée : ${insertErr.message}`);
      setPublishing(false);
      return;
    }

    setPublished(true);
    setTimeout(() => router.push("/producteur/lots"), 3000);
  }

  function handleModifier() {
    setStep(1);
    setIaResult(null);
    setPhotoUrl(null);
    setCoords(null);
    setError(null);
  }

  // ===== Écran de succès =====
  if (published) {
    return (
      <div className={styles.successWrap}>
        <div className={styles.successIcon}>
          <Icon name="check" size={32} />
        </div>
        <h2 className={styles.successTitle}>✓ Lot publié</h2>
        <p className={styles.successText}>
          Un collecteur sera prochainement informé. Vous recevrez une
          notification dès qu&apos;il acceptera votre mission.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.stepper}>
      {/* Stepper visuel */}
      <div className={styles.stepperHead}>
        <span className={styles.stepperLabel}>Étape {step} sur 3</span>
        <div className={styles.stepperTrack}>
          {[1, 2, 3].map((s) => (
            <span
              key={s}
              className={`${styles.stepDot} ${s <= step ? styles.stepDotActive : ""}`}
            />
          ))}
        </div>
      </div>

      {/* ===== ÉTAPE 1 : Photo ===== */}
      {step === 1 && (
        <div className={styles.stepBody}>
          <h1 className={styles.title}>Qu&apos;avez-vous à recycler ?</h1>
          <p className={styles.subtitle}>
            Prenez une photo claire de votre lot — l&apos;IA fait le reste.
          </p>

          <LotPhotoUpload onChange={setPhotos} maxPhotos={1} />

          {error && <p className={styles.error}>{error}</p>}

          <button
            type="button"
            className={styles.primaryBtn}
            onClick={handleContinue}
            disabled={photos.length === 0}
          >
            Continuer →
          </button>
        </div>
      )}

      {/* ===== ÉTAPE 2 : L'IA travaille ===== */}
      {step === 2 && (
        <div className={styles.stepBody}>
          <h1 className={styles.title}>L&apos;IA travaille</h1>
          <p className={styles.subtitle}>Quelques secondes suffisent…</p>

          <div className={styles.loadingList}>
            <div className={`${styles.loadingLine} ${idDone ? styles.loadingDone : ""}`}>
              <span className={styles.loadingIcon}>🍶</span>
              <span className={styles.loadingText}>Identification du déchet</span>
              {idDone ? (
                <span className={styles.loadingCheck}>
                  <Icon name="check" size={16} />
                </span>
              ) : (
                <span className={styles.spinner} />
              )}
            </div>
            <div className={`${styles.loadingLine} ${locDone ? styles.loadingDone : ""}`}>
              <span className={styles.loadingIcon}>📍</span>
              <span className={styles.loadingText}>Localisation</span>
              {locDone ? (
                <span className={styles.loadingCheck}>
                  <Icon name="check" size={16} />
                </span>
              ) : (
                <span className={styles.spinner} />
              )}
            </div>
            <div className={`${styles.loadingLine} ${qtyDone ? styles.loadingDone : ""}`}>
              <span className={styles.loadingIcon}>⚖️</span>
              <span className={styles.loadingText}>Estimation de la quantité</span>
              {qtyDone ? (
                <span className={styles.loadingCheck}>
                  <Icon name="check" size={16} />
                </span>
              ) : (
                <span className={styles.spinner} />
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== ÉTAPE 3 : Récapitulatif + publication ===== */}
      {step === 3 && iaResult && (
        <div className={styles.stepBody}>
          <h1 className={styles.title}>Votre lot 🍃</h1>

          <div className={styles.recap}>
            {/* eslint-disable-next-line @next/next/no-img-element -- URL Supabase Storage dynamique */}
            <img
              src={photoUrl ?? photos[0]?.preview}
              alt="Votre lot"
              className={styles.recapImg}
            />
            <div className={styles.recapInfo}>
              <span className={styles.recapType}>{iaResult.typeDechet}</span>
              <span className={styles.recapMeta}>
                ~{iaResult.volumeIa.toFixed(1)} kg estimés
              </span>
              <span className={styles.recapMeta}>
                📍{" "}
                {coords
                  ? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`
                  : [commune, quartier].filter(Boolean).join(" · ") ||
                    "Localisation non disponible"}
              </span>
            </div>
          </div>

          <IaResultCard result={iaResult} />

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={handleModifier}
              disabled={publishing}
            >
              Modifier
            </button>
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={handlePublish}
              disabled={publishing}
            >
              {publishing ? (
                <>
                  <span className={styles.spinnerLight} />
                  Publication…
                </>
              ) : (
                "Publier le lot"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
