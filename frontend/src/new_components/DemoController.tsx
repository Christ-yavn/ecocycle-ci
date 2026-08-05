"use client";

import { useState } from 'react';
import { useDemo } from '@/contexts/DemoContext';
import type { DemoStep } from '@/contexts/DemoContext';
import { Play, RotateCcw, ChevronRight, Settings2, X, WifiOff, Wifi } from 'lucide-react';

export function DemoController() {
  const { demoStep, setDemoStep, playAutoDemo, resetDemo, isAutoPlaying } = useDemo();
  const [isOpen, setIsOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  const steps = [
    { id: 0 as DemoStep, label: '0. Init' },
    { id: 1 as DemoStep, label: '1. Publier Lot' },
    { id: 2 as DemoStep, label: '2. Accepter Mission' },
    { id: 3 as DemoStep, label: '3. Collecte / Transit' },
    { id: 4 as DemoStep, label: '4. Centre / Marketplace' },
    { id: 5 as DemoStep, label: '5. Mairie / Impact' }
  ];

  if (!isOpen) {
    return (
      <>
        {isOffline && (
          <div className="fixed top-16 left-0 right-0 z-[1000] bg-orange-50 text-orange-800 px-4 py-3 text-center shadow-sm flex flex-col items-center justify-center border-b border-orange-200">
            <div className="flex items-center gap-2 font-bold mb-1">
              <WifiOff size={18} /> Mode Offline Simulation
            </div>
            <p className="text-xs">Les actions sont sauvegardées localement. Synchronisation automatique au retour du réseau.</p>
          </div>
        )}
        <button 
          onClick={() => setIsOpen(true)}
          className="fixed bottom-24 right-4 z-[999] bg-black text-white p-3 rounded-full shadow-2xl flex items-center gap-2 hover:bg-gray-800 transition-colors"
        >
          <Settings2 size={20} />
        </button>
      </>
    );
  }

  return (
    <>
      {isOffline && (
        <div className="fixed top-16 left-0 right-0 z-[1000] bg-orange-50 text-orange-800 px-4 py-3 text-center shadow-sm flex flex-col items-center justify-center border-b border-orange-200">
          <div className="flex items-center gap-2 font-bold mb-1">
            <WifiOff size={18} /> Mode Offline Simulation
          </div>
          <p className="text-xs">Les actions sont sauvegardées localement. Synchronisation automatique au retour du réseau.</p>
        </div>
      )}
      <div className="fixed bottom-24 right-4 z-[999] bg-white border border-gray-200 p-4 rounded-2xl shadow-2xl w-72">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-sm text-gray-800 uppercase tracking-widest flex items-center gap-2">
          <Settings2 size={16} /> EcoLoop Demo
        </h3>
        <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-800">
          <X size={18} />
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        <button 
          onClick={playAutoDemo} 
          disabled={isAutoPlaying}
          className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-bold ${isAutoPlaying ? 'bg-gray-100 text-gray-400' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
        >
          {isAutoPlaying ? <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></div> : <Play size={14} />} Auto
        </button>
        <button 
          onClick={resetDemo}
          className="flex-1 flex items-center justify-center gap-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold"
        >
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="space-y-1">
        {steps.map(step => (
          <button
            key={step.id}
            onClick={() => setDemoStep(step.id)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-between transition-colors ${demoStep === step.id ? 'bg-green-100 text-green-800 font-bold border border-green-200' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            {step.label}
            {demoStep === step.id && <ChevronRight size={14} />}
          </button>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100">
        <button
          onClick={() => setIsOffline(!isOffline)}
          className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${isOffline ? 'bg-orange-100 text-orange-800 border border-orange-200' : 'text-gray-600 hover:bg-gray-50'}`}
        >
          {isOffline ? <WifiOff size={16} /> : <Wifi size={16} />}
          {isOffline ? 'Réseau faible détecté' : 'Tester connexion faible'}
        </button>
      </div>
    </div>
    </>
  );
}
