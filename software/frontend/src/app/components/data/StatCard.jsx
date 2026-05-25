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
          'w-12 h-12 rounded-xl flex items-center justify-center shrink-0',
          accentIcon[accent] ?? accentIcon.brand
        )}
      >
        {Icon && <Icon className="w-6 h-6" />}
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-foreground tabular-nums">{value}</p>
        <p className="text-sm text-muted">{label}</p>
      </div>
    </>
  );

  const cardClass = cn(
    'transition-shadow hover:shadow-[var(--shadow-card-hover)]',
    onClick && 'cursor-pointer',
    className
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="w-full text-left">
        <Card className={cardClass}>
          <CardContent className="flex items-center gap-4 py-5">{content}</CardContent>
        </Card>
      </button>
    );
  }

  return (
    <Card className={cardClass}>
      <CardContent className="flex items-center gap-4 py-5">{content}</CardContent>
    </Card>
  );
}
