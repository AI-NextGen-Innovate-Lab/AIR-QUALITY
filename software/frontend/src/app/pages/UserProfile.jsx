import React, { useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { User, Mail, Shield, Key, Bell } from 'lucide-react';
import { toast } from 'sonner';
import { DashboardPage } from '@/app/components/layout/DashboardPage';
import { PageHeader } from '@/app/components/layout/PageHeader';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import {
  panel,
  tabBtn,
  inputClass,
  labelClass,
} from '@/app/lib/dashboardStyles';
import { cn } from '@/app/lib/utils/cn';

function Field({ icon: Icon, children, className }) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-xl border border-border bg-surface-elevated px-3 focus-within:ring-2 focus-within:ring-brand-500/40 focus-within:border-brand-500',
        className
      )}
    >
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      {children}
    </div>
  );
}

export default function UserProfile() {
  const { user, switchRole } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [tab, setTab] = useState('profile');

  const handleSaveProfile = () => {
    toast.success('Profile updated (demo only — not persisted)');
  };

  if (!user) {
    return (
      <DashboardPage narrow>
        <Card>
          <CardContent className="py-12 text-center text-muted">
            Please log in to view your profile.
          </CardContent>
        </Card>
      </DashboardPage>
    );
  }

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('');

  return (
    <DashboardPage narrow>
      <PageHeader
        badge="Account"
        title="Profile settings"
        description="Manage your account. Demo auth is client-side only until full persistence is wired."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className={panel('lg:col-span-1')}>
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-brand-600 to-brand-400">
              <span className="text-3xl font-bold text-white">{initials}</span>
            </div>
            <h3 className="mb-1 text-lg font-semibold text-foreground">{user.name}</h3>
            <p className="mb-3 text-sm text-muted">{user.email}</p>
            <span className="inline-flex rounded-full bg-brand-50 px-3 py-1 text-xs font-medium capitalize text-brand-800">
              {user.role.replace('_', ' ')}
            </span>

            <div className="mt-6 rounded-xl bg-brand-50/80 p-4 text-left border border-brand-100">
              <p className="mb-2 text-xs font-semibold text-brand-900">
                Demo: switch role
              </p>
              <div className="space-y-2">
                {['public', 'registered', 'private_owner', 'admin'].map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => switchRole(role)}
                    className={cn(
                      'w-full rounded-lg px-3 py-2 text-left text-sm transition-colors',
                      user.role === role
                        ? 'bg-brand-600 text-white'
                        : 'bg-surface-elevated text-foreground hover:bg-surface border border-border'
                    )}
                  >
                    {role.replace('_', ' ').replace(/^\w/, (c) => c.toUpperCase())}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="mb-4 flex flex-wrap gap-2 border-b border-border pb-3">
            {[
              { id: 'profile', label: 'Profile' },
              { id: 'security', label: 'Security' },
              { id: 'notifications', label: 'Notifications' },
              { id: 'api', label: 'API access' },
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

          {tab === 'profile' && (
            <div className={panel()}>
              <h3 className="mb-4 text-lg font-semibold text-foreground">
                Personal information
              </h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className={labelClass}>
                    Full name
                  </label>
                  <Field className="mt-1">
                    <input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="flex-1 border-0 bg-transparent py-2 text-sm focus:outline-none"
                    />
                  </Field>
                </div>
                <div>
                  <label htmlFor="email" className={labelClass}>
                    Email
                  </label>
                  <Field className="mt-1">
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="flex-1 border-0 bg-transparent py-2 text-sm focus:outline-none"
                    />
                  </Field>
                </div>
                <div>
                  <label htmlFor="role" className={labelClass}>
                    Role
                  </label>
                  <Field className="mt-1 opacity-80">
                    <input
                      id="role"
                      readOnly
                      value={user.role
                        .replace('_', ' ')
                        .replace(/^\w/, (c) => c.toUpperCase())}
                      className="flex-1 border-0 bg-transparent py-2 text-sm focus:outline-none cursor-not-allowed"
                    />
                  </Field>
                  <p className="mt-1 text-xs text-muted">
                    Use the demo role switcher to change role.
                  </p>
                </div>
                <Button type="button" className="w-full" onClick={handleSaveProfile}>
                  Save changes
                </Button>
              </div>
            </div>
          )}

          {tab === 'security' && (
            <div className={panel()}>
              <h3 className="mb-4 text-lg font-semibold text-foreground">Security</h3>
              <p className="text-sm text-muted">
                Password and session management are not wired to this demo backend.
              </p>
              <div className="mt-6 space-y-3">
                <div>
                  <label className={labelClass}>Current password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className={cn(inputClass, 'mt-1')}
                    disabled
                  />
                </div>
                <Button type="button" variant="secondary" className="w-full" disabled>
                  Update password (not available)
                </Button>
              </div>
            </div>
          )}

          {tab === 'notifications' && (
            <div className={panel()}>
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
                <Bell className="h-5 w-5" />
                Notifications
              </h3>
              <p className="mb-4 text-sm text-muted">
                Preferences are not persisted. Toggle UI only.
              </p>
              {[
                ['Email notifications', true],
                ['Air quality alerts', true],
                ['Weekly reports', false],
              ].map(([label, defaultOn]) => (
                <label
                  key={label}
                  className="mb-3 flex cursor-pointer items-center justify-between border-b border-border py-2"
                >
                  <span className="text-sm font-medium text-foreground">{label}</span>
                  <input
                    type="checkbox"
                    defaultChecked={defaultOn}
                    className="h-4 w-4 rounded border-border text-brand-600"
                  />
                </label>
              ))}
            </div>
          )}

          {tab === 'api' && (
            <div className={panel()}>
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
                <Key className="h-5 w-5" />
                API access
              </h3>
              {user.role === 'registered' ||
              user.role === 'private_owner' ||
              user.role === 'admin' ? (
                <div className="space-y-4 text-sm text-muted">
                  <p>
                    The monitoring API is{' '}
                    <code className="rounded bg-surface px-1 text-foreground">
                      GET /api/readings
                    </code>{' '}
                    and{' '}
                    <code className="rounded bg-surface px-1 text-foreground">
                      GET /api/health
                    </code>
                    . Keys are not issued through this UI; configure the Vite proxy or{' '}
                    <code className="rounded bg-surface px-1 text-foreground">
                      VITE_API_URL
                    </code>{' '}
                    for the frontend.
                  </p>
                  <p className="text-xs">
                    InfluxDB credentials stay on the server via environment variables.
                  </p>
                </div>
              ) : (
                <div className="py-8 text-center text-muted">
                  <Key className="mx-auto mb-4 h-12 w-12 opacity-30" />
                  <p>API documentation is available after registering (demo role).</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardPage>
  );
}
