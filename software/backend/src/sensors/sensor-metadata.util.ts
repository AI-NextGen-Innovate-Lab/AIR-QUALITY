const FRIENDLY_LABELS: Record<string, string> = {
  'lands-building': 'Lands Building',
  'planing-building': 'Planning Building',
  'planning-building': 'Planning Building',
  'bme680-ph-dox-full-sensor-test': 'BME680 Test',
};

const KNOWN_LOCATIONS: Record<string, { latitude: number; longitude: number }> = {
  'lands-building': { latitude: -6.7738, longitude: 39.2262 },
  'planing-building': { latitude: -6.7752, longitude: 39.2278 },
  'planning-building': { latitude: -6.7752, longitude: 39.2278 },
  'bme680-ph-dox-full-sensor-test': { latitude: -6.7741, longitude: 39.2255 },
};

export function extractDeviceSlug(topic: string): string {
  const parts = String(topic || '').split('/').filter(Boolean);
  const upIdx = parts.lastIndexOf('up');
  if (upIdx > 0) return parts[upIdx - 1];
  return parts[parts.length - 1] || '';
}

export function labelFromTopic(topic: string): string {
  const slug = extractDeviceSlug(topic);
  if (FRIENDLY_LABELS[slug]) {
    return FRIENDLY_LABELS[slug];
  }
  if (!slug) return 'Sensor';
  return slug
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function coordsFromTopic(topic: string) {
  const slug = extractDeviceSlug(topic);
  return KNOWN_LOCATIONS[slug] ?? null;
}
