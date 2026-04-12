import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, AlertCircle, Clock, MapPin, Search } from "lucide-react";
import { useReadings } from "@/app/hooks/useReadings";
import { calculateAQI, getAQICategory } from "@/app/lib/airQuality";
import { groupReadingsBySensor, sensorSummary } from "@/app/lib/sensorData";
import {
  connectionStatusFromLastMs,
  formatRelativeMinutes,
} from "@/app/lib/sensors/sensorStatusModel";

function panel() {
  return "rounded-xl border border-gray-100 bg-white p-6 shadow-sm";
}

function badgeClass(tone) {
  if (tone === "green") return "bg-green-100 text-green-800";
  if (tone === "yellow") return "bg-yellow-100 text-yellow-800";
  if (tone === "red") return "bg-red-100 text-red-800";
  return "bg-gray-100 text-gray-800";
}

function statusTone(key) {
  if (key === "live") return "green";
  if (key === "stale") return "yellow";
  return "red";
}

export default function SensorStatus() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { loading, error, data: rows } = useReadings({
    limit: 4000,
    page: 1,
    hours: 24,
  });

  const sensors = useMemo(() => groupReadingsBySensor(rows), [rows]);

  const rowsView = useMemo(() => {
    return sensors
      .map((s) => {
        const { pm25, pm10, lastUpdate } = sensorSummary(s);
        const aqi = calculateAQI(pm25, pm10).value;
        const category = getAQICategory(aqi);
        const conn = connectionStatusFromLastMs(lastUpdate);
        return {
          ...s,
          pm25,
          pm10,
          aqi,
          category,
          conn,
          lastUpdate,
          rel: formatRelativeMinutes(lastUpdate),
        };
      })
      .filter((s) => {
        const q = searchTerm.trim().toLowerCase();
        const matchSearch = !q || s.id.toLowerCase().includes(q);
        const matchStatus =
          statusFilter === "all" || s.conn.key === statusFilter;
        return matchSearch && matchStatus;
      });
  }, [sensors, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const all = sensors.map((s) => {
      const { lastUpdate } = sensorSummary(s);
      return connectionStatusFromLastMs(lastUpdate).key;
    });
    return {
      total: sensors.length,
      live: all.filter((k) => k === "live").length,
      stale: all.filter((k) => k === "stale").length,
      offline: all.filter((k) => k === "offline").length,
    };
  }, [sensors]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Sensor status</h1>
          <p className="text-gray-600">
            Derived from GET /api/readings (last 24h). “Live” means a point arrived within the past
            hour.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
            {error}
          </div>
        )}

        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className={panel()}>
            <div className="text-sm text-gray-600">Topics</div>
            <div className="text-2xl font-bold text-gray-900">
              {loading ? "…" : stats.total}
            </div>
          </div>
          <div className={panel()}>
            <div className="text-sm text-gray-600">Live</div>
            <div className="text-2xl font-bold text-green-600">
              {loading ? "…" : stats.live}
            </div>
          </div>
          <div className={panel()}>
            <div className="text-sm text-gray-600">Stale</div>
            <div className="text-2xl font-bold text-yellow-600">
              {loading ? "…" : stats.stale}
            </div>
          </div>
          <div className={panel()}>
            <div className="text-sm text-gray-600">Silent / no data</div>
            <div className="text-2xl font-bold text-red-600">
              {loading ? "…" : stats.offline}
            </div>
          </div>
        </div>

        <div className={`${panel()} mb-6`}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                placeholder="Search topic id…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Reporting</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All</option>
                <option value="live">Live</option>
                <option value="stale">Stale</option>
                <option value="offline">Silent / no data</option>
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {rowsView.map((sensor) => {
            const needsAttention = sensor.conn.key !== "live";
            return (
              <div key={sensor.id} className={panel()}>
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-center">
                  <div className="lg:col-span-5">
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-lg ${
                          sensor.conn.key === "live" ? "bg-green-100" : "bg-gray-100"
                        }`}
                      >
                        <Activity
                          className={`h-6 w-6 ${
                            sensor.conn.key === "live" ? "text-green-600" : "text-gray-400"
                          }`}
                        />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-900">{sensor.id}</h3>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate">MQTT / Influx topic</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-3">
                    <div className="text-xs text-gray-600">Status</div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${sensor.conn.dotClass}`} />
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${badgeClass(
                          statusTone(sensor.conn.key)
                        )}`}
                      >
                        {sensor.conn.label}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      {sensor.rel}
                    </div>
                  </div>

                  <div className="lg:col-span-2">
                    <div className="text-xs text-gray-600">AQI</div>
                    <div className="mt-1 flex items-center gap-2">
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold"
                        style={{
                          backgroundColor: sensor.category.color,
                          color: sensor.category.textColor,
                        }}
                      >
                        {sensor.aqi}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 lg:col-span-2 lg:justify-end">
                    <button
                      type="button"
                      onClick={() => navigate(`/sensor/${encodeURIComponent(sensor.id)}`)}
                      className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Details
                    </button>
                  </div>
                </div>

                {needsAttention && (
                  <div className="mt-4 border-t border-gray-100 pt-4">
                    <div className="flex items-start gap-2 text-sm text-gray-700">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                      <span>
                        {sensor.conn.key === "offline"
                          ? "No readings in this window, or topic is quiet."
                          : "No reading in the last hour; check device or ingestion."}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {!loading && rowsView.length === 0 && (
          <div className={`${panel()} mt-6 text-center text-gray-600`}>
            No topics match your filters.
          </div>
        )}
      </div>
    </div>
  );
}
