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
import {
  TrendingUp,
  TrendingDown,
  Search,
  ChevronUp,
  ChevronDown,
  Droplet,
  Wind,
  Eye,
} from "lucide-react";
import { SensorDetailHero } from "@/app/components/aqi/SensorDetailHero";
import { HealthAdvicePanel } from "@/app/components/aqi/HealthAdvicePanel";
import { Card, CardContent } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { connectionStatusFromLastMs } from "@/app/lib/sensors/sensorStatusModel";
import { cn } from "@/app/lib/utils/cn";
import { fetchSensorReadings } from "@/app/lib/api";
import {
  calculateAQI,
  getAQICategory,
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

function tabBtn(active) {
  return cn(
    "rounded-xl px-4 py-2 text-sm font-medium transition-colors",
    active
      ? "bg-brand-600 text-white shadow-sm"
      : "bg-surface text-muted hover:text-foreground border border-border"
  );
}

function badgeClass(value, type = "aqi") {
  if (!value && value !== 0) return "bg-gray-100 text-gray-800";
  if (type === "aqi") {
    if (value <= 50) return "bg-green-100 text-green-800 border-green-200";
    if (value <= 100) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    if (value <= 150) return "bg-orange-100 text-orange-800 border-orange-200";
    return "bg-red-100 text-red-800 border-red-200";
  }
  return "bg-gray-100 text-gray-800";
}

// Helper function to safely format numbers
const safeFormat = (value, decimals = 1) => {
  if (value === null || value === undefined) return "—";
  const num = Number(value);
  if (isNaN(num)) return "—";
  return num.toFixed(decimals);
};

export default function LocationDetails() {
  const { sensorId: rawId } = useParams();
  const navigate = useNavigate();
  const sensorId = rawId ? decodeURIComponent(rawId) : "";

  const [timeRange, setTimeRange] = useState("24h");
  const [chartTab, setChartTab] = useState("aqi");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Table states
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "timeLabel", direction: "desc" });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showRawData, setShowRawData] = useState(false);

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
  const category = getAQICategory(aqiResult?.value ?? 0);
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
    for (const measurement of measurements) {
      if (isPM25Measurement(measurement) || isPM10Measurement(measurement)) continue;
      const name = measurement.measurement || "unknown";
      if (!seen.has(name)) seen.set(name, []);
      seen.get(name).push(measurement);
    }
    const out = [];
    for (const [name, list] of seen) {
      list.sort((a, b) => new Date(b.time) - new Date(a.time));
      const value = list[0]?.value;
      out.push({ 
        name, 
        value: value !== undefined && value !== null ? value : null,
        time: list[0]?.time, 
        unit: list[0]?.unit || "" 
      });
    }
    return out;
  }, [measurements]);

  // Process table data with null safety
  const tableData = useMemo(() => {
    if (!chartData || chartData.length === 0) return [];
    
    let data = [...chartData];
    
    if (searchTerm) {
      data = data.filter(row => 
        row.timeLabel?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (row.AQI && row.AQI.toString().includes(searchTerm)) ||
        (row.PM25 && row.PM25.toString().includes(searchTerm)) ||
        (row.PM10 && row.PM10.toString().includes(searchTerm))
      );
    }
    
    if (sortConfig.key && data.length > 0) {
      data.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;
        if (aVal < bVal) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (aVal > bVal) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }
    
    return data;
  }, [chartData, searchTerm, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(tableData.length / itemsPerPage));
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return tableData.slice(startIndex, startIndex + itemsPerPage);
  }, [tableData, currentPage, itemsPerPage]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc"
    }));
  };

  const handleExportCSV = () => {
    if (!tableData.length) return;
    const headers = ["timeLabel", "AQI", "PM25", "PM10"];
    const csvData = tableData.map(row => 
      headers.map(header => row[header] ?? "").join(",")
    );
    const csv = [headers.join(","), ...csvData].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sensor_data_${sensorId}_${new Date().toISOString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getTrendIcon = (value) => {
    if (value === null || value === undefined) return null;
    if (value > 100) return <TrendingUp className="h-4 w-4 text-red-500" />;
    if (value > 50) return <TrendingUp className="h-4 w-4 text-orange-500" />;
    return <TrendingDown className="h-4 w-4 text-green-500" />;
  };

  const { lat, lng } = topicToLatLng(sensorId);

  const connStatus = connectionStatusFromLastMs(lastUpdateMs);

  if (!sensorId) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center px-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="py-12">
            <h2 className="text-xl font-bold text-foreground mb-2">Invalid sensor link</h2>
            <p className="text-muted text-sm mb-6">
              This monitoring location could not be found.
            </p>
            <Button onClick={() => navigate("/")}>Return home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <SensorDetailHero
        sensorId={sensorId}
        aqi={aqiResult?.value ?? 0}
        lastUpdateMs={lastUpdateMs}
        lat={lat}
        lng={lng}
        connStatus={connStatus}
        loading={loading}
        onBack={() => navigate(-1)}
        onExport={handleExportCSV}
        exportDisabled={tableData.length === 0}
      />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 rounded-xl border border-aqi-unhealthy/30 bg-aqi-unhealthy-soft/40 p-4 text-aqi-unhealthy text-sm">
            {error}
          </div>
        )}

        <HealthAdvicePanel aqi={aqiResult?.value ?? 0} className="mb-8" />

        <Card className="mb-8 border-border">
          <CardContent className="pt-6">
          <h2 className="mb-6 text-xl font-semibold text-foreground flex items-center gap-2">
            <Eye className="h-5 w-5 text-brand-600" />
            Current readings
          </h2>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl bg-brand-50 border border-brand-100 p-5 text-center">
              <div className="flex items-center justify-center mb-2">
                <Wind className="h-5 w-5 text-blue-600" />
              </div>
              <div className="text-xs text-muted font-medium mb-1">PM₂.₅</div>
              <div className="text-3xl font-bold text-brand-700">
                {latestPm25 !== undefined && latestPm25 !== null ? latestPm25.toFixed(1) : "—"}
              </div>
              <div className="text-xs text-gray-500 mt-1">µg/m³</div>
              {latestPm25 !== undefined && latestPm25 !== null && getTrendIcon(latestPm25)}
            </div>
            
            <div className="rounded-xl bg-surface border border-border p-5 text-center">
              <div className="flex items-center justify-center mb-2">
                <Droplet className="h-5 w-5 text-purple-600" />
              </div>
              <div className="text-xs text-muted font-medium mb-1">PM₁₀</div>
              <div className="text-3xl font-bold text-foreground">
                {latestPm10 !== undefined && latestPm10 !== null ? latestPm10.toFixed(1) : "—"}
              </div>
              <div className="text-xs text-gray-500 mt-1">µg/m³</div>
              {latestPm10 !== undefined && latestPm10 !== null && getTrendIcon(latestPm10)}
            </div>

            {otherSeries.slice(0, 2).map((o) => (
              <div key={o.name} className="rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 p-5 text-center transform transition-all hover:scale-105">
                <div className="text-xs text-gray-600 font-medium mb-1">{o.name}</div>
                <div className="text-2xl font-bold text-gray-700">
                  {safeFormat(o.value, 1)}
                </div>
                <div className="text-xs text-gray-500 mt-1">{o.unit || "value"}</div>
              </div>
            ))}
          </div>

          {otherSeries.length > 2 && (
            <div className="mt-6">
              <details className="cursor-pointer">
                <summary className="text-sm font-medium text-gray-700 mb-2">
                  Other measurements ({otherSeries.length - 2} more)
                </summary>
                <div className="mt-3 flex flex-wrap gap-2">
                  {otherSeries.slice(2).map((o) => (
                    <span
                      key={o.name}
                      className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5 text-xs text-gray-800"
                    >
                      <span className="font-medium">{o.name}:</span>
                      {safeFormat(o.value, 2)} {o.unit}
                    </span>
                  ))}
                </div>
              </details>
            </div>
          )}
          </CardContent>
        </Card>

        <Card className="mb-8 border-border">
          <CardContent className="pt-6">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-semibold text-foreground">Historical analysis</h2>
            <div className="flex gap-2">
              <button
                type="button"
                className={tabBtn(timeRange === "24h")}
                onClick={() => setTimeRange("24h")}
              >
                24 Hours
              </button>
              <button
                type="button"
                className={tabBtn(timeRange === "7d")}
                onClick={() => setTimeRange("7d")}
              >
                7 Days
              </button>
            </div>
          </div>

          <div className="mb-4 flex gap-2 border-b border-gray-200 pb-2">
            <button
              type="button"
              className={tabBtn(chartTab === "aqi")}
              onClick={() => setChartTab("aqi")}
            >
              AQI Trend
            </button>
            <button
              type="button"
              className={tabBtn(chartTab === "pollutants")}
              onClick={() => setChartTab("pollutants")}
            >
              Pollutants Comparison
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading chart data...</p>
              </div>
            </div>
          ) : !chartData || chartData.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No data available for the selected time range
            </div>
          ) : chartTab === "aqi" ? (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="timeLabel" 
                  tick={{ fontSize: 11 }} 
                  height={72} 
                  angle={-30} 
                  dy={10}
                  stroke="#6b7280"
                />
                <YAxis 
                  label={{ value: "Air Quality Index", angle: -90, position: "insideLeft" }}
                  stroke="#6b7280"
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "white", 
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="AQI" 
                  stroke="#2563eb" 
                  strokeWidth={2} 
                  dot={false} 
                  name="Air Quality Index"
                  activeDot={{ r: 6, fill: "#2563eb" }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="timeLabel" 
                  tick={{ fontSize: 11 }} 
                  height={72} 
                  angle={-30} 
                  dy={10}
                  stroke="#6b7280"
                />
                <YAxis 
                  label={{ value: "Concentration (µg/m³)", angle: -90, position: "insideLeft" }}
                  stroke="#6b7280"
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "white", 
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="PM25" 
                  stroke="#2563eb" 
                  strokeWidth={2} 
                  dot={false} 
                  name="PM2.5"
                />
                <Line 
                  type="monotone" 
                  dataKey="PM10" 
                  stroke="#7c3aed" 
                  strokeWidth={2} 
                  dot={false} 
                  name="PM10"
                />
              </LineChart>
            </ResponsiveContainer>
          )}

          {/* Toggle Raw Data Button */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setShowRawData(!showRawData)}
              className="text-sm text-brand-700 hover:text-brand-800 font-medium"
            >
              {showRawData ? "Hide detailed data" : "Show detailed data table"}
            </button>
          </div>
          </CardContent>
        </Card>

        {showRawData && (
          <Card className="mt-8 border-border">
            <CardContent className="pt-6">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Detailed Readings</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {tableData.length} records available
                </p>
              </div>
              
              <div className="flex gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by time or value..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                  />
                </div>
                
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={10}>10 per page</option>
                  <option value={25}>25 per page</option>
                  <option value={50}>50 per page</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  <tr>
                    <th 
                      className="py-3 px-4 text-left cursor-pointer hover:bg-gray-200 transition-colors"
                      onClick={() => handleSort("timeLabel")}
                    >
                      <div className="flex items-center gap-2">
                        Timestamp
                        {sortConfig.key === "timeLabel" && (
                          sortConfig.direction === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </th>
                    <th 
                      className="py-3 px-4 text-right cursor-pointer hover:bg-gray-200 transition-colors"
                      onClick={() => handleSort("AQI")}
                    >
                      <div className="flex items-center justify-end gap-2">
                        AQI
                        {sortConfig.key === "AQI" && (
                          sortConfig.direction === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </th>
                    <th className="py-3 px-4 text-right">Category</th>
                    <th 
                      className="py-3 px-4 text-right cursor-pointer hover:bg-gray-200 transition-colors"
                      onClick={() => handleSort("PM25")}
                    >
                      <div className="flex items-center justify-end gap-2">
                        PM2.5 (µg/m³)
                        {sortConfig.key === "PM25" && (
                          sortConfig.direction === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </th>
                    <th 
                      className="py-3 px-4 text-right cursor-pointer hover:bg-gray-200 transition-colors"
                      onClick={() => handleSort("PM10")}
                    >
                      <div className="flex items-center justify-end gap-2">
                        PM10 (µg/m³)
                        {sortConfig.key === "PM10" && (
                          sortConfig.direction === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </th>
                  </tr>
                </thead>
                
                <tbody>
                  {paginatedData.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-gray-500">
                        No matching records found
                      </td>
                    </tr>
                  ) : (
                    paginatedData.map((row, i) => {
                      const aqiCategory = getAQICategory(row.AQI);
                      return (
                        <tr key={i} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                          <td className="py-3 px-4 font-medium text-gray-900">
                            {row.timeLabel || "—"}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-semibold">
                            <span style={{ color: aqiCategory.textColor }}>
                              {row.AQI !== undefined && row.AQI !== null ? row.AQI : "—"}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${badgeClass(row.AQI, "aqi")}`}>
                              {aqiCategory.label}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono">
                            {row.PM25 !== undefined && row.PM25 !== null ? row.PM25.toFixed(1) : "—"}
                          </td>
                          <td className="py-3 px-4 text-right font-mono">
                            {row.PM10 !== undefined && row.PM10 !== null ? row.PM10.toFixed(1) : "—"}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {tableData.length > 0 && (
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, tableData.length)} of {tableData.length} entries
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  >
                    Previous
                  </button>
                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                            currentPage === pageNum
                              ? "bg-blue-500 text-white"
                              : "border border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
            </CardContent>
          </Card>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}