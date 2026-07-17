import React from 'react';
import { cn } from '@/app/lib/utils/cn';

export function PollutantRow({ label, value, unit, className }) {
  const display =
    value === undefined || value === null
      ? '—'
      : typeof value === 'number'
        ? value.toFixed(1)
        : String(value);

  return (
    <div className={cn('flex justify-between items-baseline gap-4 text-sm', className)}>
      <span className="text-muted">{label}</span>
      <span className="font-semibold text-foreground tabular-nums">
        {display}
        {unit && display !== '—' ? (
          <span className="text-muted font-normal ml-1">{unit}</span>
        ) : null}
      </span>
    </div>
  );
}
