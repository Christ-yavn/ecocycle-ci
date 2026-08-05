"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, Package, MapPin, ArrowRight } from 'lucide-react';
const wasteService = { getRecentLots: async () => [] };

const BottleIcon = ({ className, size = 24 }: { className?: string, size?: number }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M10.5 2h3"/>
    <path d="M10.5 2v4c0 1-1.5 2-1.5 3v11a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-11c0-1-1.5-2-1.5-3V2"/>
    <path d="M9 13h6"/>
  </svg>
);

export function CollectorDashboard() {
  const navigate = useRouter();
  const [missions, setMissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMissions = async () => {
      try {
        const data = await wasteService.getAvailableWastes();
        setMissions(data);
      } catch (error) {
        console.error("Erreur lors de la récupération des missions", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMissions();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 font-body pb-24">
      {/* Header */}
      <div className="px-6 pt-12 pb-8 bg-white rounded-b-3xl shadow-sm">
        <h1 className="font-heading text-3xl font-extrabold text-gray-900 mb-2">Bonjour, Yao 👋</h1>
        <p className="text-gray-500 font-medium">Prêt à faire la différence aujourd'hui ?</p>
      </div>

      <div className="px-6 mt-6 space-y-8">
        
        {/* Banner */}
        <div className="bg-green-100/80 rounded-2xl p-4 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-green-800 rounded-full flex items-center justify-center text-white font-bold">
              {missions.length}
            </div>
            <span className="font-bold text-green-900">{missions.length} missions disponibles</span>
          </div>
          <ChevronRight className="text-green-800" />
        </div>

        {/* Missions list */}
        <div>
          <h2 className="font-heading text-2xl font-bold text-gray-900 mb-1">{missions.length} missions disponibles</h2>
          <p className="text-gray-500 mb-6 font-medium">Choisissez une mission et commencez.</p>

          <div className="space-y-4">
            {loading ? (
               <div className="text-center py-10 text-gray-500">Chargement des missions...</div>
            ) : missions.length === 0 ? (
               <div className="text-center py-10 text-gray-500">Aucune mission disponible pour le moment.</div>
            ) : (
              missions.map(mission => (
                <div key={mission.id} className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
                  <div className="flex justify-between items-start mb-5">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center shrink-0">
                        {mission.type_dechet === 'Plastique' || mission.type_dechet === 'PET' ? 
                          <BottleIcon className="text-green-600" size={28} /> : 
                          <Package className="text-amber-600" size={28} />
                        }
                      </div>
                      <div>
                        <span className="inline-block px-3 py-1 bg-gray-100 text-gray-600 text-[11px] uppercase font-bold tracking-wider rounded-full mb-2">
                          {mission.type_dechet || 'Inconnu'}
                        </span>
                        <h3 className="font-heading text-3xl font-extrabold text-gray-900 leading-none">≈ {mission.poids_estime_ia} kg</h3>
                        <div className="flex items-center gap-3 text-gray-500 text-sm mt-3 font-medium">
                          <span className="flex items-center gap-1.5">
                            <MapPin size={16} className="text-gray-400" /> {mission.commune || 'Inconnue'}
                          </span>
                          <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                          <span>- km</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Map Graphic */}
                    <div className="relative w-16 h-16 bg-gray-50 rounded-2xl overflow-hidden flex items-center justify-center border border-gray-100 shrink-0">
                      <svg className="absolute inset-0 w-full h-full text-gray-200" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M -10 50 Q 25 80, 50 50 T 110 50" stroke="currentColor" strokeWidth="3" strokeDasharray="4,4" fill="none" />
                      </svg>
                      <svg className="relative z-10 w-7 h-7 drop-shadow-md" viewBox="0 0 24 24" fill={mission.type_dechet === 'Plastique' ? '#16a34a' : '#d97706'} xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9C9.5 7.62 10.62 6.5 12 6.5C13.38 6.5 14.5 7.62 14.5 9C14.5 10.38 13.38 11.5 12 11.5Z" />
                      </svg>
                    </div>
                  </div>

                  <button 
                    onClick={() => navigate(`/collector/mission/${mission.id}`)}
                    className="w-full bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-colors text-lg"
                  >
                    Voir la mission <ArrowRight size={20} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}



