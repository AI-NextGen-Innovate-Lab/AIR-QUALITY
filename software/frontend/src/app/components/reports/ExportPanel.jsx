import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import { groupReadingsBySensor, formatSensorLabel } from '@/app/lib/sensorData';
import { hoursForDownloadRange } from '@/app/lib/readings/downloadFilters';
import { exportRowsAs } from '@/app/lib/readings/csvExport';
import { PageSection } from '@/app/components/layout/PageSection';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import { panel } from '@/app/lib/dashboardStyles';
import { cn } from '@/app/lib/utils/cn';

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

function choiceCard(active) {
  return cn(
    'w-full min-w-0 rounded-xl border-2 p-3 sm:p-4 text-left transition-colors',
    active
      ? 'border-brand-500 bg-brand-50'
      : 'border-border bg-surface-elevated hover:border-brand-300'
  );
}

export default function ExportPanel() {
  const [selectedSensors, setSelectedSensors] = useState([]);
  const [selectedMeasurements, setSelectedMeasurements] = useState([]);
  const [timeRange, setTimeRange] = useState('week');
  const [format, setFormat] = useState('csv');
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

  // Measurements actually reported by the selected sensor(s), derived from the
  // loaded sample — mirrors how analytics narrows options once a sensor is picked.
  const availableMeasurements = useMemo(() => {
    const set = new Set();
    const chosen = new Set(selectedSensors);
    sensors.forEach((sensor) => {
      if (!chosen.has(sensor.id)) return;
      (sensor.measurements || []).forEach((m) => {
        if (m.measurement) set.add(m.measurement);
      });
    });
    return Array.from(set).sort();
  }, [sensors, selectedSensors]);

  // When the sensor selection changes, keep only measurements still available;
  // if that leaves nothing, default to the whole sensor (all measurements).
  useEffect(() => {
    setSelectedMeasurements((prev) => {
      const avail = new Set(availableMeasurements);
      const kept = prev.filter((m) => avail.has(m));
      return kept.length ? kept : availableMeasurements;
    });
  }, [availableMeasurements]);

  const hoursSelected = hoursForDownloadRange(timeRange);
  const rangeMeta = TIME_RANGES.find((r) => r.key === timeRange) ?? TIME_RANGES[1];

  const handleDownload = async () => {
    setMessage(null);
    setError(null);
    const fmtLabel = format.toUpperCase();
    if (!selectedSensors.length) {
      setError('Select at least one sensor.');
      return;
    }
    if (!selectedMeasurements.length) {
      setError('Select at least one measurement.');
      return;
    }
    setBusy(true);
    try {
      const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
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
      exportRowsAs(
        format,
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

          <div className={panel()}>
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-lg font-semibold text-foreground">3. Measurements</h3>
              {availableMeasurements.length > 0 && (
                <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="flex-1 sm:flex-none"
                    onClick={() => setSelectedMeasurements(availableMeasurements)}
                  >
                    Whole sensor
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="flex-1 sm:flex-none"
                    onClick={() => setSelectedMeasurements([])}
                  >
                    Clear
                  </Button>
                </div>
              )}
            </div>
            {!selectedSensors.length ? (
              <p className="text-sm text-muted">Select a sensor first to see its measurements.</p>
            ) : availableMeasurements.length === 0 ? (
              <p className="text-sm text-muted">
                No measurements found for the selected sensor(s) in the recent sample.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                {availableMeasurements.map((measurement) => {
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
            )}
          </div>

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
                <dt>Sensors</dt>
                <dd className="font-medium text-foreground">{selectedSensors.length}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Measurements</dt>
                <dd className="font-medium text-foreground">{selectedMeasurements.length}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Range</dt>
                <dd className="font-medium text-foreground capitalize">{timeRange}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Format</dt>
                <dd className="font-medium text-foreground uppercase">{format}</dd>
              </div>
            </dl>
            <Button
              type="button"
              className="mt-6 w-full"
              disabled={busy || !selectedSensors.length || !selectedMeasurements.length}
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
              <li>Pick sensors, a time range, and the measurements you want.</li>
              <li>Choose an export format: CSV, JSON, or PDF.</li>
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
