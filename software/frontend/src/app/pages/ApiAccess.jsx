import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { KeyRound, Copy, Check, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { DashboardPage } from '@/app/components/layout/DashboardPage';
import { PageHeader } from '@/app/components/layout/PageHeader';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { panel } from '@/app/lib/dashboardStyles';
import {
  createApiKeyRequest,
  fetchMyApiKeyRequests,
  fetchMyApiKeys,
} from '@/app/lib/api/apiKeys';

const TIER_INFO = [
  { tier: 'Public', limit: '30 req/min', history: '24 hours', rows: '100' },
  { tier: 'Authenticated', limit: '60 req/min', history: '7 days', rows: '500' },
  { tier: 'API key', limit: '300 req/min', history: '30 days', rows: '5,000' },
];

function statusVariant(status) {
  if (status === 'APPROVED' || status === 'ACTIVE') return 'default';
  if (status === 'PENDING') return 'secondary';
  if (status === 'REJECTED' || status === 'REVOKED') return 'destructive';
  return 'outline';
}

export default function ApiAccess() {
  const queryClient = useQueryClient();
  const [purpose, setPurpose] = useState('');
  const [revealedKey, setRevealedKey] = useState(null);
  const [copied, setCopied] = useState(false);

  const requestsQuery = useQuery({
    queryKey: ['api-key-requests', 'mine'],
    queryFn: fetchMyApiKeyRequests,
  });

  const keysQuery = useQuery({
    queryKey: ['api-keys', 'mine'],
    queryFn: fetchMyApiKeys,
  });

  const requestMutation = useMutation({
    mutationFn: (text) => createApiKeyRequest(text),
    onSuccess: () => {
      toast.success('API access request submitted');
      setPurpose('');
      queryClient.invalidateQueries({ queryKey: ['api-key-requests'] });
    },
    onError: (e) => toast.error(e.message),
  });

  const pending = requestsQuery.data?.some((r) => r.status === 'PENDING');
  const activeKeys = keysQuery.data?.filter((k) => k.status === 'ACTIVE') ?? [];

  const copyKey = async () => {
    if (!revealedKey) return;
    await navigator.clipboard.writeText(revealedKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('API key copied');
  };

  return (
    <DashboardPage>
      <PageHeader
        badge="Developer"
        title="API Access"
        description="Request programmatic access to air quality readings. Keys are reviewed by an administrator."
      />

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        {TIER_INFO.map((t) => (
          <Card key={t.tier} className="border-border bg-surface-elevated">
            <CardContent className="p-4">
              <p className="text-sm font-semibold text-foreground">{t.tier}</p>
              <ul className="mt-2 space-y-1 text-xs text-muted">
                <li>{t.limit}</li>
                <li>{t.history} history</li>
                <li>{t.rows} rows max</li>
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className={panel()}>
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
            <KeyRound className="h-5 w-5 text-brand-600" />
            Request access
          </h3>
          <p className="mb-4 text-sm text-muted">
            Describe how you plan to use the API (research, app integration, reporting, etc.).
          </p>
          <textarea
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            rows={4}
            placeholder="e.g. University research project analyzing PM2.5 trends across Dar es Salaam neighborhoods…"
            className="mb-4 w-full rounded-xl border border-border bg-surface-elevated px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            disabled={pending || requestMutation.isPending}
          />
          <Button
            onClick={() => requestMutation.mutate(purpose)}
            disabled={purpose.trim().length < 10 || pending || requestMutation.isPending}
          >
            {pending ? 'Request pending review' : 'Submit request'}
          </Button>
          {pending && (
            <p className="mt-3 flex items-center gap-2 text-xs text-amber-400">
              <AlertCircle className="h-4 w-4" />
              You already have a pending request. An admin will review it soon.
            </p>
          )}
        </div>

        <div className={panel()}>
          <h3 className="mb-4 text-lg font-semibold text-foreground">My API keys</h3>
          {keysQuery.isLoading ? (
            <p className="text-sm text-muted">Loading…</p>
          ) : activeKeys.length === 0 ? (
            <p className="text-sm text-muted">No active API keys. Request access to get started.</p>
          ) : (
            <ul className="space-y-3">
              {keysQuery.data?.map((key) => (
                <li
                  key={key.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3"
                >
                  <div>
                    <p className="font-mono text-sm text-foreground">{key.keyPrefix}…</p>
                    <p className="text-xs text-muted">
                      Created {new Date(key.createdAt).toLocaleDateString()}
                      {key.lastUsedAt && ` · Last used ${new Date(key.lastUsedAt).toLocaleDateString()}`}
                    </p>
                  </div>
                  <Badge variant={statusVariant(key.status)}>{key.status}</Badge>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4 text-xs text-muted">
            API keys can only be revoked by an administrator.
          </p>
        </div>
      </div>

      <div className={`${panel()} mt-6`}>
        <h3 className="mb-4 text-lg font-semibold text-foreground">Request history</h3>
        {requestsQuery.isLoading ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : !requestsQuery.data?.length ? (
          <p className="text-sm text-muted">No requests yet.</p>
        ) : (
          <ul className="space-y-3">
            {requestsQuery.data.map((req) => (
              <li
                key={req.id}
                className="rounded-xl border border-border bg-surface px-4 py-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Badge variant={statusVariant(req.status)}>{req.status}</Badge>
                  <span className="text-xs text-muted">
                    {new Date(req.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="mt-2 text-sm text-foreground">{req.purpose}</p>
                {req.reviewNote && (
                  <p className="mt-1 text-xs text-muted">Note: {req.reviewNote}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {revealedKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-surface-elevated p-6">
            <h3 className="text-lg font-semibold text-foreground">Your API key</h3>
            <p className="mt-2 text-sm text-amber-400">
              Copy this key now. It will not be shown again.
            </p>
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-border bg-surface p-3 font-mono text-sm text-brand-700">
              <span className="flex-1 break-all">{revealedKey}</span>
              <button type="button" onClick={copyKey} className="shrink-0 text-muted hover:text-foreground">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
            <p className="mt-3 text-xs text-muted">
              Use header: <code className="text-foreground">X-API-Key: {revealedKey.slice(0, 12)}…</code>
            </p>
            <Button className="mt-4 w-full" onClick={() => setRevealedKey(null)}>
              Done
            </Button>
          </div>
        </div>
      )}

      <p className="mt-8 text-center text-sm text-muted">
        See <Link to="/api-docs" className="text-brand-700 hover:underline">API documentation</Link> for endpoints and examples.
      </p>
    </DashboardPage>
  );
}
