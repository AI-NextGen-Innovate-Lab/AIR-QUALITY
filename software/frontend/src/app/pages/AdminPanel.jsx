import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Activity, AlertCircle, Settings, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { fetchHealth } from '@/app/lib/api';
import { useReadingsQuery } from '@/app/hooks/useReadingsQuery';
import { groupReadingsBySensor } from '@/app/lib/sensorData';
import {
  averageAqiFromSensors,
  totalReadingCount,
} from '@/app/lib/admin/adminMetrics';
import {
  fetchApiKeyRequests,
  fetchAllApiKeys,
  approveApiKeyRequest,
  rejectApiKeyRequest,
  revokeApiKey,
} from '@/app/lib/api/apiKeys';
import { DashboardPage } from '@/app/components/layout/DashboardPage';
import { PageHeader } from '@/app/components/layout/PageHeader';
import { StatCard } from '@/app/components/data/StatCard';
import { ErrorBlock } from '@/app/components/data/DataState';
import { panel, tabBtn } from '@/app/lib/dashboardStyles';
import { cn } from '@/app/lib/utils/cn';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import UserManagement from './UserManagement';
import SensorManagement from './SensorManagement';
import AuditLogsPanel from './AuditLogsPanel';
import { useAuth } from '@/app/context/AuthContext';

function pill(text, variant = 'neutral') {
  const cls =
    variant === 'ok'
      ? 'bg-aqi-good-soft text-aqi-good'
      : variant === 'warn'
        ? 'bg-aqi-moderate-soft text-aqi-moderate'
        : 'bg-surface text-muted border border-border';
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', cls)}>
      {text}
    </span>
  );
}

export default function AdminPanel() {
  const { user } = useAuth();
  const isAdmin = String(user?.role || '').toUpperCase() === 'ADMIN';
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'overview';
  const setTab = (id) => setSearchParams({ tab: id });
  const queryClient = useQueryClient();

  const healthQuery = useQuery({
    queryKey: ['health'],
    queryFn: fetchHealth,
    staleTime: 30_000,
  });

  const { loading: readingsLoading, error: readError, data: rows } = useReadingsQuery({
    limit: 3000,
    page: 1,
    hours: 24,
  });

  const pendingQuery = useQuery({
    queryKey: ['api-key-requests', 'pending'],
    queryFn: () => fetchApiKeyRequests('PENDING'),
  });

  const keysQuery = useQuery({
    queryKey: ['api-keys', 'all'],
    queryFn: () => fetchAllApiKeys('ACTIVE'),
  });

  const approveMutation = useMutation({
    mutationFn: approveApiKeyRequest,
    onSuccess: (data) => {
      toast.success('Request approved. Copy the key from the response — it is shown once.');
      if (data?.key) {
        window.prompt('Copy this API key now (shown once):', data.key);
      }
      queryClient.invalidateQueries({ queryKey: ['api-key-requests'] });
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    },
    onError: (e) => toast.error(e.message),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, note }) => rejectApiKeyRequest(id, note),
    onSuccess: () => {
      toast.success('Request rejected');
      queryClient.invalidateQueries({ queryKey: ['api-key-requests'] });
    },
    onError: (e) => toast.error(e.message),
  });

  const revokeMutation = useMutation({
    mutationFn: revokeApiKey,
    onSuccess: () => {
      toast.success('API key revoked');
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    },
    onError: (e) => toast.error(e.message),
  });

  const sensorsGrouped = groupReadingsBySensor(rows);
  const cityAqi = averageAqiFromSensors(sensorsGrouped);
  const readingCount = totalReadingCount(rows);
  const pendingCount = pendingQuery.data?.length ?? 0;
  const activeKeyCount = keysQuery.data?.length ?? 0;

  return (
    <DashboardPage>
      <PageHeader
        badge="Administration"
        title="Operations center"
        description="System health, API access, user management, and sensor snapshot."
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} value={readingsLoading ? '—' : sensorsGrouped.length} label="Topics (24h)" />
        <StatCard icon={AlertCircle} value={pendingQuery.isLoading ? '—' : pendingCount} label="Pending requests" />
        <StatCard icon={KeyRound} value={keysQuery.isLoading ? '—' : activeKeyCount} label="Active API keys" />
        <StatCard icon={Settings} value={readingsLoading ? '—' : Math.round(cityAqi)} label="Avg AQI" />
      </div>

      {readError && <ErrorBlock message={`Readings: ${readError}`} className="mb-6" />}

      <div className="mb-4 flex flex-wrap gap-2 border-b border-border pb-3">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'requests', label: 'API Requests' },
          { id: 'users', label: 'Users' },
          ...(isAdmin ? [{ id: 'sensors', label: 'Sensors' }] : []),
          { id: 'api', label: 'API Keys' },
          { id: 'audit', label: 'Audit logs' },
          { id: 'system', label: 'System' },
        ].map((t) => (
          <button key={t.id} type="button" className={tabBtn(tab === t.id)} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className={panel()}>
          <h3 className="mb-3 text-lg font-semibold text-foreground">Influx snapshot</h3>
          <ul className="list-inside list-disc space-y-2 text-sm text-muted">
            <li>API health: {healthQuery.data?.ok ? 'reachable' : 'unreachable or error'}</li>
            <li>Server time: {healthQuery.data?.time || '—'}</li>
            <li>Topics with data in the last 24h: {sensorsGrouped.length}</li>
            <li>Rows in this admin sample: {readingCount}</li>
          </ul>
        </div>
      )}

      {tab === 'requests' && (
        <div className={panel()}>
          <h3 className="mb-4 text-lg font-semibold text-foreground">Pending API requests</h3>
          {pendingQuery.isLoading ? (
            <p className="text-sm text-muted">Loading…</p>
          ) : !pendingQuery.data?.length ? (
            <p className="py-8 text-center text-muted">No pending requests</p>
          ) : (
            <div className="space-y-4">
              {pendingQuery.data.map((req) => (
                <div key={req.id} className="rounded-xl border border-border bg-surface-elevated p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground">{req.user?.name}</p>
                      <p className="text-xs text-muted">{req.user?.email}</p>
                      <p className="mt-2 text-sm text-foreground">{req.purpose}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Requested {new Date(req.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => approveMutation.mutate(req.id)}
                        disabled={approveMutation.isPending}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          const note = window.prompt('Rejection note (optional):') ?? '';
                          rejectMutation.mutate({ id: req.id, note });
                        }}
                        disabled={rejectMutation.isPending}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'users' && (
        <div className={panel()}>
          <h3 className="mb-6 text-lg font-semibold text-foreground">User management</h3>
          <UserManagement />
        </div>
      )}

      {tab === 'sensors' && isAdmin && (
        <div className={panel()}>
          <h3 className="mb-6 text-lg font-semibold text-foreground">Sensor registry</h3>
          <SensorManagement />
        </div>
      )}

      {tab === 'api' && (
        <div className={panel()}>
          <h3 className="mb-4 text-lg font-semibold text-foreground">API keys</h3>
          {keysQuery.isLoading ? (
            <p className="text-sm text-muted">Loading…</p>
          ) : !keysQuery.data?.length ? (
            <p className="py-8 text-center text-muted">No active API keys</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-muted">
                    <th className="py-2 pr-4">User</th>
                    <th className="py-2 pr-4">Prefix</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Created</th>
                    <th className="py-2 pr-4">Last used</th>
                    <th className="py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {keysQuery.data.map((key) => (
                    <tr key={key.id} className="border-b border-border/50">
                      <td className="py-3 pr-4 text-foreground">{key.user?.email}</td>
                      <td className="py-3 pr-4 font-mono text-muted">{key.keyPrefix}…</td>
                      <td className="py-3 pr-4">
                        <Badge>{key.status}</Badge>
                      </td>
                      <td className="py-3 pr-4 text-muted">
                        {new Date(key.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 pr-4 text-muted">
                        {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3">
                        {isAdmin && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            if (window.confirm('Revoke this API key?')) {
                              revokeMutation.mutate(key.id);
                            }
                          }}
                        >
                          Revoke
                        </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'audit' && <AuditLogsPanel />}

      {tab === 'system' && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className={panel()}>
            <h3 className="mb-4 text-lg font-semibold text-foreground">Status</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted">HTTP API</span>
                {pill(healthQuery.data?.ok ? 'Online' : 'Unknown', healthQuery.data?.ok ? 'ok' : 'warn')}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Readings query</span>
                {pill(readError ? 'Error' : 'OK', readError ? 'warn' : 'ok')}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">InfluxDB</span>
                {pill(readError ? 'Check logs' : 'Responding', readError ? 'warn' : 'ok')}
              </div>
            </div>
          </div>

          <div className={panel()}>
            <h3 className="mb-4 text-lg font-semibold text-foreground">Activity</h3>
            <div className="space-y-3 text-sm text-muted">
              <div className="flex gap-3">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                <div>
                  <div className="text-foreground">{readingCount} raw points in admin sample</div>
                  <div className="text-xs text-muted-foreground">Cached via TanStack Query</div>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                <div>
                  <div className="text-foreground">{sensorsGrouped.length} topics in rolling window</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardPage>
  );
}
