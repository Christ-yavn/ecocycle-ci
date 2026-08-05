"use client";

import { useState } from 'react';
import Link from 'next/link';
import { 
  Leaf, Camera, AlertTriangle, ArrowRight, 
  CheckCircle2, Truck, MapPin, Recycle, Users, 
  Menu, X, Plus, BrainCircuit
} from 'lucide-react';
import './LandingPage.css';

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const faqs = [
    { 
      question: "Quels déchets puis-je publier ?", 
      answer: "Nous acceptons les plastiques recyclables (bouteilles PET, bidons PEHD), le carton, et le papier. Le tri doit être fait au préalable pour faciliter la collecte." 
    },
    { 
      question: "Comment fonctionne la collecte ?", 
      answer: "Une fois votre déchet publié, notre IA qualifie le gisement et alerte les collecteurs à proximité. Un collecteur réserve la course et vient récupérer la matière à votre emplacement." 
    },
    { 
      question: "EcoLoop collecte-t-il les ordures ménagères ?", 
      answer: "Non, EcoLoop se concentre exclusivement sur les déchets recyclables secs ayant une valeur sur le marché. Nous ne collectons pas les déchets organiques ou les ordures ménagères." 
    }
  ];

  return (
    <div className="landing-page">
      {/* 1. HEADER */}
      <header className="landing-header">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="EcoLoop Logo" className="h-14 w-auto" />
          </Link>
          
          <div className="hidden md:flex items-center gap-6">
            <Link href="/login" className="font-medium text-gray-600 hover:text-green-700 transition-colors">
              Connexion
            </Link>
            <Link href="/register" className="bg-green-700 hover:bg-green-800 text-white font-medium py-2.5 px-6 rounded-full transition-colors shadow-md shadow-green-700/20">
              S'inscrire
            </Link>
          </div>

          <button 
            className="md:hidden text-gray-700 p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-20 left-0 w-full bg-white shadow-xl border-t border-gray-100 p-6 flex flex-col gap-4">
            <Link href="/login" className="font-medium text-center text-gray-700 py-3 border border-gray-200 rounded-xl" onClick={() => setMobileMenuOpen(false)}>
              Connexion
            </Link>
            <Link href="/register" className="bg-green-700 text-white text-center font-medium py-3 rounded-xl shadow-md shadow-green-700/20" onClick={() => setMobileMenuOpen(false)}>
              S'inscrire
            </Link>
          </div>
        )}
      </header>

      {/* 2. HERO SECTION */}
      <section className="hero-section">
        <div className="hero-skyline"></div>
        <div className="max-w-7xl mx-auto px-6 flex flex-col lg:flex-row items-center gap-16 relative z-10">
          
          <div className="flex-1 text-center lg:text-left">
            <h1 className="text-5xl lg:text-7xl font-extrabold text-[#064E3B] leading-tight mb-6">
              Transformez vos<br/>déchets recyclables<br/>
              <span className="text-green-700">en valeur.</span>
            </h1>
            <p className="text-xl text-gray-600 mb-10 whitespace-pre-line leading-relaxed max-w-2xl mx-auto lg:mx-0">
              Photographiez. EcoLoop analyse.<br/>
              Un collecteur intervient.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-10">
              <Link href="/register" className="w-full sm:w-auto bg-green-700 hover:bg-green-800 text-white font-medium py-4 px-8 rounded-full flex items-center justify-center gap-2 transition-colors shadow-lg shadow-green-700/30">
                <Camera size={20} />
                Publier un déchet
              </Link>
              <Link href="/register" className="w-full sm:w-auto border-2 border-green-700 text-green-700 hover:bg-green-50 font-medium py-4 px-8 rounded-full flex items-center justify-center gap-2 transition-colors">
                <AlertTriangle size={20} />
                Signaler un dépôt
              </Link>
            </div>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-sm font-medium text-gray-600">
              <span className="flex items-center gap-1.5"><CheckCircle2 size={18} className="text-green-600" /> Sécurisé</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 size={18} className="text-green-600" /> Simple</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 size={18} className="text-green-600" /> Impact réel</span>
            </div>
          </div>

          <div className="flex-1 w-full phone-wrapper mt-10 lg:mt-0">
            <div className="phone-mockup">
              <div className="phone-notch"></div>
              <div className="phone-screen">
                <div className="phone-topbar">
                  <h3 className="font-bold text-gray-900">Analyse EcoLoop</h3>
                  <p className="text-xs text-green-600 font-medium flex items-center justify-center gap-1 mt-1">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    IA en cours...
                  </p>
                </div>
                <div className="phone-content">
                  <div className="phone-timeline">
                    
                    <div className="phone-step">
                      <div className="phone-step-dot"></div>
                      <div className="phone-step-card">
                        <div className="flex items-center gap-2 mb-2">
                          <Camera size={16} className="text-gray-500" />
                          <span className="font-semibold text-sm">Photo prise</span>
                        </div>
                        <div className="phone-img-placeholder">
                          <Camera size={24} className="opacity-50" />
                        </div>
                      </div>
                    </div>

                    <div className="phone-step">
                      <div className="phone-step-dot"></div>
                      <div className="phone-step-card">
                        <div className="flex items-center gap-2">
                          <Recycle size={16} className="text-green-600" />
                          <div>
                            <span className="font-semibold text-sm block">Déchet identifié</span>
                            <span className="text-xs text-gray-500">Plastique PET ≈ 12 kg</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="phone-step">
                      <div className="phone-step-dot"></div>
                      <div className="phone-step-card">
                        <div className="flex items-center gap-2">
                          <MapPin size={16} className="text-orange-500" />
                          <div>
                            <span className="font-semibold text-sm block">Localisation</span>
                            <span className="text-xs text-gray-500">Cocody, Abidjan</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="phone-step">
                      <div className="phone-step-dot" style={{ borderColor: '#e2e8f0' }}></div>
                      <div className="phone-step-card border-dashed border-2 border-green-200 bg-green-50/50">
                        <div className="flex items-center gap-2">
                          <Truck size={16} className="text-green-600 animate-pulse" />
                          <div>
                            <span className="font-semibold text-sm block text-green-700">Collecteur disponible</span>
                            <span className="text-xs text-gray-500">À 1,8 km de vous</span>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </section>

      {/* 3. COMMENT ÇA MARCHE? */}
      <section className="steps-section">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl lg:text-4xl font-bold text-center text-[#064E3B] mb-16">Comment ça marche ?</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-0 lg:steps-row">
            
            <div className="step-card">
              <div className="step-icon-wrapper">
                <Camera size={32} />
              </div>
              <span className="text-green-700 font-bold text-xl mb-2">01</span>
              <h3 className="font-bold text-xl text-gray-900 mb-2">Photographiez</h3>
              <p className="text-gray-600 text-sm">Prenez une photo de vos déchets recyclables.</p>
            </div>
            
            <ArrowRight size={24} className="step-arrow" />

            <div className="step-card">
              <div className="step-icon-wrapper">
                <BrainCircuit size={32} />
              </div>
              <span className="text-green-700 font-bold text-xl mb-2">02</span>
              <h3 className="font-bold text-xl text-gray-900 mb-2">EcoLoop identifie</h3>
              <p className="text-gray-600 text-sm">Notre IA analyse et identifie le type de déchet.</p>
            </div>

            <ArrowRight size={24} className="step-arrow" />

            <div className="step-card">
              <div className="step-icon-wrapper">
                <Truck size={32} />
              </div>
              <span className="text-green-700 font-bold text-xl mb-2">03</span>
              <h3 className="font-bold text-xl text-gray-900 mb-2">Un collecteur intervient</h3>
              <p className="text-gray-600 text-sm">Les collecteurs proches sont automatiquement informés.</p>
            </div>

            <ArrowRight size={24} className="step-arrow" />

            <div className="step-card">
              <div className="step-icon-wrapper">
                <Recycle size={32} />
              </div>
              <span className="text-green-700 font-bold text-xl mb-2">04</span>
              <h3 className="font-bold text-xl text-gray-900 mb-2">Le déchet est valorisé</h3>
              <p className="text-gray-600 text-sm">Vos déchets rejoignent la chaîne du recyclage.</p>
            </div>

          </div>
        </div>
      </section>

      {/* 4. IMPACT */}
      <section className="impact-section">
        <div className="max-w-6xl mx-auto">
          <div className="impact-card">
            <img src="/sprout.jpg" alt="Impact EcoLoop" className="impact-image" />
            <div className="impact-content">
              <div className="flex items-center gap-3 mb-6">
                <Recycle size={28} className="text-green-400" />
                <h2 className="text-3xl lg:text-4xl font-bold">Déjà en mouvement.</h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mt-12">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Recycle size={20} className="text-green-400" />
                    <span className="text-4xl font-extrabold">12,4 t</span>
                  </div>
                  <p className="text-green-100/80 font-medium">déchets collectés</p>
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Users size={20} className="text-green-400" />
                    <span className="text-4xl font-extrabold">1 240</span>
                  </div>
                  <p className="text-green-100/80 font-medium">utilisateurs</p>
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Truck size={20} className="text-green-400" />
                    <span className="text-4xl font-extrabold">356</span>
                  </div>
                  <p className="text-green-100/80 font-medium">collectes réalisées</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FAQ */}
      <section className="faq-section">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-[#064E3B] mb-12">Questions fréquentes</h2>
          <div className="flex flex-col gap-2">
            {faqs.map((faq, index) => (
              <div key={index} className="faq-item">
                <button 
                  className="faq-question"
                  onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                >
                  {faq.question}
                  <Plus 
                    size={20} 
                    className={`text-green-700 transition-transform duration-300 ${activeFaq === index ? 'rotate-45' : ''}`} 
                  />
                </button>
                {activeFaq === index && (
                  <div className="faq-answer leading-relaxed">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. CTA FINAL */}
      <section className="cta-section">
        <div className="max-w-5xl mx-auto">
          <div className="cta-card">
            <img src="/leaf_cta.jpg" alt="Plante" className="cta-image" />
            <div className="cta-content">
              <h2 className="text-3xl lg:text-4xl font-bold text-[#064E3B] mb-4 leading-tight">
                Prêt à valoriser<br/>vos déchets ?
              </h2>
              <p className="text-gray-600 mb-8 text-lg">
                Rejoignez EcoLoop et participez à une ville plus propre et plus durable.
              </p>
              <Link href="/register" className="inline-flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white font-medium py-4 px-8 rounded-full transition-colors shadow-lg shadow-green-700/20">
                <Leaf size={20} />
                Commencer avec EcoLoop <ArrowRight size={20} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer className="footer-section">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-12 border-b border-gray-800 pb-12 mb-8">
          
          <div className="max-w-xs">
            <div className="flex items-center gap-2 mb-4">
              <img src="/logo.png" alt="EcoLoop Logo" className="h-12 w-auto brightness-0 invert" />
            </div>
            <p className="text-sm text-gray-400">Valoriser. Connecter. Transformer.</p>
          </div>

          <div className="flex gap-16 flex-wrap">
            <div>
              <h4 className="text-white font-semibold mb-4">Produit</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Comment ça marche</a></li>
                <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Entreprise</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">À propos</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Légal</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Confidentialité</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Conditions d'utilisation</a></li>
              </ul>
            </div>
          </div>

        </div>

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            &copy; 2026 EcoLoop. Tous droits réservés.
          </p>
          <div className="flex items-center gap-4 text-gray-400">
            <a href="#" className="hover:text-white transition-colors p-2 bg-gray-800 rounded-full text-xs font-bold w-8 h-8 flex items-center justify-center">FB</a>
            <a href="#" className="hover:text-white transition-colors p-2 bg-gray-800 rounded-full text-xs font-bold w-8 h-8 flex items-center justify-center">IG</a>
            <a href="#" className="hover:text-white transition-colors p-2 bg-gray-800 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/></svg>
            </a>
            <a href="#" className="hover:text-white transition-colors p-2 bg-gray-800 rounded-full text-xs font-bold w-8 h-8 flex items-center justify-center">IN</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

