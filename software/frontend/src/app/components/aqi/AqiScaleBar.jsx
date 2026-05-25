import React from 'react';
import { AQI_SCALE_SEGMENTS } from '@/app/lib/airQuality';
import { cn } from '@/app/lib/utils/cn';

export function AqiScaleBar({ className, showLabels = true }) {
  return (
    <div className={cn('w-full', className)}>
      <div className="h-2.5 rounded-full overflow-hidden flex">
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
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1 px-0.5">
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
