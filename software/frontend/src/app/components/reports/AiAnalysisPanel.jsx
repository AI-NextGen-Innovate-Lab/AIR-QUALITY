import React, { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { useAiHistory } from '@/app/hooks/useAiHistory';
import { useAiPredictions } from '@/app/hooks/useAiPredictions';
import { HISTORY_METRICS, HISTORY_RANGES } from '@/app/lib/aiMetrics';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { SensorForecastCard } from '@/app/components/aqi/SensorForecastCard';
import { LoadingBlock, ErrorBlock } from '@/app/components/data/DataState';
import { tabBtn } from '@/app/lib/dashboardStyles';
import {
  chartAxisTick,
  chartAxisStroke,
  chartGridProps,
  chartTooltipStyle,
} from '@/app/lib/chartTheme';

function formatBucketLabel(timestamp, hours) {
  const d = new Date(timestamp);
  if (hours <= 24) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (hours <= 168) return d.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function HistorySection() {
  const [rangeKey, setRangeKey] = useState('24h');
  const [metricKey, setMetricKey] = useState('aqi');
  const range = HISTORY_RANGES.find((r) => r.key === rangeKey) ?? HISTORY_RANGES[0];
  const metric = HISTORY_METRICS.find((m) => m.key === metricKey) ?? HISTORY_METRICS[0];
  const { data, loading, error } = useAiHistory(range.hours);

  const chartData = useMemo(
    () =>
      data.map((row) => ({
        label: formatBucketLabel(row.timestamp, range.hours),
        value: row[metric.key],
      })),
    [data, range.hours, metric.key]
  );

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            {HISTORY_RANGES.map((r) => (
              <button key={r.key} type="button" className={tabBtn(rangeKey === r.key)} onClick={() => setRangeKey(r.key)}>
                {r.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {HISTORY_METRICS.map((m) => (
              <button key={m.key} type="button" className={tabBtn(metricKey === m.key)} onClick={() => setMetricKey(m.key)}>
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <LoadingBlock message="Loading history…" />
        ) : error ? (
          <ErrorBlock message="AI history unavailable right now — please try again shortly." />
        ) : !chartData.length ? (
          <ErrorBlock message="No history data for this range yet." />
        ) : (
          <ResponsiveContainer width="100%" height={300} debounce={200}>
            <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid {...chartGridProps} />
              <XAxis dataKey="label" tick={chartAxisTick} axisLine={false} tickLine={false} stroke={chartAxisStroke} />
              <YAxis tick={chartAxisTick} axisLine={false} tickLine={false} width={36} stroke={chartAxisStroke} />
              <Tooltip contentStyle={chartTooltipStyle} formatter={(value) => [`${value}${metric.unit}`, metric.label]} />
              <Line type="monotone" dataKey="value" stroke={metric.color} strokeWidth={2} dot={false} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

function ForecastSection() {
  const { sensors, loading, error } = useAiPredictions();

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">6-hour forecast</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <LoadingBlock message="Loading forecast…" />
        ) : error ? (
          <ErrorBlock message="AI forecast unavailable right now — please try again shortly." />
        ) : !sensors.length ? (
          <ErrorBlock message="No sensors have predictions yet." />
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {sensors.map((sensor) => (
              <SensorForecastCard key={sensor.key} sensor={sensor} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AiAnalysisPanel() {
  return (
    <div className="space-y-6">
      <HistorySection />
      <ForecastSection />
    </div>
  );
}
