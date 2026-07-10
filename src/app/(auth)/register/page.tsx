"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signUp } from "@/lib/auth-actions";
import { ROLES, ROLE_LABELS, ROLE_ACCES_PAYANT, type Role } from "@/types/role";
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

const ROLE_DESCRIPTIONS: Record<Role, string> = {
  producteur: "Restaurants, hôtels, écoles — publiez vos lots",
  collecteur: "Collectez et livrez aux recycleurs",
  recycleur: "Transformez et vendez vos matières premières",
  acheteur: "Achetez des matières premières recyclées",
  mairie: "Supervisez la filière de votre commune",
  citoyen: "Signalez les dépôts sauvages",
};

const ROLE_ICONS: Record<Role, string> = {
  producteur: "🏠",
  collecteur: "🚚",
  recycleur: "♻️",
  acheteur: "🛒",
  mairie: "🏛️",
  citoyen: "👁️",
};

export default function RegisterPage() {
  const router = useRouter();

  const [role, setRole] = useState<Role>("producteur");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [commune, setCommune] = useState("");
  const [quartier, setQuartier] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error: authError } = await signUp(
      name,
      phone,
      password,
      role,
      commune || undefined,
      quartier || undefined,
    );

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    }
    setLoading(false);
  }

  if (success) {
    return (
      <div className={styles.successWrap}>
        <div className={styles.successIcon}>✓</div>
        <h2 className={styles.successTitle}>Compte créé avec succès !</h2>
        <p className={styles.successText}>
          Votre profil a été créé. Vous allez être redirigé vers la page de connexion.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className={styles.header}>
        <div className={styles.eyebrow}>Nouveau compte</div>
        <h1 className={styles.title}>Rejoignez EcoCycle CI</h1>
        <p className={styles.subtitle}>
          Choisissez votre profil et renseignez vos informations pour commencer.
        </p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label className={styles.label}>Votre profil</label>
          <div className={styles.roleGrid}>
            {ROLES.map((r) => (
              <button
                key={r}
                type="button"
                className={`${styles.roleCard} ${role === r ? styles.roleCardActive : ""}`}
                onClick={() => setRole(r)}
              >
                <span className={styles.roleIcon}>{ROLE_ICONS[r]}</span>
                <span className={styles.roleCardLabel}>{ROLE_LABELS[r]}</span>
                {ROLE_ACCES_PAYANT[r] && (
                  <span className={styles.roleBadge}>Pro</span>
                )}
              </button>
            ))}
          </div>
          <p className={styles.roleDesc}>{ROLE_DESCRIPTIONS[role]}</p>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="name">
            {role === "producteur" || role === "citoyen"
              ? "Prénom et nom"
              : "Raison sociale / Nom"}
          </label>
          <div className={styles.inputWrap}>
            <svg className={styles.inputIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 12a4 4 0 100-8 4 4 0 000 8zM4 20c0-4 4-6 8-6s8 2 8 6" />
            </svg>
            <input
              id="name"
              name="name"
              type="text"
              className={styles.input}
              placeholder="Ex : Awa Koné / EcoCollect SARL"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="phone">
            Téléphone
          </label>
          <div className={styles.inputWrap}>
            <svg className={styles.inputIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
            </svg>
            <input
              id="phone"
              name="phone"
              type="tel"
              className={styles.input}
              placeholder="+225 07 00 00 00 00"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="password">
            Mot de passe
          </label>
          <div className={styles.inputWrap}>
            <svg className={styles.inputIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="11" width="14" height="10" rx="2" />
              <path d="M8 11V7a4 4 0 018 0v4" />
            </svg>
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              className={styles.input}
              placeholder="Minimum 6 caractères"
              autoComplete="new-password"
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className={styles.togglePass}
              onClick={() => setShowPassword((s) => !s)}
              tabIndex={-1}
              aria-label="Afficher/masquer le mot de passe"
            >
              {showPassword ? "🙈" : "👁"}
            </button>
          </div>
        </div>

        <div className={styles.fieldRow}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="commune">
              Commune
            </label>
            <select
              id="commune"
              name="commune"
              className={styles.select}
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
            <label className={styles.label} htmlFor="quartier">
              Quartier
            </label>
            <input
              id="quartier"
              name="quartier"
              type="text"
              className={styles.input}
              placeholder="Angré, 220 Logements..."
              value={quartier}
              onChange={(e) => setQuartier(e.target.value)}
            />
          </div>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <button type="submit" className={styles.submitBtn} disabled={loading}>
          {loading ? (
            <>
              <span className={styles.spinner} />
              Création en cours…
            </>
          ) : (
            "Créer mon compte"
          )}
        </button>

        <div className={styles.notice}>
          {ROLE_ACCES_PAYANT[role]
            ? "Ce profil nécessite un abonnement payant. Vous pourrez souscrire après validation de votre compte."
            : "Ce profil est gratuit. Aucun abonnement requis."}
        </div>
      </form>

      <div className={styles.divider}>
        <span>ou</span>
      </div>

      <p className={styles.switch}>
        Déjà inscrit ?{" "}
        <Link href="/login" className={styles.switchLink}>
          Se connecter
        </Link>
      </p>
    </>
  );
}