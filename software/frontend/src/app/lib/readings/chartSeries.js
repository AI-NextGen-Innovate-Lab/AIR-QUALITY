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
 * ✅ FULLY DYNAMIC BUCKETING:
 * - Keeps AQI (from PM2.5 / PM10 if available)
 * - Keeps ALL other measurements (VOC, pressure, temperature, etc.)
 */
export function buildBucketedSeries(rows, bucketMinutes = 30) {
  const ms = bucketMinutes * 60 * 1000;
  const buckets = new Map();

  for (const row of rows || []) {
    const t = new Date(row.time).getTime();
    if (Number.isNaN(t)) continue;

    const key = Math.floor(t / ms) * ms;

    let bucket = buckets.get(key);

    if (!bucket) {
      bucket = {
        ts: key,

        // PM accumulators for AQI
        pm25Sum: 0,
        pm25N: 0,
        pm10Sum: 0,
        pm10N: 0,

        // ALL measurements container
        values: {},
      };

      buckets.set(key, bucket);
    }

    const value = Number(row.value);
    if (Number.isNaN(value)) continue;

    //  AQI inputs
    if (isPM25Measurement(row)) {
      bucket.pm25Sum += value;
      bucket.pm25N += 1;
    } else if (isPM10Measurement(row)) {
      bucket.pm10Sum += value;
      bucket.pm10N += 1;
    }

   
    bucket.values[row.measurement] = value;
  }

  const sortedKeys = [...buckets.keys()].sort((a, b) => a - b);

  return sortedKeys.map((key) => {
    const b = buckets.get(key);

    const pm25 = b.pm25N ? b.pm25Sum / b.pm25N : undefined;
    const pm10 = b.pm10N ? b.pm10Sum / b.pm10N : undefined;

    const aqi = calculateAQI(pm25, pm10)?.value ?? null;

    return {
      time: key,
      timeLabel: new Date(key).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),

      // AQI fields
      PM25: pm25 !== undefined ? Number(pm25.toFixed(1)) : null,
      PM10: pm10 !== undefined ? Number(pm10.toFixed(1)) : null,
      AQI: aqi,

      // ALL SENSOR DATA SPREAD HERE
      ...b.values,
    };
  });
}

/**
 * Location comparison (keeps AQI only)
 */
export function buildLocationComparison(dataRows, maxLocations = 12) {
  const grouped = groupReadingsBySensor(dataRows);

  return grouped
    .map((s) => {
      const { pm25, pm10 } = sensorSummary(s);

      return {
        id: s.id,
        name: s.id,
        AQI: calculateAQI(pm25, pm10)?.value ?? 0,
        PM25: pm25 !== undefined ? Number(pm25.toFixed(1)) : null,
      };
    })
    .sort((a, b) => b.AQI - a.AQI)
    .slice(0, maxLocations);
}