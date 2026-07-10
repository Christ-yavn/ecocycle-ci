"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signUp } from "@/lib/auth-actions";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ROLES, ROLE_LABELS, ROLE_ACCES_PAYANT, type Role } from "@/types/role";
import styles from "../login/page.module.css";

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

export default function RegisterPage() {
  const router = useRouter();

  const [role, setRole] = useState<Role>("producteur");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [commune, setCommune] = useState("");
  const [quartier, setQuartier] = useState("");
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
      // Si email confirmation requise, afficher un message.
      // Sinon, rediriger vers login.
      setTimeout(() => router.push("/login"), 2000);
    }
    setLoading(false);
  }

  if (success) {
    return (
      <div className="stack" style={{ textAlign: "center", padding: "1rem" }}>
        <Badge tone="signal" dot>
          Compte créé
        </Badge>
        <h2 style={{ fontSize: "1.2rem" }}>Inscription réussie !</h2>
        <p className="muted">
          Votre profil a été créé. Vous allez être redirigé vers la connexion.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="pageHead" style={{ marginBottom: "1.25rem" }}>
        <h1 style={{ fontSize: "1.4rem" }}>Créer votre compte</h1>
        <p className="muted" style={{ margin: 0 }}>
          Choisissez votre profil et renseignez vos informations.
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
                className={`${styles.roleOpt} ${role === r ? styles.roleOptSel : ""}`}
                onClick={() => setRole(r)}
              >
                <span>{ROLE_LABELS[r]}</span>
                {ROLE_ACCES_PAYANT[r] && <Badge tone="amber">Payant</Badge>}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="name">
            {role === "producteur" || role === "citoyen"
              ? "Prénom et nom"
              : "Raison sociale / Nom"}
          </label>
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
            placeholder="Minimum 6 caractères"
            autoComplete="new-password"
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="commune">
            Commune
          </label>
          <select
            id="commune"
            name="commune"
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

        <div className={styles.field}>
          <label className={styles.label} htmlFor="quartier">
            Quartier (optionnel)
          </label>
          <input
            id="quartier"
            name="quartier"
            type="text"
            className={styles.input}
            placeholder="Ex : Angré, 220 Logements"
            value={quartier}
            onChange={(e) => setQuartier(e.target.value)}
          />
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <Button full variant="primary" disabled={loading}>
          {loading ? "Création…" : "Créer mon compte"}
        </Button>
      </form>

      <div className={styles.divider} />

      <p className={styles.switch}>
        Déjà inscrit ?{" "}
        <Link href="/login" className={styles.switchLink}>
          Se connecter
        </Link>
      </p>

      <p className={styles.notice}>
        {ROLE_ACCES_PAYANT[role]
          ? "Ce profil nécessite un abonnement payant (licence mensuelle ou annuelle). Vous pourrez souscrire après validation de votre compte."
          : "Ce profil est gratuit. Aucun abonnement requis."}
      </p>
    </>
  );
}
