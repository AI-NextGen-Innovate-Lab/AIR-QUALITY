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
import { calculateAQI } from '@/app/lib/airQuality';
import { Card, CardContent } from '@/app/components/ui/card';

function bucketHourlyAqi(readings) {
  const buckets = new Map();

  for (const row of readings) {
    if (!row.time || row.value == null) continue;
    const t = new Date(row.time);
    if (Number.isNaN(t.getTime())) continue;
    const hourKey = new Date(t.getFullYear(), t.getMonth(), t.getDate(), t.getHours()).getTime();
    const metric = String(row.measurement || '').toLowerCase();
    if (!buckets.has(hourKey)) {
      buckets.set(hourKey, { pm25: [], pm10: [], time: hourKey });
    }
    const b = buckets.get(hourKey);
    const n = Number(row.value);
    if (!Number.isFinite(n)) continue;
    if (metric.includes('pm2.5') || metric.includes('pm25')) b.pm25.push(n);
    if (metric.includes('pm10')) b.pm10.push(n);
  }

  return [...buckets.values()]
    .sort((a, b) => a.time - b.time)
    .map((b) => {
      const avg = (arr) => (arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : undefined);
      const pm25 = avg(b.pm25);
      const pm10 = avg(b.pm10);
      const aqi = calculateAQI(pm25, pm10).value;
      return {
        time: b.time,
        label: new Date(b.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        aqi: Math.round(aqi),
      };
    });
}

export function AqiTrendChart({ readings = [], loading }) {
  const data = useMemo(() => bucketHourlyAqi(readings), [readings]);

  return (
    <Card className="border-zinc-800 bg-zinc-900">
      <CardContent className="p-4 sm:p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-zinc-100">City AQI trend</h3>
          <p className="text-sm text-zinc-500">Hourly average across all sensors (last 24h)</p>
        </div>
        {loading ? (
          <div className="flex h-[240px] items-center justify-center text-zinc-500">Loading chart…</div>
        ) : data.length === 0 ? (
          <div className="flex h-[240px] items-center justify-center text-zinc-500">No trend data yet</div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="aqiGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#27272a" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} width={32} />
              <Tooltip
                contentStyle={{
                  background: '#18181b',
                  border: '1px solid #3f3f46',
                  borderRadius: '12px',
                  color: '#fafafa',
                }}
                formatter={(value) => [`AQI ${value}`, 'Index']}
              />
              <Area
                type="monotone"
                dataKey="aqi"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#aqiGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export function countOfflineSensors(sensors) {
  const twoHoursMs = 2 * 60 * 60 * 1000;
  return sensors.filter((s) => !s.lastUpdate || Date.now() - s.lastUpdate > twoHoursMs).length;
}

export function countOnlineSensors(sensors) {
  return sensors.length - countOfflineSensors(sensors);
}
