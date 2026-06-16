/** Dar es Salaam city center (for default map view) */
export const DSM_CENTER = { lat: -6.7924, lng: 39.2083 };
export const DSM_DEFAULT_ZOOM = 12;

/** Friendly display names for known device slugs */
export const FRIENDLY_LABELS = {
  'lands-building': 'Lands Building',
  'planing-building': 'Planning Building',
  'planning-building': 'Planning Building',
  'bme680-ph-dox-full-sensor-test': 'BME680 Test',
};

/**
 * Approximate coordinates for known TTN device ids (UDSM / project sites).
 * Update these when you have surveyed GPS for each sensor.
 */
const KNOWN_LOCATIONS = {
  'lands-building': { lat: -6.7738, lng: 39.2262 },
  'planing-building': { lat: -6.7752, lng: 39.2278 },
  'planning-building': { lat: -6.7752, lng: 39.2278 },
  'bme680-ph-dox-full-sensor-test': { lat: -6.7741, lng: 39.2255 },
};

export function extractDeviceSlug(topicId) {
  const parts = String(topicId || '').split('/').filter(Boolean);
  const upIdx = parts.lastIndexOf('up');
  if (upIdx > 0) return parts[upIdx - 1];
  return parts[parts.length - 1] || '';
}

/**
 * Resolve map position from MQTT topic. Known devices use fixed coords;
 * others get a stable point spread across the city until GPS is added.
 */
export function topicToLatLng(topicId) {
  const slug = extractDeviceSlug(topicId);
  const known = KNOWN_LOCATIONS[slug];
  if (known) return { lat: known.lat, lng: known.lng };

  const s = String(topicId);
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h, 33) ^ s.charCodeAt(i);
  }
  const u = (Math.abs(h) % 10000) / 10000;
  const v = (Math.abs(h >> 8) % 10000) / 10000;
  return {
    lat: DSM_CENTER.lat - 0.08 + u * 0.16,
    lng: DSM_CENTER.lng - 0.08 + v * 0.16,
  };
}
