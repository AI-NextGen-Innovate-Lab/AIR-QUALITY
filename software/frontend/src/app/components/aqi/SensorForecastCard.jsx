import React, { useState } from 'react';
import { trendMeta } from '@/app/lib/aiTrend';
import { FORECAST_METRICS } from '@/app/lib/aiMetrics';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { ForecastLineChart } from './ForecastLineChart';
import { tabBtn } from '@/app/lib/dashboardStyles';
import { cn } from '@/app/lib/utils/cn';

/** One sensor's 6h AQI/PM2.5/PM10 forecast, with a trend badge and a metric tab switcher. */
export function SensorForecastCard({ sensor }) {
  const [metricKey, setMetricKey] = useState('aqi');
  const metric = FORECAST_METRICS.find((m) => m.key === metricKey) ?? FORECAST_METRICS[0];
  const { label: trendLabel, Icon: TrendIcon, className: trendClassName } = trendMeta(sensor.trend_direction);

  return (
    <Card className="border-border">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">{sensor.label}</CardTitle>
        <span className={cn('inline-flex items-center gap-1.5 text-sm font-medium', trendClassName)}>
          <TrendIcon className="h-4 w-4" />
          {trendLabel}
          {sensor.trend_confidence != null && (
            <span className="text-muted font-normal">· {Math.round(sensor.trend_confidence)}% confidence</span>
          )}
        </span>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex gap-2">
          {FORECAST_METRICS.map((m) => (
            <button
              key={m.key}
              type="button"
              className={tabBtn(metricKey === m.key)}
              onClick={() => setMetricKey(m.key)}
            >
              {m.label}
            </button>
          ))}
        </div>
        <ForecastLineChart
          values={sensor[metric.field] ?? []}
          label={metric.label}
          unit={metric.unit}
          color={metric.color}
        />
      </CardContent>
    </Card>
  );
}
