import { calculateAQI } from "@/app/lib/airQuality";
import {
  groupReadingsBySensor,
  isPM10Measurement,
  isPM25Measurement,
  sensorSummary,
} from "@/app/lib/sensorData";

export function filterRowsBySensor(rows, sensorId) {
  if (!sensorId) return rows;
  return rows.filter((r) => r.id === sensorId);
}

/**
 * Average PM2.5 / PM10 inside time buckets for one sensor (or all rows if unfiltered).
 */
export function buildBucketedSeries(rows, bucketMinutes = 30) {
  const ms = bucketMinutes * 60 * 1000;
  const buckets = new Map();

  for (const row of rows || []) {
    const t = new Date(row.time).getTime();
    if (Number.isNaN(t)) continue;
    const k = Math.floor(t / ms) * ms;
    let b = buckets.get(k);
    if (!b) {
      b = { pm25Sum: 0, pm25N: 0, pm10Sum: 0, pm10N: 0, ts: k };
      buckets.set(k, b);
    }
    const v = Number(row.value);
    if (Number.isNaN(v)) continue;
    if (isPM25Measurement(row)) {
      b.pm25Sum += v;
      b.pm25N += 1;
    } else if (isPM10Measurement(row)) {
      b.pm10Sum += v;
      b.pm10N += 1;
    }
  }

  const keys = [...buckets.keys()].sort((a, b) => a - b);
  return keys.map((k) => {
    const b = buckets.get(k);
    const pm25 = b.pm25N ? b.pm25Sum / b.pm25N : undefined;
    const pm10 = b.pm10N ? b.pm10Sum / b.pm10N : undefined;
    const aqi = calculateAQI(pm25, pm10).value;
    return {
      time: k,
      timeLabel: new Date(k).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      PM25: pm25 !== undefined ? Number(pm25.toFixed(1)) : null,
      PM10: pm10 !== undefined ? Number(pm10.toFixed(1)) : null,
      AQI: aqi,
    };
  });
}

export function buildLocationComparison(dataRows, maxLocations = 12) {
  const grouped = groupReadingsBySensor(dataRows);
  return grouped
    .map((s) => {
      const { pm25, pm10 } = sensorSummary(s);
      return {
        id: s.id,
        name: s.id,
        AQI: calculateAQI(pm25, pm10).value,
        PM25: pm25 !== undefined ? Number(pm25.toFixed(1)) : null,
      };
    })
    .sort((a, b) => b.AQI - a.AQI)
    .slice(0, maxLocations);
}
