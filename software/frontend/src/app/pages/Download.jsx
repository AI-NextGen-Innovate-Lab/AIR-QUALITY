import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Download as DownloadIcon,
  FileText,
  FileSpreadsheet,
  Calendar,
  CheckCircle,
  HelpCircle,
  BookOpen,
  Info,
} from 'lucide-react';
import { fetchReadings } from '@/app/lib/api';
import { groupReadingsBySensor, formatSensorLabel } from '@/app/lib/sensorData';
import { hoursForDownloadRange } from '@/app/lib/readings/downloadFilters';
import { downloadTextFile, toCsv } from '@/app/lib/readings/csvExport';
import { DashboardPage } from '@/app/components/layout/DashboardPage';
import { PageHeader } from '@/app/components/layout/PageHeader';
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

export default function Download() {
  const [selectedSensors, setSelectedSensors] = useState([]);
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

  const hoursSelected = hoursForDownloadRange(timeRange);
  const rangeMeta = TIME_RANGES.find((r) => r.key === timeRange) ?? TIME_RANGES[1];

  const estimateRows = useMemo(() => {
    const pointsPerSensor = Math.min(hoursSelected * 4, MAX_ROWS);
    return pointsPerSensor * selectedSensors.length;
  }, [hoursSelected, selectedSensors.length]);

  const handleDownload = async () => {
    setMessage(null);
    setError(null);
    if (!selectedSensors.length) {
      setError('Select at least one sensor.');
      return;
    }
    setBusy(true);
    try {
      const hours = hoursForDownloadRange(timeRange);
      const json = await fetchReadings({ limit: MAX_ROWS, page: 1, hours });
      const setIds = new Set(selectedSensors);
      const filtered = (json.data || []).filter((r) => r.id && setIds.has(r.id));
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
      const csvBody = toCsv(rows, columns);
      const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
      if (format === 'pdf') {
        const note =
          'Air quality export\n\nPDF is not generated server-side. Use CSV or Excel.\n\n';
        downloadTextFile(
          `airquality_${stamp}.txt`,
          note + csvBody,
          'text/plain;charset=utf-8;'
        );
        setMessage(`Downloaded ${rows.length} row(s) as text + CSV (print for PDF).`);
      } else {
        const bom = '\uFEFF';
        downloadTextFile(
          `airquality_${stamp}.csv`,
          bom + csvBody,
          'text/csv;charset=utf-8;'
        );
        setMessage(
          format === 'excel'
            ? `Downloaded ${rows.length} row(s) — CSV (Excel-compatible).`
            : `Downloaded ${rows.length} row(s) as CSV.`
        );
      }
    } catch (e) {
      setError(e.message || 'Download failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <DashboardPage>
      <PageHeader
        badge="Data export"
        title="Download center"
        description="Export sensor readings as CSV. Files are built in your browser from the public readings API."
        action={
          <Link
            to="/api-docs"
            className="inline-flex items-center gap-2 text-sm font-medium text-brand-700 hover:text-brand-800"
          >
            <BookOpen className="h-4 w-4" />
            API documentation
          </Link>
        }
      />

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
                No login required; export runs locally in your browser.
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
            <p className="text-sm text-muted mb-4">
              Choose one or more devices. Long MQTT topic names wrap on small screens.
            </p>
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
            <p className="text-sm text-muted mb-4">
              Each option maps to an <code className="text-foreground">hours</code> parameter on{' '}
              <code className="text-foreground">GET /readings</code>.
            </p>
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
            <div className="mt-4 overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm text-left">
                <thead className="bg-surface text-xs uppercase text-muted">
                  <tr>
                    <th className="px-3 py-2">Range</th>
                    <th className="px-3 py-2">Hours</th>
                    <th className="px-3 py-2">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {TIME_RANGES.map((r) => (
                    <tr key={r.key} className={timeRange === r.key ? 'bg-brand-50/50' : ''}>
                      <td className="px-3 py-2 font-medium capitalize">{r.key}</td>
                      <td className="px-3 py-2 font-mono text-xs">{r.hours}</td>
                      <td className="px-3 py-2 text-muted">{r.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className={panel()}>
            <h3 className="mb-4 text-lg font-semibold text-foreground">3. Export format</h3>
            <div className="grid gap-4 md:grid-cols-3">
              {[
                {
                  value: 'csv',
                  icon: FileText,
                  label: 'CSV',
                  hint: 'UTF-8 with BOM — opens in Excel, Sheets, R, Python',
                },
                {
                  value: 'excel',
                  icon: FileSpreadsheet,
                  label: 'Excel',
                  hint: 'Same CSV file; Excel recognizes encoding',
                },
                {
                  value: 'pdf',
                  icon: FileText,
                  label: 'PDF note',
                  hint: 'Plain text + CSV; print to PDF from your OS',
                },
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
                <dt>Range</dt>
                <dd className="font-medium text-foreground capitalize">{timeRange}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>API hours</dt>
                <dd className="font-medium text-foreground font-mono">{hoursSelected}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Rows (est.)</dt>
                <dd className="font-medium text-foreground">
                  ~{estimateRows.toLocaleString()}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>API limit</dt>
                <dd className="font-medium text-foreground font-mono">{MAX_ROWS}</dd>
              </div>
            </dl>
            <Button
              type="button"
              className="mt-6 w-full"
              disabled={busy || !selectedSensors.length}
              onClick={handleDownload}
            >
              <DownloadIcon className="mr-2 h-4 w-4" />
              {busy ? 'Working…' : 'Download'}
            </Button>
            <p className="mt-3 text-xs text-muted">
              Need programmatic access? See{' '}
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
              <li>Loads recent readings to list available sensors.</li>
              <li>Fetches up to {MAX_ROWS} rows for your time window.</li>
              <li>Filters to selected sensors and pivots measurements into columns.</li>
              <li>Triggers a browser download — nothing is stored on our servers.</li>
            </ol>
          </div>
        </div>
      </div>

      <PageSection title="CSV column reference" className="border-t border-border mt-10 py-0">
        <div className={panel()}>
          <p className="text-sm text-muted mb-4">
            Exports use a wide layout: one row per timestamp per sensor, with pollutant and weather
            fields as separate columns when present in the data.
          </p>
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

      <PageSection title="FAQ" className="border-t border-border py-0 pb-12">
        <div className={cn(panel(), 'space-y-4 text-sm text-muted')}>
          <div>
            <p className="font-semibold text-foreground">Why fewer rows than expected?</p>
            <p className="mt-1">
              The API returns at most {MAX_ROWS} readings per request. Very active sensors or long
              ranges may hit that cap — narrow the time range or export one sensor at a time.
            </p>
          </div>
          <div>
            <p className="font-semibold text-foreground">Missing PM2.5 or humidity columns?</p>
            <p className="mt-1">
              Columns appear only if the device reported that measurement in the selected window.
            </p>
          </div>
          <div>
            <p className="font-semibold text-foreground">Automating exports?</p>
            <p className="mt-1">
              Call{' '}
              <code className="text-foreground">GET /backend/api/readings?hours=168&limit=5000</code>{' '}
              from your script — details on the{' '}
              <Link to="/api-docs" className="text-brand-700 hover:underline">
                API docs
              </Link>{' '}
              page.
            </p>
          </div>
        </div>
      </PageSection>
    </DashboardPage>
  );
}
