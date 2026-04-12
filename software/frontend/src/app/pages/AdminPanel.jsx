import React, { useEffect, useState } from "react";
import { Users, Activity, AlertCircle, Settings } from "lucide-react";
import { fetchHealth, fetchReadings } from "@/app/lib/api";
import { groupReadingsBySensor } from "@/app/lib/sensorData";
import {
  averageAqiFromSensors,
  totalReadingCount,
} from "@/app/lib/admin/adminMetrics";

function panel() {
  return "rounded-xl border border-gray-100 bg-white p-6 shadow-sm";
}

function tabBtn(active) {
  return `rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap ${
    active ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
  }`;
}

function pill(text, variant = "neutral") {
  const cls =
    variant === "ok"
      ? "bg-green-100 text-green-800"
      : variant === "warn"
        ? "bg-amber-100 text-amber-800"
        : "bg-gray-100 text-gray-800";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {text}
    </span>
  );
}

export default function AdminPanel() {
  const [tab, setTab] = useState("overview");
  const [health, setHealth] = useState(null);
  const [readError, setReadError] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      fetchHealth().catch(() => null),
      fetchReadings({ limit: 3000, page: 1, hours: 24 }).catch((e) => {
        if (!cancelled) setReadError(e.message);
        return { data: [] };
      }),
    ]).then(([h, json]) => {
      if (cancelled) return;
      setHealth(h);
      setRows(json.data || []);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const sensorsGrouped = groupReadingsBySensor(rows);
  const cityAqi = averageAqiFromSensors(sensorsGrouped);
  const readingCount = totalReadingCount(rows);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin panel</h1>
          <p className="text-gray-600">
            Live figures from GET /api/readings and GET /api/health. User and API-key management
            requires a separate service (not in this backend).
          </p>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-4">
          <div className={panel()}>
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <Activity className="h-5 w-5 text-blue-600" />
              </div>
              <span className="text-sm text-gray-600">Topics (24h)</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {loading ? "…" : sensorsGrouped.length}
            </div>
            <div className="mt-1 text-xs text-gray-500">Distinct Influx topics</div>
          </div>

          <div className={panel()}>
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <span className="text-sm text-gray-600">Rows loaded</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {loading ? "…" : readingCount}
            </div>
            <div className="mt-1 text-xs text-gray-500">Sample (limit 3000)</div>
          </div>

          <div className={panel()}>
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              </div>
              <span className="text-sm text-gray-600">Pending requests</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">—</div>
            <div className="mt-1 text-xs text-gray-500">No backend endpoint</div>
          </div>

          <div className={panel()}>
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                <Settings className="h-5 w-5 text-purple-600" />
              </div>
              <span className="text-sm text-gray-600">Avg AQI</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {loading ? "…" : Math.round(cityAqi)}
            </div>
            <div className="mt-1 text-xs text-gray-500">From latest PM2.5/PM10</div>
          </div>
        </div>

        {readError && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            Readings: {readError}
          </div>
        )}

        <div className="mb-4 flex flex-wrap gap-2 border-b border-gray-200 pb-3">
          {[
            { id: "overview", label: "Overview" },
            { id: "requests", label: "Pending requests" },
            { id: "users", label: "Users" },
            { id: "api", label: "API keys" },
            { id: "system", label: "System" },
          ].map((t) => (
            <button key={t.id} type="button" className={tabBtn(tab === t.id)} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <div className={panel()}>
            <h3 className="mb-3 text-lg font-semibold">Influx snapshot</h3>
            <ul className="list-inside list-disc space-y-2 text-sm text-gray-700">
              <li>API health: {health?.ok ? "reachable" : "unreachable or error"}</li>
              <li>Server time: {health?.time || "—"}</li>
              <li>Topics with data in the last 24h: {sensorsGrouped.length}</li>
              <li>Rows in this admin sample: {readingCount}</li>
            </ul>
          </div>
        )}

        {tab === "requests" && (
          <div className={panel()}>
            <h3 className="mb-2 text-lg font-semibold">Private sensor requests</h3>
            <p className="mb-4 text-sm text-gray-600">
              There is no POST/approval API in{" "}
              <code className="rounded bg-gray-100 px-1">server.js</code>. Wire this tab to your user
              database when available.
            </p>
            <div className="py-12 text-center text-gray-500">No pending requests</div>
          </div>
        )}

        {tab === "users" && (
          <div className={panel()}>
            <div className="mb-4 flex items-center justify-between gap-2">
              <h3 className="text-lg font-semibold">User accounts</h3>
              <button
                type="button"
                disabled
                className="cursor-not-allowed rounded-lg bg-gray-200 px-3 py-1.5 text-sm text-gray-500"
              >
                Add user (no API)
              </button>
            </div>
            <div className="py-12 text-center text-gray-500">
              User listing is not provided by the air-quality API.
            </div>
          </div>
        )}

        {tab === "api" && (
          <div className={panel()}>
            <h3 className="mb-2 text-lg font-semibold">API keys</h3>
            <p className="mb-4 text-sm text-gray-600">
              Key management is not implemented on this server. Use Influx tokens and env vars on
              the backend.
            </p>
            <div className="py-12 text-center text-gray-500">No keys exposed here</div>
          </div>
        )}

        {tab === "system" && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className={panel()}>
              <h3 className="mb-4 text-lg font-semibold">Status</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">HTTP API</span>
                  {pill(health?.ok ? "Online" : "Unknown", health?.ok ? "ok" : "warn")}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Readings query</span>
                  {pill(readError ? "Error" : "OK", readError ? "warn" : "ok")}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">InfluxDB</span>
                  {pill(readError ? "Check logs" : "Responding", readError ? "warn" : "ok")}
                </div>
              </div>
            </div>

            <div className={panel()}>
              <h3 className="mb-4 text-lg font-semibold">Activity</h3>
              <div className="space-y-3 text-sm text-gray-700">
                <div className="flex gap-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                  <div>
                    <div>Loaded {readingCount} raw points for admin overview</div>
                    <div className="text-xs text-gray-500">Last refresh on mount</div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-green-500" />
                  <div>
                    <div>{sensorsGrouped.length} topics seen in the rolling window</div>
                    <div className="text-xs text-gray-500">Based on grouped readings</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
