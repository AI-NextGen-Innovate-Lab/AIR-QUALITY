import React, { useMemo } from 'react';
import { Maximize2 } from 'lucide-react';
import { cn } from '@/app/lib/utils/cn';
import { AqiLegend } from './AqiLegend';

const CENTER_LAT = -6.8;
const CENTER_LNG = 39.25;
const MAP_WIDTH = 1200;
const MAP_HEIGHT = 800;

function latToY(lat) {
  const latRange = 0.2;
  return ((CENTER_LAT - lat) / latRange) * (MAP_HEIGHT / 2) + MAP_HEIGHT / 2;
}

function lngToX(lng) {
  const lngRange = 0.15;
  return ((lng - CENTER_LNG) / lngRange) * (MAP_WIDTH / 2) + MAP_WIDTH / 2;
}

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
}) {
  const markers = useMemo(
    () =>
      sensors.map((s) => ({
        ...s,
        x: lngToX(s.lng),
        y: latToY(s.lat),
      })),
    [sensors]
  );

  return (
    <div
      className={cn(
        'relative rounded-xl overflow-hidden bg-gradient-to-br from-brand-50 to-surface border border-border',
        className
      )}
      style={{ height }}
    >
      <div className="absolute inset-0">
        <svg
          viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
          className="w-full h-full"
          preserveAspectRatio="xMidYMid slice"
        >
          <path
            d="M 900 100 Q 850 200 900 300 L 900 700 Q 800 750 700 700 L 300 700 Q 200 650 150 500 L 150 300 Q 200 200 300 150 L 700 100 Q 800 80 900 100 Z"
            fill="#ecfdf5"
            stroke="#5eead4"
            strokeWidth="2"
          />
          <circle cx="600" cy="400" r="80" fill="#f0fdfa" opacity="0.8" />
          <circle cx="500" cy="500" r="60" fill="#ccfbf1" opacity="0.6" />
          <line
            x1="300"
            y1="400"
            x2="800"
            y2="400"
            stroke="#cbd5e1"
            strokeWidth="2"
            opacity="0.5"
          />
          <line
            x1="600"
            y1="200"
            x2="600"
            y2="600"
            stroke="#cbd5e1"
            strokeWidth="2"
            opacity="0.5"
          />
        </svg>

        {markers.map((sensor) => {
          const { category } = sensor;
          const isSelected = selectedId === sensor.id;
          const leftPct = (sensor.x / MAP_WIDTH) * 100;
          const topPct = (sensor.y / MAP_HEIGHT) * 100;

          return (
            <button
              key={sensor.id}
              type="button"
              className="absolute transform -translate-x-1/2 -translate-y-1/2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-full"
              style={{ left: `${leftPct}%`, top: `${topPct}%` }}
              onClick={() => {
                onSelectSensor?.(sensor.id);
                onMarkerClick?.(sensor);
              }}
              aria-label={`${sensor.id}, AQI ${sensor.aqi}`}
            >
              {isSelected && (
                <span
                  className="absolute -inset-2 rounded-full animate-ping opacity-60"
                  style={{ backgroundColor: category.color }}
                />
              )}
              <span
                className={cn(
                  'relative flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full border-2 border-white shadow-md font-bold text-xs sm:text-sm transition-transform',
                  isSelected && 'scale-110'
                )}
                style={{
                  backgroundColor: category.color,
                  color: category.textColor,
                }}
              >
                {sensor.aqi}
              </span>
            </button>
          );
        })}
      </div>

      {showExpand && onExpand && (
        <button
          type="button"
          onClick={onExpand}
          className="absolute top-3 right-3 flex items-center gap-2 rounded-xl bg-surface-elevated/95 border border-border px-3 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-brand-50 transition-colors"
        >
          <Maximize2 className="w-4 h-4" />
          Full map
        </button>
      )}

      {showLegend && (
        <AqiLegend className="absolute bottom-3 left-3 max-w-[200px]" compact />
      )}
    </div>
  );
}
