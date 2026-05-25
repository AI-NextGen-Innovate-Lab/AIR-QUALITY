import React from 'react';
import { AQI_SCALE_SEGMENTS } from '@/app/lib/airQuality';
import { cn } from '@/app/lib/utils/cn';

export function AqiScaleBar({ className, showLabels = true, size = 'default' }) {
  const barHeight = size === 'lg' ? 'h-3 sm:h-4' : 'h-2.5';
  const labelSize = size === 'lg' ? 'text-xs sm:text-sm' : 'text-[10px]';

  return (
    <div className={cn('w-full', className)}>
      <div className={cn(barHeight, 'rounded-full overflow-hidden flex')}>
        {AQI_SCALE_SEGMENTS.map((seg) => (
          <div
            key={seg.themeKey}
            className="h-full flex-1"
            style={{ backgroundColor: seg.color }}
            title={seg.label}
          />
        ))}
      </div>
      {showLabels && (
        <div className={cn('flex justify-between text-muted-foreground mt-2 px-0.5', labelSize)}>
          <span>0</span>
          <span>50</span>
          <span>100</span>
          <span>150</span>
          <span>200</span>
          <span>300+</span>
        </div>
      )}
    </div>
  );
}
