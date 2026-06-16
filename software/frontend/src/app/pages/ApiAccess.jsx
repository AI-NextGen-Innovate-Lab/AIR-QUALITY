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
  fetchApiKeySecret,
  revokeApiKey,
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

  const requestsQuery = useQuery({
    queryKey: ['api-key-requests', 'mine'],
    queryFn: fetchMyApiKeyRequests,
  });

  const keysQuery = useQuery({
    queryKey: ['api-keys', 'mine'],
    queryFn: fetchMyApiKeys,
  });

  useEffect(() => {
    const keys = keysQuery.data?.filter((k) => k.status === 'ACTIVE') ?? [];
    if (!keys.length) return;

    let cancelled = false;
    (async () => {
      const stored = loadStoredSecrets();
      for (const key of keys) {
        if (stored[key.id]) continue;
        try {
          const res = await fetchApiKeySecret(key.id);
          if (!cancelled && res?.key) {
            saveStoredSecret(key.id, res.key);
            setSecrets((prev) => ({ ...prev, [key.id]: res.key }));
          }
        } catch {
          /* no delivery available */
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [keysQuery.data]);

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
    onSuccess: (_, keyId) => {
      toast.success('API key deleted');
      removeStoredSecret(keyId);
      setSecrets((prev) => {
        const next = { ...prev };
        delete next[keyId];
        return next;
      });
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    },
    onError: (e) => toast.error(e.message),
  });

  const pending = requestsQuery.data?.some((r) => r.status === 'PENDING');
  const allKeys = keysQuery.data ?? [];

  const copyText = async (text, id) => {
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
        description="Request an API key, copy it, and call the readings API from your apps or scripts."
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
            Describe your use case. An administrator will review and issue a key. After approval,
            return here to copy your full key (available for 7 days).
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
                          {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      )}
                      <button
                        type="button"
                        className="text-muted hover:text-foreground"
                        onClick={() => copyText(fullKey || key.keyPrefix, key.id)}
                        title="Copy key"
                        disabled={key.status !== 'ACTIVE'}
                      >
                        {copiedId === key.id ? (
                          <Check className="h-4 w-4 text-aqi-good" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>

                    {!fullKey && key.status === 'ACTIVE' && (
                      <p className="mt-2 text-xs text-muted">
                        Full key not stored on this device. If recently approved, refresh this page.
                        Otherwise contact an administrator — keys cannot be recovered after 7 days.
                      </p>
                    )}

                    {key.status === 'ACTIVE' && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="mt-3"
                        onClick={() => {
                          if (
                            window.confirm(
                              'Delete this API key? Apps using it will stop working immediately.'
                            )
                          ) {
                            revokeMutation.mutate(key.id);
                          }
                        }}
                        disabled={revokeMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete key
                      </Button>
                    )}
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
            Send your key in the <code className="text-foreground">X-API-Key</code> header on every
            request. API keys unlock the highest tier: up to 5,000 rows and 30 days of history.
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
          <div>
            <p className="mb-2 font-medium text-foreground">Python (requests)</p>
            <pre className="overflow-x-auto rounded-xl border border-border bg-surface p-4 text-xs text-foreground">
{`import requests
r = requests.get(
    "${API_BASE}/readings",
    params={"hours": 168, "limit": 500},
    headers={"X-API-Key": "YOUR_API_KEY_HERE"},
)
print(r.json())`}
            </pre>
          </div>
          <ul className="list-inside list-disc space-y-1">
            <li>Never commit API keys to Git or share them publicly.</li>
            <li>Use <code className="text-foreground">sensorId</code> to filter one device topic.</li>
            <li>Use <code className="text-foreground">measurement</code> to filter PM2.5, PM10, etc.</li>
            <li>Delete and request a new key if you suspect it was exposed.</li>
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
                {req.reviewNote && (
                  <p className="mt-1 text-xs text-muted">Note: {req.reviewNote}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="mt-8 text-center text-sm text-muted">
        Full reference:{' '}
        <Link to="/api-docs" className="text-brand-700 hover:underline">
          API documentation
        </Link>
      </p>
    </DashboardPage>
  );
}
