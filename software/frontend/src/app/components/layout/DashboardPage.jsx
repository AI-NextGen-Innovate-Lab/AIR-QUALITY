import React from 'react';
import { cn } from '@/app/lib/utils/cn';

export function DashboardPage({ children, className, narrow = false }) {
  return (
    <div className={cn('py-8 sm:py-10', className)}>
      <div
        className={cn(
          'mx-auto px-4 sm:px-6',
          narrow ? 'max-w-4xl' : 'max-w-7xl'
        )}
      >
        {children}
      </div>
    </div>
  );
}
