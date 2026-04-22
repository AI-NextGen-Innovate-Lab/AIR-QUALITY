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
import {
  hoursForDownloadRange,
  rowMatchesPollutantSelection,
} from "@/app/lib/readings/downloadFilters";
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
  const [pollutants, setPollutants] = useState({
    pm25: true,
    pm10: true,
    co2: false,
    no2: false,
    o3: false,
    co: false,
    so2: false,
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [sensors, setSensors] = useState([]);
  const didInitSensors = useRef(false);

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

  const togglePollutant = (key) => {
    setPollutants((prev) => ({ ...prev, [key]: !prev[key] }));
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
    if (!Object.values(pollutants).some(Boolean)) {
      setError("Select at least one pollutant column.");
      return;
    }
    setBusy(true);
    try {
      const hours = hoursForDownloadRange(timeRange);
      const json = await fetchReadings({ limit: 5000, page: 1, hours });
      const setIds = new Set(selectedSensors);
      const filtered = (json.data || []).filter(
        (r) => r.id && setIds.has(r.id) && rowMatchesPollutantSelection(r, pollutants)
      );
      if (!filtered.length) {
        setError("No rows matched your filters for this window (check pollutant names in Influx).");
        setBusy(false);
        return;
      }
      const columns = ["time", "id", "measurement", "value"];
      const rows = filtered.map((r) => ({
        time: r.time,
        id: r.id,
        measurement: r.measurement,
        value: r.value,
      }));
      const csvBody = toCsv(rows, columns);
      const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");

      if (format === "pdf") {
        const note =
          "Air quality export\n\nPDF is not generated server-side. Use CSV or Excel-style export in the app.\n\n";
        downloadTextFile(`airquality_${stamp}.txt`, note + csvBody, "text/plain;charset=utf-8;");
        setMessage("Downloaded a text summary plus CSV content. For PDF, print that file.");
      } else {
        const ext = format === "excel" ? "csv" : "csv";
        const bom = "\uFEFF";
        downloadTextFile(
          `airquality_${stamp}.${ext}`,
          bom + csvBody,
          "text/csv;charset=utf-8;"
        );
        setMessage(
          format === "excel"
            ? "Downloaded CSV (Excel-compatible with UTF-8 BOM)."
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Download center</h1>
          
        </div>

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
          <div className="space-y-6 lg:col-span-2">
            <div className={panel()}>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-lg font-semibold">Select sensors</h3>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className={btnOutline()}
                    onClick={() => setSelectedSensors(sensors.map((s) => s.id))}
                  >
                    Select all
                  </button>
                  <button type="button" className={btnOutline()} onClick={() => setSelectedSensors([])}>
                    Deselect all
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {sensors.map((sensor) => (
                  <label
                    key={sensor.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border-2 p-3 transition-colors ${
                      selectedSensors.includes(sensor.id)
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 rounded border-gray-300"
                      checked={selectedSensors.includes(sensor.id)}
                      onChange={() => toggleSensor(sensor.id)}
                    />
                    <div>
                      <div className="text-sm font-medium">{sensor.id}</div>
                      <div className="text-xs text-gray-500">Influx topic</div>
                    </div>
                  </label>
                ))}
                {sensors.length === 0 && (
                  <p className="text-sm text-gray-600">No sensors loaded yet (check API).</p>
                )}
              </div>
            </div>

            <div className={panel()}>
              <h3 className="mb-4 text-lg font-semibold">Time period</h3>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {[
                  { value: "day", label: "24 hours" },
                  { value: "week", label: "7 days" },
                  { value: "month", label: "30 days" },
                  { value: "year", label: "30 days (max)" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setTimeRange(option.value)}
                    className={`rounded-lg border-2 p-4 text-left transition-colors ${
                      timeRange === option.value
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <Calendar className="mb-2 h-6 w-6 text-gray-600" />
                    <div className="text-sm font-medium">{option.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className={panel()}>
              <h3 className="mb-4 text-lg font-semibold">Pollutants</h3>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {Object.keys(pollutants).map((key) => (
                  <label key={key} className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300"
                      checked={pollutants[key]}
                      onChange={() => togglePollutant(key)}
                    />
                    <span className="uppercase">{key}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className={panel()}>
              <h3 className="mb-4 text-lg font-semibold">Export format</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {[
                  { value: "csv", label: "CSV", icon: FileText, desc: "Comma-separated" },
                  { value: "excel", label: "Excel", icon: FileSpreadsheet, desc: "CSV + BOM for Excel" },
                  { value: "pdf", label: "PDF / text", icon: FileText, desc: "Plain text + data" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFormat(option.value)}
                    className={`rounded-lg border-2 p-4 text-left transition-colors ${
                      format === option.value
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <option.icon className="mb-2 h-8 w-8 text-gray-600" />
                    <div className="font-medium">{option.label}</div>
                    <div className="text-xs text-gray-500">{option.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className={`${panel()} sticky top-24`}>
              <h3 className="mb-4 text-lg font-semibold">Summary</h3>
              <div className="space-y-4 text-sm">
                <div>
                  <div className="text-gray-600">Sensors</div>
                  <div className="text-2xl font-bold text-gray-900">{selectedSensors.length}</div>
                </div>
                <div>
                  <div className="text-gray-600">Server window</div>
                  <div className="text-lg font-semibold capitalize">{timeRange}</div>
                </div>
                <div>
                  <div className="text-gray-600">Pollutant filters on</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {Object.values(pollutants).filter(Boolean).length}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600">Format</div>
                  <div className="text-lg font-semibold uppercase">{format}</div>
                </div>
                <div className="border-t pt-4">
                  <div className="text-gray-600">Rough max rows</div>
                  <div className="text-lg font-semibold">{estimateRows}</div>
                </div>
                <button
                  type="button"
                  disabled={busy || selectedSensors.length === 0}
                  onClick={handleDownload}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  <DownloadIcon className="h-4 w-4" />
                  {busy ? "Working…" : "Download"}
                </button>
              </div>
            </div>

            <div className={`${panel()} mt-6`}>
              <h3 className="mb-3 text-lg font-semibold">Recent exports</h3>
              <p className="flex items-start gap-2 text-sm text-gray-600">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                Exports are generated in your browser; history is not stored on the server.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
