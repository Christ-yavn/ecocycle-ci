"use client";

import { useState, Suspense, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "@/lib/auth-actions";
import { Icon } from "@/components/ui/Icon";
import styles from "./page.module.css";

function formatPhone(value: string): string {
  // Tolère le collage au format international (+225 07...) → garde le national
  const digits = value.replace(/\D/g, "").replace(/^225/, "").slice(0, 10);
  return digits.replace(/(\d{2})(?=\d)/g, "$1 ").trim();
}

function LoginForm() {
  const params = useSearchParams();
  const redirectTo = params.get("redirect") ?? null;
  const urlError = params.get("error");
  const mode = params.get("mode");

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(
    urlError === "config"
      ? "Le service est momentanément mal configuré (variables Supabase absentes). Contactez l'administrateur — diagnostic sur /debug."
      : urlError === "no_profile"
        ? "Votre compte est connecté mais aucun profil n'a été trouvé en base. Contactez l'administrateur."
        : mode === "complete"
          ? "Votre profil n'est pas encore créé en base de données. Contactez l'administrateur."
          : null,
  );
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const digits = phone.replace(/\D/g, "");
    if (digits.length !== 10) {
      setError("Veuillez saisir votre numéro à 10 chiffres.");
      return;
    }

    setLoading(true);

    try {
      const { data, error: authError } = await signIn(digits, password);

      if (authError) {
        console.error("[login] authError:", authError);
        setError("Numéro ou mot de passe incorrect.");
        setLoading(false);
        return;
      }

      if (data.user) {
        if (redirectTo) {
          window.location.href = redirectTo;
          return;
        }

        const { createSupabaseBrowserClient } = await import(
          "@/lib/supabase/browser"
        );
        const supabase = createSupabaseBrowserClient();
        const { data: profile, error: profileErr } = await supabase
          .from("users")
          .select("role")
          .eq("id", data.user.id)
          .single();
        if (profileErr) {
          console.error("[login] profil indisponible (RLS ?):", profileErr);
        }

        if (profile?.role) {
          window.location.href = `/${profile.role}`;
          return;
        }

        setError(
          "Connexion réussie mais aucun profil trouvé en base. Contactez l'administrateur.",
        );
        setLoading(false);
        return;
      }

      setError("Réponse inattendue du serveur d'authentification.");
      setLoading(false);
    } catch (err) {
      console.error("[login] Échec signIn :", err);
      setError(
        err instanceof Error
          ? err.message
          : "Erreur inconnue lors de la connexion.",
      );
      setLoading(false);
    }
  }

  return (
    <>
      <div className={styles.logoWrap}>
        <span className={styles.logoDot} />
        <span className={styles.logoText}>EcoLoop</span>
      </div>

      <div className={styles.header}>
        <h1 className={styles.title}>Bienvenue sur EcoLoop</h1>
        <p className={styles.subtitle}>Connectez-vous à votre espace</p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="phone">
            Numéro de téléphone
          </label>
          <div className={styles.phoneWrap}>
            <span className={styles.phonePrefix}>+225</span>
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
              <Icon name={showPassword ? "eyeOff" : "eye"} size={18} />
            </button>
          </div>
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
