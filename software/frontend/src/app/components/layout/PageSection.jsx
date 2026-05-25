import React from 'react';
import { cn } from '@/app/lib/utils/cn';

export function PageSection({
  title,
  description,
  action,
  children,
  className,
  variant = 'default',
}) {
  const isDisplay = variant === 'display';

  return (
    <section className={cn('py-10 sm:py-14', className)}>
      {(title || description || action) && (
        <div
          className={cn(
            'flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10 animate-fade-in-up',
            isDisplay && 'mb-12'
          )}
        >
          <div>
            {title && (
              <h2
                className={cn(
                  'font-bold text-foreground tracking-tight leading-tight',
                  isDisplay
                    ? 'text-3xl sm:text-4xl lg:text-5xl'
                    : 'text-2xl sm:text-3xl'
                )}
              >
                {title}
              </h2>
            )}
            {description && (
              <p
                className={cn(
                  'mt-3 text-muted max-w-3xl leading-relaxed',
                  isDisplay ? 'text-lg sm:text-xl' : 'text-base sm:text-lg'
                )}
              >
                {description}
              </p>
            )}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
