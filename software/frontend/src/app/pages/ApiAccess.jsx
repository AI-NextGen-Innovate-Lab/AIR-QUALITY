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
  revokeApiKey,
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

  const revokeMutation = useMutation({
    mutationFn: revokeApiKey,
    onSuccess: () => {
      toast.success('API key revoked');
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
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
          <Card key={t.tier} className="border-zinc-800 bg-zinc-900">
            <CardContent className="p-4">
              <p className="text-sm font-semibold text-zinc-100">{t.tier}</p>
              <ul className="mt-2 space-y-1 text-xs text-zinc-400">
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
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-zinc-100">
            <KeyRound className="h-5 w-5 text-emerald-500" />
            Request access
          </h3>
          <p className="mb-4 text-sm text-zinc-400">
            Describe how you plan to use the API (research, app integration, reporting, etc.).
          </p>
          <textarea
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            rows={4}
            placeholder="e.g. University research project analyzing PM2.5 trends across Dar es Salaam neighborhoods…"
            className="mb-4 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
          <h3 className="mb-4 text-lg font-semibold text-zinc-100">My API keys</h3>
          {keysQuery.isLoading ? (
            <p className="text-sm text-zinc-500">Loading…</p>
          ) : activeKeys.length === 0 ? (
            <p className="text-sm text-zinc-500">No active API keys. Request access to get started.</p>
          ) : (
            <ul className="space-y-3">
              {keysQuery.data?.map((key) => (
                <li
                  key={key.id}
                  className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3"
                >
                  <div>
                    <p className="font-mono text-sm text-zinc-200">{key.keyPrefix}…</p>
                    <p className="text-xs text-zinc-500">
                      Created {new Date(key.createdAt).toLocaleDateString()}
                      {key.lastUsedAt && ` · Last used ${new Date(key.lastUsedAt).toLocaleDateString()}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={statusVariant(key.status)}>{key.status}</Badge>
                    {key.status === 'ACTIVE' && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          if (window.confirm('Revoke this API key? This cannot be undone.')) {
                            revokeMutation.mutate(key.id);
                          }
                        }}
                      >
                        Revoke
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className={`${panel()} mt-6`}>
        <h3 className="mb-4 text-lg font-semibold text-zinc-100">Request history</h3>
        {requestsQuery.isLoading ? (
          <p className="text-sm text-zinc-500">Loading…</p>
        ) : !requestsQuery.data?.length ? (
          <p className="text-sm text-zinc-500">No requests yet.</p>
        ) : (
          <ul className="space-y-3">
            {requestsQuery.data.map((req) => (
              <li
                key={req.id}
                className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Badge variant={statusVariant(req.status)}>{req.status}</Badge>
                  <span className="text-xs text-zinc-500">
                    {new Date(req.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="mt-2 text-sm text-zinc-300">{req.purpose}</p>
                {req.reviewNote && (
                  <p className="mt-1 text-xs text-zinc-500">Note: {req.reviewNote}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {revealedKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-700 bg-zinc-900 p-6">
            <h3 className="text-lg font-semibold text-zinc-100">Your API key</h3>
            <p className="mt-2 text-sm text-amber-400">
              Copy this key now. It will not be shown again.
            </p>
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-zinc-950 p-3 font-mono text-sm text-emerald-400">
              <span className="flex-1 break-all">{revealedKey}</span>
              <button type="button" onClick={copyKey} className="shrink-0 text-zinc-400 hover:text-zinc-100">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
            <p className="mt-3 text-xs text-zinc-500">
              Use header: <code className="text-zinc-300">X-API-Key: {revealedKey.slice(0, 12)}…</code>
            </p>
            <Button className="mt-4 w-full" onClick={() => setRevealedKey(null)}>
              Done
            </Button>
          </div>
        </div>
      )}

      <p className="mt-8 text-center text-sm text-zinc-500">
        See <Link to="/api-docs" className="text-emerald-400 hover:underline">API documentation</Link> for endpoints and examples.
      </p>
    </DashboardPage>
  );
}
