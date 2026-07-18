import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Maximize2 } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import { cn } from '@/app/lib/utils/cn';
import { formatSensorLabel } from '@/app/lib/sensorData';
import { DSM_CENTER, DSM_DEFAULT_ZOOM } from '@/app/lib/sensorLocations';
import { AqiLegend } from './AqiLegend';
import { MapFitBounds } from './MapFitBounds';
import { MapFocusSelected } from './MapFocusSelected';
import { createAqiIcon } from './createAqiIcon';

const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export function SensorMap({
  sensors = [],
  selectedId,
  onSelectSensor,
  onMarkerClick,
  height = 600,
  showLegend = true,
  showExpand,
  onExpand,
  className,
  interactive = true,
}) {
  const markers = useMemo(
    () =>
      sensors.map((sensor) => ({
        ...sensor,
        label: sensor.label || formatSensorLabel(sensor.id),
        icon: createAqiIcon(
          sensor.aqi,
          sensor.category,
          selectedId === sensor.id
        ),
      })),
    [sensors, selectedId]
  );

  return (
    <div
      className={cn(
        'relative rounded-xl overflow-hidden border border-border z-0',
        className
      )}
      style={{ height }}
    >
      <MapContainer
        center={[DSM_CENTER.lat, DSM_CENTER.lng]}
        zoom={DSM_DEFAULT_ZOOM}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={interactive}
        dragging={interactive}
        doubleClickZoom={interactive}
        zoomControl={interactive}
        className="z-0"
      >
        <TileLayer attribution={OSM_ATTRIBUTION} url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapFitBounds sensors={sensors} />
        {selectedId && <MapFocusSelected sensors={sensors} selectedId={selectedId} />}
        {markers.map((sensor) => (
          <Marker
            key={sensor.id}
            position={[sensor.lat, sensor.lng]}
            icon={sensor.icon}
            eventHandlers={{
              click: () => {
                onSelectSensor?.(sensor.id);
                onMarkerClick?.(sensor);
              },
            }}
          >
            {interactive && (
              <Popup>
                <div className="min-w-[140px] text-sm">
                  <p className="font-semibold text-foreground">{sensor.label}</p>
                  <p className="mt-1">
                    AQI:{' '}
                    <span className="font-bold" style={{ color: sensor.category.color }}>
                      {sensor.aqi}
                    </span>{' '}
                    <span className="text-muted">({sensor.category.label})</span>
                  </p>
                </div>
              </Popup>
            )}
          </Marker>
        ))}
      </MapContainer>

      {showExpand && onExpand && (
        <button
          type="button"
          onClick={onExpand}
          className="absolute top-3 right-3 z-[1000] flex items-center gap-2 rounded-xl bg-surface-elevated/95 border border-border px-3 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-brand-50 transition-colors"
        >
          <Maximize2 className="w-4 h-4" />
          Full map
        </button>
      )}

      {showLegend && (
        <AqiLegend className="absolute bottom-3 left-3 z-[1000] max-w-[200px]" compact />
      )}
    </div>
  );
}
