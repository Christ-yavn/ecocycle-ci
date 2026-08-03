"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  SOUS_ACTIVITE_LABELS,
  type SousActivite,
} from "@/types/role";
import styles from "./page.module.css";

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

const ROLE_OPTIONS = [
  { value: "collecteur", label: "Collecteur entreprise" },
  { value: "recycleur", label: "Recycleur" },
  { value: "acheteur", label: "Acheteur" },
  { value: "mairie", label: "Mairie" },
] as const;

type RoleAdmin = (typeof ROLE_OPTIONS)[number]["value"];

function formatPhone(value: string): string {
  // Tolère le collage au format international (+225 07...) → garde le national
  const digits = value.replace(/\D/g, "").replace(/^225/, "").slice(0, 10);
  return digits.replace(/(\d{2})(?=\d)/g, "$1 ").trim();
}

export default function AdminCreerComptePage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<RoleAdmin>("collecteur");
  const [sousActivite, setSousActivite] = useState<SousActivite>("mixte");
  const [commune, setCommune] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<string | null>(null);

  const avecSousActivite = role === "collecteur" || role === "recycleur";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setCreated(null);

    const digits = phone.replace(/\D/g, "");
    if (digits.length !== 10) {
      setError("Numéro à 10 chiffres requis (ex : 07 00 00 00 00).");
      return;
    }
    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/creer-compte", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: digits,
          password,
          role,
          commune: commune || undefined,
          sous_activite: avecSousActivite ? sousActivite : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error ?? "Création échouée. Réessayez.");
        setLoading(false);
        return;
      }

      setCreated(name.trim());
      setName("");
      setPhone("");
      setPassword("");
      setRole("collecteur");
      setCommune("");
      setLoading(false);
      setTimeout(() => router.refresh(), 500);
    } catch {
      setError("Erreur réseau. Réessayez.");
      setLoading(false);
    }
  }

  return (
    <>
      <div className="pageHead">
        <h1>Créer un compte</h1>
        <p className="muted">
          Créez un compte professionnel depuis le back-office. Le compte est
          actif immédiatement.
        </p>
      </div>

      {created && (
        <div className={styles.success}>
          ✓ Compte « {created} » créé avec succès. Il peut se connecter avec
          son numéro de téléphone.
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="name">
            Nom de l&apos;entité
          </label>
          <input
            id="name"
            type="text"
            className={styles.input}
            placeholder="Ex : EcoRecycle SARL, Mairie de Cocody…"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="phone">
            Téléphone
          </label>
          <div className={styles.phoneWrap}>
            <span className={styles.phonePrefix}>🇨🇮 +225</span>
            <input
              id="phone"
              type="tel"
              inputMode="numeric"
              className={styles.phoneInput}
              placeholder="07 00 00 00 00"
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
              required
            />
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="password">
            Mot de passe
          </label>
          <input
            id="password"
            type="text"
            className={styles.input}
            placeholder="Au moins 8 caractères"
            autoComplete="off"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div className={styles.fieldRow}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="role">
              Rôle
            </label>
            <select
              id="role"
              className={styles.input}
              value={role}
              onChange={(e) => setRole(e.target.value as RoleAdmin)}
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="commune">
              Commune
            </label>
            <select
              id="commune"
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
        </div>

        {avecSousActivite && (
          <div className={styles.field}>
            <label className={styles.label} htmlFor="sous_activite">
              Sous-activité
            </label>
            <select
              id="sous_activite"
              className={styles.input}
              value={sousActivite}
              onChange={(e) => setSousActivite(e.target.value as SousActivite)}
            >
              {(Object.keys(SOUS_ACTIVITE_LABELS) as SousActivite[]).map(
                (sa) => (
                  <option key={sa} value={sa}>
                    {SOUS_ACTIVITE_LABELS[sa]}
                  </option>
                ),
              )}
            </select>
          </div>
        )}

        {error && <div className={styles.error}>{error}</div>}

        <button type="submit" className={styles.submitBtn} disabled={loading}>
          {loading ? (
            <>
              <span className={styles.spinner} />
              Création en cours…
            </>
          ) : (
            "Créer le compte"
          )}
        </button>
      </form>
    </>
  );
}
