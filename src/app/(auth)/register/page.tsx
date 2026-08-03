"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signUp } from "@/lib/auth-actions";
import styles from "./page.module.css";

type RoleInscription = "producteur" | "collecteur";

function formatPhone(value: string): string {
  // Tolère le collage au format international (+225 07...) → garde le national
  const digits = value.replace(/\D/g, "").replace(/^225/, "").slice(0, 10);
  return digits.replace(/(\d{2})(?=\d)/g, "$1 ").trim();
}

export default function RegisterPage() {
  const router = useRouter();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<RoleInscription>("producteur");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  function goToStep2(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("Veuillez renseigner votre nom.");
      return;
    }
    setStep(2);
  }

  function goToStep3(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const digits = phone.replace(/\D/g, "");
    if (digits.length !== 10) {
      setError("Veuillez saisir un numéro à 10 chiffres (ex : 07 00 00 00 00).");
      return;
    }
    setStep(3);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    const { data, error: authError } = await signUp(
      name.trim(),
      phone.replace(/\D/g, ""),
      password,
      role,
    );
    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    if (data.user) {
      setSuccess(true);
    }
  }

  if (success) {
    return (
      <div className={styles.successWrap}>
        <div className={styles.successIcon}>🎉</div>
        <h2 className={styles.successTitle}>Compte créé</h2>
        <p className={styles.successText}>Bienvenue, {name}</p>
        <button
          type="button"
          className={styles.submitBtn}
          onClick={() => router.push("/login")}
        >
          Accéder à mon espace →
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Stepper */}
      <div className={styles.stepper} aria-label={`Étape ${step} sur 3`}>
        <div className={styles.stepperLabel}>Étape {step} sur 3</div>
        <div className={styles.stepperTrack}>
          {[1, 2, 3].map((s) => (
            <span
              key={s}
              className={`${styles.stepDot} ${s <= step ? styles.stepDotActive : ""}`}
            />
          ))}
        </div>
      </div>

      {/* ===== ÉTAPE 1 : Identité + rôle ===== */}
      {step === 1 && (
        <form onSubmit={goToStep2} className={styles.form}>
          <div className={styles.header}>
            <h1 className={styles.title}>Comment vous appelez-vous ?</h1>
            <p className={styles.subtitle}>
              Dites-nous qui vous êtes et ce que vous souhaitez faire.
            </p>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="name">
              Nom / Prénom
            </label>
            <input
              id="name"
              name="name"
              type="text"
              className={styles.inputPlain}
              placeholder="Ex : Awa Koné"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Vous êtes</span>
            <div className={styles.roleGrid}>
              <button
                type="button"
                className={`${styles.roleCard} ${role === "producteur" ? styles.roleCardActive : ""}`}
                onClick={() => setRole("producteur")}
              >
                <span className={styles.roleIcon}>🏠</span>
                <span className={styles.roleCardLabel}>Ménage / Producteur</span>
                <span className={styles.roleDesc}>
                  Je publie mes déchets triés et je gagne des points
                </span>
              </button>
              <button
                type="button"
                className={`${styles.roleCard} ${role === "collecteur" ? styles.roleCardActive : ""}`}
                onClick={() => setRole("collecteur")}
              >
                <span className={styles.roleIcon}>🚛</span>
                <span className={styles.roleCardLabel}>Collecteur informel</span>
                <span className={styles.roleDesc}>
                  Je collecte les lots près de chez moi
                </span>
              </button>
            </div>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button type="submit" className={styles.submitBtn}>
            Continuer →
          </button>
        </form>
      )}

      {/* ===== ÉTAPE 2 : Téléphone ===== */}
      {step === 2 && (
        <form onSubmit={goToStep3} className={styles.form}>
          <div className={styles.header}>
            <h1 className={styles.title}>Votre numéro de téléphone</h1>
            <p className={styles.subtitle}>
              Il servira d{"'"}identifiant de connexion.
            </p>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="phone">
              Numéro de téléphone
            </label>
            <div className={styles.phoneWrap}>
              <span className={styles.phonePrefix}>🇨🇮 +225</span>
              <input
                id="phone"
                name="phone"
                type="tel"
                inputMode="numeric"
                className={styles.phoneInput}
                placeholder="07 00 00 00 00"
                autoComplete="tel-national"
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                required
              />
            </div>
            <p className={styles.secureNote}>🔒 Votre numéro est sécurisé</p>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button type="submit" className={styles.submitBtn}>
            Continuer →
          </button>
          <button
            type="button"
            className={styles.backBtn}
            onClick={() => setStep(1)}
          >
            ← Retour
          </button>
        </form>
      )}

      {/* ===== ÉTAPE 3 : Mot de passe ===== */}
      {step === 3 && (
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.header}>
            <h1 className={styles.title}>Créez votre mot de passe</h1>
            <p className={styles.subtitle}>
              Dernière étape avant de rejoindre EcoLoop.
            </p>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">
              Mot de passe
            </label>
            <div className={styles.inputWrap}>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                className={styles.inputPlain}
                placeholder="••••••••"
                autoComplete="new-password"
                minLength={8}
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
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
            <p className={styles.secureNote}>🛡️ Au moins 8 caractères</p>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="confirmPassword">
              Confirmez le mot de passe
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showPassword ? "text" : "password"}
              className={styles.inputPlain}
              placeholder="••••••••"
              autoComplete="new-password"
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? (
              <>
                <span className={styles.spinner} />
                Création en cours…
              </>
            ) : (
              "Créer mon compte →"
            )}
          </button>
          <button
            type="button"
            className={styles.backBtn}
            onClick={() => setStep(2)}
          >
            ← Retour
          </button>
        </form>
      )}

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
