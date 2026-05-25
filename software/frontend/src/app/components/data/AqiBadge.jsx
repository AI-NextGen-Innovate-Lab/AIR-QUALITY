import React from 'react';
import { getAQICategory } from '@/app/lib/airQuality';
import { cn } from '@/app/lib/utils/cn';

export function AqiBadge({ aqi, showLabel = true, className }) {
  const c = getAQICategory(Number(aqi) || 0);
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold',
        className
      )}
      style={{ backgroundColor: c.bgSoft, color: c.color }}
    >
      <span className="tabular-nums">{Math.round(Number(aqi) || 0)}</span>
      {showLabel && <span>{c.label}</span>}
    </span>
  );
}
