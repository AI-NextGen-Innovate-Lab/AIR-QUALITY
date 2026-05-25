import React from 'react';
import { ChevronRight } from 'lucide-react';
import { calculateAQI, getAQICategory } from '@/app/lib/airQuality';
import {
  getLatestValue,
  isPM25Measurement,
  isPM10Measurement,
} from '@/app/lib/sensorData';
import {
  connectionStatusFromLastMs,
  formatRelativeMinutes,
} from '@/app/lib/sensors/sensorStatusModel';
import { formatSensorLabel } from '@/app/lib/sensorData';
import { cn } from '@/app/lib/utils/cn';
import { Card, CardContent } from '@/app/components/ui/card';
import { AqiScaleBar } from '@/app/components/aqi/AqiScaleBar';
import { SensorStatusBadge } from '@/app/components/aqi/SensorStatusBadge';

export function LocationCard({
  sensorId,
  measurements = [],
  lastUpdate,
  onClick,
  className,
}) {
  const latestPM25 = getLatestValue(measurements, isPM25Measurement);
  const latestPM10 = getLatestValue(measurements, isPM10Measurement);
  const aqi = calculateAQI(latestPM25, latestPM10);
  const category = getAQICategory(aqi.value);
  const conn = connectionStatusFromLastMs(lastUpdate);
  const label = formatSensorLabel(sensorId);

  const inner = (
    <CardContent className="py-5">
      <div className="flex justify-between items-start gap-3 mb-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-foreground truncate">{label}</h3>
            <SensorStatusBadge status={conn} />
          </div>
          {label !== sensorId && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">{sensorId}</p>
          )}
          <p className="text-xs text-muted mt-1">
            Updated {formatRelativeMinutes(lastUpdate)}
          </p>
        </div>
        <div className="text-right shrink-0">
          <div
            className="text-4xl font-bold tabular-nums leading-none"
            style={{ color: category.color }}
          >
            {aqi.value}
          </div>
          <p
            className="text-xs font-semibold mt-1"
            style={{ color: category.color }}
          >
            {category.label}
          </p>
        </div>
      </div>

      <div className="space-y-2 text-sm mb-4">
        <div className="flex justify-between">
          <span className="text-muted">PM₂.₅</span>
          <span className="font-medium tabular-nums">
            {latestPM25 !== undefined ? `${latestPM25.toFixed(1)} µg/m³` : '—'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">Dominant</span>
          <span className="font-medium">{aqi.dominant}</span>
        </div>
      </div>

      <AqiScaleBar showLabels={false} />

      {onClick && (
        <p className="mt-4 text-xs font-medium text-brand-700 flex items-center gap-1 group-hover:gap-2 transition-all">
          View details
          <ChevronRight className="w-4 h-4" />
        </p>
      )}
    </CardContent>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'w-full text-left group rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2'
        )}
      >
        <Card className={cn('h-full transition-shadow hover:shadow-[var(--shadow-card-hover)] border-border', className)}>
          {inner}
        </Card>
      </button>
    );
  }

  return <Card className="border-border">{inner}</Card>;
}
