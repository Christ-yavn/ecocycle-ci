"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Leaf, 
  User, 
  Smartphone, 
  Lock, 
  ShieldCheck, 
  ArrowRight,
  Eye,
  EyeOff,
  Pen,
  MapPin,
  CheckCircle,
  ArrowLeft
} from 'lucide-react';

import { signUp } from '@/lib/auth-actions';
import { motion, AnimatePresence } from 'framer-motion';
import './RegisterPage.css';

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useRouter();

  const cleanPhone = phone.replace(/\s+/g, '');
  const isValidPhone = cleanPhone.length >= 8 && cleanPhone.match(/^[0-9+]+$/);
  
  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };
  
  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    try {
      await signUp(
        name,
        cleanPhone,
        password,
        'producteur'
      );
      
      const { signIn } = await import('@/lib/auth-actions');
      await signIn(cleanPhone, password);
      navigate.push('/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.message || "Erreur technique, veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const slideVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, x: -50, transition: { duration: 0.2 } }
  };

  return (
    <div className="register-page-container">
      <div className="register-overlay"></div>
      
      <div className="register-content font-body">
        
        {/* Logo Section */}
        <div className="register-logo-container">
          <Link href="/" className="register-logo-row hover:opacity-80 transition-opacity">
            <img src="/logo.png" alt="EcoLoop Logo" className="h-20 w-auto mb-2" />
          </Link>
          <p className="register-tagline">Valorisons. Trions. Agissons.</p>
        </div>

        {/* Main Card */}
        <div className="register-card">
          
          {/* Step Icon */}
          <div className="register-step-icon">
            {step === 1 && <User size={28} />}
            {step === 2 && <Smartphone size={28} />}
            {step === 3 && <Lock size={28} />}
          </div>

          <h2 className="register-title">Créer votre compte</h2>
          <div className="register-title-underline"></div>

          {/* Progress Bar */}
          <div className="register-progress-container">
            <div className="register-progress-bar">
              <div className={`register-progress-node ${step >= 1 ? 'active' : 'inactive'}`}>1</div>
              <div className={`register-progress-line ${step >= 2 ? 'active' : 'inactive'}`}></div>
              <div className={`register-progress-node ${step >= 2 ? 'active' : 'inactive'}`}>2</div>
              <div className={`register-progress-line ${step >= 3 ? 'active' : 'inactive'}`}></div>
              <div className={`register-progress-node ${step >= 3 ? 'active' : 'inactive'}`}>3</div>
            </div>
            <p className="register-step-indicator">Étape {step} / 3</p>
          </div>

          {error && step === 3 && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm font-medium border border-red-100">
              {error}
            </div>
          )}

          {/* Forms Steps */}
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" variants={slideVariants} initial="hidden" animate="visible" exit="exit">
                <p className="register-subtitle">
                  Votre prénom nous permettra de personnaliser votre expérience.
                </p>
                <div className="register-input-group">
                  <User className="register-input-icon" size={20} />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Prénom"
                    className="register-input"
                    autoFocus
                  />
                </div>
                <button 
                  onClick={handleNext}
                  disabled={!name.trim()}
                  className="register-btn"
                >
                  Continuer <ArrowRight size={20} />
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" variants={slideVariants} initial="hidden" animate="visible" exit="exit">
                <p className="register-subtitle">
                  Nous l'utiliserons pour vous connecter et vous envoyer des notifications importantes.
                </p>
                <div className="register-input-group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none gap-2">
                    <span className="text-xl">🇨🇮</span>
                    <span className="text-gray-500 font-medium">+225</span>
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="XX XX XX XX XX"
                    className="register-input"
                    style={{ paddingLeft: '6.5rem' }}
                    autoFocus
                  />
                </div>
                <p className="register-secure-text">
                  <Lock size={16} /> Votre numéro est 100% sécurisé.
                </p>
                <button 
                  onClick={handleNext}
                  disabled={!isValidPhone}
                  className="register-btn mt-6"
                >
                  Continuer <ArrowRight size={20} />
                </button>
                <button onClick={handleBack} className="register-back-btn">
                  <ArrowLeft size={16} /> Retour
                </button>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" variants={slideVariants} initial="hidden" animate="visible" exit="exit">
                <form onSubmit={handleRegister}>
                  <div className="register-input-group">
                    <Lock className="register-input-icon" size={20} />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mot de passe"
                      className="register-input"
                      autoFocus
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="register-password-toggle">
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  <div className="register-input-group">
                    <Lock className="register-input-icon" size={20} />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirmer le mot de passe"
                      className="register-input"
                    />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="register-password-toggle">
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  
                  <button 
                    type="submit"
                    disabled={isSubmitting || !password || password !== confirmPassword}
                    className="register-btn"
                  >
                    {isSubmitting ? "Création..." : "Créer mon compte"}
                  </button>
                  <button type="button" onClick={handleBack} className="register-back-btn">
                    <ArrowLeft size={16} /> Retour
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Security Badge */}
          <div className="register-security-badge">
            <div className="register-security-badge-icon">
              <ShieldCheck size={24} />
            </div>
            <div>
              <p className="font-bold text-[#064E3B] text-sm">Vos données sont sécurisées</p>
              <p className="text-xs text-gray-500 mt-1">Nous protégeons vos informations personnelles.</p>
            </div>
          </div>
        </div>

        {/* Features Bar */}
        <div className="register-features-bar">
          <div className="register-feature-item">
            <div className="register-feature-icon">
              <Pen size={18} />
            </div>
            <span className="register-feature-text">Collecte intelligente</span>
          </div>
          <div className="register-feature-item">
            <div className="register-feature-icon">
              <MapPin size={18} />
            </div>
            <span className="register-feature-text">Géolocalisation précise</span>
          </div>
          <div className="register-feature-item">
            <div className="register-feature-icon">
              <CheckCircle size={18} />
            </div>
            <span className="register-feature-text">Impact environnemental</span>
          </div>
        </div>

        {/* Footer */}
        <div className="register-footer">
          <p>© 2025 EcoLoop. Tous droits réservés.</p>
        </div>
      </div>
    </div>
  );
}



