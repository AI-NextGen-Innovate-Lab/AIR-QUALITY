import React, { useState } from 'react';
import {
  Download as DownloadIcon,
  FileText,
  FileJson,
  ShieldCheck,
  Calendar,
} from 'lucide-react';
import { getUsersApi } from '@/app/lib/api/users';
import { exportRowsAs } from '@/app/lib/readings/csvExport';
import { Button } from '@/app/components/ui/button';
import { panel } from '@/app/lib/dashboardStyles';
import { cn } from '@/app/lib/utils/cn';

const RANGES = [
  { days: 7, label: 'Last 7 days' },
  { days: 30, label: 'Last 30 days' },
  { days: 90, label: 'Last 90 days' },
];

const FORMATS = [
  { value: 'csv', icon: FileText, label: 'CSV', hint: 'UTF-8 with BOM' },
  { value: 'json', icon: FileJson, label: 'JSON', hint: 'Structured records' },
  { value: 'pdf', icon: FileText, label: 'PDF', hint: 'Print / Save as PDF' },
];

const COLUMNS = ['time', 'action', 'actorEmail', 'actorRole', 'description', 'metadata'];
const MAX_EVENTS = 500;

function choiceCard(active) {
  return cn(
    'min-w-0 rounded-xl border-2 px-4 py-3 text-left transition-colors',
    active
      ? 'border-brand-500 bg-brand-50'
      : 'border-border bg-surface-elevated hover:border-brand-300'
  );
}

export default function SystemReportPanel() {
  const [days, setDays] = useState(30);
  const [format, setFormat] = useState('csv');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleDownload = async () => {
    setMessage(null);
    setError(null);
    setBusy(true);
    try {
      const logs = await getUsersApi.getAuditLogs({ limit: MAX_EVENTS, days });
      const rows = (logs || []).map((log) => ({
        time: log.createdAt,
        action: log.action,
        actorEmail: log.user?.email ?? '',
        actorRole: log.user?.role ?? '',
        description: log.description,
        metadata: JSON.stringify(log.metadata ?? {}),
      }));
      if (!rows.length) {
        setError('No system activity found in the selected range.');
        setBusy(false);
        return;
      }
      const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
      exportRowsAs(
        format,
        rows,
        COLUMNS,
        `system_report_${stamp}`,
        'System activity report',
        `${rows.length} event(s) - last ${days} days`
      );
      setMessage(
        format === 'pdf'
          ? `Prepared ${rows.length} event(s) - use your browser's "Save as PDF" in the print dialog.`
          : `Downloaded ${rows.length} event(s) as ${format.toUpperCase()}.`
      );
    } catch (e) {
      setError(e.message || 'Download failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={panel()}>
      <div className="mb-6 flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
          <ShieldCheck className="h-6 w-6" />
        </span>
        <div>
          <h3 className="text-lg font-semibold text-foreground">System activity report</h3>
          <p className="mt-1 text-sm text-muted">
            Export audit logs — logins, API key actions, and admin operations — for
            compliance and review.
          </p>
        </div>
      </div>

      {message && (
        <div className="mb-4 rounded-xl border border-aqi-good/30 bg-aqi-good-soft/20 px-4 py-3 text-sm font-medium text-aqi-good">
          {message}
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-xl border border-aqi-unhealthy/30 bg-aqi-unhealthy-soft/20 px-4 py-3 text-sm font-medium text-aqi-unhealthy">
          {error}
        </div>
      )}

      <div className="space-y-6">
        <div>
          <p className="mb-3 text-sm font-medium text-foreground">Time range</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {RANGES.map((r) => (
              <button
                key={r.days}
                type="button"
                onClick={() => setDays(r.days)}
                className={choiceCard(days === r.days)}
              >
                <Calendar className="mb-2 h-5 w-5 text-brand-700" />
                <span className="block text-sm font-medium text-foreground">{r.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-3 text-sm font-medium text-foreground">Export format</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {FORMATS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setFormat(opt.value)}
                className={choiceCard(format === opt.value)}
              >
                <opt.icon className="mb-2 h-5 w-5 text-brand-700" />
                <span className="block text-sm font-medium text-foreground">{opt.label}</span>
                <span className="mt-0.5 block text-xs text-muted">{opt.hint}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted">
          Up to {MAX_EVENTS.toLocaleString()} most-recent events per download.
        </p>
        <Button type="button" onClick={handleDownload} disabled={busy}>
          <DownloadIcon className="mr-2 h-4 w-4" />
          {busy ? 'Working…' : 'Download report'}
        </Button>
      </div>
    </div>
  );
}
