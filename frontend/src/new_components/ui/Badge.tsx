"use client";

import React from 'react';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  icon?: React.ReactNode;
  className?: string;
}

export function Badge({ children, variant = 'neutral', icon, className = '' }: BadgeProps) {
  const variants: Record<BadgeVariant, string> = {
    success: 'bg-green-50 text-ecoloop-green border border-green-100',
    warning: 'bg-orange-50 text-orange-600 border border-orange-100',
    error: 'bg-red-50 text-red-600 border border-red-100',
    info: 'bg-blue-50 text-blue-600 border border-blue-100',
    neutral: 'bg-gray-50 text-gray-600 border border-gray-100'
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${variants[variant]} ${className}`}>
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </span>
  );
}
