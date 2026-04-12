import React, { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Calendar, TrendingUp, Database, Filter } from "lucide-react";
import { useReadings } from "@/app/hooks/useReadings";
import { groupReadingsBySensor } from "@/app/lib/sensorData";
import {
  buildBucketedSeries,
  buildLocationComparison,
  filterRowsBySensor,
} from "@/app/lib/readings/chartSeries";

function panel() {
  return "rounded-xl border border-gray-100 bg-white p-6 shadow-sm";
}

function selectClass() {
  return "mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";
}

export default function DataDashboard() {
  const [selectedSensor, setSelectedSensor] = useState("");
  const [timeRange, setTimeRange] = useState("7d");
  const [pollutant, setPollutant] = useState("pm25");
  const [mainTab, setMainTab] = useState("trend");

  const hours =
    timeRange === "24h" ? 24 : timeRange === "7d" ? 168 : timeRange === "30d" ? 720 : 24;
  const bucketMinutes =
    timeRange === "24h" ? 15 : timeRange === "7d" ? 120 : 360;

  const { loading, error, data: rows } = useReadings({
    limit: 4000,
    page: 1,
    hours,
  });

  const sensors = useMemo(() => groupReadingsBySensor(rows), [rows]);

  useEffect(() => {
    if (!selectedSensor && sensors.length) {
      setSelectedSensor(sensors[0].id);
    }
  }, [sensors, selectedSensor]);

  const filteredRows = useMemo(
    () => filterRowsBySensor(rows, selectedSensor),
    [rows, selectedSensor]
  );

  const chartData = useMemo(
    () => buildBucketedSeries(filteredRows, bucketMinutes),
    [filteredRows, bucketMinutes]
  );

  const comparisonData = useMemo(() => buildLocationComparison(rows, 12), [rows]);

  const stats = useMemo(() => {
    if (!chartData.length) return { avg: 0, max: 0, min: 0 };
    const aqis = chartData.map((d) => d.AQI).filter((n) => n != null);
    if (!aqis.length) return { avg: 0, max: 0, min: 0 };
    const sum = aqis.reduce((a, b) => a + b, 0);
    return {
      avg: sum / aqis.length,
      max: Math.max(...aqis),
      min: Math.min(...aqis),
    };
  }, [chartData]);

  const pollutantKey =
    pollutant === "pm25"
      ? "PM25"
      : pollutant === "pm10"
        ? "PM10"
        : "AQI";

  const currentSensorLabel = selectedSensor || "—";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Data Dashboard</h1>
          <p className="text-gray-600">
            Charts from Influx readings (GET /api/readings). Only pollutants present in your bucket
            appear.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
            {error}
          </div>
        )}

        <div className={`${panel()} mb-6`}>
          <div className="mb-4 flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold">Filters</h3>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Sensor (topic)</label>
              <select
                className={selectClass()}
                value={selectedSensor}
                onChange={(e) => setSelectedSensor(e.target.value)}
              >
                {sensors.length === 0 ? (
                  <option value="">No sensors in range</option>
                ) : (
                  sensors.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.id}
                    </option>
                  ))
                )}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Time range</label>
              <select
                className={selectClass()}
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
              >
                <option value="24h">Last 24 hours</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Series</label>
              <select
                className={selectClass()}
                value={pollutant}
                onChange={(e) => setPollutant(e.target.value)}
              >
                <option value="pm25">PM2.5</option>
                <option value="pm10">PM10</option>
                <option value="aqi">AQI</option>
              </select>
            </div>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className={panel()}>
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <span className="text-sm text-gray-600">Average AQI (bucketed)</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {loading ? "…" : stats.avg.toFixed(0)}
            </div>
          </div>
          <div className={panel()}>
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
                <TrendingUp className="h-5 w-5 text-red-600" />
              </div>
              <span className="text-sm text-gray-600">Peak AQI</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {loading ? "…" : stats.max}
            </div>
          </div>
          <div className={panel()}>
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <span className="text-sm text-gray-600">Lowest AQI</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {loading ? "…" : stats.min}
            </div>
          </div>
          <div className={panel()}>
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                <Database className="h-5 w-5 text-purple-600" />
              </div>
              <span className="text-sm text-gray-600">Buckets</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {loading ? "…" : chartData.length}
            </div>
          </div>
        </div>

        <div className="mb-6">
          <div className="mb-3 flex flex-wrap gap-2 border-b border-gray-200 pb-2">
            {[
              { id: "trend", label: "Trend analysis" },
              { id: "pollutants", label: "Pollutant levels" },
              { id: "comparison", label: "Location comparison" },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setMainTab(t.id)}
                className={`rounded-lg px-4 py-2 text-sm font-medium ${
                  mainTab === t.id
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {mainTab === "trend" && (
            <div className={panel()}>
              <h3 className="mb-4 text-lg font-semibold">
                AQI trend — {currentSensorLabel}
              </h3>
              {loading ? (
                <p className="text-gray-600">Loading…</p>
              ) : chartData.length === 0 ? (
                <p className="text-gray-600">No data for this sensor and range.</p>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timeLabel" tick={{ fontSize: 11 }} height={72} angle={-25} dy={8} />
                    <YAxis label={{ value: "AQI", angle: -90, position: "insideLeft" }} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="AQI"
                      stroke="#2563eb"
                      strokeWidth={2}
                      dot={false}
                      name="AQI"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          )}

          {mainTab === "pollutants" && (
            <div className={panel()}>
              <h3 className="mb-4 text-lg font-semibold">
                {pollutant === "aqi" ? "AQI" : pollutant === "pm25" ? "PM2.5" : "PM10"} —{" "}
                {currentSensorLabel}
              </h3>
              {loading ? (
                <p className="text-gray-600">Loading…</p>
              ) : chartData.length === 0 ? (
                <p className="text-gray-600">No data.</p>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timeLabel" tick={{ fontSize: 11 }} height={72} angle={-25} dy={8} />
                    <YAxis
                      label={{
                        value: pollutant === "aqi" ? "AQI" : "µg/m³",
                        angle: -90,
                        position: "insideLeft",
                      }}
                    />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey={pollutantKey}
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={false}
                      name={pollutantKey}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          )}

          {mainTab === "comparison" && (
            <div className={panel()}>
              <h3 className="mb-4 text-lg font-semibold">Current AQI by topic (latest in range)</h3>
              {loading ? (
                <p className="text-gray-600">Loading…</p>
              ) : comparisonData.length === 0 ? (
                <p className="text-gray-600">No sensors.</p>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} height={80} angle={-35} textAnchor="end" />
                    <YAxis label={{ value: "AQI", angle: -90, position: "insideLeft" }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="AQI" fill="#2563eb" name="AQI" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          )}
        </div>

        <div className={panel()}>
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <Calendar className="h-5 w-5" />
            Recent buckets
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-3 pr-4">Time (bucket)</th>
                  <th className="py-3 pr-4 text-right">AQI</th>
                  <th className="py-3 pr-4 text-right">PM2.5</th>
                  <th className="py-3 pr-4 text-right">PM10</th>
                </tr>
              </thead>
              <tbody>
                {chartData
                  .slice()
                  .reverse()
                  .slice(0, 12)
                  .map((row, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 pr-4">{row.timeLabel}</td>
                      <td className="py-3 pr-4 text-right font-medium">{row.AQI}</td>
                      <td className="py-3 pr-4 text-right">
                        {row.PM25 != null ? `${row.PM25}` : "—"}
                      </td>
                      <td className="py-3 pr-4 text-right">
                        {row.PM10 != null ? `${row.PM10}` : "—"}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
