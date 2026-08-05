"use client";

import { useEffect, useState } from 'react';
import { PackageOpen, FileText, Clock, TrendingUp, MapPin, CheckCircle2, Factory } from 'lucide-react';
const LoadingState = () => <div>Loading...</div>;
const wasteService = { getRecentLots: async () => [] };

export default function RecyclerDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [purchaseLotId, setPurchaseLotId] = useState<string | null>(null);
  const [collectionDay, setCollectionDay] = useState('');
  const [purchaseStep, setPurchaseStep] = useState(1);
  const [marketplaceLots, setMarketplaceLots] = useState<any[]>([]);

  useEffect(() => {
    const fetchLots = async () => {
      try {
        const data = await wasteService.getAvailableWastes();
        setMarketplaceLots((data as any).items || data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLots();
  }, []);

  if (isLoading) return <LoadingState fullPage message="Chargement du stock en temps réel..." />;

  // Keeping stocks mock for UI since no direct API for it yet
  const stocks = [
    { name: 'Plastique PET', quantity: '12.5 T', trend: '+18%' },
    { name: 'Plastique HDPE', quantity: '4.2 T', trend: '+5%' },
    { name: 'Carton', quantity: '28.0 T', trend: '-2%' },
    { name: 'Métal / Alu', quantity: '1.8 T', trend: '+12%' },
    { name: 'Verre', quantity: '8.4 T', trend: '+0%' }
  ];

  return (
    <div className="min-h-screen bg-bg font-body text-text-main pb-24">
      <div className="bg-purple-600 text-white pt-12 pb-24 px-6 rounded-b-[2rem] shadow-sm">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-sm font-medium mb-3">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span> Approvisionnement Actif
            </div>
            <h1 className="font-heading text-3xl font-bold">Bonjour, Industriel</h1>
            <p className="opacity-90 mt-1">Sécurisez votre approvisionnement en matière première secondaire.</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 -mt-16">
        
        <h2 className="font-heading text-xl font-bold text-white mb-4">Stock disponible aujourd'hui</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          {stocks.map((stock) => (
            <div key={stock.name} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col justify-between">
              <span className="text-sm font-bold text-text-secondary mb-2">{stock.name}</span>
              <div>
                <span className="font-heading text-2xl font-extrabold text-purple-900 block">{stock.quantity}</span>
                <span className={`text-xs font-bold flex items-center gap-1 ${stock.trend.startsWith('+') ? 'text-ecoloop-green' : 'text-orange-500'}`}>
                  <TrendingUp size={12} /> {stock.trend}
                </span>
              </div>
            </div>
          ))}
        </div>

        <h2 className="font-heading text-xl font-bold text-deep-forest mb-4 flex items-center gap-2">
          <Factory size={24} className="text-purple-600" />
          Marketplace B2B
        </h2>

        <div className="space-y-4 mb-8">
          {marketplaceLots.map(lot => (
            <div key={lot.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:border-purple-300 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded-full">Lot #{lot.id.substring(0, 8)}</span>
                    <span className="text-xs font-bold bg-green-50 text-ecoloop-green px-2 py-1 rounded-full flex items-center gap-1"><CheckCircle2 size={12} /> {lot.score_tri || 'Vérifié'}</span>
                  </div>
                  <h3 className="font-heading text-xl font-bold text-deep-forest">{lot.type_dechet || 'Matière'}</h3>
                  <p className="text-sm text-text-secondary flex items-center gap-1 mt-1">
                    <MapPin size={14} /> {lot.commune || 'Abidjan'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="block text-2xl font-black text-purple-600">{lot.poids_estime_ia || lot.poids_estime || 0} kg</span>
                  <span className="text-sm font-bold text-text-secondary">Prix Marché</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 bg-gray-50 rounded-xl p-4 mb-4">
                <div>
                  <span className="block text-xs text-text-secondary mb-1">État</span>
                  <span className="font-bold text-deep-forest">{lot.etat_matiere || 'Bon'}</span>
                </div>
                <div>
                  <span className="block text-xs text-text-secondary mb-1">Type</span>
                  <span className="font-bold text-deep-forest">{lot.sous_type || '-'}</span>
                </div>
                <div>
                  <span className="block text-xs text-text-secondary mb-1">Disponibilité</span>
                  <span className="font-bold text-deep-forest">Immédiate</span>
                </div>
              </div>

              {/* Removed demo alert section for ECO-00094 */}

              <button 
                onClick={() => setPurchaseLotId(lot.id)}
                className="w-full btn-primary bg-purple-600 hover:bg-purple-700 py-3 rounded-xl flex items-center justify-center gap-2"
              >
                <PackageOpen size={20} /> Acheter ce lot
              </button>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center justify-center text-center group hover:border-purple-300 transition-colors">
            <div className="w-16 h-16 bg-green-50 text-ecoloop-green rounded-full flex items-center justify-center mb-4 transition-transform">
              <FileText size={32} />
            </div>
            <h3 className="font-bold text-lg text-deep-forest mb-1">Certificats ESG</h3>
            <p className="text-sm text-text-secondary">Téléchargez vos rapports d'impact et de traçabilité</p>
          </button>

          <button className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center justify-center text-center group hover:border-purple-300 transition-colors">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4 transition-transform">
              <Clock size={32} />
            </div>
            <h3 className="font-bold text-lg text-deep-forest mb-1">Historique des commandes</h3>
            <p className="text-sm text-text-secondary">Suivez vos livraisons et factures passées</p>
          </button>
        </div>

      </div>

      {/* PURCHASE MODAL */}
      {purchaseLotId && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl animate-in zoom-in-95 duration-200">
            {purchaseStep === 1 && (
              <>
                <h3 className="font-bold text-2xl text-deep-forest mb-2">Confirmer l'achat</h3>
                <p className="text-text-secondary mb-6">Sélectionnez un jour pour la collecte de ce lot.</p>
                
                <div className="space-y-4 mb-8">
                  <label className="font-bold text-deep-forest text-sm">Jour de collecte souhaité</label>
                  <select 
                    value={collectionDay} 
                    onChange={e => setCollectionDay(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium text-deep-forest focus:outline-none focus:border-purple-500"
                  >
                    <option value="">Sélectionner un jour...</option>
                    <option value="Aujourd'hui">Aujourd'hui</option>
                    <option value="Demain">Demain</option>
                    <option value="Lundi">Lundi prochain</option>
                    <option value="Mardi">Mardi prochain</option>
                  </select>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setPurchaseLotId(null)} className="flex-1 py-3 font-bold text-text-secondary bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors">
                    Annuler
                  </button>
                  <button 
                    disabled={!collectionDay}
                    onClick={() => {
                      setPurchaseStep(2);
                      setTimeout(async () => {
                        try {
                          await (wasteService as any).reserveLot(purchaseLotId);
                          setPurchaseStep(2);
                        } catch(e) {
                          alert("Erreur lors de la réservation de ce lot");
                          setPurchaseStep(1);
                        }
                      }, 1000);
                    }} 
                    className="flex-[2] py-3 font-bold text-white bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 disabled:cursor-not-allowed rounded-xl transition-colors"
                  >
                    Confirmer la collecte
                  </button>
                </div>
              </>
            )}

            {purchaseStep === 2 && (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="text-ecoloop-green" size={32} />
                </div>
                <h3 className="font-bold text-2xl text-deep-forest mb-2">Achat confirmé</h3>
                <p className="text-text-secondary mb-2">Les notifications ont été envoyées au producteur et au réseau de collecteurs.</p>
                <p className="text-purple-600 font-bold text-sm">Collecte prévue : {collectionDay}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}



