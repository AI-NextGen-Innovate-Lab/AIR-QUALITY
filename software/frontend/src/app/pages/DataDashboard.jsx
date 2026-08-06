import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from 'react-router-dom';
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
  Calendar,
  TrendingUp,
  Database,
  Filter,
  Search,
  ChevronUp,
  ChevronDown,
  Activity,
  Clock,
} from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { useReadings } from '@/app/hooks/useReadings';
import { groupReadingsBySensor } from '@/app/lib/sensorData';
import {
  buildBucketedSeries,
  filterRowsBySensor,
} from '@/app/lib/readings/chartSeries';
import { DashboardPage } from '@/app/components/layout/DashboardPage';
import { PageHeader } from '@/app/components/layout/PageHeader';
import { StatCard } from '@/app/components/data/StatCard';
import { AqiBadge } from '@/app/components/data/AqiBadge';
import { ErrorBlock, LoadingBlock } from '@/app/components/data/DataState';
import { Button } from '@/app/components/ui/button';
import {
  panel,
  selectClass,
  inputClass,
  labelClass,
} from '@/app/lib/dashboardStyles';
import { cn } from '@/app/lib/utils/cn';
import { tabBtn } from '@/app/lib/dashboardStyles';
import ExportPanel from '@/app/components/reports/ExportPanel';

export default function DataDashboard() {
  const { user } = useAuth();
  // Only sensor owners get the reports & export tools.
  const isOwner = String(user?.role || '').toLowerCase() === 'owner';
  const [searchParams, setSearchParams] = useSearchParams();
  const view = isOwner && searchParams.get('tab') === 'export' ? 'export' : 'analytics';
  const setView = (id) => setSearchParams(id === 'analytics' ? {} : { tab: id });
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

  return (
    <DashboardPage>
      <PageHeader
        badge={isOwner ? 'Analytics & Reports' : 'Analytics'}
        title="Data dashboard"
        description={
          isOwner
            ? 'Charts and customizable data exports.'
            : 'Charts and trends for the sensor network.'
        }
        action={
          view === 'analytics' ? (
          <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-elevated px-4 py-2 text-sm">
            <Activity className="h-4 w-4 text-brand-700" />
            <span className="font-medium text-foreground">Live</span>
            <span className="h-2 w-2 rounded-full bg-aqi-good animate-pulse" />
          </div>
          ) : (
            <Link
              to="/api-docs"
              className="inline-flex items-center gap-2 text-sm font-medium text-brand-700 hover:text-brand-800"
            >
              API documentation
            </Link>
          )
        }
      />

      {isOwner && (
        <div className="mb-6 flex flex-wrap gap-2 border-b border-border pb-3">
          <button type="button" className={tabBtn(view === 'analytics')} onClick={() => setView('analytics')}>
            Analytics
          </button>
          <button type="button" className={tabBtn(view === 'export')} onClick={() => setView('export')}>
            Reports & export
          </button>
        </div>
      )}

      {view === 'export' ? (
        <ExportPanel />
      ) : (
      <>
      {error && <ErrorBlock message={error} className="mb-6" />}

        <div className={panel('mb-6')}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-brand-700" />
              <h3 className="text-lg font-semibold text-foreground">Filters</h3>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className={labelClass}>Sensor</label>
              <select
                className={cn(selectClass, 'mt-1')}
                value={selectedSensor}
                onChange={(e) => setSelectedSensor(e.target.value)}
              >
                {sensors.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.id}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Time range</label>
              <select
                className={cn(selectClass, 'mt-1')}
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
              >
                <option value="24h">Last 24 hours</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Metric</label>
              <select
                className={cn(selectClass, 'mt-1')}
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

        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <StatCard
            icon={TrendingUp}
            value={loading ? '—' : stats.avg.toFixed(0)}
            label="Average AQI"
          />
          <StatCard
            icon={Activity}
            value={loading ? '—' : stats.max}
            label="Max AQI"
            accent="map"
          />
          <StatCard
            icon={Database}
            value={loading ? '—' : stats.min}
            label="Min AQI"
            accent="good"
          />
          <StatCard icon={Clock} value={chartData.length} label="Buckets" />
        </div>

        <div className={panel('mb-6')}>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">{series} trend</h3>
            <div className="flex items-center gap-2 text-sm text-muted">
              <Clock className="h-4 w-4" />
              <span>
                {timeRange === '24h'
                  ? '15-min'
                  : timeRange === '7d'
                    ? '2-hour'
                    : '6-hour'}{' '}
                buckets
              </span>
            </div>
          </div>
          {loading ? (
            <LoadingBlock message="Loading chart…" />
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="timeLabel" stroke="var(--color-muted)" fontSize={12} />
                <YAxis stroke="var(--color-muted)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-surface-elevated)',
                    borderRadius: '12px',
                    border: '1px solid var(--color-border)',
                  }}
                />
                <Legend />
                <Line
                  dataKey={series}
                  stroke="var(--color-brand-600)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6, fill: 'var(--color-brand-600)' }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className={panel()}>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-brand-700" />
              <h3 className="text-lg font-semibold text-foreground">History</h3>
              <span className="text-sm text-muted">({tableData.length} records)</span>
            </div>

            <div className="flex gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="search"
                  placeholder="Search records…"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className={cn(inputClass, 'pl-9 w-48 sm:w-64')}
                />
              </div>

              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className={selectClass}
              >
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-surface">
                <tr>
                  <th
                    className="cursor-pointer px-4 py-3 text-left transition-colors hover:bg-surface-elevated"
                    onClick={() => handleSort('timeLabel')}
                  >
                    <div className="flex items-center gap-2">
                      Time
                      {sortConfig.key === "timeLabel" && (
                        sortConfig.direction === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-muted font-medium">AQI</th>
                  {availableSeries.map(
                    (col) =>
                      visibleColumns[col] !== false && (
                        <th
                          key={col}
                          className="cursor-pointer px-4 py-3 text-right transition-colors hover:bg-surface-elevated"
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
                    <td
                      colSpan={availableSeries.length + 2}
                      className="py-8 text-center text-muted"
                    >
                      Loading data…
                    </td>
                  </tr>
                ) : paginatedData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={availableSeries.length + 2}
                      className="py-8 text-center text-muted"
                    >
                      No records found
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((row, i) => (
                    <tr
                      key={i}
                      className="border-b border-border transition-colors hover:bg-surface"
                    >
                      <td className="px-4 py-3 font-medium text-foreground">
                        {row.timeLabel}
                      </td>
                      <td className="px-4 py-3">
                        {row.AQI != null ? (
                          <AqiBadge aqi={row.AQI} />
                        ) : (
                          '—'
                        )}
                      </td>
                      {availableSeries.map(
                        (col) =>
                          visibleColumns[col] !== false && (
                            <td key={col} className="px-4 py-3 text-right font-mono tabular-nums">
                              {row[col] ?? '—'}
                            </td>
                          )
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && tableData.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
              <div className="text-sm text-muted">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                {Math.min(currentPage * itemsPerPage, tableData.length)} of{' '}
                {tableData.length} records
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                >
                  Previous
                </Button>
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) pageNum = i + 1;
                    else if (currentPage <= 3) pageNum = i + 1;
                    else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                    else pageNum = currentPage - 2 + i;
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setCurrentPage(pageNum)}
                        className={cn(
                          'rounded-lg px-3 py-1 text-sm transition-colors',
                          currentPage === pageNum
                            ? 'bg-brand-600 text-white'
                            : 'border border-border hover:bg-surface'
                        )}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </>
      )}
    </DashboardPage>
  );
}