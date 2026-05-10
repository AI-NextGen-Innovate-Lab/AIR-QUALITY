function measurementName(m) {
  return String(m?.measurement ?? '').toLowerCase();
}

export function isPM25Measurement(m) {
  const n = measurementName(m);
  return n.includes('pm2.5') || n.includes('pm2_5');
}

export function isPM10Measurement(m) {
  const n = measurementName(m);
  if (!n.includes('pm10')) return false;
  if (n.includes('pm100') || n.includes('pm 100')) return false;
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

/**
 * Stable pseudo-coordinates inside Dar es Salaam bounds (topics have no lat/lng in API).
 */
export function topicToLatLng(topicId) {
  const s = String(topicId);
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h, 33) ^ s.charCodeAt(i);
  }
  const u = (Math.abs(h) % 10000) / 10000;
  const v = (Math.abs(h >> 8) % 10000) / 10000;
  return {
    lat: -6.88 + u * 0.2,
    lng: 39.18 + v * 0.15,
  };
}

export function sensorSummary(sensor) {
  const pm25 = getLatestValue(sensor.measurements, isPM25Measurement);
  const pm10 = getLatestValue(sensor.measurements, isPM10Measurement);
  return { pm25, pm10, lastUpdate: sensor.lastUpdate };
}
