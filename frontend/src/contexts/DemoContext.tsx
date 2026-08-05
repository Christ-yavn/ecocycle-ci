"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

export type DemoStep = 0 | 1 | 2 | 3 | 4 | 5;

// 0: Initial (Rien)
// 1: Lot ECO-00094 Publié (Producteur -> Collecteur alerté)
// 2: Mission Acceptée (Collecteur accepte)
// 3: Collecte en cours (En transit)
// 4: Centre de tri / Marketplace (L'industriel le voit)
// 5: Impact Mairie (+1 au dashboard)

interface DemoContextType {
  demoStep: DemoStep;
  setDemoStep: (step: DemoStep) => void;
  playAutoDemo: () => void;
  resetDemo: () => void;
  isAutoPlaying: boolean;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [demoStep, setDemoStepState] = useState<DemoStep>(() => {
    const saved = localStorage.getItem('ecoloop_demo_step');
    return saved ? (parseInt(saved) as DemoStep) : 0;
  });

  const [isAutoPlaying, setIsAutoPlaying] = useState(false);

  useEffect(() => {
    localStorage.setItem('ecoloop_demo_step', demoStep.toString());
  }, [demoStep]);

  const setDemoStep = (step: DemoStep) => {
    setDemoStepState(step);
  };

  const resetDemo = () => {
    setDemoStepState(0);
    setIsAutoPlaying(false);
  };

  const playAutoDemo = () => {
    if (isAutoPlaying) return;
    setIsAutoPlaying(true);
    setDemoStepState(0);

    const timeline = [
      { step: 1, delay: 2000 },
      { step: 2, delay: 6000 },
      { step: 3, delay: 10000 },
      { step: 4, delay: 14000 },
      { step: 5, delay: 18000 },
    ];

    timeline.forEach(({ step, delay }) => {
      setTimeout(() => {
        setDemoStepState(step as DemoStep);
        if (step === 5) setIsAutoPlaying(false);
      }, delay);
    });
  };

  return (
    <DemoContext.Provider value={{ demoStep, setDemoStep, playAutoDemo, resetDemo, isAutoPlaying }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (context === undefined) {
    throw new Error('useDemo must be used within a DemoProvider');
  }
  return context;
}
