import React, { useEffect, useState } from 'react';
import { Users, Activity, AlertCircle, Settings } from 'lucide-react';
import { fetchHealth, fetchReadings } from '@/app/lib/api';
import { groupReadingsBySensor } from '@/app/lib/sensorData';
import {
  averageAqiFromSensors,
  totalReadingCount,
} from '@/app/lib/admin/adminMetrics';
import { DashboardPage } from '@/app/components/layout/DashboardPage';
import { PageHeader } from '@/app/components/layout/PageHeader';
import { StatCard } from '@/app/components/data/StatCard';
import { ErrorBlock } from '@/app/components/data/DataState';
import { panel, tabBtn } from '@/app/lib/dashboardStyles';
import { cn } from '@/app/lib/utils/cn';
import UserManagement from './UserManagement';

function pill(text, variant = 'neutral') {
  const cls =
    variant === 'ok'
      ? 'bg-aqi-good-soft text-aqi-good'
      : variant === 'warn'
        ? 'bg-aqi-moderate-soft text-aqi-moderate'
        : 'bg-surface text-muted border border-border';
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        cls
      )}
    >
      {text}
    </span>
  );
}

export default function AdminPanel() {
  const [tab, setTab] = useState('overview');
  const [health, setHealth] = useState(null);
  const [readError, setReadError] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      fetchHealth().catch(() => null),
      fetchReadings({ limit: 3000, page: 1, hours: 24 }).catch((e) => {
        if (!cancelled) setReadError(e.message);
        return { data: [] };
      }),
    ]).then(([h, json]) => {
      if (cancelled) return;
      setHealth(h);
      setRows(json.data || []);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const sensorsGrouped = groupReadingsBySensor(rows);
  const cityAqi = averageAqiFromSensors(sensorsGrouped);
  const readingCount = totalReadingCount(rows);

  return (
    <DashboardPage>
      <PageHeader
        badge="Administration"
        title="Admin panel"
        description="System health, user management, and Influx snapshot for the last 24 hours."
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Activity}
          value={loading ? '—' : sensorsGrouped.length}
          label="Topics (24h)"
        />
        <StatCard
          icon={Users}
          value={loading ? '—' : readingCount}
          label="Rows loaded"
        />
        <StatCard
          icon={AlertCircle}
          value="—"
          label="Pending requests"
        />
        <StatCard
          icon={Settings}
          value={loading ? '—' : Math.round(cityAqi)}
          label="Avg AQI"
        />
      </div>

      {readError && (
        <ErrorBlock message={`Readings: ${readError}`} className="mb-6" />
      )}

      <div className="mb-4 flex flex-wrap gap-2 border-b border-border pb-3">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'requests', label: 'Pending requests' },
          { id: 'users', label: 'Users' },
          { id: 'api', label: 'API keys' },
          { id: 'system', label: 'System' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            className={tabBtn(tab === t.id)}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className={panel()}>
          <h3 className="mb-3 text-lg font-semibold text-foreground">
            Influx snapshot
          </h3>
          <ul className="list-inside list-disc space-y-2 text-sm text-muted">
            <li>API health: {health?.ok ? 'reachable' : 'unreachable or error'}</li>
            <li>Server time: {health?.time || '—'}</li>
            <li>Topics with data in the last 24h: {sensorsGrouped.length}</li>
            <li>Rows in this admin sample: {readingCount}</li>
          </ul>
        </div>
      )}

      {tab === 'requests' && (
        <div className={panel()}>
          <h3 className="mb-2 text-lg font-semibold text-foreground">
            Private sensor requests
          </h3>
          <p className="mb-4 text-sm text-muted">
            There is no POST/approval API yet. Wire this tab to your user database
            when available.
          </p>
          <div className="py-12 text-center text-muted">No pending requests</div>
        </div>
      )}

      {tab === 'users' && (
        <div className={panel()}>
          <h3 className="mb-6 text-lg font-semibold text-foreground">
            User management
          </h3>
          <UserManagement />
        </div>
      )}

      {tab === 'api' && (
        <div className={panel()}>
          <h3 className="mb-2 text-lg font-semibold text-foreground">API keys</h3>
          <p className="mb-4 text-sm text-muted">
            Key management is not implemented on this server. Use Influx tokens and
            env vars on the backend.
          </p>
          <div className="py-12 text-center text-muted">No keys exposed here</div>
        </div>
      )}

      {tab === 'system' && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className={panel()}>
            <h3 className="mb-4 text-lg font-semibold text-foreground">Status</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted">HTTP API</span>
                {pill(health?.ok ? 'Online' : 'Unknown', health?.ok ? 'ok' : 'warn')}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Readings query</span>
                {pill(readError ? 'Error' : 'OK', readError ? 'warn' : 'ok')}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">InfluxDB</span>
                {pill(
                  readError ? 'Check logs' : 'Responding',
                  readError ? 'warn' : 'ok'
                )}
              </div>
            </div>
          </div>

          <div className={panel()}>
            <h3 className="mb-4 text-lg font-semibold text-foreground">Activity</h3>
            <div className="space-y-3 text-sm text-muted">
              <div className="flex gap-3">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" />
                <div>
                  <div className="text-foreground">
                    Loaded {readingCount} raw points for admin overview
                  </div>
                  <div className="text-xs text-muted">Last refresh on mount</div>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-aqi-good" />
                <div>
                  <div className="text-foreground">
                    {sensorsGrouped.length} topics seen in the rolling window
                  </div>
                  <div className="text-xs text-muted">Based on grouped readings</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardPage>
  );
}
