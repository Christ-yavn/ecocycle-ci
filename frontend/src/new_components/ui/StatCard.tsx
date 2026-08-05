"use client";

import React from 'react';
import { Card } from './Card';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  colorClass?: string;
}

export function StatCard({ title, value, subtitle, icon, trend, colorClass = "text-ecoloop-green" }: StatCardProps) {
  return (
    <Card className="flex flex-col">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-text-secondary">{title}</h3>
        {icon && <div className={`${colorClass}`}>{icon}</div>}
      </div>
      
      <div className="mt-auto">
        <div className={`text-3xl font-extrabold font-heading mb-1 ${colorClass}`}>{value}</div>
        
        <div className="flex items-center gap-2">
          {trend && (
            <span className={`text-xs font-bold ${trend.isPositive ? 'text-green-600' : 'text-red-500'}`}>
              {trend.isPositive ? '+' : '-'}{trend.value}
            </span>
          )}
          {subtitle && <span className="text-sm text-text-secondary">{subtitle}</span>}
        </div>
      </div>
    </Card>
  );
}
