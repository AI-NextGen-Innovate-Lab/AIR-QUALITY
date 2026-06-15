import React, { useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Activity, MapPin, Search, TrendingUp, BookOpen, AlertTriangle, Shield } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { useReadingsQuery } from '@/app/hooks/useReadingsQuery';
import { calculateAQI } from '@/app/lib/airQuality';
import {
  groupReadingsBySensor,
  sensorSummary,
  formatSensorLabel,
} from '@/app/lib/sensorData';
import { formatRelativeMinutes } from '@/app/lib/sensors/sensorStatusModel';
import { AqiHero } from '@/app/components/aqi/AqiHero';
import { HealthAdvicePanel } from '@/app/components/aqi/HealthAdvicePanel';
import { StatCard } from '@/app/components/data/StatCard';
import { LocationCard } from '@/app/components/data/LocationCard';
import { LoadingBlock, ErrorBlock, EmptyBlock } from '@/app/components/data/DataState';
import { PageSection } from '@/app/components/layout/PageSection';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { AirEducationSections } from '@/app/components/home/AirEducationSections';
import {
  AqiTrendChart,
  countOfflineSensors,
  countOnlineSensors,
} from '@/app/components/home/AqiTrendChart';
import { MapPreview } from '@/app/components/map/MapPreview';
import heroBackdrop from '@/assets/pawel-czerwinski-WZ7vr3YcQrg-unsplash.jpg';

function averageCityMetrics(sensors) {
  if (!sensors.length) return { aqi: 0, pm25: undefined, pm10: undefined, dominant: '—' };
  const pm25s = [];
  const pm10s = [];
  for (const s of sensors) {
    const { pm25, pm10 } = sensorSummary(s);
    if (pm25 !== undefined) pm25s.push(pm25);
    if (pm10 !== undefined) pm10s.push(pm10);
  }
  const avg = (arr) =>
    arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : undefined;
  const pm25 = avg(pm25s);
  const pm10 = avg(pm10s);
  const { value, dominant } = calculateAQI(pm25, pm10);
  return { aqi: value, pm25, pm10, dominant };
}

function RoleCtaBanner({ user, navigate }) {
  if (!user) return null;
  const role = String(user.role || 'USER').toUpperCase();
  const config =
    role === 'ADMIN'
      ? { label: 'Open Admin Center', path: '/admin' }
      : role === 'OWNER'
        ? { label: 'Manage Infrastructure', path: '/private-sensors' }
        : { label: 'Open Analytics Dashboard', path: '/user-dashboard' };

  return (
    <div className="mb-8 flex flex-col gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-medium text-zinc-100">Signed in as {user.name}</p>
        <p className="text-xs text-zinc-500">Access your personalized dashboard and API tools.</p>
      </div>
      <Button onClick={() => navigate(config.path)}>{config.label}</Button>
    </div>
  );
}

export function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const { loading, error, data: rawReadings } = useReadingsQuery({ limit: 1000, page: 1, hours: 24 });

  const sensors = useMemo(() => groupReadingsBySensor(rawReadings), [rawReadings]);
  const city = useMemo(() => averageCityMetrics(sensors), [sensors]);

  const lastRefreshMs = useMemo(
    () => (sensors.length ? Math.max(...sensors.map((s) => s.lastUpdate || 0)) : 0),
    [sensors]
  );

  const goodLocationsCount = useMemo(
    () =>
      sensors.filter((s) => {
        const { pm25 } = sensorSummary(s);
        return pm25 !== undefined && pm25 <= 12;
      }).length,
    [sensors]
  );

  const filteredSensors = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sensors;
    return sensors.filter((s) => {
      const label = formatSensorLabel(s.id).toLowerCase();
      return s.id.toLowerCase().includes(q) || label.includes(q);
    });
  }, [sensors, search]);

  const heroMeta =
    !loading && !error && lastRefreshMs ? (
      <span>
        Live sensor network · {sensors.length} reporting · Updated{' '}
        {formatRelativeMinutes(lastRefreshMs)}
      </span>
    ) : null;

  return (
    <div>
      <AqiHero
        title="Dar es Salaam"
        subtitle="City-wide air quality intelligence from a live sensor network. Open data for public health and research."
        aqi={city.aqi}
        dominantPollutant={city.dominant}
        pm25={city.pm25}
        pm10={city.pm10}
        loading={loading}
        error={error}
        meta={heroMeta}
        backgroundImage={heroBackdrop}
        backgroundImageAlt="Sky with emissions from an industrial stack"
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <PageSection className="py-8">
          <RoleCtaBanner user={user} navigate={navigate} />

          <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-5">
            <StatCard icon={TrendingUp} value={loading ? '—' : Math.round(city.aqi)} label="City AQI" />
            <StatCard icon={Activity} value={loading ? '—' : countOnlineSensors(sensors)} label="Sensors online" />
            <StatCard icon={MapPin} value={loading ? '—' : 1} label="City covered" />
            <StatCard
              icon={AlertTriangle}
              value={loading ? '—' : countOfflineSensors(sensors)}
              label="Offline sensors"
              accent={countOfflineSensors(sensors) > 0 ? 'warn' : undefined}
            />
            <StatCard icon={Shield} value={loading ? '—' : goodLocationsCount} label="Good air zones" accent="good" />
          </div>

          <div className="mb-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <AqiTrendChart readings={rawReadings} loading={loading} />
            </div>
            <MapPreview sensors={sensors} loading={loading} />
          </div>

          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center">
            <label className="block flex-1">
              <span className="sr-only">Search monitoring locations</span>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by sensor name or topic…"
                  className="h-12 w-full rounded-2xl border border-zinc-800 bg-zinc-900 pl-12 pr-4 text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </label>
            <Button type="button" variant="secondary" className="w-full shrink-0 sm:w-auto" onClick={() => navigate('/map')}>
              <MapPin className="h-4 w-4" />
              Open city map
            </Button>
          </div>

          <HealthAdvicePanel aqi={city.aqi} className="mb-10" />
        </PageSection>

        <PageSection
          title="Monitoring locations"
          description="Tap a station for charts, history, and health guidance for that area."
          className="border-t border-zinc-800 pt-8"
        >
          {loading ? (
            <LoadingBlock message="Loading sensors…" />
          ) : error ? (
            <ErrorBlock message={error} />
          ) : sensors.length === 0 ? (
            <EmptyBlock
              title="No sensor data"
              description="No readings in the last 24 hours. Check that the backend and InfluxDB are running."
            />
          ) : filteredSensors.length === 0 ? (
            <EmptyBlock title="No matches" description={`No sensors match "${search}".`} />
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {filteredSensors.map((sensor) => (
                <LocationCard
                  key={sensor.id}
                  sensorId={sensor.id}
                  measurements={sensor.measurements}
                  lastUpdate={sensor.lastUpdate}
                  onClick={() => navigate(`/sensor/${encodeURIComponent(sensor.id)}`)}
                />
              ))}
            </div>
          )}
        </PageSection>

        <PageSection
          title="Trust & transparency"
          description="How we measure and publish air quality data."
          className="border-t border-zinc-800 pt-8"
        >
          <Card className="border-zinc-800 bg-zinc-900">
            <CardContent className="py-6 sm:py-8">
              <ul className="space-y-2 text-sm text-zinc-400">
                <li>AQI is computed using the US EPA method from PM₂.₅ and PM₁₀ sub-indices.</li>
                <li>Sensors publish readings over MQTT into InfluxDB, typically every few minutes.</li>
                <li>Public access is rate-limited; approved API keys unlock extended history and higher limits.</li>
                <li>All admin actions on API keys are audit-logged.</li>
              </ul>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/api-docs">
                  <Button variant="secondary" type="button">
                    <BookOpen className="h-4 w-4" />
                    API documentation
                  </Button>
                </Link>
                {user && (
                  <Link to="/api-access">
                    <Button type="button">Request API access</Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        </PageSection>

        <details className="mb-16 mt-8 rounded-2xl border border-zinc-800 bg-zinc-900 px-5 py-4">
          <summary className="cursor-pointer text-sm font-semibold text-zinc-200">Learn more about air quality</summary>
          <div className="mt-4">
            <AirEducationSections />
          </div>
        </details>
      </div>
    </div>
  );
}

export default HomePage;
