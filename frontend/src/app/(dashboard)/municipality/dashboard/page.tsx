"use client";

import { useEffect, useState } from 'react';
import { Activity, AlertTriangle, BrainCircuit, Target, CheckCircle2, Navigation } from 'lucide-react';
const LoadingState = () => <div>Loading...</div>;
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const aiService = { getMunicipalityRiskZones: async () => [] }; type ZoneRiskAdapter = any;

export default function MunicipalityDashboard() {
  
  const [isLoading, setIsLoading] = useState(true);
  const [decisionTaken, setDecisionTaken] = useState(false);
  const [simulationTriggered, setSimulationTriggered] = useState(false);
  const [aiRiskData, setAiRiskData] = useState<ZoneRiskAdapter | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    setTimeout(() => setIsLoading(false), 500);
  }, []);

  const handleSimulation = async () => {
    setSimulationTriggered(true);
    setIsAiLoading(true);
    try {
      const riskData = await aiService.getZonesRisk('Cocody');
      setAiRiskData(riskData);
    } catch (e) {
      console.error(e);
      // Fallback
      setAiRiskData({
        zone: 'Cocody',
        risk_score: 85,
        confidence: 0.9,
        trend: 'up',
        reasons: ["Pluies diluviennes", "Chute de 40% des collectes"],
        recommendation: { action: "Déployer 5 collecteurs d'urgence", priority: "URGENT", estimated_impact: "-30% déchets" }
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  if (isLoading) return <LoadingState fullPage message="Initialisation du Centre de Commandement..." />;

  const abidjanCenter: [number, number] = [5.3364, -4.0267];

  return (
    <div className="min-h-screen bg-bg font-body text-text-main pb-24">
      {/* Header Centre de Commandement */}
      <div className="bg-orange-500 text-white pt-12 pb-24 px-6 rounded-b-[2rem] shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span> En Ligne
            </div>
            <h1 className="font-heading text-4xl font-black tracking-tight">Centre de Commandement</h1>
          </div>
          <div className="flex gap-4">
            <div className="bg-white/10 p-4 rounded-xl border border-white/20 backdrop-blur-sm">
              <span className="text-xs font-medium uppercase tracking-widest block mb-1 opacity-80">Index de propreté globale</span>
              <div className="flex items-center gap-2">
                <Activity className="text-green-300" />
                <span className="font-heading text-2xl font-bold">{demoStep >= 5 ? 89 : 88}<span className="text-sm opacity-80">/100</span></span>
                {demoStep >= 5 && (
                  <span className="ml-2 text-xs bg-green-500 text-white px-2 py-1 rounded-full font-bold animate-bounce">
                    +1
                  </span>
                )}
              </div>
              {demoStep >= 5 && <span className="text-xs text-green-200 mt-1 block">Suite à 4 collectes terminées</span>}
            </div>
            <div className="bg-white/10 p-4 rounded-xl border border-white/20 backdrop-blur-sm">
              <span className="text-xs font-medium uppercase tracking-widest block mb-1 opacity-80">Collecteurs actifs</span>
              <div className="flex items-center gap-2">
                <Navigation className="text-blue-300" />
                <span className="font-heading text-2xl font-bold">128</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 -mt-10">
        
        {/* CARTE INTERACTIVE */}
        <Card padding="none" className="mb-8 overflow-hidden border-orange-100 relative">
          <div className="absolute top-4 right-4 z-[400] bg-white p-3 rounded-xl shadow-lg border border-gray-100">
            <h3 className="font-bold text-sm mb-2">Légende</h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500"></div> Zone Stable</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"></div> Collecteur Actif</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500"></div> Risque / Décharge</div>
            </div>
          </div>
          <div className="h-[400px] w-full z-0 relative">
            <MapContainer center={abidjanCenter} zoom={12} style={{ height: '100%', width: '100%', zIndex: 0 }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {/* Producteurs / Zones stables */}
              <CircleMarker center={[5.345, -4.015]} radius={10} color="transparent" fillColor="#22c55e" fillOpacity={0.7}>
                <Popup>Zone Stable (Marcory)</Popup>
              </CircleMarker>
              <CircleMarker center={[5.320, -4.005]} radius={15} color="transparent" fillColor="#22c55e" fillOpacity={0.6}>
                <Popup>Zone Stable (Treichville)</Popup>
              </CircleMarker>
              
              {/* Collecteurs */}
              <CircleMarker center={[5.350, -4.030]} radius={6} color="#ffffff" weight={2} fillColor="#3b82f6" fillOpacity={1}>
                <Popup>Collecteur: Amadou</Popup>
              </CircleMarker>
              <CircleMarker center={[5.330, -3.990]} radius={6} color="#ffffff" weight={2} fillColor="#3b82f6" fillOpacity={1}>
                <Popup>Collecteur: Sarah</Popup>
              </CircleMarker>

              {/* Simulation J+7 effect: Zone critique */}
              {simulationTriggered && (
                <>
                  <CircleMarker center={[5.370, -3.980]} radius={40} color="#ef4444" weight={2} fillColor="#ef4444" fillOpacity={0.4}>
                    <Popup>
                      <strong>Alerte Critique ({aiRiskData?.zone || 'Cocody'})</strong><br/>
                      Risque de saturation: {aiRiskData?.risk_score || 85}%
                    </Popup>
                  </CircleMarker>
                  <CircleMarker center={[5.365, -3.990]} radius={10} color="#000000" weight={2} fillColor="#f59e0b" fillOpacity={0.8} className="animate-pulse">
                    <Popup>
                      <strong>⚠️ Dépôt sauvage critique</strong><br/>
                      Signalé il y a 10 minutes<br/>
                      Point d'apport volontaire saturé.
                    </Popup>
                  </CircleMarker>
                </>
              )}
            </MapContainer>
          </div>
        </Card>

        {/* PRÉVISION J+7 & IA */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          
          {/* PRÉVISION */}
          <Card className="relative overflow-hidden border-gray-200 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <Target className="text-orange-500" size={28} />
                <h2 className="font-heading text-2xl font-bold text-deep-forest">Prévision J+7</h2>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSimulation}
                disabled={simulationTriggered || isAiLoading}
              >
                {isAiLoading ? 'Analyse IA en cours...' : simulationTriggered ? 'Simulation Active' : 'Lancer Simulation'}
              </Button>
            </div>
            
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-text-secondary">Risque de saturation ({aiRiskData?.zone || 'Cocody'})</span>
                  <span className={`${simulationTriggered ? 'text-red-500' : 'text-orange-500'} font-bold`}>{simulationTriggered ? (aiRiskData?.risk_score || 85) + '%' : '42%'}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className={`${simulationTriggered ? 'bg-red-500' : 'bg-orange-500'} h-2 rounded-full transition-all duration-1000`} style={{ width: simulationTriggered ? (aiRiskData?.risk_score || 85) + '%' : '42%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-text-secondary">Taux de collecte estimé (Globale)</span>
                  <span className="text-ecoloop-green font-bold">92%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-ecoloop-green h-2 rounded-full" style={{ width: '92%' }}></div>
                </div>
              </div>
              
              {simulationTriggered && (
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-sm text-text-secondary leading-relaxed bg-red-50 p-3 rounded-lg border border-red-100">
                    <strong className="text-red-600">Alerte IA ({aiRiskData?.confidence ? Math.round(aiRiskData.confidence * 100) : 90}% confiance) :</strong> {aiRiskData?.reasons?.join(' ') || "Les données météorologiques annoncent de fortes pluies dans 4 jours. Risque d'inondation CRITIQUE."}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* RECOMMANDATION IA & DÉCISION */}
          <Card className="relative overflow-hidden flex flex-col shadow-sm border-gray-200">
            <div className="flex items-center gap-3 mb-6">
              <BrainCircuit className="text-purple-600" size={28} />
              <h2 className="font-heading text-2xl font-bold text-deep-forest">Recommandation IA</h2>
            </div>

            {!simulationTriggered ? (
              <div className="flex-1 flex items-center justify-center text-center text-text-secondary p-8 bg-gray-50 rounded-xl border border-gray-100 border-dashed">
                Lancez la simulation J+7 pour générer des recommandations prédictives.
              </div>
            ) : !decisionTaken ? (
              <div className="flex-1 flex flex-col justify-between">
                <div className="bg-orange-50 p-5 rounded-xl border border-orange-100 mb-6">
                  <h3 className="font-bold text-orange-800 mb-2 flex items-center gap-2">
                    <AlertTriangle size={18} /> Action préventive requise ({aiRiskData?.recommendation?.priority || 'URGENT'})
                  </h3>
                  <ul className="text-sm text-orange-700 space-y-2 ml-6 list-disc">
                    <li>{aiRiskData?.recommendation?.action || "Déployer 5 collecteurs partenaires en urgence sur Cocody Riviera."}</li>
                    <li>Résoudre le signalement de dépôt sauvage détecté ce matin.</li>
                  </ul>
                  {aiRiskData?.recommendation?.estimated_impact && (
                    <p className="mt-3 text-xs font-bold text-orange-900 bg-orange-200 inline-block px-2 py-1 rounded">
                      Impact IA estimé : {aiRiskData.recommendation.estimated_impact}
                    </p>
                  )}
                </div>

                <div className="flex gap-4 mt-auto">
                  <Button variant="outline" className="flex-1">
                    Ignorer
                  </Button>
                  <Button 
                    variant="primary"
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                    onClick={() => setDecisionTaken(true)}
                  >
                    Appliquer la décision
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 size={40} className="text-ecoloop-green" />
                </div>
                <h3 className="font-heading text-2xl font-bold text-deep-forest mb-2">Décision Prise</h3>
                <p className="text-text-secondary">Les collecteurs partenaires ont été notifiés et la prime a été augmentée automatiquement. La zone devrait être sécurisée d'ici 24h.</p>
              </div>
            )}
          </Card>

        </div>

        {/* EXPORTS & REPORTING */}
        <h2 className="font-heading text-xl font-bold text-deep-forest mb-4">Rapports & Exports (ESG)</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <button className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center justify-center text-center group hover:border-orange-300 hover:bg-orange-50 transition-colors">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <span className="font-black text-lg">PDF</span>
            </div>
            <h3 className="font-bold text-deep-forest">Exporter en PDF</h3>
            <p className="text-xs text-text-secondary mt-1">Rapport synthétique pour présentation</p>
          </button>
          
          <button className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center justify-center text-center group hover:border-orange-300 hover:bg-orange-50 transition-colors">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <span className="font-black text-lg">XLS</span>
            </div>
            <h3 className="font-bold text-deep-forest">Exporter en Excel</h3>
            <p className="text-xs text-text-secondary mt-1">Données brutes pour analyse approfondie</p>
          </button>

          <button className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center justify-center text-center group hover:border-orange-300 hover:bg-orange-50 transition-colors">
            <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
            </div>
            <h3 className="font-bold text-deep-forest">Télécharger le Rapport</h3>
            <p className="text-xs text-text-secondary mt-1">Dossier complet (Impact & ESG)</p>
          </button>
        </div>

      </div>
    </div>
  );
}



