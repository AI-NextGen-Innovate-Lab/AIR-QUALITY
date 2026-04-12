import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Navigation, ZoomIn, ZoomOut } from 'lucide-react';
import { fetchReadings } from '@/app/lib/api';
import { calculateAQI, getAQICategory } from '@/app/lib/airQuality';
import {
  groupReadingsBySensor,
  sensorSummary,
  topicToLatLng,
} from '@/app/lib/sensorData';

export function MapPage() {
  const navigate = useNavigate();
  const [selectedSensor, setSelectedSensor] = useState(null);
  const [sensors, setSensors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const json = await fetchReadings({ limit: 1000, page: 1 });
        if (cancelled) return;
        setSensors(groupReadingsBySensor(json.data || []));
      } catch (e) {
        if (!cancelled) setError(e.message || 'Failed to load readings');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const sensorsWithCoords = useMemo(
    () =>
      sensors.map((s) => {
        const { lat, lng } = topicToLatLng(s.id);
        const { pm25, pm10 } = sensorSummary(s);
        const aqi = calculateAQI(pm25, pm10).value;
        return {
          ...s,
          lat,
          lng,
          aqi,
          category: getAQICategory(aqi),
        };
      }),
    [sensors]
  );

  const centerLat = -6.8;
  const centerLng = 39.25;
  const mapWidth = 1200;
  const mapHeight = 800;

  const latToY = (lat) => {
    const latRange = 0.2;
    return ((centerLat - lat) / latRange) * (mapHeight / 2) + mapHeight / 2;
  };

  const lngToX = (lng) => {
    const lngRange = 0.15;
    return ((lng - centerLng) / lngRange) * (mapWidth / 2) + mapWidth / 2;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Air Quality Map
          </h1>
          <p className="text-gray-600">
            Interactive map showing real-time air quality across Dar es Salaam.
            Station positions are approximate (API provides topic IDs only).
          </p>
        </div>

        {loading && (
          <p className="text-gray-600 mb-4">Loading sensor positions…</p>
        )}
        {error && <p className="text-red-600 mb-4">{error}</p>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 p-6 bg-white rounded-xl shadow">
            <div
              className="relative bg-blue-50 rounded-lg overflow-hidden"
              style={{ height: '600px' }}
            >
              <div className="absolute inset-0">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-200 to-cyan-100" />

                <svg viewBox="0 0 1200 800" className="w-full h-full">
                  <path
                    d="M 900 100 Q 850 200 900 300 L 900 700 Q 800 750 700 700 L 300 700 Q 200 650 150 500 L 150 300 Q 200 200 300 150 L 700 100 Q 800 80 900 100 Z"
                    fill="#E8F5E9"
                    stroke="#81C784"
                    strokeWidth="2"
                  />

                  <circle cx="600" cy="400" r="80" fill="#FFF9C4" opacity="0.6" />
                  <circle cx="500" cy="500" r="60" fill="#FFF9C4" opacity="0.6" />
                  <circle cx="400" cy="350" r="50" fill="#FFF9C4" opacity="0.6" />

                  <line
                    x1="300"
                    y1="400"
                    x2="800"
                    y2="400"
                    stroke="#9E9E9E"
                    strokeWidth="3"
                    opacity="0.5"
                  />
                  <line
                    x1="600"
                    y1="200"
                    x2="600"
                    y2="600"
                    stroke="#9E9E9E"
                    strokeWidth="3"
                    opacity="0.5"
                  />
                </svg>

                {sensorsWithCoords.map((sensor) => {
                  const x = lngToX(sensor.lng);
                  const y = latToY(sensor.lat);
                  const { category } = sensor;
                  const isSelected = selectedSensor === sensor.id;

                  return (
                    <div
                      key={sensor.id}
                      className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer hover:scale-110"
                      style={{ left: `${x}px`, top: `${y}px` }}
                      onClick={() => setSelectedSensor(sensor.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ')
                          setSelectedSensor(sensor.id);
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="relative">
                        {isSelected && (
                          <div
                            className="absolute -inset-2 rounded-full animate-ping opacity-75"
                            style={{ backgroundColor: category.color }}
                          />
                        )}

                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg border-2 border-white ${
                            isSelected ? 'scale-125' : ''
                          }`}
                          style={{ backgroundColor: category.color }}
                        >
                          <span
                            className="font-bold text-sm"
                            style={{ color: category.textColor }}
                          >
                            {sensor.aqi}
                          </span>
                        </div>

                        {isSelected && (
                          <div className="absolute top-14 left-1/2 -translate-x-1/2 bg-white px-2 py-1 rounded shadow text-xs max-w-[140px] truncate">
                            {sensor.id}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="absolute top-4 right-4 flex flex-col gap-2">
                <button
                  type="button"
                  className="p-2 bg-white rounded shadow hover:bg-gray-100"
                  aria-label="Zoom in"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  className="p-2 bg-white rounded shadow hover:bg-gray-100"
                  aria-label="Zoom out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  className="p-2 bg-white rounded shadow hover:bg-gray-100"
                  aria-label="Navigation"
                >
                  <Navigation className="w-4 h-4" />
                </button>
              </div>

              <div className="absolute bottom-4 left-4 bg-white p-4 rounded-lg shadow">
                <p className="text-sm font-semibold mb-2">AQI Scale</p>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-green-500" />
                    <span>Good (0-50)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-yellow-400" />
                    <span>Moderate (51-100)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-orange-500" />
                    <span>Unhealthy for Sensitive</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-red-500" />
                    <span>Unhealthy</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            className="p-6 bg-white rounded-xl shadow overflow-y-auto"
            style={{ maxHeight: '600px' }}
          >
            <h3 className="font-semibold text-lg mb-4">Monitoring Stations</h3>

            {!loading && !error && sensorsWithCoords.length === 0 && (
              <p className="text-sm text-gray-600">
                No stations with data in the last 24 hours.
              </p>
            )}

            <div className="space-y-3">
              {sensorsWithCoords.map((sensor) => {
                const { category } = sensor;
                const isSelected = selectedSensor === sensor.id;

                return (
                  <div
                    key={sensor.id}
                    className={`p-3 rounded-lg border-2 cursor-pointer ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedSensor(sensor.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ')
                        setSelectedSensor(sensor.id);
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="flex justify-between mb-2">
                      <div className="min-w-0 pr-2">
                        <p className="font-medium text-sm truncate">{sensor.id}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span className="truncate">Topic / sensor ID</span>
                        </p>
                      </div>

                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                        style={{ backgroundColor: category.color }}
                      >
                        <span
                          className="font-bold text-sm"
                          style={{ color: category.textColor }}
                        >
                          {sensor.aqi}
                        </span>
                      </div>
                    </div>

                    <div
                      className="inline-block px-2 py-1 rounded text-xs font-medium"
                      style={{
                        backgroundColor: category.color,
                        color: category.textColor,
                      }}
                    >
                      {category.label}
                    </div>

                    {isSelected && (
                      <button
                        type="button"
                        className="w-full mt-3 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/sensor/${encodeURIComponent(sensor.id)}`);
                        }}
                      >
                        View Details
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MapPage;
