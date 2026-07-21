import React, { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { useAiPredictions } from '@/app/hooks/useAiPredictions';
import { extractDeviceSlug } from '@/app/lib/sensorData';
import { trendMeta } from '@/app/lib/aiTrend';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { LoadingBlock, ErrorBlock } from '@/app/components/data/DataState';
import { cn } from '@/app/lib/utils/cn';
import {
  chartAxisTick,
  chartAxisStroke,
  chartGridProps,
  chartLineBrand,
  chartTooltipStyle,
} from '@/app/lib/chartTheme';

/** Per-sensor 6h AQI forecast + trend, sourced from the AI prediction service. */
export function AqiForecastPanel({ sensorId, className }) {
  const { sensors, loading, error } = useAiPredictions();

  const prediction = useMemo(() => {
    const slug = extractDeviceSlug(sensorId);
    return sensors.find((s) => s.topic === slug || s.key === slug) ?? null;
  }, [sensors, sensorId]);

  const chartData = useMemo(() => {
    if (!prediction?.forecast_6h) return [];
    return prediction.forecast_6h.map((aqi, i) => ({
      label: `+${i + 1}h`,
      aqi: Math.round(aqi),
    }));
  }, [prediction]);

  if (loading) {
    return (
      <Card className={cn('border-border', className)}>
        <CardContent>
          <LoadingBlock message="Loading forecast…" />
        </CardContent>
      </Card>
    );
  }

  if (error || !prediction) {
    return (
      <Card className={cn('border-border', className)}>
        <CardContent>
          <ErrorBlock message={error ? 'AI forecast unavailable right now.' : 'No forecast for this sensor yet.'} />
        </CardContent>
      </Card>
    );
  }

  const { label, Icon, className: trendClassName } = trendMeta(prediction.trend_direction);

  return (
    <Card className={cn('border-border', className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">6-hour AI forecast</CardTitle>
        <span className={cn('inline-flex items-center gap-1.5 text-sm font-medium', trendClassName)}>
          <Icon className="h-4 w-4" />
          {label}
          {prediction.trend_confidence != null && (
            <span className="text-muted font-normal">· {Math.round(prediction.trend_confidence)}% confidence</span>
          )}
        </span>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={180} debounce={200}>
          <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={chartLineBrand} stopOpacity={0.35} />
                <stop offset="100%" stopColor={chartLineBrand} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid {...chartGridProps} vertical={false} />
            <XAxis dataKey="label" tick={chartAxisTick} axisLine={false} tickLine={false} stroke={chartAxisStroke} />
            <YAxis tick={chartAxisTick} axisLine={false} tickLine={false} width={32} stroke={chartAxisStroke} />
            <Tooltip contentStyle={chartTooltipStyle} formatter={(value) => [`AQI ${value}`, 'Forecast']} />
            <Area
              type="monotone"
              dataKey="aqi"
              stroke={chartLineBrand}
              strokeWidth={2}
              fill="url(#forecastGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
