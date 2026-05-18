import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { fetchReadings } from '@/app/lib/api';
import { calculateAQI, getAQICategory } from '@/app/lib/airQuality';
import {
  groupReadingsBySensor,
  sensorSummary,
  topicToLatLng,
} from '@/app/lib/sensorData';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet with React
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Custom component to handle map centering
function ChangeView({ center, zoom }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

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
        const { lat, lng, label } = topicToLatLng(s.id);
        const { pm25, pm10 } = sensorSummary(s);
        const aqi = calculateAQI(pm25, pm10).value;
        return {
          ...s,
          lat,
          lng,
          label: label || s.id,
          aqi,
          category: getAQICategory(aqi),
        };
      }),
    [sensors]
  );


  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Air Quality Map
          </h1>
         
        </div>

        {loading && (
          <p className="text-gray-600 mb-4">Loading sensor positions…</p>
        )}
        {error && <p className="text-red-600 mb-4">{error}</p>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 p-6 bg-white rounded-xl shadow relative overflow-hidden" style={{ height: '700px' }}>
            <MapContainer 
              center={[-6.769, 39.240]} 
              zoom={15} 
              scrollWheelZoom={true}
              style={{ height: '100%', width: '100%', borderRadius: '0.75rem', zIndex: 1 }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              <ChangeView center={selectedSensor ? [sensorsWithCoords.find(s => s.id === selectedSensor)?.lat || -6.769, sensorsWithCoords.find(s => s.id === selectedSensor)?.lng || 39.240] : [-6.769, 39.240]} zoom={selectedSensor ? 16 : 15} />

              {sensorsWithCoords.map((sensor) => (
                <Marker 
                  key={sensor.id} 
                  position={[sensor.lat, sensor.lng]}
                  icon={L.divIcon({
                    className: 'custom-div-icon',
                    html: `
                      <div class="relative transform -translate-x-1/2 -translate-y-1/2">
                        <div class="w-12 h-12 rounded-full flex items-center justify-center shadow-lg border-2 border-white transition-all hover:scale-110" style="background-color: ${sensor.category.color}">
                          <span class="font-bold text-sm" style="color: ${sensor.category.textColor}">${sensor.aqi}</span>
                        </div>
                        ${selectedSensor === sensor.id ? `
                          <div class="absolute -inset-2 rounded-full animate-ping opacity-75" style="background-color: ${sensor.category.color}"></div>
                        ` : ''}
                      </div>
                    `,
                    iconSize: [48, 48],
                    iconAnchor: [24, 24]
                  })}
                  eventHandlers={{
                    click: () => setSelectedSensor(sensor.id),
                  }}
                >
                  <Popup>
                    <div className="p-2 min-w-[150px]">
                      <p className="font-bold text-sm mb-0.5 text-blue-600">{sensor.label}</p>
                      <p className="text-[10px] text-gray-400 mb-2 uppercase tracking-tighter">ID: {sensor.id}</p>
                      <div className="flex items-center justify-between mb-3 bg-slate-50 p-2 rounded-lg">
                        <span className="text-xs font-medium text-gray-500">Current AQI</span>
                        <span className="text-lg font-black" style={{ color: sensor.category.color }}>{sensor.aqi}</span>
                      </div>
                      <button
                        onClick={() => navigate(`/sensor/${encodeURIComponent(sensor.id)}`)}
                        className="w-full bg-slate-900 text-white py-1.5 px-2 rounded-lg text-[11px] font-bold hover:bg-blue-600 transition-all shadow-sm"
                      >
                        Detailed Analytics
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>

            {/* Legend Overlay */}
            <div className="absolute bottom-10 left-10 bg-white/90 backdrop-blur-sm p-4 rounded-xl shadow-lg z-[1000] border border-gray-100">
              <p className="text-sm font-bold text-gray-800 mb-3">Air Quality Index</p>
              <div className="space-y-2">
                {[
                  { label: 'Good', color: '#10b981', range: '0-50' },
                  { label: 'Moderate', color: '#facc15', range: '51-100' },
                  { label: 'Sensitive', color: '#f97316', range: '101-150' },
                  { label: 'Unhealthy', color: '#ef4444', range: '151-200' },
                  { label: 'Very Unhealthy', color: '#8b5cf6', range: '201-300' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: item.color }} />
                    <span className="text-xs font-medium text-gray-600">{item.label}</span>
                    <span className="text-[10px] text-gray-400 ml-auto">{item.range}</span>
                  </div>
                ))}
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
                    className={`p-3 rounded-lg border border-blue-300 border-2 cursor-pointer ${
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
                        <p className="font-bold text-sm text-slate-800 truncate">{sensor.label}</p>
                        <p className="text-[10px] text-slate-400 flex items-center gap-1 uppercase font-bold tracking-tighter">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span className="truncate">{sensor.id}</span>
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
