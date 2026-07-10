"use client";

import { useState, Suspense, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "@/lib/auth-actions";
import { Button } from "@/components/ui/Button";
import styles from "./page.module.css";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = params.get("redirect") ?? null;

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error: authError } = await signIn(phone, password);

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      if (redirectTo) {
        router.push(redirectTo);
      } else {
        router.push("/producteur");
      }
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <>
      <div className="pageHead" style={{ marginBottom: "1.25rem" }}>
        <h1 style={{ fontSize: "1.4rem" }}>Accéder à votre espace</h1>
        <p className="muted" style={{ margin: 0 }}>
          Connectez-vous avec votre téléphone et mot de passe.
        </p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="phone">
            Téléphone
          </label>
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

        <div className={styles.field}>
          <label className={styles.label} htmlFor="password">
            Mot de passe
          </label>
          <input
            id="password"
            name="password"
            type="password"
            className={styles.input}
            placeholder="••••••••"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <Button full variant="primary" disabled={loading}>
          {loading ? "Connexion…" : "Se connecter"}
        </Button>
      </form>

      <div className={styles.divider} />

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
