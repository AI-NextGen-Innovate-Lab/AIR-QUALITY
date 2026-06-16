function measurementName(m) {
  return String(m?.measurement ?? '').toLowerCase();
}

export function isPM25Measurement(m) {
  const n = measurementName(m);
  return (
    n === 'pm2.5' ||
    n.includes('pm2.5') ||
    n.includes('pm2_5') ||
    n === 'pm25'
  );
}

export function isPM10Measurement(m) {
  const n = measurementName(m);
  if (!n.includes('pm10')) return false;
  if (n.includes('pm100') || n.includes('pm 100')) return false;
  // avoid matching pm2.5 as pm10
  if (n.includes('pm2')) return false;
  return true;
}

export function getLatestValue(measurements, predicate) {
  const list = (measurements || []).filter(predicate);
  if (!list.length) return undefined;
  list.sort((a, b) => new Date(b.time) - new Date(a.time));
  const v = list[0]?.value;
  return v === undefined || v === null ? undefined : Number(v);
}

/** Group server rows by `id` (Influx topic). */
export function groupReadingsBySensor(rows) {
  const map = new Map();
  for (const row of rows || []) {
    const id = row.id;
    if (!id) continue;
    if (!map.has(id)) map.set(id, []);
    map.get(id).push({
      measurement: row.measurement,
      value: row.value,
      time: row.time,
    });
  }
  return [...map.entries()].map(([id, measurements]) => ({
    id,
    measurements,
    lastUpdate: measurements.length
      ? Math.max(...measurements.map((m) => new Date(m.time).getTime()))
      : 0,
  }));
}

import { topicToLatLng, extractDeviceSlug, DSM_CENTER, FRIENDLY_LABELS } from '@/app/lib/sensorLocations';

export { topicToLatLng, extractDeviceSlug, DSM_CENTER, FRIENDLY_LABELS };

export function sensorSummary(sensor) {
  const pm25 = getLatestValue(sensor.measurements, isPM25Measurement);
  const pm10 = getLatestValue(sensor.measurements, isPM10Measurement);
  return { pm25, pm10, lastUpdate: sensor.lastUpdate };
}

/** Human-friendly label from registry name or MQTT topic slug */
export function formatSensorLabel(sensorId, registryLabel) {
  if (registryLabel && String(registryLabel).trim()) {
    return String(registryLabel).trim();
  }
  const slug = extractDeviceSlug(sensorId);
  if (FRIENDLY_LABELS[slug]) {
    return FRIENDLY_LABELS[slug];
  }
  if (!slug) return 'Unknown sensor';
  return slug
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
