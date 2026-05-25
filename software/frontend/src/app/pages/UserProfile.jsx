import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/app/context/AuthContext';
import {
  User,
  Mail,
  Shield,
  Key,
  Bell,
  Calendar,
  Hash,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { DashboardPage } from '@/app/components/layout/DashboardPage';
import { PageHeader } from '@/app/components/layout/PageHeader';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import { ErrorBlock, LoadingBlock } from '@/app/components/data/DataState';
import { fetchMyProfile, updateMyProfile } from '@/app/lib/api/profile';
import { panel, tabBtn, inputClass, labelClass } from '@/app/lib/dashboardStyles';
import { cn } from '@/app/lib/utils/cn';

function ProfileField({ icon: Icon, children, className }) {
  if (!Icon) return null;
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-xl border border-border bg-surface-elevated px-4 focus-within:ring-2 focus-within:ring-brand-500/40 focus-within:border-brand-500 transition-shadow duration-300',
        className
      )}
    >
      <Icon className="h-5 w-5 shrink-0 text-brand-700" />
      {children}
    </div>
  );
}

function formatRole(role) {
  const r = String(role || 'USER').toUpperCase();
  if (r === 'ADMIN') return 'Administrator';
  if (r === 'OWNER') return 'Owner';
  return 'User';
}

function roleBadgeClass(role) {
  const r = String(role || 'USER').toUpperCase();
  if (r === 'ADMIN') return 'bg-brand-50 text-brand-800 border-brand-200';
  if (r === 'OWNER') return 'bg-aqi-sensitive-soft text-aqi-sensitive border-aqi-sensitive/30';
  return 'bg-surface text-foreground border-border';
}

function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
}

export default function UserProfile() {
  const { user: sessionUser, token, loading: authLoading, setUser, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [name, setName] = useState('');
  const [tab, setTab] = useState('profile');

  useEffect(() => {
    if (authLoading) return;
    if (!token || !sessionUser) {
      setLoading(false);
      setProfile(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchMyProfile()
      .then((data) => {
        if (cancelled) return;
        setProfile(data);
        setName(data.name || '');
        setUser(data);
      })
      .catch((e) => {
        if (cancelled) return;
        if (e.status === 401) {
          logout();
          setError('Your session expired. Please sign in again.');
          setProfile(null);
          return;
        }
        setError(e.message || 'Could not load profile');
        setProfile(sessionUser);
        setName(sessionUser?.name || '');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [authLoading, token, sessionUser?.id]);

  const handleSaveProfile = async () => {
    const trimmed = name.trim();
    if (trimmed.length < 3) {
      toast.error('Name must be at least 3 characters');
      return;
    }
    setSaving(true);
    try {
      const updated = await updateMyProfile({ name: trimmed });
      setProfile(updated);
      setName(updated.name);
      setUser(updated);
      toast.success('Profile saved');
    } catch (e) {
      toast.error(e.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || (token && loading)) {
    return (
      <DashboardPage>
        <LoadingBlock message="Loading your profile…" />
      </DashboardPage>
    );
  }

  if (!sessionUser || !token) {
    return (
      <DashboardPage>
        <PageHeader
          badge="Account"
          title="Profile"
          description="Sign in to view and edit your account."
        />
        <Card className="card-interactive">
          <CardContent className="py-12 text-center">
            <p className="text-muted mb-6">You are not signed in.</p>
            <Link to="/login">
              <Button type="button">Go to login</Button>
            </Link>
          </CardContent>
        </Card>
      </DashboardPage>
    );
  }

  const display = profile || sessionUser;
  const initials = (display.name || '?')
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <DashboardPage>
      <PageHeader
        badge="Account"
        title="Your profile"
        description="Account details from the server. Email and role are managed by administrators."
      />

      {error && (
        <ErrorBlock message={error} className="mb-6" />
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <Card className={cn('lg:col-span-1 card-interactive overflow-hidden')}>
          <CardContent className="py-8 text-center">
            <div className="mx-auto mb-5 flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-brand-600 to-brand-400 text-4xl font-bold text-white shadow-lg">
              {initials}
            </div>
            <h2 className="text-2xl font-bold text-foreground">{display.name}</h2>
            <p className="mt-1 text-base text-muted break-all">{display.email}</p>
            <span
              className={cn(
                'mt-4 inline-flex rounded-full border px-4 py-1.5 text-sm font-semibold',
                roleBadgeClass(display.role)
              )}
            >
              {formatRole(display.role)}
            </span>

            <dl className="mt-8 space-y-4 text-left border-t border-border pt-6">
              <div className="flex items-start gap-3">
                <Hash className="h-5 w-5 shrink-0 text-brand-700 mt-0.5" />
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                    User ID
                  </dt>
                  <dd className="text-lg font-medium text-foreground tabular-nums">
                    {display.id}
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 shrink-0 text-brand-700 mt-0.5" />
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                    Member since
                  </dt>
                  <dd className="text-base text-foreground">
                    {formatDate(display.createdAt)}
                  </dd>
                </div>
              </div>
              {display.updatedAt && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 shrink-0 text-muted mt-0.5" />
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                      Last updated
                    </dt>
                    <dd className="text-sm text-muted">
                      {formatDate(display.updatedAt)}
                    </dd>
                  </div>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <div className="mb-6 flex flex-wrap gap-2 border-b border-border pb-4">
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
              <h3 className="mb-6 text-xl font-bold text-foreground">
                Personal information
              </h3>
              <div className="space-y-5">
                <div>
                  <label htmlFor="profile-name" className={labelClass}>
                    Full name
                  </label>
                  <ProfileField icon={User} className="mt-2">
                    <input
                      id="profile-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="flex-1 border-0 bg-transparent py-3 text-base focus:outline-none"
                      autoComplete="name"
                    />
                  </ProfileField>
                </div>
                <div>
                  <label htmlFor="profile-email" className={labelClass}>
                    Email
                  </label>
                  <ProfileField icon={Mail} className="mt-2 opacity-90">
                    <input
                      id="profile-email"
                      type="email"
                      readOnly
                      value={display.email || ''}
                      className="flex-1 border-0 bg-transparent py-3 text-base text-muted cursor-not-allowed focus:outline-none"
                    />
                  </ProfileField>
                  <p className="mt-2 text-sm text-muted">
                    Contact an administrator to change your email address.
                  </p>
                </div>
                <div>
                  <label htmlFor="profile-role" className={labelClass}>
                    Role
                  </label>
                  <ProfileField icon={Shield} className="mt-2 opacity-90">
                    <input
                      id="profile-role"
                      readOnly
                      value={formatRole(display.role)}
                      className="flex-1 border-0 bg-transparent py-3 text-base cursor-not-allowed focus:outline-none"
                    />
                  </ProfileField>
                </div>
                <Button
                  type="button"
                  className="w-full sm:w-auto"
                  onClick={handleSaveProfile}
                  disabled={saving || name.trim() === (display.name || '')}
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    'Save changes'
                  )}
                </Button>
              </div>
            </div>
          )}

          {tab === 'security' && (
            <div className={panel()}>
              <h3 className="mb-4 text-xl font-bold text-foreground">Security</h3>
              <p className="text-base text-muted leading-relaxed">
                Password changes are not available in the app yet. Use a strong unique
                password when registering.
              </p>
              <div className="mt-6">
                <label className={labelClass}>Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className={cn(inputClass, 'mt-2')}
                  disabled
                />
              </div>
            </div>
          )}

          {tab === 'notifications' && (
            <div className={panel()}>
              <h3 className="mb-4 flex items-center gap-2 text-xl font-bold text-foreground">
                <Bell className="h-6 w-6" />
                Notifications
              </h3>
              <p className="mb-6 text-base text-muted">
                Alert preferences will be available in a future release.
              </p>
              {['Email notifications', 'Air quality alerts', 'Weekly reports'].map(
                (label) => (
                  <label
                    key={label}
                    className="mb-4 flex items-center justify-between border-b border-border py-3"
                  >
                    <span className="font-medium text-foreground">{label}</span>
                    <input
                      type="checkbox"
                      disabled
                      className="h-5 w-5 rounded border-border"
                    />
                  </label>
                )
              )}
            </div>
          )}

          {tab === 'api' && (
            <div className={panel()}>
              <h3 className="mb-4 flex items-center gap-2 text-xl font-bold text-foreground">
                <Key className="h-6 w-6" />
                API access
              </h3>
              <div className="space-y-4 text-base text-muted leading-relaxed">
                <p>
                  Public readings:{' '}
                  <code className="rounded-lg bg-surface px-2 py-0.5 text-sm text-foreground border border-border">
                    GET /api/readings
                  </code>
                </p>
                <p>
                  Authenticated routes use your JWT from login. Influx credentials
                  remain on the server only.
                </p>
                {(display.role === 'ADMIN' || display.role === 'OWNER') && (
                  <Link to="/api-docs">
                    <Button type="button" variant="secondary">
                      API documentation
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardPage>
  );
}
