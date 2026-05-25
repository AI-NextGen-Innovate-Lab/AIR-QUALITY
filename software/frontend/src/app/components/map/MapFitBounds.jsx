import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { DSM_CENTER, DSM_DEFAULT_ZOOM } from '@/app/lib/sensorLocations';

export function MapFitBounds({ sensors = [] }) {
  const map = useMap();

  useEffect(() => {
    if (!sensors.length) {
      map.setView([DSM_CENTER.lat, DSM_CENTER.lng], DSM_DEFAULT_ZOOM);
      return;
    }

    const bounds = L.latLngBounds(
      sensors.map((s) => [s.lat, s.lng])
    );
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 15 });
  }, [map, sensors]);

  return null;
}
