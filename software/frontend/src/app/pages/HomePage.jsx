import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, MapPin, Search, TrendingUp, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchReadings } from '@/app/lib/api';
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
import { MapPreview } from '@/app/components/map/MapPreview';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { AirEducationSections } from '@/app/components/home/AirEducationSections';
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

export function HomePage() {
  const navigate = useNavigate();
  const [sensors, setSensors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const json = await fetchReadings({ limit: 1000, page: 1 });
        if (cancelled) return;
        setSensors(groupReadingsBySensor(json.data || []));
      } catch (e) {
        if (!cancelled) setError(e.message || 'Failed to load readings');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const city = useMemo(() => averageCityMetrics(sensors), [sensors]);

  const lastRefreshMs = useMemo(
    () =>
      sensors.length
        ? Math.max(...sensors.map((s) => s.lastUpdate || 0))
        : 0,
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
        {sensors.length} sensor{sensors.length !== 1 ? 's' : ''} reporting · Last
        refresh {formatRelativeMinutes(lastRefreshMs)}
      </span>
    ) : null;

  return (
    <div>
      <AqiHero
        title="Air quality in Dar es Salaam"
        subtitle="Real-time particulate matter monitoring from sensors across the city. Open data for public health and research."
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <PageSection className="py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
            <div className="lg:col-span-2">
              <label className="block">
                <span className="sr-only">Search monitoring locations</span>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by sensor name or topic…"
                    className="w-full h-12 pl-12 pr-4 rounded-2xl border border-border bg-surface-elevated text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500"
                  />
                </div>
              </label>
            </div>
            <MapPreview sensors={sensors} loading={loading} />
          </div>

          <HealthAdvicePanel aqi={city.aqi} className="mb-10" />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
            <StatCard
              icon={Activity}
              value={loading ? '—' : sensors.length}
              label="Active sensors"
            />
            <StatCard
              icon={TrendingUp}
              value={loading ? '—' : goodLocationsCount}
              label="Good air locations (PM₂.₅ ≤ 12)"
              accent="good"
            />
            <StatCard
              icon={MapPin}
              value="Map"
              label="Explore all stations on the city map"
              accent="map"
              onClick={() => navigate('/map')}
            />
          </div>
        </PageSection>

        <AirEducationSections />

        <PageSection
          title="Monitoring locations"
          description="Tap a station for charts, history, and health guidance for that area."
          className="pt-0 border-t border-border"
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
            <EmptyBlock
              title="No matches"
              description={`No sensors match "${search}". Try another name or clear the search.`}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredSensors.map((sensor) => (
                <LocationCard
                  key={sensor.id}
                  sensorId={sensor.id}
                  measurements={sensor.measurements}
                  lastUpdate={sensor.lastUpdate}
                  onClick={() =>
                    navigate(`/sensor/${encodeURIComponent(sensor.id)}`)
                  }
                />
              ))}
            </div>
          )}
        </PageSection>

        <PageSection
          title="Open data & API"
          description="Researchers and developers can pull the same readings that power this dashboard."
          className="border-t border-border pb-16"
        >
          <Card className="bg-brand-50/50 border-brand-100">
            <CardContent className="py-6 sm:py-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                <p className="max-w-2xl text-sm text-muted leading-relaxed">
                  Sensors publish PM₂.₅, PM₁₀, and weather fields over MQTT into
                  InfluxDB. The US EPA AQI is computed from the highest PM
                  sub-index. See the sections above for what each measurement
                  means, or use the API for your own analysis.
                </p>
                <div className="flex flex-wrap gap-3 shrink-0">
                  <Link to="/map">
                    <Button variant="secondary" type="button">
                      City map
                    </Button>
                  </Link>
                  <Link to="/api-docs">
                    <Button type="button">
                      <BookOpen className="w-4 h-4" />
                      API documentation
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </PageSection>
      </div>
    </div>
  );
}

export default HomePage;
