"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { LotPhotoUpload, type PhotoFile } from "./LotPhotoUpload";
import { GeolocPicker, type Coords } from "./GeolocPicker";
import { IaResultCard } from "./IaResultCard";
import type { AnalyseIa } from "@/types/ia";
import type { TypeDechet } from "@/types/database.types";
import { analyzePhoto, compressAndUploadPhoto } from "@/lib/auth-actions";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import styles from "./LotForm.module.css";

const TYPE_OPTIONS: { value: TypeDechet; label: string }[] = [
  { value: "plastique", label: "Plastique" },
  { value: "metal", label: "Métal" },
  { value: "papier_carton", label: "Papier / Carton" },
  { value: "verre", label: "Verre" },
  { value: "organique", label: "Organique" },
  { value: "electronique", label: "Électronique" },
  { value: "textile", label: "Textile" },
  { value: "mixte", label: "Mixte" },
];

const DISPONIBILITE_OPTIONS = [
  { value: "maintenant", label: "Maintenant" },
  { value: "demain", label: "Demain" },
  { value: "2-3_jours", label: "Dans 2-3 jours" },
];

const HORAIRES_OPTIONS = [
  { value: "matin", label: "Matin (6h-12h)" },
  { value: "apres-midi", label: "Après-midi (12h-18h)" },
  { value: "soir", label: "Soir (18h-22h)" },
];

type Step = "saisie" | "analyse" | "resultat" | "publication" | "publie";

export function LotForm({ userId }: { userId: string }) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [step, setStep] = useState<Step>("saisie");
  const [photos, setPhotos] = useState<PhotoFile[]>([]);
  const [coords, setCoords] = useState<Coords | null>(null);
  const [typeDechet, setTypeDechet] = useState<TypeDechet>("mixte");
  const [disponibilite, setDisponibilite] = useState("maintenant");
  const [horaire, setHoraire] = useState("matin");
  const [note, setNote] = useState("");
  const [iaResult, setIaResult] = useState<AnalyseIa | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);

  async function handleAnalyze(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (photos.length === 0) {
      setError("Veuillez prendre au moins une photo du lot.");
      return;
    }

    setStep("analyse");
    try {
      const result = await analyzePhoto(photos[0].file);
      setIaResult(result);

      // Pré-remplir le type si l'IA l'a détecté
      const matched = TYPE_OPTIONS.find(
        (t) =>
          t.value === result.typeDechet ||
          t.value === result.typeDechet.replace("-", "_"),
      );
      if (matched) setTypeDechet(matched.value);

      setStep("resultat");
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Erreur lors de l'analyse IA. Réessayez.",
      );
      setStep("saisie");
    }
  }

  async function handlePublish() {
    if (!iaResult) return;
    setError(null);
    setPublishing(true);

    try {
      // 1. Uploader la photo principale
      const { url, error: uploadErr } = await compressAndUploadPhoto(
        photos[0].file,
        userId,
      );

      if (uploadErr || !url) {
        setError(`Upload photo échoué : ${uploadErr}`);
        setPublishing(false);
        setStep("resultat");
        return;
      }

      // 2. Créer le lot en base
      const { data: lot, error: insertErr } = await supabase
        .from("lots")
        .insert({
          producteur_id: userId,
          type_dechet: typeDechet,
          status: "publie",
          score_tri: iaResult.scoreTri,
          volume_ia: iaResult.volumeIa,
          latitude: coords?.lat ?? null,
          longitude: coords?.lng ?? null,
          photo_url: url,
          disponibilite: `${disponibilite}|${horaire}`,
          note: note || null,
        })
        .select("id")
        .single();

      if (insertErr || !lot) {
        setError(`Création du lot échouée : ${insertErr?.message}`);
        setPublishing(false);
        setStep("resultat");
        return;
      }

      setStep("publie");
      setTimeout(() => router.push("/producteur/lots"), 2000);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Erreur lors de la publication.",
      );
      setPublishing(false);
      setStep("resultat");
    }
  }

  function handleRetrier() {
    setIaResult(null);
    setStep("saisie");
  }

  // --- Étape : Lot publié avec succès ---
  if (step === "publie") {
    return (
      <EmptyState icon="star" title="Lot publié avec succès !">
        Votre lot est maintenant visible par les collecteurs de votre zone.
        Vous serez notifié lorsqu&apos;un collecteur le réservera.
      </EmptyState>
    );
  }

  // --- Étape : Analyse IA en cours ---
  if (step === "analyse") {
    return (
      <div className={styles.loading}>
        <div className={styles.spinnerWrap}>
          <Icon name="recycle" size={40} />
        </div>
        <h2 className="font-fraunces">Analyse de votre lot en cours…</h2>
        <p className="muted">
          L&apos;IA analyse la photo pour déterminer le niveau de tri, le type
          de déchet et le volume estimé.
        </p>
      </div>
    );
  }

  // --- Étape : Résultat IA + publication ---
  if (step === "resultat" && iaResult) {
    return (
      <div className={styles.stack}>
        <IaResultCard result={iaResult} />

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handlePublish();
          }}
          className={styles.form}
        >
          <div className={styles.field}>
            <label className={styles.label}>Type de déchet (confirmé)</label>
            <select
              className={styles.input}
              value={typeDechet}
              onChange={(e) => setTypeDechet(e.target.value as TypeDechet)}
            >
              {TYPE_OPTIONS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Localisation</label>
            <GeolocPicker onChange={setCoords} />
          </div>

          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <label className={styles.label}>Disponibilité</label>
              <select
                className={styles.input}
                value={disponibilite}
                onChange={(e) => setDisponibilite(e.target.value)}
              >
                {DISPONIBILITE_OPTIONS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Plage horaire</label>
              <select
                className={styles.input}
                value={horaire}
                onChange={(e) => setHoraire(e.target.value)}
              >
                {HORAIRES_OPTIONS.map((h) => (
                  <option key={h.value} value={h.value}>
                    {h.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Note libre (optionnel, max 140)</label>
            <input
              type="text"
              maxLength={140}
              className={styles.input}
              placeholder="Ex : Lot au fond de la cour, sonner portail vert."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.actions}>
            <Button type="button" variant="ghost" onClick={handleRetrier}>
              <Icon name="close" size={16} />
              Retrier et rephotographier
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={publishing}
            >
              {publishing ? "Publication…" : "Confirmer et publier"}
            </Button>
          </div>
        </form>
      </div>
    );
  }

  // --- Étape : Saisie initiale (photos + analyse) ---
  return (
    <form onSubmit={handleAnalyze} className={styles.form}>
      <div className={styles.field}>
        <label className={styles.label}>Photos du lot (1 à 3)</label>
        <LotPhotoUpload onChange={setPhotos} />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Type de déchet (optionnel)</label>
        <select
          className={styles.input}
          value={typeDechet}
          onChange={(e) => setTypeDechet(e.target.value as TypeDechet)}
        >
          {TYPE_OPTIONS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <p className={styles.hint}>
          L&apos;IA déterminera automatiquement le type depuis la photo. Cette
          indication sert de contrôle croisé.
        </p>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <Button type="submit" full variant="accent" disabled={photos.length === 0}>
        <Icon name="star" size={18} />
        Analyser mon lot avec l&apos;IA
      </Button>
    </form>
  );
}
