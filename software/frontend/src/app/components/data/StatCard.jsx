import React from 'react';
import { cn } from '@/app/lib/utils/cn';
import { Card, CardContent } from '@/app/components/ui/card';

export function StatCard({
  icon: Icon,
  value,
  label,
  onClick,
  className,
  accent = 'brand',
  animationDelay = '',
}) {
  const accentIcon = {
    brand: 'bg-brand-50 text-brand-700',
    good: 'bg-aqi-good-soft text-aqi-good',
    map: 'bg-surface text-brand-700 ring-1 ring-border',
  };

  const content = (
    <>
      <div
        className={cn(
          'w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center shrink-0 pulse-soft',
          accentIcon[accent] ?? accentIcon.brand
        )}
      >
        {Icon && <Icon className="w-7 h-7 sm:w-8 sm:h-8" />}
      </div>
      <div className="min-w-0">
        <p className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground tabular-nums tracking-tight">
          {value}
        </p>
        <p className="text-base sm:text-lg text-muted mt-1 leading-snug">{label}</p>
      </div>
    </>
  );

  const cardClass = cn(
    'card-interactive animate-fade-in-up',
    animationDelay,
    onClick && 'cursor-pointer',
    className
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="w-full text-left">
        <Card className={cardClass}>
          <CardContent className="flex items-center gap-5 py-6 sm:py-8">{content}</CardContent>
        </Card>
      </button>
    );
  }

  return (
    <Card className={cardClass}>
      <CardContent className="flex items-center gap-5 py-6 sm:py-8">{content}</CardContent>
    </Card>
  );
}
