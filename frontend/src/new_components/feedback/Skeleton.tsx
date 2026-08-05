"use client";

import React from 'react';

type SkeletonProps = {
  className?: string;
  variant?: 'line' | 'card' | 'circle' | 'table-row';
  style?: React.CSSProperties;
};

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', variant = 'line', style }) => {
  const baseClass = 'animate-pulse bg-gray-200';
  let variantClass = '';

  switch (variant) {
    case 'card':
      variantClass = 'rounded-lg h-32 w-full';
      break;
    case 'circle':
      variantClass = 'rounded-full h-12 w-12';
      break;
    case 'table-row':
      variantClass = 'rounded-md h-12 w-full';
      break;
    case 'line':
    default:
      variantClass = 'rounded-md h-4 w-full';
      break;
  }

  return (
    <div 
      className={`${baseClass} ${variantClass} ${className}`} 
      style={style}
      aria-hidden="true"
    />
  );
};
