import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Download as DownloadIcon,
  FileText,
  FileSpreadsheet,
  Calendar,
  CheckCircle,
} from 'lucide-react';
import { fetchReadings } from '@/app/lib/api';
import { groupReadingsBySensor } from '@/app/lib/sensorData';
import { hoursForDownloadRange } from '@/app/lib/readings/downloadFilters';
import { downloadTextFile, toCsv } from '@/app/lib/readings/csvExport';
import { DashboardPage } from '@/app/components/layout/DashboardPage';
import { PageHeader } from '@/app/components/layout/PageHeader';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import { panel } from '@/app/lib/dashboardStyles';
import { cn } from '@/app/lib/utils/cn';

function choiceCard(active) {
  return cn(
    'rounded-xl border-2 p-4 text-left transition-colors',
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

  const estimateRows = useMemo(() => {
    const hours = hoursForDownloadRange(timeRange);
    const pointsPerSensor = Math.min(hours * 4, 4000);
    return pointsPerSensor * selectedSensors.length;
  }, [timeRange, selectedSensors.length]);

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
      const json = await fetchReadings({ limit: 5000, page: 1, hours });
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
        setMessage('Downloaded text + CSV content (print for PDF).');
      } else {
        const bom = '\uFEFF';
        downloadTextFile(
          `airquality_${stamp}.csv`,
          bom + csvBody,
          'text/csv;charset=utf-8;'
        );
        setMessage(
          format === 'excel'
            ? 'Downloaded CSV (Excel-compatible).'
            : 'Downloaded CSV.'
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
        description="Export sensor readings as CSV. Files are generated in your browser."
      />

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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className={panel()}>
            <div className="mb-4 flex flex-wrap justify-between gap-3">
              <h3 className="text-lg font-semibold text-foreground">Select sensors</h3>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedSensors(sensors.map((s) => s.id))}
                >
                  Select all
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedSensors([])}
                >
                  Deselect all
                </Button>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {sensors.map((sensor) => (
                <label
                  key={sensor.id}
                  className={choiceCard(selectedSensors.includes(sensor.id))}
                >
                  <span className="flex gap-3">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={selectedSensors.includes(sensor.id)}
                      onChange={() => toggleSensor(sensor.id)}
                    />
                    <span className="text-sm font-medium text-foreground truncate">
                      {sensor.id}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className={panel()}>
            <h3 className="mb-4 text-lg font-semibold text-foreground">Time period</h3>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {['day', 'week', 'month', 'year'].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setTimeRange(val)}
                  className={choiceCard(timeRange === val)}
                >
                  <Calendar className="mb-2 h-6 w-6 text-brand-700" />
                  <span className="capitalize text-sm font-medium">{val}</span>
                </button>
              ))}
            </div>
          </div>

          <div className={panel()}>
            <h3 className="mb-4 text-lg font-semibold text-foreground">Export format</h3>
            <div className="grid gap-4 md:grid-cols-3">
              {[
                { value: 'csv', icon: FileText, label: 'CSV' },
                { value: 'excel', icon: FileSpreadsheet, label: 'Excel' },
                { value: 'pdf', icon: FileText, label: 'PDF note' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFormat(opt.value)}
                  className={choiceCard(format === opt.value)}
                >
                  <opt.icon className="mb-2 h-6 w-6 text-brand-700" />
                  <span className="text-sm font-medium">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className={cn(panel(), 'sticky top-24')}>
            <h3 className="mb-4 text-lg font-semibold text-foreground">Summary</h3>
            <dl className="space-y-2 text-sm text-muted">
              <div className="flex justify-between">
                <dt>Sensors</dt>
                <dd className="font-medium text-foreground">
                  {selectedSensors.length}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt>Range</dt>
                <dd className="font-medium text-foreground capitalize">{timeRange}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Rows (est.)</dt>
                <dd className="font-medium text-foreground">{estimateRows}</dd>
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
          </div>
          <div className={cn(panel(), 'mt-6')}>
            <p className="flex gap-2 text-sm text-muted">
              <CheckCircle className="h-4 w-4 shrink-0 text-aqi-good" />
              Exports are generated locally in your browser.
            </p>
          </div>
        </div>
      </div>
    </DashboardPage>
  );
}
