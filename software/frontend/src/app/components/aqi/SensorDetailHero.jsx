import React from 'react';
import { ArrowLeft, Clock, MapPin, Download } from 'lucide-react';
import { formatSensorLabel } from '@/app/lib/sensorData';
import { formatRelativeMinutes } from '@/app/lib/sensors/sensorStatusModel';
import { Button } from '@/app/components/ui/button';
import { AqiValue } from './AqiValue';
import { SensorStatusBadge } from './SensorStatusBadge';
import { cn } from '@/app/lib/utils/cn';

export function SensorDetailHero({
  sensorId,
  aqi,
  lastUpdateMs,
  lat,
  lng,
  connStatus,
  loading,
  onBack,
  onExport,
  exportDisabled,
}) {
  const label = formatSensorLabel(sensorId);

  return (
    <div className="border-b border-border bg-surface-elevated">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          {onExport && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onExport}
              disabled={exportDisabled}
            >
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
          )}
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground truncate">
                {label}
              </h1>
              {connStatus && <SensorStatusBadge status={connStatus} />}
            </div>
            {label !== sensorId && (
              <p className="text-sm text-muted-foreground mt-1 truncate">{sensorId}</p>
            )}
            <div className="mt-4 flex flex-col sm:flex-row sm:flex-wrap gap-3 text-sm text-muted">
              <span className="inline-flex items-center gap-2">
                <MapPin className="w-4 h-4 text-brand-600 shrink-0" />
                {Math.abs(lat).toFixed(4)}°{lat < 0 ? 'S' : 'N'},{' '}
                {lng.toFixed(4)}°E
              </span>
              <span className="inline-flex items-center gap-2">
                <Clock className="w-4 h-4 shrink-0" />
                {loading
                  ? 'Loading…'
                  : lastUpdateMs
                    ? `Updated ${formatRelativeMinutes(lastUpdateMs)}`
                    : 'No recent data'}
              </span>
            </div>
          </div>
          <AqiValue value={aqi} size="md" className={cn(loading && 'opacity-50')} />
        </div>
      </div>
    </div>
  );
}
