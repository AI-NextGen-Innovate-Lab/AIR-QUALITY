import React from 'react';
import { cn } from '@/app/lib/utils/cn';

export function PageHeader({ title, description, action, badge, className }) {
  return (
    <div
      className={cn(
        'mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between',
        className
      )}
    >
      <div>
        {badge && (
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700 mb-2">
            {badge}
          </p>
        )}
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="mt-2 text-muted max-w-2xl">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
