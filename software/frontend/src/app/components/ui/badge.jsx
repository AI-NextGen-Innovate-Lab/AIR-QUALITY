import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/app/lib/utils/cn';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-brand-100 text-brand-800',
        secondary: 'bg-surface text-muted border border-border',
        outline: 'border border-border-strong text-foreground',
        aqi: '',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export function Badge({ className, variant, children, ...props }) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props}>
      {children}
    </span>
  );
}

export { badgeVariants };
