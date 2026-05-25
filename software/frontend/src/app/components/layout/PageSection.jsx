import React from 'react';
import { cn } from '@/app/lib/utils/cn';

export function PageSection({ title, description, action, children, className }) {
  return (
    <section className={cn('py-10 sm:py-12', className)}>
      {(title || description || action) && (
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            {title && (
              <h2 className="text-2xl font-bold text-foreground tracking-tight">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-2 text-muted max-w-2xl">{description}</p>
            )}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
