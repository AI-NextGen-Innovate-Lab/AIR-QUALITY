import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ScrollText } from 'lucide-react';
import { getUsersApi } from '@/app/lib/api/users';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { panel, selectClass, labelClass } from '@/app/lib/dashboardStyles';
import { cn } from '@/app/lib/utils/cn';

const PRESETS = [
  { id: '1', label: 'Last 24 hours', days: 1 },
  { id: '7', label: 'Last 7 days', days: 7 },
  { id: '30', label: 'Last 30 days', days: 30 },
  { id: '90', label: 'Last 90 days', days: 90 },
  { id: 'custom', label: 'Custom range', days: null },
];

function toDateInputValue(date) {
  return date.toISOString().slice(0, 10);
}

export default function AuditLogsPanel() {
  const [preset, setPreset] = useState('7');
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return toDateInputValue(d);
  });
  const [to, setTo] = useState(() => toDateInputValue(new Date()));
  const [limit, setLimit] = useState(200);
  const [applied, setApplied] = useState({ preset: '7', days: 7, from: null, to: null, limit: 200 });

  const auditLogsQuery = useQuery({
    queryKey: ['audit-logs', applied],
    queryFn: () => {
      if (applied.preset === 'custom') {
        return getUsersApi.getAuditLogs({
          limit: applied.limit,
          from: applied.from,
          to: applied.to,
        });
      }
      return getUsersApi.getAuditLogs({
        limit: applied.limit,
        days: applied.days,
      });
    },
  });

  const applyFilters = () => {
    if (preset === 'custom') {
      if (!from || !to) return;
      if (new Date(from) > new Date(to)) return;
      setApplied({ preset: 'custom', days: null, from, to, limit });
    } else {
      const selected = PRESETS.find((p) => p.id === preset);
      setApplied({
        preset,
        days: selected?.days ?? 7,
        from: null,
        to: null,
        limit,
      });
    }
  };

  return (
    <div className={panel()}>
      <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
        <ScrollText className="h-5 w-5 text-brand-700" />
        System audit logs
      </h3>
      <p className="mb-4 text-sm text-muted">
        Filter by time range. Results are capped at {limit} most recent events in the selected window.
      </p>

      <div className="mb-6 flex flex-wrap items-end gap-4 rounded-xl border border-border bg-surface p-4">
        <div>
          <label className={labelClass}>Time range</label>
          <select
            className={cn(selectClass, 'mt-1 min-w-[10rem]')}
            value={preset}
            onChange={(e) => setPreset(e.target.value)}
          >
            {PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        {preset === 'custom' && (
          <>
            <div>
              <label className={labelClass}>From</label>
              <input
                type="date"
                className={cn(selectClass, 'mt-1')}
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>To</label>
              <input
                type="date"
                className={cn(selectClass, 'mt-1')}
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>
          </>
        )}

        <div>
          <label className={labelClass}>Max rows</label>
          <select
            className={cn(selectClass, 'mt-1')}
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
          >
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={200}>200</option>
            <option value={500}>500</option>
          </select>
        </div>

        <Button type="button" onClick={applyFilters}>
          Apply filters
        </Button>
      </div>

      {auditLogsQuery.isLoading ? (
        <p className="text-sm text-muted">Loading audit logs…</p>
      ) : !auditLogsQuery.data?.length ? (
        <p className="py-8 text-center text-muted">No activity logs in this range</p>
      ) : (
        <>
          <p className="mb-3 text-xs text-muted">
            Showing {auditLogsQuery.data.length} event{auditLogsQuery.data.length === 1 ? '' : 's'}
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted">
                  <th className="py-2 pr-4">Time</th>
                  <th className="py-2 pr-4">Action</th>
                  <th className="py-2 pr-4">Actor</th>
                  <th className="py-2 pr-4">Description</th>
                  <th className="py-2">Metadata</th>
                </tr>
              </thead>
              <tbody>
                {auditLogsQuery.data.map((log) => (
                  <tr key={log.id} className="border-b border-border/50 align-top">
                    <td className="py-3 pr-4 text-xs text-muted whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 pr-4">
                      <Badge variant="secondary">{log.action}</Badge>
                    </td>
                    <td className="py-3 pr-4 text-foreground">
                      {log.user?.email ?? 'Unknown'}
                    </td>
                    <td className="py-3 pr-4 text-foreground">{log.description}</td>
                    <td className="py-3">
                      <pre className="max-w-[28rem] overflow-x-auto rounded-lg bg-surface p-2 text-xs text-muted">
                        {JSON.stringify(log.metadata ?? {}, null, 2)}
                      </pre>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
