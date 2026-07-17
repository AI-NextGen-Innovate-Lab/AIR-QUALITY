import React from 'react';
import { AQI_SCALE_SEGMENTS } from '@/app/lib/airQuality';
import { cn } from '@/app/lib/utils/cn';

export function AqiLegend({ className, compact = false }) {
  return (
    <div className={cn('bg-surface-elevated/95 backdrop-blur rounded-xl border border-border p-4 shadow-[var(--shadow-card)]', className)}>
      <p className="text-sm font-semibold text-foreground mb-3">AQI scale (US EPA)</p>
      <div className={cn('space-y-2', compact ? 'text-[10px]' : 'text-xs')}>
        {AQI_SCALE_SEGMENTS.map((seg, i) => {
          const prev = AQI_SCALE_SEGMENTS[i - 1];
          const min = prev ? prev.max + 1 : 0;
          return (
            <div key={seg.themeKey} className="flex items-center gap-2 text-muted">
              <div
                className="w-3.5 h-3.5 rounded-full shrink-0 ring-1 ring-border"
                style={{ backgroundColor: seg.color }}
              />
              <span>
                {seg.label} ({min}–{seg.max})
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
