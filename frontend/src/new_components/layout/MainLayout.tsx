"use client";

import { useRouter, usePathname } from 'next/navigation';
import { Home, Clock, UserCircle, Bell, Check, Trash2, X, Lock, Map, Camera, Briefcase, ShoppingBag } from 'lucide-react';

import { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';


// Mock Notifications
const INITIAL_NOTIFICATIONS = [
  { id: 1, type: 'mission', title: 'Nouvelle mission disponible', desc: 'Collecte de 50kg de PET à proximité.', time: 'Il y a 5 min', read: false },
  { id: 2, type: 'success', title: 'Collecte validée', desc: 'Votre lot a été réceptionné par l\'industriel.', time: 'Il y a 2 h', read: false },
  { id: 3, type: 'reward', title: 'Récompense obtenue', desc: 'Vous avez reçu 500 points EcoLoop.', time: 'Hier', read: true },
  { id: 4, type: 'ai', title: 'Analyse IA terminée', desc: 'Votre déchet a été identifié comme HDPE.', time: 'Hier', read: true },
];

export function MainLayout({ children, user }: { children: React.ReactNode, user: any }) {
  const pathname = usePathname();
  const navigate = useRouter();
  const logout = async () => { await fetch('/api/auth/logout', { method: 'POST' }); window.location.href = '/login'; };
  
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: number) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const markAsRead = (id: number) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const userRole = user?.role?.toLowerCase() || '';

  // Determine the correct dashboard path per role
  const dashboardPath = (() => {
    switch (userRole) {
      case 'collecteur': return '/collector/dashboard';
      case 'producteur': return '/household/dashboard';
      case 'industriel': return '/recycler/dashboard';
      case 'mairie': return '/municipality/dashboard';
      default: return '/dashboard';
    }
  })();

  // Base Nav Items depending on role
  let baseNavItems = [];
  if (userRole === 'collecteur') {
    baseNavItems = [
      { label: 'Accueil', path: dashboardPath, icon: <Home size={24} /> },
      { label: 'Missions', path: '/missions', icon: <Briefcase size={24} /> },
      { label: 'Carte', path: '/collector/map', icon: <Map size={24} /> },
      { label: 'Profil', path: '/profile', icon: <UserCircle size={24} /> }
    ];
  } else if (userRole === 'producteur') {
    baseNavItems = [
      { label: 'Accueil', path: dashboardPath, icon: <Home size={24} /> },
      { label: 'Lots', path: '/producer/reports', icon: <Briefcase size={24} /> },
      { label: 'Historique', path: '/profile/history', icon: <Clock size={24} /> },
      { label: 'Profil', path: '/profile', icon: <UserCircle size={24} /> }
    ];
  } else if (userRole === 'industriel') {
    baseNavItems = [
      { label: 'Accueil', path: dashboardPath, icon: <Home size={24} /> },
      { label: 'Marketplace', path: '/recycler/marketplace', icon: <ShoppingBag size={24} /> },
      { label: 'Offres', path: '/recycler/offers', icon: <Briefcase size={24} /> },
      { label: 'Profil', path: '/profile', icon: <UserCircle size={24} /> }
    ];
  } else {
    // Generic / Default
    baseNavItems = [
      { label: 'Accueil', path: dashboardPath, icon: <Home size={24} /> },
      { label: 'Activité', path: '/activity', icon: <Clock size={24} /> },
      { label: 'Profil', path: '/profile', icon: <UserCircle size={24} /> }
    ];
  }

  const isActive = (path: string) => {
    if (path === dashboardPath) {
      return pathname === path;
    }
    return pathname.startsWith(path);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-[260px] bg-white border-r border-gray-100 fixed inset-y-0 left-0 z-40">
        <div className="p-6">
          <Link to="/">
            <img src="/logo.png" alt="EcoLoop" className="h-16 mb-3" />
          </Link>
          <p className="text-xs text-gray-500 font-medium leading-relaxed">Le bon déchet, au bon endroit, au bon moment</p>
        </div>
        
        <nav className="flex-1 px-3 mt-4 space-y-1">
          {baseNavItems.map((item, idx) => {
            const active = isActive(item.path);
            return (
              <Link 
                key={idx} 
                to={item.path} 
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  active 
                    ? 'bg-green-50 text-green-700 border-l-4 border-green-600' 
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 border-l-4 border-transparent'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 mt-auto">
          <button onClick={logout} className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors mb-4">
            <span className="truncate">Déconnexion</span>
          </button>
          
          <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-2 border border-gray-100">
            <Lock size={16} className="text-green-600 flex-shrink-0" />
            <span className="text-xs text-gray-600 font-medium">Vos données sont sécurisées</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-[260px] flex flex-col min-h-screen pb-20 md:pb-0">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-100 h-16 flex items-center justify-between px-4 md:px-6 sticky top-0 z-30">
          
          {/* Mobile Logo */}
          <div className="md:hidden flex items-center gap-2">
            <img src="/logo.png" alt="EcoLoop Logo" className="h-14 w-auto" />
          </div>

          <div className="flex items-center gap-4 ml-auto">
            
            {/* Demo badge hidden on mobile to save space, but visible on desktop */}
            <div className="hidden md:flex items-center gap-1.5 bg-white text-ecoloop-green px-3 py-1.5 rounded-full text-xs font-bold shadow-sm border border-gray-100 cursor-help" title="EcoLoop Demo Environment">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Demo Live
            </div>

            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button 
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                )}
              </button>

              <AnimatePresence>
                {isNotifOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-2xl shadow-xl border border-gray-100 flex flex-col z-50 overflow-hidden"
                  >
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white">
                      <h3 className="font-bold text-base text-gray-900">Notifications</h3>
                      {unreadCount > 0 && (
                        <button onClick={markAllAsRead} className="text-xs font-medium text-green-600 hover:underline">
                          Tout marquer lu
                        </button>
                      )}
                    </div>
                    
                    <div className="max-h-[300px] overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-gray-500">
                          <Bell size={32} className="mx-auto mb-2 opacity-20" />
                          <p className="text-sm">Aucune notification.</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-50">
                          {notifications.map(n => (
                            <div key={n.id} className={`p-4 flex gap-3 hover:bg-gray-50 transition-colors cursor-pointer ${!n.read ? 'bg-green-50/30' : ''}`} onClick={() => markAsRead(n.id)}>
                              <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${!n.read ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                {n.type === 'mission' && <Map size={14} />}
                                {n.type === 'success' && <Check size={14} />}
                                {n.type === 'reward' && <span className="font-bold text-[10px]">pts</span>}
                                {n.type === 'ai' && <Camera size={14} />}
                              </div>
                              <div className="flex-1">
                                <h4 className={`text-sm ${!n.read ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>{n.title}</h4>
                                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.desc}</p>
                                <span className="text-[10px] text-gray-400 mt-1 block">{n.time}</span>
                              </div>
                              <button 
                                onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                                className="text-gray-300 hover:text-red-500 p-1 opacity-0 hover:opacity-100 transition-opacity"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Profile Dropdown Trigger */}
            <Link to="/profile" className="flex items-center gap-2 cursor-pointer pl-2 border-l border-gray-200">
              <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-sm uppercase">
                {user?.full_name?.charAt(0) || 'U'}
              </div>
              <span className="hidden md:flex items-center text-sm font-medium text-gray-700">
                {user?.full_name || 'E Esmel'}
                <svg className="w-4 h-4 ml-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </Link>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 w-full max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center px-2 pb-safe pt-1 h-[68px] z-40">
        {baseNavItems.map((item, idx) => {
          const active = isActive(item.path);
          return (
            <Link 
              key={idx} 
              to={item.path} 
              className={`flex flex-col items-center gap-1 p-2 flex-1 transition-colors ${
                active ? 'text-green-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <div className={`${active ? 'bg-green-50 p-1.5 rounded-full' : 'p-1.5'}`}>
                {item.icon}
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      
    </div>
  );
}



