import React from 'react';
import { cn } from '@/app/lib/utils/cn';

export function Card({ className, children, ...props }) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-border bg-surface-elevated shadow-[var(--shadow-card)]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }) {
  return (
    <div className={cn('px-6 pt-6 pb-2', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }) {
  return (
    <h3
      className={cn('text-lg font-semibold text-foreground tracking-tight', className)}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({ className, children, ...props }) {
  return (
    <p className={cn('text-sm text-muted mt-1', className)} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ className, children, ...props }) {
  return (
    <div className={cn('px-6 pb-6', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...props }) {
  return (
    <div
      className={cn(
        'flex items-center px-6 py-4 border-t border-border',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
