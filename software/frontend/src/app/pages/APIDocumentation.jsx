import React from 'react';
import { ExternalLink, Server, Shield, Database } from 'lucide-react';
import { DashboardPage } from '@/app/components/layout/DashboardPage';
import { PageHeader } from '@/app/components/layout/PageHeader';
import { Card, CardContent } from '@/app/components/ui/card';
import { panel } from '@/app/lib/dashboardStyles';
import { cn } from '@/app/lib/utils/cn';

function Endpoint({ method, path, description, query, body }) {
  return (
    <div className="border-b border-border py-5 last:border-0">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span
          className={cn(
            'rounded-lg px-2 py-0.5 text-xs font-bold uppercase',
            method === 'GET'
              ? 'bg-aqi-good-soft text-aqi-good'
              : 'bg-brand-50 text-brand-800'
          )}
        >
          {method}
        </span>
        <code className="text-sm font-mono text-foreground">{path}</code>
      </div>
      <p className="text-sm text-muted mb-3">{description}</p>
      {query && (
        <div className="mb-2">
          <p className="text-xs font-semibold text-foreground mb-1">Query parameters</p>
          <ul className="text-xs text-muted space-y-1 font-mono">
            {query.map(([k, v]) => (
              <li key={k}>
                <span className="text-brand-700">{k}</span> — {v}
              </li>
            ))}
          </ul>
        </div>
      )}
      {body && (
        <div>
          <p className="text-xs font-semibold text-foreground mb-1">Request body (JSON)</p>
          <pre className="rounded-xl bg-surface border border-border p-3 text-xs overflow-x-auto text-foreground">
            {body}
          </pre>
        </div>
      )}
    </div>
  );
}

export default function APIDocumentation() {
  const base =
    typeof window !== 'undefined'
      ? `${window.location.origin}/backend/api`
      : '/backend/api';

  return (
    <DashboardPage>
      <PageHeader
        badge="Developers"
        title="API documentation"
        description="REST endpoints exposed by the NestJS backend. The Vite dev server proxies /backend to localhost:3000."
        action={
          <a
            href={`${base}/health`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-brand-700 hover:text-brand-800"
          >
            Try health check
            <ExternalLink className="h-4 w-4" />
          </a>
        }
      />

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card>
          <CardContent className="py-5 flex gap-3">
            <Server className="h-8 w-8 text-brand-700 shrink-0" />
            <div>
              <p className="font-semibold text-foreground">Base URL</p>
              <code className="text-xs text-muted break-all">{base}</code>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-5 flex gap-3">
            <Database className="h-8 w-8 text-brand-700 shrink-0" />
            <div>
              <p className="font-semibold text-foreground">Data store</p>
              <p className="text-xs text-muted">InfluxDB for readings; PostgreSQL for users</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-5 flex gap-3">
            <Shield className="h-8 w-8 text-brand-700 shrink-0" />
            <div>
              <p className="font-semibold text-foreground">Auth</p>
              <p className="text-xs text-muted">JWT from login/register; Influx token server-side only</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className={panel('mb-6')}>
        <h2 className="text-lg font-semibold text-foreground mb-1">Readings & health</h2>
        <p className="text-sm text-muted mb-4">Public sensor data from InfluxDB (no auth required).</p>
        <Endpoint
          method="GET"
          path="/health"
          description="Returns API and server timestamp. Use for uptime checks."
        />
        <Endpoint
          method="GET"
          path="/readings"
          description="Paginated air-quality readings normalized from Influx (PM, humidity, etc.)."
          query={[
            ['limit', 'Max rows per page (default server limit applies)'],
            ['page', 'Page number (1-based)'],
            ['hours', 'Rolling window in hours (e.g. 24, 168)'],
            ['sensorId', 'Optional filter by MQTT topic / sensor id'],
            ['sensor', 'Alias for sensorId'],
          ]}
        />
        <p className="text-xs text-muted mt-4">
          Example:{' '}
          <code className="rounded bg-surface px-1">{base}/readings?limit=100&page=1&hours=24</code>
        </p>
      </div>

      <div className={panel('mb-6')}>
        <h2 className="text-lg font-semibold text-foreground mb-1">Authentication</h2>
        <p className="text-sm text-muted mb-4">User accounts stored in PostgreSQL via Prisma.</p>
        <Endpoint
          method="POST"
          path="/auth/register"
          description="Create a new user. Password must meet complexity rules enforced by the server."
          body={`{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "SecurePass1!"
}`}
        />
        <Endpoint
          method="POST"
          path="/auth/login"
          description="Returns JWT access token on success."
          body={`{
  "email": "jane@example.com",
  "password": "SecurePass1!"
}`}
        />
        <Endpoint
          method="POST"
          path="/auth/validate-token"
          description="Validate an existing JWT."
          body={`{ "token": "<jwt>" }`}
        />
      </div>

      <div className={panel()}>
        <h2 className="text-lg font-semibold text-foreground mb-1">Users (admin)</h2>
        <p className="text-sm text-muted mb-4">
          CRUD under <code className="rounded bg-surface px-1">/users</code> — requires appropriate
          guards on the backend. Used by the admin User management tab.
        </p>
        <Endpoint method="GET" path="/users" description="List all users." />
        <Endpoint method="POST" path="/users" description="Create user (admin)." />
        <Endpoint method="GET" path="/users/:id" description="Get user by id." />
      </div>
    </DashboardPage>
  );
}
