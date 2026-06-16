import { calculateAQI, getAQICategory } from '@/app/lib/airQuality';
import { formatSensorLabel, sensorSummary, topicToLatLng } from '@/app/lib/sensorData';

export function registryByTopic(registry = []) {
  return new Map(registry.map((row) => [row.topic, row]));
}

export function resolveCoords(topic, registryRow) {
  if (registryRow?.latitude != null && registryRow?.longitude != null) {
    return { lat: registryRow.latitude, lng: registryRow.longitude };
  }
  return topicToLatLng(topic);
}

/**
 * Merge Influx reading groups with DB registry (label, coordinates, visibility).
 */
export function enrichSensorsForMap(readingSensors = [], registry = []) {
  const byTopic = registryByTopic(registry);

  return readingSensors.map((sensor) => {
    const meta = byTopic.get(sensor.id);
    const { lat, lng } = resolveCoords(sensor.id, meta);
    const { pm25, pm10 } = sensorSummary(sensor);
    const aqi = calculateAQI(pm25, pm10).value;

    return {
      ...sensor,
      label: formatSensorLabel(sensor.id, meta?.label),
      visibility: meta?.visibility ?? 'PUBLIC',
      lat,
      lng,
      aqi,
      category: getAQICategory(aqi),
    };
  });
}

/**
 * Build map markers from registry when owner has assigned sensors without recent readings.
 */
export function registryOnlyMapMarkers(registry = [], readingSensors = []) {
  const readingTopics = new Set(readingSensors.map((s) => s.id));

  return registry
    .filter((row) => !readingTopics.has(row.topic))
    .map((row) => {
      const { lat, lng } = resolveCoords(row.topic, row);
      return {
        id: row.topic,
        label: formatSensorLabel(row.topic, row.label),
        visibility: row.visibility,
        lat,
        lng,
        aqi: null,
        category: getAQICategory(0),
        measurements: [],
        lastUpdate: 0,
      };
    });
}
