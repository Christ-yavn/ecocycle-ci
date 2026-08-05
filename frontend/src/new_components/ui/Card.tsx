"use client";

import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
}

export function Card({ 
  children, 
  padding = 'md', 
  hoverable = false,
  className = '',
  ...props 
}: CardProps) {
  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  const baseClasses = "bg-white rounded-2xl border border-gray-100 shadow-sm transition-all duration-200";
  const hoverClasses = hoverable ? "hover:border-gray-200 hover:shadow-md cursor-pointer" : "";

  return (
    <div className={`${baseClasses} ${hoverClasses} ${paddings[padding]} ${className}`} {...props}>
      {children}
    </div>
  );
}
