import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

export function MapFocusSelected({ sensors = [], selectedId }) {
  const map = useMap();

  useEffect(() => {
    if (!selectedId) return;
    const sensor = sensors.find((s) => s.id === selectedId);
    if (!sensor) return;
    map.flyTo([sensor.lat, sensor.lng], Math.max(map.getZoom(), 14), {
      duration: 0.4,
    });
  }, [map, selectedId, sensors]);

  return null;
}
