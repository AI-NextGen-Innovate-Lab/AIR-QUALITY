import React from 'react';
import { Link } from 'react-router-dom';
import {
  ExternalLink,
  Server,
  Shield,
  Database,
  Code2,
  AlertCircle,
  Download,
} from 'lucide-react';
import { DashboardPage } from '@/app/components/layout/DashboardPage';
import { PageHeader } from '@/app/components/layout/PageHeader';
import { PageSection } from '@/app/components/layout/PageSection';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { panel } from '@/app/lib/dashboardStyles';
import { cn } from '@/app/lib/utils/cn';

function Endpoint({
  method,
  path,
  description,
  auth = false,
  query,
  body,
  response,
}) {
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
        {auth && (
          <span className="text-xs font-medium text-muted bg-surface px-2 py-0.5 rounded border border-border">
            Bearer JWT
          </span>
        )}
      </div>
      <p className="text-sm text-muted mb-3">{description}</p>
      {query && (
        <div className="mb-3">
          <p className="text-xs font-semibold text-foreground mb-1">Query parameters</p>
          <ul className="text-xs text-muted space-y-1">
            {query.map(([k, v]) => (
              <li key={k}>
                <code className="text-brand-700">{k}</code> — {v}
              </li>
            ))}
          </ul>
        </div>
      )}
      {body && (
        <div className="mb-3">
          <p className="text-xs font-semibold text-foreground mb-1">Request body (JSON)</p>
          <pre className="rounded-xl bg-surface border border-border p-3 text-xs overflow-x-auto text-foreground">
            {body}
          </pre>
        </div>
      )}
      {response && (
        <div>
          <p className="text-xs font-semibold text-foreground mb-1">Example response</p>
          <pre className="rounded-xl bg-surface border border-border p-3 text-xs overflow-x-auto text-foreground">
            {response}
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
        description="REST API for air-quality readings, authentication, and user profiles. In development, requests go through the Vite proxy at /backend/api."
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

      <div className="grid gap-4 md:grid-cols-3 mb-8">
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
              <p className="font-semibold text-foreground">Data</p>
              <p className="text-xs text-muted">InfluxDB (readings) · PostgreSQL (users)</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-5 flex gap-3">
            <Shield className="h-8 w-8 text-brand-700 shrink-0" />
            <div>
              <p className="font-semibold text-foreground">Auth header</p>
              <code className="text-xs text-muted">Authorization: Bearer &lt;jwt&gt;</code>
            </div>
          </CardContent>
        </Card>
      </div>

      <PageSection title="Quick start" className="py-0">
        <div className={panel()}>
          <ol className="list-decimal list-inside space-y-3 text-sm text-muted">
            <li>
              Check the API is up: <code className="text-foreground">GET /health</code> (no auth).
            </li>
            <li>
              Fetch recent readings:{' '}
              <code className="text-foreground">GET /readings?hours=24&limit=100&page=1</code>.
            </li>
            <li>
              Register or log in via <code className="text-foreground">/auth/register</code> or{' '}
              <code className="text-foreground">/auth/login</code> to receive a JWT.
            </li>
            <li>
              Call protected routes with{' '}
              <code className="text-foreground">Authorization: Bearer &lt;token&gt;</code>.
            </li>
          </ol>
          <pre className="mt-4 rounded-xl bg-surface border border-border p-3 text-xs overflow-x-auto">
{`curl "${base}/readings?hours=24&limit=5&page=1"

curl -X POST "${base}/auth/login" \\
  -H "Content-Type: application/json" \\
  -d '{"email":"you@example.com","password":"YourPass1!"}'`}
          </pre>
        </div>
      </PageSection>

      <PageSection title="Readings & health" className="border-t border-border py-0">
        <div className={panel()}>
          <p className="text-sm text-muted mb-4">
            Public endpoints — no authentication required. Data is normalized from InfluxDB
            (MQTT topics as sensor <code className="text-foreground">id</code>).
          </p>
          <Endpoint
            method="GET"
            path="/health"
            description="Health check. Returns ok flag and server ISO timestamp."
            response={`{
  "ok": true,
  "time": "2026-05-25T12:00:00.000Z"
}`}
          />
          <Endpoint
            method="GET"
            path="/readings"
            description="Paginated sensor readings. Each row is one measurement at one time for one topic."
            query={[
              ['limit', 'Max rows (default capped by server, e.g. 5000)'],
              ['page', 'Page number, 1-based'],
              ['hours', 'Rolling window in hours (e.g. 24, 168, 720)'],
              ['sensorId', 'Filter to a single MQTT topic / sensor id'],
              ['sensor', 'Alias for sensorId'],
            ]}
            response={`{
  "data": [
    {
      "id": "v3/your-app@ttn/devices/my-sensor",
      "measurement": "PM2.5",
      "value": 18.4,
      "time": "2026-05-25T11:45:00.000Z"
    }
  ],
  "pagination": {
    "limit": 100,
    "page": 1,
    "hours": 24,
    "count": 1
  }
}`}
          />
          <p className="text-xs text-muted mt-4">
            Common measurements: <strong>PM2.5</strong>, <strong>PM10</strong>,{' '}
            <strong>Temperature</strong>, <strong>RelativeHumidity</strong>,{' '}
            <strong>AbsoluteHumidity</strong>, <strong>Pressure</strong> (depends on device).
          </p>
        </div>
      </PageSection>

      <PageSection title="Authentication" className="border-t border-border py-0">
        <div className={panel()}>
          <Endpoint
            method="POST"
            path="/auth/register"
            description="Create an account. Password must be ≥8 chars with upper, lower, number, and special character (@$!%*?&)."
            body={`{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "SecurePass1!"
}`}
            response={`{
  "user": { "id": 1, "name": "Jane Doe", "email": "jane@example.com", "role": "USER" },
  "access_token": "<jwt>"
}`}
          />
          <Endpoint
            method="POST"
            path="/auth/login"
            description="Authenticate and receive a JWT access token."
            body={`{
  "email": "jane@example.com",
  "password": "SecurePass1!"
}`}
            response={`{
  "user": { "id": 1, "name": "Jane Doe", "email": "jane@example.com", "role": "USER" },
  "access_token": "<jwt>"
}`}
          />
          <Endpoint
            method="POST"
            path="/auth/validate-token"
            description="Verify that a token is still valid."
            body={`{ "token": "<jwt>" }`}
          />
        </div>
      </PageSection>

      <PageSection title="Profile (logged-in user)" className="border-t border-border py-0">
        <div className={panel()}>
          <Endpoint
            method="GET"
            path="/users/me"
            auth
            description="Returns the current user's profile (id, name, email, role, timestamps)."
          />
          <Endpoint
            method="PATCH"
            path="/users/me"
            auth
            description="Update your display name. Email and role changes require an administrator."
            body={`{ "name": "Jane M. Doe" }`}
          />
        </div>
      </PageSection>

      <PageSection title="Users (admin / owner)" className="border-t border-border py-0">
        <div className={panel()}>
          <p className="text-sm text-muted mb-4 flex gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-aqi-moderate" />
            Requires JWT with role <strong>ADMIN</strong> or <strong>OWNER</strong>.
          </p>
          <Endpoint method="GET" path="/users" auth description="List all users." />
          <Endpoint
            method="POST"
            path="/users"
            auth
            description="Create a user (admin)."
            body={`{
  "name": "New User",
  "email": "new@example.com",
  "password": "SecurePass1!",
  "role": "USER"
}`}
          />
          <Endpoint method="GET" path="/users/:id" auth description="Get user by numeric id." />
          <Endpoint
            method="PATCH"
            path="/users/:id"
            auth
            description="Update user fields (admin)."
          />
          <Endpoint
            method="PATCH"
            path="/users/:id/role"
            auth
            description="Update role only."
            body={`{ "role": "ADMIN" }`}
          />
          <Endpoint method="DELETE" path="/users/:id" auth description="Delete a user." />
        </div>
      </PageSection>

      <PageSection title="Errors & limits" className="border-t border-border py-0">
        <div className={panel()}>
          <ul className="space-y-2 text-sm text-muted">
            <li>
              <strong className="text-foreground">401</strong> — Missing or invalid JWT on protected
              routes. Log in again.
            </li>
            <li>
              <strong className="text-foreground">403</strong> — Valid token but insufficient role
              (e.g. non-admin calling /users).
            </li>
            <li>
              <strong className="text-foreground">400</strong> — Validation failed; response includes a{' '}
              <code>message</code> field.
            </li>
            <li>
              Large <code>hours</code> + <code>limit</code> values may slow Influx queries; use
              pagination.
            </li>
          </ul>
        </div>
      </PageSection>

      <PageSection title="Using the API in JavaScript" className="border-t border-border py-0 pb-12">
        <div className={panel()}>
          <div className="flex items-center gap-2 mb-3">
            <Code2 className="h-5 w-5 text-brand-700" />
            <p className="font-semibold text-foreground">Browser / frontend</p>
          </div>
          <pre className="rounded-xl bg-surface border border-border p-3 text-xs overflow-x-auto mb-4">
{`const res = await fetch('/backend/api/readings?hours=24&limit=500', {
  headers: {
    Authorization: 'Bearer ' + localStorage.getItem('token'),
  },
});
const json = await res.json();
console.log(json.data);`}
          </pre>
          <div className="flex flex-wrap gap-3">
            <Link to="/download">
              <Button type="button" variant="secondary">
                <Download className="h-4 w-4" />
                Download center
              </Button>
            </Link>
          </div>
        </div>
      </PageSection>
    </DashboardPage>
  );
}
