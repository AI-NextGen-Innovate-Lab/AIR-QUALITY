import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Download as DownloadIcon,
  FileText,
  FileSpreadsheet,
  Calendar,
  CheckCircle,
} from "lucide-react";

import { fetchReadings } from "@/app/lib/api";
import { groupReadingsBySensor } from "@/app/lib/sensorData";
import { hoursForDownloadRange } from "@/app/lib/readings/downloadFilters";
import { downloadTextFile, toCsv } from "@/app/lib/readings/csvExport";

function panel() {
  return "rounded-xl border border-gray-100 bg-white p-6 shadow-sm";
}

function btnOutline() {
  return "rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50";
}

export default function Download() {
  const [selectedSensors, setSelectedSensors] = useState([]);
  const [timeRange, setTimeRange] = useState("week");
  const [format, setFormat] = useState("csv");

  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const [sensors, setSensors] = useState([]);
  const didInitSensors = useRef(false);

  // Load sensors
  useEffect(() => {
    let cancelled = false;

    fetchReadings({ limit: 2000, page: 1, hours: 168 })
      .then((json) => {
        if (cancelled) return;
        setSensors(groupReadingsBySensor(json.data || []));
      })
      .catch(() => {
        if (!cancelled) setSensors([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Auto-select first sensor
  useEffect(() => {
    if (sensors.length && !didInitSensors.current) {
      didInitSensors.current = true;
      setSelectedSensors([sensors[0].id]);
    }
  }, [sensors]);

  const toggleSensor = (id) => {
    setSelectedSensors((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const estimateRows = useMemo(() => {
    const hours = hoursForDownloadRange(timeRange);
    const pointsPerSensor = Math.min(hours * 4, 4000);
    return pointsPerSensor * selectedSensors.length;
  }, [timeRange, selectedSensors.length]);

  const handleDownload = async () => {
    setMessage(null);
    setError(null);

    if (!selectedSensors.length) {
      setError("Select at least one sensor.");
      return;
    }

    setBusy(true);

    try {
      const hours = hoursForDownloadRange(timeRange);
      const json = await fetchReadings({ limit: 5000, page: 1, hours });

      const setIds = new Set(selectedSensors);

      // ✅ NO pollutant filtering — only sensor filtering
      const filtered = (json.data || []).filter(
        (r) => r.id && setIds.has(r.id)
      );

      if (!filtered.length) {
        setError("No data found for selected sensors/time range.");
        setBusy(false);
        return;
      }

      // ✅ Pivot data dynamically
      const grouped = {};

      filtered.forEach((r) => {
        const key = `${r.time}_${r.id}`;

        if (!grouped[key]) {
          grouped[key] = {
            time: r.time,
            id: r.id,
          };
        }

        // measurement becomes column name dynamically
        grouped[key][r.measurement] = r.value;
      });

      const rows = Object.values(grouped);

      // ✅ Dynamic columns
      const columns = Array.from(
        new Set(rows.flatMap((r) => Object.keys(r)))
      );

      const csvBody = toCsv(rows, columns);

      const stamp = new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/[:T]/g, "-");

      if (format === "pdf") {
        const note =
          "Air quality export\n\nPDF is not generated server-side. Use CSV or Excel.\n\n";

        downloadTextFile(
          `airquality_${stamp}.txt`,
          note + csvBody,
          "text/plain;charset=utf-8;"
        );

        setMessage("Downloaded text + CSV content (print for PDF).");
      } else {
        const ext = "csv";
        const bom = "\uFEFF";

        downloadTextFile(
          `airquality_${stamp}.${ext}`,
          bom + csvBody,
          "text/csv;charset=utf-8;"
        );

        setMessage(
          format === "excel"
            ? "Downloaded CSV (Excel-compatible)."
            : "Downloaded CSV."
        );
      }
    } catch (e) {
      setError(e.message || "Download failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="mb-6 text-3xl font-bold text-gray-900">
          Download center
        </h1>

        {message && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-900">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* LEFT */}
          <div className="space-y-6 lg:col-span-2">
            {/* Sensors */}
            <div className={panel()}>
              <div className="mb-4 flex justify-between">
                <h3 className="text-lg font-semibold">Select sensors</h3>
                <div className="flex gap-2">
                  <button
                    className={btnOutline()}
                    onClick={() => setSelectedSensors(sensors.map((s) => s.id))}
                  >
                    Select all
                  </button>
                  <button
                    className={btnOutline()}
                    onClick={() => setSelectedSensors([])}
                  >
                    Deselect all
                  </button>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {sensors.map((sensor) => (
                  <label
                    key={sensor.id}
                    className={`flex gap-3 rounded-lg border-2 p-3 ${
                      selectedSensors.includes(sensor.id)
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedSensors.includes(sensor.id)}
                      onChange={() => toggleSensor(sensor.id)}
                    />
                    <div>
                      <div className="text-sm font-medium">
                        {sensor.id}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Time */}
            <div className={panel()}>
              <h3 className="mb-4 text-lg font-semibold">Time period</h3>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {["day", "week", "month", "year"].map((val) => (
                  <button
                    key={val}
                    onClick={() => setTimeRange(val)}
                    className={`rounded-lg border-2 p-4 ${
                      timeRange === val
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200"
                    }`}
                  >
                    <Calendar className="mb-2 h-6 w-6" />
                    {val}
                  </button>
                ))}
              </div>
            </div>

            {/* Format */}
            <div className={panel()}>
              <h3 className="mb-4 text-lg font-semibold">Export format</h3>

              <div className="grid gap-4 md:grid-cols-3">
                {[
                  { value: "csv", icon: FileText },
                  { value: "excel", icon: FileSpreadsheet },
                  { value: "pdf", icon: FileText },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setFormat(opt.value)}
                    className={`rounded-lg border-2 p-4 ${
                      format === opt.value
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200"
                    }`}
                  >
                    <opt.icon className="mb-2 h-6 w-6" />
                    {opt.value}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div>
            <div className={`${panel()} sticky top-24`}>
              <h3 className="mb-4 text-lg font-semibold">Summary</h3>

              <p>Sensors: {selectedSensors.length}</p>
              <p>Range: {timeRange}</p>
              <p>Rows (est): {estimateRows}</p>

              <button
                disabled={busy || !selectedSensors.length}
                onClick={handleDownload}
                className="mt-4 w-full rounded-lg bg-blue-600 p-3 text-white"
              >
                <DownloadIcon className="inline mr-2 h-4 w-4" />
                {busy ? "Working…" : "Download"}
              </button>
            </div>

            <div className={`${panel()} mt-6`}>
              <p className="text-sm text-gray-600 flex gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Exports generated locally.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}