import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, AlertCircle, Clock, MapPin, Search } from 'lucide-react';
import { useReadings } from '@/app/hooks/useReadings';
import { calculateAQI, getAQICategory } from '@/app/lib/airQuality';
import {
  groupReadingsBySensor,
  sensorSummary,
  formatSensorLabel,
} from '@/app/lib/sensorData';
import {
  connectionStatusFromLastMs,
  formatRelativeMinutes,
} from '@/app/lib/sensors/sensorStatusModel';
import { DashboardPage } from '@/app/components/layout/DashboardPage';
import { PageHeader } from '@/app/components/layout/PageHeader';
import { StatCard } from '@/app/components/data/StatCard';
import { SensorStatusBadge } from '@/app/components/aqi/SensorStatusBadge';
import { ErrorBlock, LoadingBlock, EmptyBlock } from '@/app/components/data/DataState';
import { Button } from '@/app/components/ui/button';
import { panel, inputClass, selectClass, labelClass } from '@/app/lib/dashboardStyles';

export default function SensorStatus() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { loading, error, data: rows } = useReadings({
    limit: 4000,
    page: 1,
    hours: 24,
  });

  const sensors = useMemo(() => groupReadingsBySensor(rows), [rows]);

  const rowsView = useMemo(() => {
    return sensors
      .map((s) => {
        const { pm25, pm10, lastUpdate } = sensorSummary(s);
        const aqi = calculateAQI(pm25, pm10).value;
        const category = getAQICategory(aqi);
        const conn = connectionStatusFromLastMs(lastUpdate);
        return {
          ...s,
          label: formatSensorLabel(s.id),
          pm25,
          pm10,
          aqi,
          category,
          conn,
          rel: formatRelativeMinutes(lastUpdate),
        };
      })
      .filter((s) => {
        const q = searchTerm.trim().toLowerCase();
        const matchSearch =
          !q ||
          s.id.toLowerCase().includes(q) ||
          s.label.toLowerCase().includes(q);
        const matchStatus =
          statusFilter === 'all' || s.conn.key === statusFilter;
        return matchSearch && matchStatus;
      });
  }, [sensors, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const all = sensors.map((s) => {
      const { lastUpdate } = sensorSummary(s);
      return connectionStatusFromLastMs(lastUpdate).key;
    });
    return {
      total: sensors.length,
      live: all.filter((k) => k === 'live').length,
      stale: all.filter((k) => k === 'stale').length,
      offline: all.filter((k) => k === 'offline').length,
    };
  }, [sensors]);

  return (
    <DashboardPage>
      <PageHeader
        badge="Operations"
        title="Sensor status"
        description="Live connectivity and latest AQI per MQTT topic (last 24 hours)."
      />

      {error && <ErrorBlock message={error} className="mb-6" />}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 mb-6">
        <StatCard icon={MapPin} value={loading ? '—' : stats.total} label="Topics" />
        <StatCard
          icon={Activity}
          value={loading ? '—' : stats.live}
          label="Live"
          accent="good"
        />
        <StatCard
          icon={Clock}
          value={loading ? '—' : stats.stale}
          label="Stale"
        />
        <StatCard
          icon={AlertCircle}
          value={loading ? '—' : stats.offline}
          label="Silent / no data"
        />
      </div>

      <div className={panel('mb-6')}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search sensor or topic…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={inputClass + ' pl-10'}
            />
          </div>
          <div>
            <label className={labelClass}>Reporting</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={selectClass}
            >
              <option value="all">All</option>
              <option value="live">Live</option>
              <option value="stale">Stale</option>
              <option value="offline">Silent / no data</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingBlock message="Loading sensor status…" />
      ) : rowsView.length === 0 ? (
        <EmptyBlock title="No sensors match" description="Try another search or filter." />
      ) : (
        <div className="space-y-4">
          {rowsView.map((sensor) => {
            const needsAttention = sensor.conn.key !== 'live';
            return (
              <div key={sensor.id} className={panel()}>
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-center">
                  <div className="lg:col-span-5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50">
                        <Activity className="h-6 w-6 text-brand-700" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-foreground">{sensor.label}</h3>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {sensor.id}
                        </p>
                        <div className="flex items-center gap-1 text-sm text-muted mt-1">
                          <MapPin className="h-3 w-3 shrink-0" />
                          MQTT / Influx topic
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-3">
                    <p className={labelClass}>Status</p>
                    <SensorStatusBadge status={sensor.conn} />
                    <p className="mt-2 flex items-center gap-1 text-xs text-muted">
                      <Clock className="h-3 w-3" />
                      {sensor.rel}
                    </p>
                  </div>

                  <div className="lg:col-span-2">
                    <p className={labelClass}>AQI</p>
                    <div
                      className="mt-1 flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold"
                      style={{
                        backgroundColor: sensor.category.color,
                        color: sensor.category.textColor,
                      }}
                    >
                      {sensor.aqi}
                    </div>
                  </div>

                  <div className="flex lg:col-span-2 lg:justify-end">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        navigate(`/sensor/${encodeURIComponent(sensor.id)}`)
                      }
                    >
                      Details
                    </Button>
                  </div>
                </div>

                {needsAttention && (
                  <div className="mt-4 pt-4 border-t border-border flex gap-2 text-sm text-muted">
                    <AlertCircle className="h-4 w-4 shrink-0 text-aqi-moderate" />
                    {sensor.conn.key === 'offline'
                      ? 'No readings in this window, or topic is quiet.'
                      : 'No reading in the last hour; check device or ingestion.'}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </DashboardPage>
  );
}
