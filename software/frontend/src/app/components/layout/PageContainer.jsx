import React from 'react';
import { cn } from '@/app/lib/utils/cn';

/** Horizontal padding for edge-to-edge layouts (no max-width cap). */
export const pagePadding = 'px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12';

export function PageContainer({ children, className, as: Component = 'div' }) {
  return (
    <Component className={cn('w-full', pagePadding, className)}>
      {children}
    </Component>
  );
}
