import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AQICard } from '@/app/components/AQICard';
import { fetchReadings } from '@/app/lib/api';
import {
  calculateAQI,
  getAQICategory,
  getHealthRecommendations,
} from '@/app/lib/airQuality';
import {
  groupReadingsBySensor,
  sensorSummary,
} from '@/app/lib/sensorData';
import { AlertCircle, TrendingUp, Activity, MapPin } from 'lucide-react';

function averageCityAQI(sensors) {
  if (!sensors.length) return 0;
  const values = sensors
    .map((s) => {
      const { pm25, pm10 } = sensorSummary(s);
      return calculateAQI(pm25, pm10).value;
    })
    .filter((v) => v > 0);
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function HomePage() {
  const navigate = useNavigate();
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

  const cityAQI = useMemo(() => averageCityAQI(sensors), [sensors]);
  const cityCategory = getAQICategory(cityAQI);
  const recommendations = getHealthRecommendations(cityAQI);

  const goodLocationsCount = useMemo(
    () =>
      sensors.filter((s) => {
        const { pm25 } = sensorSummary(s);
        return pm25 !== undefined && pm25 <= 12;
      }).length,
    [sensors]
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-blue-600 to-cyan-500 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <h1 className="text-4xl font-bold mb-2">Dar es Salaam Air Quality</h1>
          <p className="text-blue-100 text-lg">
            Real-time monitoring across the city
          </p>

          <div className="bg-white p-8 rounded-xl shadow-md text-center max-w-2xl mx-auto mt-8">
            <p className="text-gray-600 text-sm uppercase mb-2">
              City-wide Air Quality Index
            </p>

            {loading ? (
              <p className="text-gray-600 py-12">Loading latest readings…</p>
            ) : error ? (
              <p className="text-red-600 py-8">{error}</p>
            ) : (
              <>
                <div
                  className="w-32 h-32 mx-auto rounded-full flex items-center justify-center mb-4"
                  style={{ backgroundColor: cityCategory.color }}
                >
                  <span
                    className="font-bold text-5xl"
                    style={{ color: cityCategory.textColor }}
                  >
                    {Math.round(cityAQI)}
                  </span>
                </div>

                <div
                  className="inline-block px-6 py-2 rounded-full mb-4"
                  style={{ backgroundColor: cityCategory.color }}
                >
                  <span
                    className="text-xl font-semibold"
                    style={{ color: cityCategory.textColor }}
                  >
                    {cityCategory.label}
                  </span>
                </div>

                <p className="text-gray-700">{cityCategory.description}</p>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div
          className="mb-8 p-4 rounded-lg bg-white shadow border-l-4"
          style={{ borderLeftColor: cityCategory.color }}
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 mt-1 text-gray-600" />
            <div>
              <h3 className="font-semibold text-gray-900">
                Health Recommendations
              </h3>
              <ul className="list-disc list-inside mt-2 space-y-1">
                {recommendations.map((rec, index) => (
                  <li key={index} className="text-sm text-gray-700">
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="p-6 bg-white border border-blue-300 rounded-xl shadow flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg  flex items-center justify-center">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{sensors.length}</p>
              <p className="text-sm text-gray-600">Active Sensors</p>
            </div>
          </div>

          <div className="p-6 bg-white border border-blue-300 rounded-xl shadow flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{goodLocationsCount}</p>
              <p className="text-sm text-gray-600">Good Quality Locations</p>
            </div>
          </div>

          <div
            className="p-6 bg-white border border-blue-300 rounded-xl shadow flex items-center gap-4 cursor-pointer hover:shadow-lg"
            onClick={() => navigate('/map')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') navigate('/map');
            }}
            role="button"
            tabIndex={0}
          >
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <MapPin className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">View Map</p>
              <p className="text-sm text-gray-600">Interactive City Map</p>
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Monitoring Locations
        </h2>

        {loading ? (
          <p className="text-gray-600">Loading sensors…</p>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : sensors.length === 0 ? (
          <p className="text-gray-600">
            No sensor data in the last 24 hours. Check the backend and InfluxDB
            connection.
          </p>
        ) : (
          <div className="grid grid-cols-1  md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sensors.map((sensor) => (
              <AQICard 
                className="border border-blue-300"
                key={sensor.id}
                sensorId={sensor.id}
                measurements={sensor.measurements}
                onClick={() =>
                  className=
                  navigate(`/sensor/${encodeURIComponent(sensor.id)}`)
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default HomePage;
