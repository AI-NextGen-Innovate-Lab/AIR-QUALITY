import React from "react";
import { Link } from "react-router-dom";
import { useReadings } from "@/app/hooks/useReadings";
import { calculateAQI, getAQICategory } from "@/app/lib/airQuality";
import { groupReadingsBySensor, sensorSummary } from "@/app/lib/sensorData";
import { MapPin, Radio } from "lucide-react";

function panel() {
  return "rounded-xl border border-gray-100 bg-white p-6 shadow-sm";
}

export default function PrivateSensor() {
  const { loading, error, data: rows } = useReadings({
    limit: 2500,
    page: 1,
    hours: 168,
  });

  const sensors = groupReadingsBySensor(rows);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Private sensors</h1>
         
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">{error}</div>
        )}

        <div className={`${panel()} mb-8`}>
          <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Radio className="h-5 w-5 text-blue-600" />
            Connect a private device
          </h2>
          <ol className="list-inside list-decimal space-y-2 text-sm text-gray-700">
            <li>Publish MQTT messages to a unique topic that matches your Influx Telegraf mapping.</li>
            <li>Ensure measurements include PM2.5 and PM10 fields your dashboard expects.</li>
            <li>
              Once data appears in Influx, the topic shows up here and on the public map (consider
              access control at the edge if topics must stay private).
            </li>
          </ol>
        </div>

        <div className={panel()}>
          <h2 className="mb-4 text-lg font-semibold">Topics (last 7 days)</h2>
          {loading ? (
            <p className="text-gray-600">Loading…</p>
          ) : sensors.length === 0 ? (
            <p className="text-gray-600">No topics in this window.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-3 pr-4">Topic</th>
                    <th className="py-3 pr-4 text-right">AQI</th>
                    <th className="py-3 pr-4">Category</th>
                    <th className="py-3 pr-4" />
                  </tr>
                </thead>
                <tbody>
                  {sensors.map((s) => {
                    const { pm25, pm10 } = sensorSummary(s);
                    const aqi = calculateAQI(pm25, pm10).value;
                    const cat = getAQICategory(aqi);
                    return (
                      <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 pr-4 font-mono text-xs">{s.id}</td>
                        <td className="py-3 pr-4 text-right font-semibold">{aqi}</td>
                        <td className="py-3 pr-4">
                          <span
                            className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
                            style={{
                              backgroundColor: cat.color,
                              color: cat.textColor,
                            }}
                          >
                            {cat.label}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-right">
                          <Link
                            to={`/sensor/${encodeURIComponent(s.id)}`}
                            className="text-blue-600 hover:underline"
                          >
                            Details
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="mt-6 flex items-center gap-2 text-xs text-gray-500">
          <MapPin className="h-3 w-3" />
          Map positions for topics are approximate until you store real coordinates server-side.
        </p>
      </div>
    </div>
  );
}
