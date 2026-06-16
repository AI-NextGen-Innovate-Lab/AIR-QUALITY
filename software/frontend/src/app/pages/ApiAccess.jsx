import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { KeyRound, Copy, Check, AlertCircle, Trash2, Eye, EyeOff, Terminal } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { DashboardPage } from '@/app/components/layout/DashboardPage';
import { PageHeader } from '@/app/components/layout/PageHeader';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { panel } from '@/app/lib/dashboardStyles';
import { buildUrl } from '@/app/lib/api/client';
import {
  createApiKeyRequest,
  fetchMyApiKeyRequests,
  fetchMyApiKeys,
  fetchMyKeyDeliveries,
  deleteApiKey,
} from '@/app/lib/api/apiKeys';

const STORAGE_KEY = 'aqm_api_key_secrets';

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

function loadStoredSecrets() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveStoredSecret(id, key) {
  const all = loadStoredSecrets();
  all[id] = key;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

function removeStoredSecret(id) {
  const all = loadStoredSecrets();
  delete all[id];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

const API_BASE = buildUrl('/readings').replace(/\/readings$/, '');

export default function ApiAccess() {
  const queryClient = useQueryClient();
  const [purpose, setPurpose] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [visibleKeys, setVisibleKeys] = useState({});
  const [secrets, setSecrets] = useState(loadStoredSecrets);
  const [newKeyModal, setNewKeyModal] = useState(null);

  const requestsQuery = useQuery({
    queryKey: ['api-key-requests', 'mine'],
    queryFn: fetchMyApiKeyRequests,
    refetchInterval: (query) => {
      const hasApproved = query.state.data?.some((r) => r.status === 'APPROVED');
      return hasApproved ? 5000 : false;
    },
  });

  const keysQuery = useQuery({
    queryKey: ['api-keys', 'mine'],
    queryFn: fetchMyApiKeys,
    refetchInterval: 15000,
  });

  const deliveriesQuery = useQuery({
    queryKey: ['api-keys', 'deliveries'],
    queryFn: fetchMyKeyDeliveries,
    refetchInterval: 5000,
  });

  useEffect(() => {
    const deliveries = deliveriesQuery.data ?? [];
    if (!deliveries.length) return;

    const stored = loadStoredSecrets();
    let newest = null;

    for (const item of deliveries) {
      if (!stored[item.id]) {
        saveStoredSecret(item.id, item.key);
        newest = item;
      }
    }

    if (newest) {
      setSecrets((prev) => ({ ...prev, [newest.id]: newest.key }));
      setNewKeyModal(newest.key);
      setVisibleKeys((prev) => ({ ...prev, [newest.id]: true }));
      toast.success('Your API key is ready — copy it now.');
    } else {
      setSecrets(loadStoredSecrets());
    }
  }, [deliveriesQuery.data]);

  const requestMutation = useMutation({
    mutationFn: (text) => createApiKeyRequest(text),
    onSuccess: () => {
      toast.success('API access request submitted');
      setPurpose('');
      queryClient.invalidateQueries({ queryKey: ['api-key-requests'] });
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteApiKey,
    onSuccess: (_, keyId) => {
      toast.success('API key permanently deleted');
      removeStoredSecret(keyId);
      setSecrets((prev) => {
        const next = { ...prev };
        delete next[keyId];
        return next;
      });
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      queryClient.invalidateQueries({ queryKey: ['api-key-requests'] });
    },
    onError: (e) => toast.error(e.message),
  });

  const pending = requestsQuery.data?.some((r) => r.status === 'PENDING');
  const approvedAwaitingKey = requestsQuery.data?.some(
    (r) => r.status === 'APPROVED' && !keysQuery.data?.length
  );
  const allKeys = keysQuery.data ?? [];

  const copyText = async (text, id) => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success('Copied to clipboard');
  };

  const displayKey = (key) => secrets[key.id] || null;

  return (
    <DashboardPage>
      <PageHeader
        badge="Developer"
        title="API Access"
        description="Request an API key, copy it here after approval, and use it in your apps or scripts."
      />

      {approvedAwaitingKey && (
        <Card className="mb-6 border-brand-300 bg-brand-50">
          <CardContent className="py-3 text-sm text-brand-800">
            Your request was approved. Your full API key will appear below within a few seconds.
          </CardContent>
        </Card>
      )}

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
            Submit a request for an administrator to review. Once approved, your full key appears
            on this page only — not in the admin panel.
          </p>
          <textarea
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            rows={4}
            placeholder="e.g. University research project analyzing PM2.5 trends…"
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
            <p className="mt-3 flex items-center gap-2 text-xs text-amber-600">
              <AlertCircle className="h-4 w-4" />
              You already have a pending request.
            </p>
          )}
        </div>

        <div className={panel()}>
          <h3 className="mb-4 text-lg font-semibold text-foreground">My API keys</h3>
          {keysQuery.isLoading ? (
            <p className="text-sm text-muted">Loading…</p>
          ) : allKeys.length === 0 ? (
            <p className="text-sm text-muted">No API keys yet. Submit a request to get started.</p>
          ) : (
            <ul className="space-y-4">
              {allKeys.map((key) => {
                const fullKey = displayKey(key);
                const isVisible = visibleKeys[key.id];
                const isActive = key.status === 'ACTIVE';
                const masked = fullKey
                  ? `${fullKey.slice(0, 8)}${'•'.repeat(12)}${fullKey.slice(-4)}`
                  : `${key.keyPrefix}••••••••`;

                return (
                  <li
                    key={key.id}
                    className="rounded-xl border border-border bg-surface px-4 py-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground">
                          {key.label || 'API key'}
                        </p>
                        <p className="text-xs text-muted">
                          Created {new Date(key.createdAt).toLocaleDateString()}
                          {key.expiresAt &&
                            ` · Expires ${new Date(key.expiresAt).toLocaleDateString()}`}
                          {key.lastUsedAt &&
                            ` · Last used ${new Date(key.lastUsedAt).toLocaleDateString()}`}
                        </p>
                      </div>
                      <Badge variant={statusVariant(key.status)}>{key.status}</Badge>
                    </div>

                    {isActive && (
                      <div className="mt-3 flex items-center gap-2 rounded-lg border border-border bg-surface-elevated px-3 py-2">
                        <code className="flex-1 break-all font-mono text-xs text-foreground">
                          {fullKey && isVisible ? fullKey : masked}
                        </code>
                        {fullKey && (
                          <button
                            type="button"
                            className="text-muted hover:text-foreground"
                            onClick={() =>
                              setVisibleKeys((prev) => ({ ...prev, [key.id]: !prev[key.id] }))
                            }
                            title={isVisible ? 'Hide key' : 'Show key'}
                          >
                            {isVisible ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        )}
                        <button
                          type="button"
                          className="text-muted hover:text-foreground disabled:opacity-40"
                          onClick={() => copyText(fullKey, key.id)}
                          title="Copy full key"
                          disabled={!fullKey}
                        >
                          {copiedId === key.id ? (
                            <Check className="h-4 w-4 text-aqi-good" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    )}

                    {!fullKey && isActive && (
                      <p className="mt-2 text-xs text-muted">
                        Waiting for key delivery… Refresh this page if you were just approved.
                      </p>
                    )}

                    <Button
                      size="sm"
                      variant="secondary"
                      className="mt-3"
                      onClick={() => {
                        const label =
                          key.status === 'REVOKED'
                            ? 'Remove this revoked key from your list?'
                            : 'Permanently delete this API key? Apps using it will stop working.';
                        if (window.confirm(label)) {
                          deleteMutation.mutate(key.id);
                        }
                      }}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                      {key.status === 'REVOKED' ? 'Remove' : 'Delete key'}
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <div className={`${panel()} mt-6`}>
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
          <Terminal className="h-5 w-5 text-brand-700" />
          How to use your API key
        </h3>
        <div className="space-y-4 text-sm text-muted">
          <p>
            After approval, copy your key from <strong>My API keys</strong> above. Send it in the{' '}
            <code className="text-foreground">X-API-Key</code> header on every request.
          </p>
          <div>
            <p className="mb-2 font-medium text-foreground">cURL example</p>
            <pre className="overflow-x-auto rounded-xl border border-border bg-surface p-4 text-xs text-foreground">
{`curl -H "X-API-Key: YOUR_API_KEY_HERE" \\
  "${API_BASE}/readings?hours=168&limit=100"`}
            </pre>
          </div>
          <div>
            <p className="mb-2 font-medium text-foreground">JavaScript (fetch)</p>
            <pre className="overflow-x-auto rounded-xl border border-border bg-surface p-4 text-xs text-foreground">
{`const res = await fetch("${API_BASE}/readings?hours=24&limit=100", {
  headers: { "X-API-Key": "YOUR_API_KEY_HERE" },
});
const { data } = await res.json();`}
            </pre>
          </div>
          <ul className="list-inside list-disc space-y-1">
            <li>Only you can see and copy your full key — admins cannot.</li>
            <li>Never commit API keys to Git or share them publicly.</li>
            <li>Delete revoked keys to clear them from your list.</li>
          </ul>
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
                {req.status === 'APPROVED' && (
                  <p className="mt-1 text-xs text-brand-700">
                    Approved — copy your key from My API keys above.
                  </p>
                )}
                {req.reviewNote && (
                  <p className="mt-1 text-xs text-muted">Note: {req.reviewNote}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {newKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-surface-elevated p-6">
            <h3 className="text-lg font-semibold text-foreground">Your API key is ready</h3>
            <p className="mt-2 text-sm text-muted">
              Copy this key now. It is only shown here on your account — administrators cannot see it.
            </p>
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-border bg-surface p-3 font-mono text-sm text-brand-700">
              <span className="flex-1 break-all">{newKeyModal}</span>
              <button
                type="button"
                onClick={() => copyText(newKeyModal, 'modal')}
                className="shrink-0 text-muted hover:text-foreground"
              >
                {copiedId === 'modal' ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="mt-3 text-xs text-muted">
              Header: <code className="text-foreground">X-API-Key: your-key-here</code>
            </p>
            <Button className="mt-4 w-full" onClick={() => setNewKeyModal(null)}>
              I have copied my key
            </Button>
          </div>
        </div>
      )}

      <p className="mt-8 text-center text-sm text-muted">
        Full reference:{' '}
        <Link to="/api-docs" className="text-brand-700 hover:underline">
          API documentation
        </Link>
      </p>
    </DashboardPage>
  );
}
