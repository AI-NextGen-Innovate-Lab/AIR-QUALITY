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
import { 
  Calendar, 
  TrendingUp, 
  Database, 
  Filter, 
  Search, 
  ChevronUp, 
  ChevronDown,
  Download,
  Eye,
  Activity,
  MapPin,
  Clock,
  ArrowUpDown
} from "lucide-react";

import { useReadings } from "@/app/hooks/useReadings";
import { groupReadingsBySensor } from "@/app/lib/sensorData";
import {
  buildBucketedSeries,
  buildLocationComparison,
  filterRowsBySensor,
} from "@/app/lib/readings/chartSeries";

function panel() {
  return "rounded-xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow duration-300";
}

function selectClass() {
  return "mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
}

function inputClass() {
  return "mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
}

function badgeClass(value) {
  if (value <= 50) return "bg-green-100 text-green-800";
  if (value <= 100) return "bg-yellow-100 text-yellow-800";
  if (value <= 150) return "bg-orange-100 text-orange-800";
  return "bg-red-100 text-red-800";
}

export default function DataDashboard() {
  const [selectedSensor, setSelectedSensor] = useState("");
  const [timeRange, setTimeRange] = useState("7d");
  const [series, setSeries] = useState("AQI");
  
  // Table states
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "timeLabel", direction: "desc" });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [visibleColumns, setVisibleColumns] = useState({});
  const [showColumnSelector, setShowColumnSelector] = useState(false);

  const hours = timeRange === "24h" ? 24 : timeRange === "7d" ? 168 : 720;
  const bucketMinutes = timeRange === "24h" ? 15 : timeRange === "7d" ? 120 : 360;

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

  const comparisonData = useMemo(
    () => buildLocationComparison(rows, 12),
    [rows]
  );

  const availableSeries = useMemo(() => {
    if (!chartData.length) return ["AQI"];
    return Object.keys(chartData[0]).filter(
      (k) => !["time", "timeLabel"].includes(k)
    );
  }, [chartData]);

  useEffect(() => {
    if (!availableSeries.includes(series)) {
      setSeries(availableSeries[0] || "AQI");
    }
    
    // Initialize visible columns
    const initialColumns = {};
    availableSeries.forEach(col => {
      initialColumns[col] = true;
    });
    setVisibleColumns(initialColumns);
  }, [availableSeries]);

  const stats = useMemo(() => {
    const aqis = chartData.map((d) => d.AQI).filter((x) => x != null);
    if (!aqis.length) return { avg: 0, max: 0, min: 0 };

    return {
      avg: aqis.reduce((a, b) => a + b, 0) / aqis.length,
      max: Math.max(...aqis),
      min: Math.min(...aqis),
    };
  }, [chartData]);

  // Table data processing
  const tableData = useMemo(() => {
    let data = [...chartData];
    
    // Search filter
    if (searchTerm) {
      data = data.filter(row => 
        row.timeLabel.toLowerCase().includes(searchTerm.toLowerCase()) ||
        Object.values(row).some(val => 
          val && val.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
    
    // Sorting
    if (sortConfig.key) {
      data.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }
    
    return data;
  }, [chartData, searchTerm, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(tableData.length / itemsPerPage);
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
    const headers = ["timeLabel", ...availableSeries];
    const csvData = tableData.map(row => 
      headers.map(header => row[header] ?? "").join(",")
    );
    const csv = [headers.join(","), ...csvData].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sensor_data_${selectedSensor}_${new Date().toISOString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getAQIStatus = (aqi) => {
    if (aqi <= 50) return { status: "Good", color: "text-green-600" };
    if (aqi <= 100) return { status: "Moderate", color: "text-yellow-600" };
    if (aqi <= 150) return { status: "Unhealthy for Sensitive Groups", color: "text-orange-600" };
    return { status: "Unhealthy", color: "text-red-600" };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Air Quality Dashboard
            </h1>
            <p className="text-gray-600 mt-2">Real-time sensor monitoring and analytics</p>
          </div>
          <div className="flex gap-2">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm">
              <Activity className="h-5 w-5 text-blue-500" />
              <span className="text-sm font-medium">Live</span>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded-lg">
            {error}
          </div>
        )}

        {/* FILTERS */}
        <div className={`${panel()} mb-6`}>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-blue-500" />
              <h3 className="text-lg font-semibold">Filters & Controls</h3>
            </div>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Sensor Location</label>
              <select
                className={selectClass()}
                value={selectedSensor}
                onChange={(e) => setSelectedSensor(e.target.value)}
              >
                {sensors.map((s) => (
                  <option key={s.id} value={s.id}>
                    📍 {s.id}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Time Range</label>
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
              <label className="text-sm font-medium text-gray-700">Metric</label>
              <select
                className={selectClass()}
                value={series}
                onChange={(e) => setSeries(e.target.value)}
              >
                {availableSeries.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* STATS CARDS */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <div className={`${panel()} bg-gradient-to-br from-blue-50 to-blue-100`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Average AQI</p>
                <p className="text-3xl font-bold text-blue-600">
                  {loading ? "—" : stats.avg.toFixed(0)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-400" />
            </div>
          </div>
          
          <div className={`${panel()} bg-gradient-to-br from-red-50 to-red-100`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Max AQI</p>
                <p className="text-3xl font-bold text-red-600">
                  {loading ? "—" : stats.max}
                </p>
              </div>
              <Activity className="h-8 w-8 text-red-400" />
            </div>
          </div>
          
          <div className={`${panel()} bg-gradient-to-br from-green-50 to-green-100`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Min AQI</p>
                <p className="text-3xl font-bold text-green-600">
                  {loading ? "—" : stats.min}
                </p>
              </div>
              <Database className="h-8 w-8 text-green-400" />
            </div>
          </div>
          
          <div className={`${panel()} bg-gradient-to-br from-purple-50 to-purple-100`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Records</p>
                <p className="text-3xl font-bold text-purple-600">
                  {chartData.length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-purple-400" />
            </div>
          </div>
        </div>

        {/* CHART */}
        <div className={`${panel()} mb-6`}>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-lg">{series} Trend Analysis</h3>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="h-4 w-4" />
              <span>{timeRange === "24h" ? "Hourly" : timeRange === "7d" ? "2-hour" : "6-hour"} intervals</span>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="timeLabel" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
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
                dataKey={series} 
                stroke="#2563eb" 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6, fill: "#2563eb" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* COMPARISON CHART */}
        <div className={`${panel()} mb-6`}>
          <h3 className="mb-4 font-semibold text-lg">Location Comparison</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Bar dataKey="AQI" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* ENHANCED DATA TABLE */}
        <div className={panel()}>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              <h3 className="text-lg font-semibold">Sensor Data History</h3>
              <span className="text-sm text-gray-500">
                ({tableData.length} records)
              </span>
            </div>
            
            <div className="flex gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search records..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <option value={100}>100 per page</option>
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
                      Time
                      {sortConfig.key === "timeLabel" && (
                        sortConfig.direction === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </th>
                  <th className="py-3 px-4 text-left">AQI Status</th>
                  {availableSeries.map((col) => visibleColumns[col] !== false && (
                    <th 
                      key={col} 
                      className="py-3 px-4 text-right cursor-pointer hover:bg-gray-200 transition-colors"
                      onClick={() => handleSort(col)}
                    >
                      <div className="flex items-center justify-end gap-2">
                        {col}
                        {sortConfig.key === col && (
                          sortConfig.direction === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={availableSeries.length + 2} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                        Loading data...
                      </div>
                    </td>
                  </tr>
                ) : paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={availableSeries.length + 2} className="text-center py-8 text-gray-500">
                      No records found
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((row, i) => {
                    const aqiStatus = getAQIStatus(row.AQI);
                    return (
                      <tr key={i} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                        <td className="py-3 px-4 font-medium text-gray-900">
                          {row.timeLabel}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${badgeClass(row.AQI)}`}>
                            {aqiStatus.status}
                          </span>
                        </td>
                        {availableSeries.map((col) => visibleColumns[col] !== false && (
                          <td key={col} className="py-3 px-4 text-right font-mono">
                            {col === "AQI" ? (
                              <span className={aqiStatus.color}>
                                {row[col] ?? "—"}
                              </span>
                            ) : (
                              row[col] ?? "—"
                            )}
                          </td>
                        ))}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && tableData.length > 0 && (
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, tableData.length)} of {tableData.length} records
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
        </div>
      </div>
    </div>
  );
}