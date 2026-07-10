"use client";

import { useState, Suspense, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "@/lib/auth-actions";
import styles from "./page.module.css";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = params.get("redirect") ?? null;

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error: authError } = await signIn(
      identifier.trim(),
      password,
    );

    if (authError) {
      setError("Identifiants incorrects. Vérifiez votre email/téléphone et mot de passe.");
      setLoading(false);
      return;
    }

    if (data.user) {
      if (redirectTo) {
        window.location.href = redirectTo;
      } else {
        window.location.href = "/";
      }
    }
    setLoading(false);
  }

  return (
    <>
      <div className={styles.header}>
        <div className={styles.eyebrow}>Bon retour</div>
        <h1 className={styles.title}>Connexion à votre espace</h1>
        <p className={styles.subtitle}>
          Entrez vos identifiants pour accéder à votre tableau de bord.
        </p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="identifier">
            Email ou téléphone
          </label>
          <div className={styles.inputWrap}>
            <svg className={styles.inputIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16v16H4zM4 4l8 8 8-8" />
            </svg>
            <input
              id="identifier"
              name="identifier"
              type="text"
              className={styles.input}
              placeholder="producteur@ecocycle.ci"
              autoComplete="username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
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
              placeholder="••••••••"
              autoComplete="current-password"
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

        <div className={styles.formRow}>
          <label className={styles.checkRow}>
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className={styles.checkbox}
            />
            <span>Se souvenir de moi</span>
          </label>
          <span className={styles.forgot}>Mot de passe oublié ?</span>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <button type="submit" className={styles.submitBtn} disabled={loading}>
          {loading ? (
            <>
              <span className={styles.spinner} />
              Connexion en cours…
            </>
          ) : (
            "Se connecter"
          )}
        </button>
      </form>

      <div className={styles.demoNotice}>
        <strong>Comptes de démonstration :</strong>
        <span>producteur@ecocycle.ci · collecteur@ecocycle.ci · recycleur@ecocycle.ci · acheteur@ecocycle.ci · mairie@ecocycle.ci · citoyen@ecocycle.ci</span>
        <span>Mot de passe : <code>TestEcoCycle2026!</code></span>
      </div>

      <div className={styles.divider}>
        <span>ou</span>
      </div>

      <p className={styles.switch}>
        Pas encore de compte ?{" "}
        <Link href="/register" className={styles.switchLink}>
          Créer un compte
        </Link>
      </p>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <p className="muted">Chargement…</p>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}