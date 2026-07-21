import React, { useId } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import {
  chartAxisTick,
  chartAxisStroke,
  chartGridProps,
  chartTooltipStyle,
} from '@/app/lib/chartTheme';

/**
 * A 6-hour forecast area chart for one metric (AQI, PM2.5, PM10, ...).
 * `values` is the raw forecast array (e.g. forecast_6h); each entry becomes "+Nh".
 */
export function ForecastLineChart({ values = [], label, unit = '', color, height = 180 }) {
  const gradientId = useId();
  const data = values.map((value, i) => ({
    label: `+${i + 1}h`,
    value: Math.round(value * 100) / 100,
  }));

  if (!data.length) {
    return (
      <div className="flex h-[180px] items-center justify-center text-sm text-muted">
        No forecast data
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height} debounce={200}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid {...chartGridProps} vertical={false} />
        <XAxis dataKey="label" tick={chartAxisTick} axisLine={false} tickLine={false} stroke={chartAxisStroke} />
        <YAxis tick={chartAxisTick} axisLine={false} tickLine={false} width={36} stroke={chartAxisStroke} />
        <Tooltip
          contentStyle={chartTooltipStyle}
          formatter={(value) => [`${value}${unit}`, label]}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill={`url(#${gradientId})`}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
