"use client";

import React from 'react';
import { Skeleton } from './Skeleton';

type LoadingStateProps = {
  message?: string;
  fullPage?: boolean;
};

export const LoadingState: React.FC<LoadingStateProps> = ({ message = 'Chargement en cours...', fullPage = false }) => {
  const containerClass = fullPage 
    ? 'flex flex-col items-center justify-center min-h-[500px] w-full p-8'
    : 'flex flex-col items-center justify-center py-12 w-full';

  return (
    <div className={containerClass} aria-live="polite" aria-busy="true">
      <div className="w-full max-w-4xl space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-2 w-1/3">
            <Skeleton className="w-3/4 h-8" />
            <Skeleton className="w-1/2" />
          </div>
          <Skeleton variant="circle" className="h-10 w-10" />
        </div>
        
        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Skeleton variant="card" className="h-24" />
          <Skeleton variant="card" className="h-24" />
          <Skeleton variant="card" className="h-24" />
          <Skeleton variant="card" className="h-24" />
        </div>
        
        {/* Main Content Area Skeleton */}
        <div className="space-y-4">
          <Skeleton variant="table-row" />
          <Skeleton variant="table-row" />
          <Skeleton variant="table-row" />
        </div>
        
        <p className="text-center text-secondary mt-8 animate-pulse">{message}</p>
      </div>
    </div>
  );
};
