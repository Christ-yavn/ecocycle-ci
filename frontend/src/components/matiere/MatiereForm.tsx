"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import styles from "./MatiereForm.module.css";

export function MatiereForm() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const formData = new FormData(e.currentTarget);
    const payload = {
      typeMatiere: formData.get("typeMatiere") as string,
      volumeKg: parseFloat(formData.get("volumeKg") as string),
      specifications: formData.get("specifications") as string,
      grade: formData.get("grade") as string,
      conditionnement: formData.get("conditionnement") as string,
    };

    try {
      const res = await fetch("/api/matieres", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok) {
        setMessage("Matière première publiée avec succès !");
        setOpen(false);
        window.location.reload();
      } else {
        setError(data.error ?? "Publication échouée");
      }
    } catch {
      setError("Erreur réseau. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <Button variant="primary" onClick={() => setOpen(true)}>
        + Publier une matière
      </Button>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {error && <div className={styles.error}>{error}</div>}
      {message && <div className={styles.success}>{message}</div>}

      <div className={styles.field}>
        <label htmlFor="typeMatiere">Type de matière *</label>
        <select id="typeMatiere" name="typeMatiere" required>
          <option value="">Sélectionner...</option>
          <option value="plastique_pet">Plastique PET</option>
          <option value="plastique_pehd">Plastique PE-HD</option>
          <option value="metal_fer">Métal ferreux</option>
          <option value="metal_nonfer">Métal non-ferreux</option>
          <option value="papier">Papier</option>
          <option value="carton">Carton</option>
          <option value="verre">Verre</option>
          <option value="composte">Composte</option>
          <option value="bois">Bois</option>
          <option value="textile">Textile</option>
        </select>
      </div>

      <div className={styles.field}>
        <label htmlFor="volumeKg">Volume disponible (kg) *</label>
        <input
          id="volumeKg"
          name="volumeKg"
          type="number"
          min="1"
          step="0.5"
          required
          placeholder="ex: 500"
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="grade">Grade / Qualité</label>
        <input
          id="grade"
          name="grade"
          type="text"
          placeholder="ex: Grade A, Premium, Standard..."
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="conditionnement">Conditionnement</label>
        <select id="conditionnement" name="conditionnement">
          <option value="">Sélectionner...</option>
          <option value="vrac">Vrac</option>
          <option value="balles">Balles</option>
          <option value="sacs_50kg">Sacs 50kg</option>
          <option value="big_bag">Big Bag</option>
          <option value="futs">Fûts</option>
        </select>
      </div>

      <div className={styles.field}>
        <label htmlFor="specifications">Spécifications / Notes</label>
        <textarea
          id="specifications"
          name="specifications"
          rows={3}
          placeholder="Détails sur la pureté, le traitement, l'origine..."
        />
      </div>

      <div className={styles.actions}>
        <Button variant="primary" disabled={loading}>
          {loading ? "Publication..." : "Publier"}
        </Button>
        <Button variant="ghost" onClick={() => setOpen(false)}>
          Annuler
        </Button>
      </div>
    </form>
  );
}