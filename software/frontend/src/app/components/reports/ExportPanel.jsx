import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Download as DownloadIcon,
  FileText,
  FileJson,
  Calendar,
  CheckCircle,
  HelpCircle,
  BookOpen,
  Info,
} from 'lucide-react';
import { fetchReadings } from '@/app/lib/api';
import { getUsersApi } from '@/app/lib/api/users';
import { groupReadingsBySensor, formatSensorLabel } from '@/app/lib/sensorData';
import { hoursForDownloadRange } from '@/app/lib/readings/downloadFilters';
import { downloadTextFile, toCsv, printRowsAsPdf } from '@/app/lib/readings/csvExport';
import { PageSection } from '@/app/components/layout/PageSection';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import { panel } from '@/app/lib/dashboardStyles';
import { cn } from '@/app/lib/utils/cn';
import { useAuth } from '@/app/context/AuthContext';

const TIME_RANGES = [
  { key: 'day', label: 'Day', hours: 24, note: 'Last 24 hours' },
  { key: 'week', label: 'Week', hours: 168, note: 'Last 7 days' },
  { key: 'month', label: 'Month', hours: 720, note: 'Last 30 days' },
  { key: 'year', label: 'Year', hours: 720, note: 'Same window as month (API cap)' },
];

const COLUMN_GLOSSARY = [
  { col: 'time', desc: 'ISO timestamp of the reading (UTC from Influx).' },
  { col: 'id', desc: 'Sensor identifier — usually the MQTT / TTN device topic.' },
  { col: 'PM2.5, PM10, …', desc: 'One column per measurement name at that timestamp (wide format).' },
  { col: 'Temperature', desc: 'Ambient temperature when reported by the device.' },
  { col: 'RelativeHumidity', desc: 'Relative humidity (%).' },
  { col: 'Pressure', desc: 'Barometric pressure when available.' },
];

const MAX_ROWS = 5000;
const MEASUREMENTS = [
  'PM2.5',
  'PM10',
  'Temperature',
  'RelativeHumidity',
  'AbsoluteHumidity',
  'Pressure',
];

function choiceCard(active) {
  return cn(
    'w-full min-w-0 rounded-xl border-2 p-3 sm:p-4 text-left transition-colors',
    active
      ? 'border-brand-500 bg-brand-50'
      : 'border-border bg-surface-elevated hover:border-brand-300'
  );
}

export default function ExportPanel() {
  const { user } = useAuth();
  const isAdmin = String(user?.role || '').toUpperCase() === 'ADMIN';
  const [selectedSensors, setSelectedSensors] = useState([]);
  const [selectedMeasurements, setSelectedMeasurements] = useState(['PM2.5', 'PM10']);
  const [timeRange, setTimeRange] = useState('week');
  const [format, setFormat] = useState('csv');
  const [reportType, setReportType] = useState('sensor');
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

  const toggleMeasurement = (measurement) => {
    setSelectedMeasurements((prev) =>
      prev.includes(measurement)
        ? prev.filter((m) => m !== measurement)
        : [...prev, measurement]
    );
  };

  const hoursSelected = hoursForDownloadRange(timeRange);
  const rangeMeta = TIME_RANGES.find((r) => r.key === timeRange) ?? TIME_RANGES[1];

  // Emit already-built rows in the chosen format (shared by both report types).
  const exportRows = (rows, columns, baseName, title, subtitle) => {
    if (format === 'json') {
      downloadTextFile(
        `${baseName}.json`,
        JSON.stringify(rows, null, 2),
        'application/json;charset=utf-8;'
      );
    } else if (format === 'pdf') {
      printRowsAsPdf(title, columns, rows, subtitle);
    } else {
      downloadTextFile(
        `${baseName}.csv`,
        '﻿' + toCsv(rows, columns),
        'text/csv;charset=utf-8;'
      );
    }
  };

  const handleDownload = async () => {
    setMessage(null);
    setError(null);
    const fmtLabel = format.toUpperCase();
    if (reportType === 'sensor' && !selectedSensors.length) {
      setError('Select at least one sensor.');
      return;
    }
    if (reportType === 'sensor' && !selectedMeasurements.length) {
      setError('Select at least one measurement.');
      return;
    }
    setBusy(true);
    try {
      const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
      if (reportType === 'system') {
        if (!isAdmin) {
          throw new Error('Only administrators can download system reports');
        }
        const logs = await getUsersApi.getAuditLogs({ limit: 500, days: 30 });
        const mapped = (logs || []).map((log) => ({
          time: log.createdAt,
          action: log.action,
          actorEmail: log.user?.email ?? '',
          actorRole: log.user?.role ?? '',
          description: log.description,
          metadata: JSON.stringify(log.metadata ?? {}),
        }));
        exportRows(
          mapped,
          ['time', 'action', 'actorEmail', 'actorRole', 'description', 'metadata'],
          `system_report_${stamp}`,
          'System activity report',
          `${mapped.length} activity row(s)`
        );
        setMessage(`Downloaded system report with ${mapped.length} activity row(s) as ${fmtLabel}.`);
        setBusy(false);
        return;
      }

      const hours = hoursForDownloadRange(timeRange);
      // Fetch per sensor (the backend caps rows per request), so a specific
      // sensor + measurement selection reliably returns that sensor's data
      // instead of being crowded out of a shared all-sensor row cap.
      const perSensor = await Promise.all(
        selectedSensors.map((id) =>
          fetchReadings({
            limit: MAX_ROWS,
            page: 1,
            hours,
            sensorId: id,
            measurement: selectedMeasurements,
          })
            .then((json) => json.data || [])
            .catch(() => [])
        )
      );
      const selMeas = new Set(selectedMeasurements);
      const filtered = perSensor
        .flat()
        .filter((r) => r.id && selMeas.has(r.measurement));
      if (!filtered.length) {
        setError('No data found for selected sensors/time range.');
        setBusy(false);
        return;
      }
      const grouped = {};
      filtered.forEach((r) => {
        const key = `${r.time}_${r.id}`;
        if (!grouped[key]) {
          grouped[key] = { time: r.time, id: r.id };
        }
        grouped[key][r.measurement] = r.value;
      });
      const rows = Object.values(grouped);
      const columns = Array.from(new Set(rows.flatMap((r) => Object.keys(r))));
      exportRows(
        rows,
        columns,
        `airquality_${stamp}`,
        'Air quality data export',
        `${rows.length} row(s) - ${selectedMeasurements.join(', ')} (${timeRange})`
      );
      setMessage(
        format === 'pdf'
          ? `Prepared ${rows.length} row(s) - use your browser's "Save as PDF" in the print dialog.`
          : `Downloaded ${rows.length} row(s) as ${fmtLabel}.`
      );
    } catch (e) {
      setError(e.message || 'Download failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardContent className="py-4 flex gap-3">
            <Info className="h-7 w-7 text-brand-700 shrink-0" />
            <div>
              <p className="font-semibold text-foreground text-sm">Max rows per request</p>
              <p className="text-xs text-muted mt-1">
                Up to {MAX_ROWS.toLocaleString()} readings per download (server limit).
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 flex gap-3">
            <Calendar className="h-7 w-7 text-brand-700 shrink-0" />
            <div>
              <p className="font-semibold text-foreground text-sm">Current window</p>
              <p className="text-xs text-muted mt-1">
                {rangeMeta.note} — <strong>{hoursSelected}h</strong> query
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 flex gap-3">
            <CheckCircle className="h-7 w-7 text-aqi-good shrink-0" />
            <div>
              <p className="font-semibold text-foreground text-sm">Privacy</p>
              <p className="text-xs text-muted mt-1">
                Private sensor data is only included for assigned owners.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {message && (
        <Card className="mb-4 border-aqi-good/30 bg-aqi-good-soft/20">
          <CardContent className="py-3 text-sm text-aqi-good font-medium">
            {message}
          </CardContent>
        </Card>
      )}
      {error && (
        <Card className="mb-4 border-aqi-unhealthy/30 bg-aqi-unhealthy-soft/20">
          <CardContent className="py-3 text-sm text-aqi-unhealthy font-medium">
            {error}
          </CardContent>
        </Card>
      )}

      <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-6 lg:col-span-2">
          <div className={panel()}>
            <h3 className="mb-3 text-lg font-semibold text-foreground">Report type</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <button
                type="button"
                className={choiceCard(reportType === 'sensor')}
                onClick={() => setReportType('sensor')}
              >
                <p className="text-sm font-medium text-foreground">Sensor data report</p>
                <p className="mt-1 text-xs text-muted">
                  Custom export by sensor, time range, and measurement.
                </p>
              </button>
              <button
                type="button"
                className={choiceCard(reportType === 'system')}
                onClick={() => setReportType('system')}
                disabled={!isAdmin}
              >
                <p className="text-sm font-medium text-foreground">System activity report</p>
                <p className="mt-1 text-xs text-muted">
                  Audit logs: login, logout, API key actions, and admin operations.
                </p>
                {!isAdmin && (
                  <p className="mt-1 text-xs text-aqi-unhealthy">Administrators only</p>
                )}
              </button>
            </div>
          </div>

          {reportType === 'sensor' && (
          <div className={cn(panel(), 'min-w-0 overflow-hidden')}>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-lg font-semibold text-foreground">1. Select sensors</h3>
              <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="flex-1 sm:flex-none"
                  onClick={() => setSelectedSensors(sensors.map((s) => s.id))}
                >
                  Select all
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="flex-1 sm:flex-none"
                  onClick={() => setSelectedSensors([])}
                >
                  Deselect all
                </Button>
              </div>
            </div>
            {sensors.length === 0 ? (
              <p className="text-sm text-muted">No sensors loaded yet. Check that the API is running.</p>
            ) : (
              <ul className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
                {sensors.map((sensor) => {
                  const selected = selectedSensors.includes(sensor.id);
                  return (
                    <li key={sensor.id} className="min-w-0">
                      <label
                        className={cn(
                          choiceCard(selected),
                          'flex cursor-pointer items-start gap-3'
                        )}
                      >
                        <input
                          type="checkbox"
                          className="mt-1 h-4 w-4 shrink-0 rounded border-border text-brand-600"
                          checked={selected}
                          onChange={() => toggleSensor(sensor.id)}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium text-foreground break-words">
                            {formatSensorLabel(sensor.id)}
                          </span>
                          <span
                            className="mt-0.5 block font-mono text-xs text-muted break-all line-clamp-3 sm:line-clamp-2"
                            title={sensor.id}
                          >
                            {sensor.id}
                          </span>
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          )}

          {reportType === 'sensor' && (
          <div className={panel()}>
            <h3 className="mb-2 text-lg font-semibold text-foreground">2. Time period</h3>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {TIME_RANGES.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTimeRange(key)}
                  className={choiceCard(timeRange === key)}
                >
                  <Calendar className="mb-2 h-6 w-6 text-brand-700" />
                  <span className="capitalize text-sm font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>
          )}

          {reportType === 'sensor' && (
          <div className={panel()}>
            <h3 className="mb-3 text-lg font-semibold text-foreground">3. Measurements</h3>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {MEASUREMENTS.map((measurement) => {
                const selected = selectedMeasurements.includes(measurement);
                return (
                  <label key={measurement} className={choiceCard(selected)}>
                    <input
                      type="checkbox"
                      className="mr-2 h-4 w-4 align-middle"
                      checked={selected}
                      onChange={() => toggleMeasurement(measurement)}
                    />
                    <span className="text-sm font-medium text-foreground">{measurement}</span>
                  </label>
                );
              })}
            </div>
          </div>
          )}

          <div className={panel()}>
            <h3 className="mb-4 text-lg font-semibold text-foreground">Export format</h3>
            <div className="grid gap-4 md:grid-cols-3">
              {[
                { value: 'csv', icon: FileText, label: 'CSV', hint: 'UTF-8 with BOM' },
                { value: 'json', icon: FileJson, label: 'JSON', hint: 'Structured records' },
                { value: 'pdf', icon: FileText, label: 'PDF', hint: 'Print / Save as PDF' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFormat(opt.value)}
                  className={choiceCard(format === opt.value)}
                >
                  <opt.icon className="mb-2 h-6 w-6 text-brand-700" />
                  <span className="text-sm font-medium block">{opt.label}</span>
                  <span className="text-xs text-muted mt-1 block">{opt.hint}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="min-w-0 space-y-6">
          <div className={cn(panel(), 'lg:sticky lg:top-24')}>
            <h3 className="mb-4 text-lg font-semibold text-foreground">Summary</h3>
            <dl className="space-y-2 text-sm text-muted">
              <div className="flex justify-between gap-2">
                <dt>Report type</dt>
                <dd className="font-medium text-foreground capitalize">{reportType}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Sensors</dt>
                <dd className="font-medium text-foreground">
                  {reportType === 'system' ? 'N/A' : selectedSensors.length}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Measurements</dt>
                <dd className="font-medium text-foreground">
                  {reportType === 'system' ? 'N/A' : selectedMeasurements.length}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Range</dt>
                <dd className="font-medium text-foreground capitalize">
                  {reportType === 'system' ? 'Recent 500 events' : timeRange}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Format</dt>
                <dd className="font-medium text-foreground uppercase">{format}</dd>
              </div>
            </dl>
            <Button
              type="button"
              className="mt-6 w-full"
              disabled={busy || (reportType === 'sensor' && (!selectedSensors.length || !selectedMeasurements.length))}
              onClick={handleDownload}
            >
              <DownloadIcon className="mr-2 h-4 w-4" />
              {busy ? 'Working…' : 'Download'}
            </Button>
            <p className="mt-3 text-xs text-muted">
              See{' '}
              <Link to="/api-docs" className="text-brand-700 hover:underline">
                API documentation
              </Link>
              .
            </p>
          </div>

          <div className={panel()}>
            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-brand-700" />
              How it works
            </h4>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted">
              <li>Choose Sensor report or System report (admin only).</li>
              <li>Filter by sensor, timeframe, and measurement.</li>
              <li>Download runs in the browser from the readings API.</li>
            </ol>
          </div>
        </div>
      </div>

      <PageSection title="CSV column reference" className="border-t border-border mt-10 py-0">
        <div className={panel()}>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm text-left">
              <thead className="bg-surface text-xs uppercase text-muted">
                <tr>
                  <th className="px-3 py-2">Column</th>
                  <th className="px-3 py-2">Meaning</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {COLUMN_GLOSSARY.map((row) => (
                  <tr key={row.col}>
                    <td className="px-3 py-2 font-mono text-xs text-brand-800">{row.col}</td>
                    <td className="px-3 py-2 text-muted">{row.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </PageSection>
    </>
  );
}
