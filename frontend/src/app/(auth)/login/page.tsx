"use client";

import { useState, Suspense, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "@/lib/auth-actions";
import { ShieldCheck, Eye, EyeOff, Lock, UserPlus, AlertCircle } from 'lucide-react';
import './LoginPage.css';

function formatPhone(value: string): string {
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
      ? "Le service est momentanément mal configuré."
      : urlError === "no_profile"
        ? "Votre compte est connecté mais aucun profil n'a été trouvé."
        : mode === "complete"
          ? "Votre profil n'est pas encore créé en base de données."
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
        setError("Numéro ou mot de passe incorrect.");
        setLoading(false);
        return;
      }

      if (data.user) {
        if (redirectTo) {
          window.location.href = redirectTo;
          return;
        }

        const { createSupabaseBrowserClient } = await import("@/lib/supabase/browser");
        const supabase = createSupabaseBrowserClient();
        const { data: profile } = await supabase
          .from("users")
          .select("role")
          .eq("id", data.user.id)
          .single();

        if (profile?.role) {
          window.location.href = `/${profile.role}/dashboard`; // Redirect based on new paths
          return;
        }

        setError("Profil non trouvé.");
        setLoading(false);
        return;
      }

      setError("Réponse inattendue.");
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
      setLoading(false);
    }
  }

  return (
    <div className="login-layout">
      {/* LEFT PANEL */}
      <div className="login-left">
        <div className="login-left-overlay"></div>
        <div className="login-left-content">
          <div className="login-logo-white">
            <img src="/logo.png" alt="EcoLoop Logo" className="h-12 w-auto brightness-0 invert" />
          </div>
          
          <div className="login-hero-text">
            <h1>
              Ensemble,<br />
              valorisons nos déchets,<br />
              préservons<br />
              demain.
            </h1>
            <p>
              EcoLoop connecte citoyens, collecteurs et recycleurs pour des <span className="text-green-400 font-bold">villes plus propres</span>.
            </p>
            <div className="login-hero-divider"></div>
          </div>

          <div className="login-security-badge">
            <ShieldCheck size={20} className="text-green-400" />
            <span>Vos données sont sécurisées et protégées.</span>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="login-right">
        <div className="login-right-container">
          <div className="login-header-mobile flex flex-col items-center">
            <img src="/logo.png" alt="EcoLoop Logo" className="h-20 w-auto mb-2" />
            <p>Valorisons. Trions. Agissons.</p>
          </div>

          <div className="login-welcome">
            <h1>Bienvenue sur <span className="text-green-700">EcoLoop</span></h1>
            <p>Connectez-vous à votre espace</p>
          </div>

          {error && (
            <div className="login-alert-error">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form-main">
            <div className="form-group-modern">
              <label htmlFor="phone">Numéro de téléphone</label>
              <div className="phone-input-wrapper">
                <div className="phone-prefix">
                  <span className="flag">🇨🇮</span>
                  <span className="prefix">+225</span>
                </div>
                <input 
                  type="tel" 
                  id="phone" 
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                  placeholder="XX XX XX XX XX"
                  required 
                />
              </div>
            </div>

            <div className="form-group-modern">
              <label htmlFor="password">Mot de passe</label>
              <div className="password-input-wrapper">
                <input 
                  type={showPassword ? "text" : "password"} 
                  id="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required 
                />
                <button 
                  type="button" 
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <div className="forgot-password-link">
                <Link href="/forgot-password">Mot de passe oublié ?</Link>
              </div>
            </div>
            
            <button type="submit" className="btn-primary-full" disabled={loading}>
              {loading ? (
                <span>Connexion en cours...</span>
              ) : (
                <>
                  <Lock size={18} />
                  <span>Se connecter</span>
                </>
              )}
            </button>
          </form>

          <div className="login-divider">
            <span>ou</span>
          </div>

          <div className="create-account-section">
            <p>Pas encore de compte ?</p>
            <Link href="/register" className="btn-outline-full">
              <UserPlus size={18} />
              <span>Créer un compte</span>
            </Link>
          </div>

          {/* SECTION DEMO */}
          <div className="demo-section-mini mt-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 text-center">Connexion rapide (Démo)</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <button className="py-2 px-3 bg-white border border-gray-200 rounded-lg hover:border-green-500 hover:text-green-700 transition font-medium" type="button" onClick={() => { setPhone('07 00 00 00 01'); setPassword('EcoLoop2026!'); }}>
                Producteur
              </button>
              <button className="py-2 px-3 bg-white border border-gray-200 rounded-lg hover:border-green-500 hover:text-green-700 transition font-medium" type="button" onClick={() => { setPhone('07 00 00 00 02'); setPassword('EcoLoop2026!'); }}>
                Collecteur
              </button>
            </div>
          </div>

          <div className="login-footer-rights mt-6 text-center text-xs text-gray-400">
            © 2026 EcoLoop. Tous droits réservés.
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Chargement...</div>}>
      <LoginForm />
    </Suspense>
  );
}
