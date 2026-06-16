import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useReadings } from '@/app/hooks/useReadings';
import { groupReadingsBySensor, sensorSummary } from '@/app/lib/sensorData';
import { fetchMySensors } from '@/app/lib/api/sensors';
import { Radio } from 'lucide-react';
import { DashboardPage } from '@/app/components/layout/DashboardPage';
import { PageHeader } from '@/app/components/layout/PageHeader';
import { AqiBadge } from '@/app/components/data/AqiBadge';
import { ErrorBlock, LoadingBlock, EmptyBlock } from '@/app/components/data/DataState';
import { panel } from '@/app/lib/dashboardStyles';
import { calculateAQI } from '@/app/lib/airQuality';

export default function PrivateSensor() {
  const sensorsQuery = useQuery({
    queryKey: ['sensors', 'mine'],
    queryFn: fetchMySensors,
  });

  const assignedTopics = (sensorsQuery.data ?? []).map((s) => s.topic);

  const { loading, error, data: rows } = useReadings({
    limit: 2500,
    page: 1,
    hours: 168,
  });

  const sensors = groupReadingsBySensor(rows).filter((s) =>
    assignedTopics.includes(s.id)
  );
  const registry = sensorsQuery.data ?? [];

  return (
    <DashboardPage>
      <PageHeader
        badge="Private network"
        title="Private sensors"
        description="Sensors assigned to your account. Only you can view measurements from private devices."
      />

      {error && <ErrorBlock message={error} className="mb-6" />}

      <div className={panel('mb-8')}>
        <h2 className="mb-3 text-lg font-semibold text-foreground">Owner access flow</h2>
        <ol className="mb-5 list-inside list-decimal space-y-2 text-sm text-muted">
          <li>An administrator registers your device topic and assigns it to your account.</li>
          <li>Private sensors appear here once data is flowing into Influx.</li>
          <li>Use <strong>Analytics & Reports</strong> to chart and export your sensor data.</li>
          <li>Other users — including administrators — cannot see your private measurements.</li>
        </ol>

        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-foreground">
          <Radio className="h-5 w-5 text-brand-700" />
          Connect a private device
        </h2>
        <ol className="list-inside list-decimal space-y-2 text-sm text-muted">
          <li>
            Publish MQTT messages to a unique topic that matches your Influx Telegraf
            mapping.
          </li>
          <li>
            Ensure measurements include PM2.5 and PM10 fields your dashboard expects.
          </li>
          <li>
            Once data appears in Influx, the topic shows up here and on the public map
            (use access control at the edge if topics must stay private).
          </li>
        </ol>
      </div>

      <div className={panel()}>
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          Assigned sensors
        </h2>
        {sensorsQuery.isLoading ? (
          <LoadingBlock message="Loading assigned sensors…" />
        ) : registry.length === 0 ? (
          <EmptyBlock
            title="No sensors assigned"
            description="Ask an administrator to register your device and assign it to your account."
          />
        ) : loading ? (
          <LoadingBlock message="Loading topics…" />
        ) : sensors.length === 0 ? (
          <EmptyBlock
            title="No recent readings"
            description="Your sensors are registered but have not reported in the last 7 days."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted">
                  <th className="py-3 pr-4 font-medium">Topic</th>
                  <th className="py-3 pr-4 text-right font-medium">AQI</th>
                  <th className="py-3 pr-4 font-medium">Category</th>
                  <th className="py-3 pr-4" />
                </tr>
              </thead>
              <tbody>
                {sensors.map((s) => {
                  const { pm25, pm10 } = sensorSummary(s);
                  const aqi = calculateAQI(pm25, pm10).value;
                  return (
                    <tr
                      key={s.id}
                      className="border-b border-border hover:bg-surface transition-colors"
                    >
                      <td className="py-3 pr-4 font-mono text-xs text-foreground">
                        {s.id}
                      </td>
                      <td className="py-3 pr-4 text-right">
                        <AqiBadge aqi={aqi} showLabel={false} />
                      </td>
                      <td className="py-3 pr-4">
                        <AqiBadge aqi={aqi} />
                      </td>
                      <td className="py-3 pr-4 text-right">
                        <Link
                          to={`/sensor/${encodeURIComponent(s.id)}`}
                          className="text-sm font-medium text-brand-700 hover:text-brand-800"
                        >
                          Details
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardPage>
  );
}
