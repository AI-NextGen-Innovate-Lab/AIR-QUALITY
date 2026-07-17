import React from 'react';
import { calculateAQI, getAQICategory } from '@/app/lib/airQuality';
import {
  getLatestValue,
  isPM25Measurement,
  isPM10Measurement,
} from '@/app/lib/sensorData';
import { cn } from '@/app/lib/utils/cn';

const cardClass =
  'rounded-2xl border border-border bg-surface-elevated shadow-[var(--shadow-card)] p-6';

export function AQICard({ sensorId, measurements = [], onClick }) {
  const latestPM25 = getLatestValue(measurements, isPM25Measurement);
  const latestPM10 = getLatestValue(measurements, isPM10Measurement);

  const aqi = calculateAQI(latestPM25, latestPM10);
  const category = getAQICategory(aqi.value);

  const inner = (
    <>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Air Quality Index</h3>
          <p className="text-sm text-muted">{sensorId || 'Live Sensor'}</p>
        </div>
        <div className="text-right">
          <div
            className="text-5xl font-bold"
            style={{ color: category.color }}
          >
            {aqi.value}
          </div>
          <div className="text-sm font-medium" style={{ color: category.color }}>
            {category.label}
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted">
            PM<sub>2.5</sub> (ATM)
          </span>
          <span className="font-medium text-foreground">
            {latestPM25 !== undefined ? latestPM25.toFixed(1) : '--'} µg/m³
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted">
            PM<sub>10</sub> (ATM)
          </span>
          <span className="font-medium text-foreground">
            {latestPM10 !== undefined ? latestPM10.toFixed(1) : '--'} µg/m³
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted">Dominant Pollutant</span>
          <span className="font-medium text-foreground">{aqi.dominant}</span>
        </div>
      </div>

      <div className="mt-8 h-3 rounded-full overflow-hidden bg-border flex">
        <div className="h-full w-[20%] bg-aqi-good" />
        <div className="h-full w-[20%] bg-aqi-moderate" />
        <div className="h-full w-[20%] bg-aqi-sensitive" />
        <div className="h-full w-[20%] bg-aqi-unhealthy" />
        <div className="h-full w-[20%] bg-aqi-very-unhealthy" />
      </div>
      <div className="flex justify-between text-[10px] text-muted mt-1">
        <span>0</span>
        <span>50</span>
        <span>100</span>
        <span>150</span>
        <span>200</span>
        <span>300+</span>
      </div>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          cardClass,
          'text-left w-full hover:shadow-[var(--shadow-card-hover)] transition-shadow cursor-pointer'
        )}
      >
        {inner}
      </button>
    );
  }

  return <div className={cardClass}>{inner}</div>;
}

export default AQICard;
