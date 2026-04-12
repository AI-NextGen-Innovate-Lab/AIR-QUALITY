import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ArrowLeft, MapPin, Clock } from "lucide-react";
import { fetchSensorReadings } from "@/app/lib/api";
import {
  calculateAQI,
  getAQICategory,
  getHealthRecommendations,
} from "@/app/lib/airQuality";
import {
  getLatestValue,
  groupReadingsBySensor,
  isPM10Measurement,
  isPM25Measurement,
  sensorSummary,
  topicToLatLng,
} from "@/app/lib/sensorData";
import { buildBucketedSeries } from "@/app/lib/readings/chartSeries";

function panelClass() {
  return "rounded-xl border border-gray-100 bg-white p-6 shadow-sm";
}

function btnGhost() {
  return "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100";
}

function tabBtn(active) {
  return `rounded-lg px-4 py-2 text-sm font-medium ${
    active
      ? "bg-blue-600 text-white"
      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
  }`;
}

export default function LocationDetails() {
  const { sensorId: rawId } = useParams();
  const navigate = useNavigate();
  const sensorId = rawId ? decodeURIComponent(rawId) : "";

  const [timeRange, setTimeRange] = useState("24h");
  const [chartTab, setChartTab] = useState("aqi");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const hours = timeRange === "24h" ? 24 : 168;
  const bucketMinutes = timeRange === "24h" ? 15 : 60;

  useEffect(() => {
    if (!sensorId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchSensorReadings(sensorId, { limit: 4000, hours })
      .then((json) => {
        if (cancelled) return;
        setRows(json.data || []);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message || "Failed to load");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [sensorId, hours]);

  const measurements = useMemo(() => {
    const g = groupReadingsBySensor(rows);
    const mine = g.find((s) => s.id === sensorId);
    return mine?.measurements ?? [];
  }, [rows, sensorId]);

  const latestPm25 = getLatestValue(measurements, isPM25Measurement);
  const latestPm10 = getLatestValue(measurements, isPM10Measurement);
  const aqiResult = calculateAQI(latestPm25, latestPm10);
  const category = getAQICategory(aqiResult.value);
  const recommendations = getHealthRecommendations(aqiResult.value);

  const lastUpdateMs = useMemo(() => {
    const g = groupReadingsBySensor(rows);
    const mine = g.find((s) => s.id === sensorId);
    if (!mine) return 0;
    return sensorSummary(mine).lastUpdate ?? mine.lastUpdate ?? 0;
  }, [rows, sensorId]);

  const chartData = useMemo(
    () => buildBucketedSeries(rows, bucketMinutes),
    [rows, bucketMinutes]
  );

  const otherSeries = useMemo(() => {
    const seen = new Map();
    for (const m of measurements) {
      if (isPM25Measurement(m) || isPM10Measurement(m)) continue;
      const name = m.measurement || "unknown";
      if (!seen.has(name)) seen.set(name, []);
      seen.get(name).push(m);
    }
    const out = [];
    for (const [name, list] of seen) {
      list.sort((a, b) => new Date(b.time) - new Date(a.time));
      const v = list[0]?.value;
      out.push({ name, value: v, time: list[0]?.time });
    }
    return out;
  }, [measurements]);

  const { lat, lng } = topicToLatLng(sensorId);

  if (!sensorId) {
    return (
      <div className="p-8 text-center text-gray-600">
        Invalid sensor link.
        <button type="button" className={`${btnGhost()} mt-4`} onClick={() => navigate("/")}>
          Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <button type="button" className={`${btnGhost()} mb-4`} onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{sensorId}</h1>
              <div className="mt-2 flex items-center gap-2 text-gray-600">
                <MapPin className="h-4 w-4" />
                <span>
                  Approx. map position: {lat.toFixed(3)}, {lng.toFixed(3)} (topic has no GPS in API)
                </span>
              </div>
              <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                <Clock className="h-4 w-4" />
                <span>
                  Last reading:{" "}
                  {lastUpdateMs
                    ? new Date(lastUpdateMs).toLocaleString()
                    : loading
                      ? "…"
                      : "—"}
                </span>
              </div>
            </div>

            <div className="text-center">
              <div
                className="mx-auto mb-2 flex h-24 w-24 items-center justify-center rounded-full"
                style={{ backgroundColor: category.color }}
              >
                <span
                  className="text-4xl font-bold"
                  style={{ color: category.textColor }}
                >
                  {aqiResult.value}
                </span>
              </div>
              <div
                className="inline-block rounded-full px-4 py-1"
                style={{ backgroundColor: category.color }}
              >
                <span
                  className="text-sm font-medium"
                  style={{ color: category.textColor }}
                >
                  {category.label}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
            {error}
          </div>
        )}

        <div
          className={`${panelClass()} mb-8 border-l-4`}
          style={{ borderLeftColor: category.color }}
        >
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            Health recommendations
          </h2>
          <ul className="space-y-2">
            {recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2 text-gray-700">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" />
                {rec}
              </li>
            ))}
          </ul>
        </div>

        <div className={`${panelClass()} mb-8`}>
          <h2 className="mb-6 text-xl font-semibold text-gray-900">
            Latest measurements
          </h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-lg bg-gray-50 p-4 text-center">
              <div className="mb-1 text-xs text-gray-600">PM2.5</div>
              <div className="text-2xl font-bold text-blue-600">
                {latestPm25 !== undefined ? latestPm25.toFixed(1) : "—"}
              </div>
              <div className="text-xs text-gray-500">µg/m³</div>
            </div>
            <div className="rounded-lg bg-gray-50 p-4 text-center">
              <div className="mb-1 text-xs text-gray-600">PM10</div>
              <div className="text-2xl font-bold text-violet-600">
                {latestPm10 !== undefined ? latestPm10.toFixed(1) : "—"}
              </div>
              <div className="text-xs text-gray-500">µg/m³</div>
            </div>
          </div>
          {otherSeries.length > 0 && (
            <div className="mt-6">
              <h3 className="mb-2 text-sm font-medium text-gray-700">
                Other fields (from Influx)
              </h3>
              <div className="flex flex-wrap gap-2">
                {otherSeries.map((o) => (
                  <span
                    key={o.name}
                    className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-800"
                  >
                    {o.name}: {String(o.value)} @ {o.time ? new Date(o.time).toLocaleString() : ""}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className={panelClass()}>
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Historical data</h2>
            <div className="flex gap-2">
              <button
                type="button"
                className={tabBtn(timeRange === "24h")}
                onClick={() => setTimeRange("24h")}
              >
                24 hours
              </button>
              <button
                type="button"
                className={tabBtn(timeRange === "7d")}
                onClick={() => setTimeRange("7d")}
              >
                7 days
              </button>
            </div>
          </div>

          <div className="mb-4 flex gap-2 border-b border-gray-200 pb-2">
            <button
              type="button"
              className={tabBtn(chartTab === "aqi")}
              onClick={() => setChartTab("aqi")}
            >
              AQI trend
            </button>
            <button
              type="button"
              className={tabBtn(chartTab === "pollutants")}
              onClick={() => setChartTab("pollutants")}
            >
              PM2.5 / PM10
            </button>
          </div>

          {loading ? (
            <p className="text-gray-600">Loading chart…</p>
          ) : chartData.length === 0 ? (
            <p className="text-gray-600">No points in this range.</p>
          ) : chartTab === "aqi" ? (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timeLabel" tick={{ fontSize: 11 }} height={72} angle={-30} dy={10} />
                <YAxis label={{ value: "AQI", angle: -90, position: "insideLeft" }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="AQI" stroke="#2563eb" strokeWidth={2} dot={false} name="AQI" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timeLabel" tick={{ fontSize: 11 }} height={72} angle={-30} dy={10} />
                <YAxis label={{ value: "µg/m³", angle: -90, position: "insideLeft" }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="PM25" stroke="#2563eb" strokeWidth={2} dot={false} name="PM2.5" />
                <Line type="monotone" dataKey="PM10" stroke="#7c3aed" strokeWidth={2} dot={false} name="PM10" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
