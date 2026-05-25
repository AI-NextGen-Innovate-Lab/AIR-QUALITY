import React from 'react';
import { getAQICategory } from '@/app/lib/airQuality';
import { cn } from '@/app/lib/utils/cn';
import { Badge } from '@/app/components/ui/badge';

export function AqiValue({
  value,
  size = 'lg',
  showLabel = true,
  className,
  pulse = false,
}) {
  const n = Math.round(Number(value) || 0);
  const category = getAQICategory(n);

  const sizeClasses = {
    sm: { ring: 'h-20 w-20', value: 'text-3xl', pill: 'text-xs px-3 py-1' },
    md: { ring: 'h-28 w-28', value: 'text-5xl', pill: 'text-sm px-4 py-1.5' },
    lg: {
      ring: 'h-40 w-40 sm:h-44 sm:w-44',
      value: 'text-7xl sm:text-8xl',
      pill: 'text-base sm:text-lg px-5 py-2',
    },
  };
  const s = sizeClasses[size] ?? sizeClasses.lg;

  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      <div
        className={cn(
          'rounded-full flex items-center justify-center shadow-[var(--shadow-card-hover)] ring-4 ring-white/80 transition-transform duration-500',
          s.ring,
          pulse && 'pulse-soft'
        )}
        style={{ backgroundColor: category.color }}
        aria-label={`Air quality index ${n}, ${category.label}`}
      >
        <span
          className={cn('font-bold tabular-nums tracking-tight', s.value)}
          style={{ color: category.textColor }}
        >
          {n}
        </span>
      </div>
      {showLabel && (
        <Badge
          className={cn('border-0 font-semibold shadow-sm', s.pill)}
          style={{
            backgroundColor: category.color,
            color: category.textColor,
          }}
        >
          {category.label}
        </Badge>
      )}
    </div>
  );
}
