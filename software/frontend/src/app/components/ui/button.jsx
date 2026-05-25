import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/app/lib/utils/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-brand-600 text-white hover:bg-brand-700',
        secondary:
          'bg-surface-elevated text-foreground border border-border hover:bg-surface',
        ghost: 'text-muted hover:text-foreground hover:bg-surface',
        outline:
          'border border-border-strong bg-transparent text-foreground hover:bg-surface',
        destructive: 'bg-aqi-unhealthy text-white hover:opacity-90',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 rounded-lg px-3 text-xs',
        lg: 'h-11 px-6 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export function Button({
  className,
  variant,
  size,
  type = 'button',
  children,
  ...props
}) {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {children}
    </button>
  );
}

export { buttonVariants };
