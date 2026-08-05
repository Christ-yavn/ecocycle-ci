"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, Plus, Box, Check, ChevronRight } from 'lucide-react';

const dashboardService = { getHouseholdStats: async () => ({ activeLots: 2, totalCollected: 45 }), getCollectorStats: async () => ({ activeMissions: 1, totalCollected: 120 }), getRecyclerStats: async () => ({ availableLots: 5, totalPurchased: 500 }), getMunicipalityStats: async () => ({ activeReports: 12, resolvedReports: 45 }), getAdminStats: async () => ({ totalUsers: 120, totalTransactions: 540 }) };

export default function HouseholdDashboard() {
  const navigate = useRouter();
  const user = { full_name: 'Utilisateur', role: 'user' };
  
  // Format the name slightly differently for style:
  // If the user's name contains spaces, we can split it or just display it as is.
  const displayName = user?.full_name || 'Producteur';

  const [stats, setStats] = useState({ activeLots: 0, totalCollected: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await dashboardService.getHouseholdStats();
        setStats({ activeLots: data.activeLots, totalCollected: data.totalCollected });
      } catch (error) {
        console.error("Erreur chargement stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex flex-col font-sans text-gray-900 pb-24">
      {/* Top Bar */}
      <div className="px-4 py-4 flex items-center justify-between sticky top-0 z-10 bg-[#FDFDFD]">
        <button className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors">
          <Menu className="w-6 h-6 text-gray-700" />
        </button>
        
        {/* Logo Ecoloop */}
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center mb-1">
            <span className="text-white font-bold text-lg leading-none">e</span>
          </div>
          <div className="text-[10px] font-black tracking-widest text-green-700">ECOLOOP</div>
        </div>

        <div className="w-10 h-10"></div> {/* Spacer */}
      </div>

      <div className="px-6 mt-4">
        {/* Header Section */}
        <div className="flex justify-between items-start mb-8">
          <div className="flex-1 pr-4">
            <h1 className="text-[32px] font-black text-[#0B1B2B] leading-tight mb-2 tracking-tight">
              Bonjour,<br />
              <span className="text-green-700">{displayName}</span>
            </h1>
            <p className="text-sm font-medium text-gray-500 leading-relaxed">
              Gérez simplement vos déchets et suivez leur valorisation.
            </p>
          </div>
          <div className="w-[120px] h-[90px] rounded-2xl overflow-hidden flex-shrink-0 shadow-sm border border-gray-100">
            <img 
              src="https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&q=80&w=300&h=200" 
              alt="École" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Publish Button */}
        <button 
          onClick={() => navigate.push('/producer/new-lot')}
          className="w-full bg-green-700 hover:bg-green-800 text-white font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-2 text-[17px] transition-all transform hover:-translate-y-1 shadow-[0_8px_20px_rgba(22,163,74,0.25)] mb-8"
        >
          <Plus className="w-5 h-5" strokeWidth={3} />
          Publier un lot
        </button>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {/* Card 1 */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3 border border-gray-100">
              <svg className="w-6 h-6 text-green-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <div className="text-xs font-bold text-gray-500 mb-1">Lots en cours</div>
            <div className="text-[32px] font-black text-green-700 leading-none">
              {loading ? '-' : stats.activeLots}
            </div>
          </div>
          {/* Card 2 */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mb-3 border border-green-100">
              <Check className="w-6 h-6 text-green-700" strokeWidth={3} />
            </div>
            <div className="text-xs font-bold text-gray-500 mb-1">Lots collectés</div>
            <div className="text-[32px] font-black text-green-700 leading-none">
              {loading ? '-' : stats.totalCollected}
            </div>
          </div>
        </div>

        {/* Recent Activity a été supprimé pour simplifier ou sera géré par l'historique complet */}
        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100">
          <button 
            onClick={() => navigate.push('/profile/history')}
            className="w-full pt-4 flex items-center justify-between text-green-700 font-bold text-sm hover:text-green-800 transition-colors"
          >
            Voir toute l'activité
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

