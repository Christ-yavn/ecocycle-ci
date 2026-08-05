"use client";

import React from 'react';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-gray-50 rounded-2xl border border-gray-100 border-dashed">
      <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center text-gray-400 mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-deep-forest mb-2">{title}</h3>
      <p className="text-sm text-text-secondary max-w-md mb-6">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
