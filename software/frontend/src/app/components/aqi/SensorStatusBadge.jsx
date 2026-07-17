import React from 'react';
import { cn } from '@/app/lib/utils/cn';

const STATUS_STYLES = {
  live: 'bg-aqi-good-soft text-brand-800 ring-aqi-good/30',
  stale: 'bg-aqi-moderate-soft text-amber-900 ring-aqi-moderate/30',
  offline: 'bg-surface text-muted ring-border',
};

export function SensorStatusBadge({ status }) {
  const key = status?.key ?? 'offline';
  const label = status?.label ?? 'Unknown';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset',
        STATUS_STYLES[key] ?? STATUS_STYLES.offline
      )}
    >
      <span
        className={cn('h-1.5 w-1.5 rounded-full', status?.dotClass ?? 'bg-muted-foreground')}
      />
      {label}
    </span>
  );
}
