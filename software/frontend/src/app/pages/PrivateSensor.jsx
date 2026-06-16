import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useReadings } from '@/app/hooks/useReadings';
import { groupReadingsBySensor, sensorSummary, formatSensorLabel } from '@/app/lib/sensorData';
import { enrichSensorsForMap, registryOnlyMapMarkers } from '@/app/lib/sensorMapUtils';
import { fetchMySensors } from '@/app/lib/api/sensors';
import { Radio } from 'lucide-react';
import { DashboardPage } from '@/app/components/layout/DashboardPage';
import { PageHeader } from '@/app/components/layout/PageHeader';
import { AqiBadge } from '@/app/components/data/AqiBadge';
import { ErrorBlock, LoadingBlock, EmptyBlock } from '@/app/components/data/DataState';
import { SensorMap } from '@/app/components/map/SensorMap';
import { Card } from '@/app/components/ui/card';
import { panel } from '@/app/lib/dashboardStyles';
import { calculateAQI } from '@/app/lib/airQuality';

export default function PrivateSensor() {
  const sensorsQuery = useQuery({
    queryKey: ['sensors', 'mine'],
    queryFn: fetchMySensors,
  });

  const registry = sensorsQuery.data ?? [];

  const { loading, error, data: rows } = useReadings({
    limit: 2500,
    page: 1,
    hours: 168,
  });

  const readingSensors = useMemo(
    () =>
      groupReadingsBySensor(rows).filter((s) =>
        registry.some((r) => r.topic === s.id)
      ),
    [rows, registry]
  );

  const mapSensors = useMemo(() => {
    const withData = enrichSensorsForMap(readingSensors, registry);
    const withoutData = registryOnlyMapMarkers(registry, readingSensors);
    return [...withData, ...withoutData];
  }, [readingSensors, registry]);

  return (
    <DashboardPage>
      <PageHeader
        badge="Private network"
        title="My sensors"
        description="Your assigned sensors on the map. Only you can see private device locations and measurements."
      />

      {error && <ErrorBlock message={error} className="mb-6" />}

      <div className={panel('mb-8')}>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-foreground">
          <Radio className="h-5 w-5 text-brand-700" />
          Your sensor map
        </h2>
        <p className="mb-4 text-sm text-muted">
          Locations use coordinates from the sensor registry. Names such as{' '}
          <strong>Lands Building</strong> and <strong>Planning Building</strong> replace long MQTT topics.
        </p>
        {sensorsQuery.isLoading ? (
          <LoadingBlock message="Loading your sensors…" />
        ) : registry.length === 0 ? (
          <EmptyBlock
            title="No sensors assigned"
            description="Ask an administrator to register your device and assign it to your account."
          />
        ) : (
          <Card className="overflow-hidden p-0 border-border">
            <SensorMap
              sensors={mapSensors}
              height={480}
              showLegend
              showExpand={false}
            />
          </Card>
        )}
      </div>

      <div className={panel()}>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Assigned sensors</h2>
        {sensorsQuery.isLoading ? (
          <LoadingBlock message="Loading assigned sensors…" />
        ) : registry.length === 0 ? (
          <EmptyBlock
            title="No sensors assigned"
            description="Ask an administrator to register your device and assign it to your account."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted">
                  <th className="py-3 pr-4 font-medium">Name</th>
                  <th className="py-3 pr-4 font-medium">Visibility</th>
                  <th className="py-3 pr-4 text-right font-medium">AQI</th>
                  <th className="py-3 pr-4" />
                </tr>
              </thead>
              <tbody>
                {registry.map((reg) => {
                  const live = readingSensors.find((s) => s.id === reg.topic);
                  const { pm25, pm10 } = live ? sensorSummary(live) : {};
                  const aqi = live ? calculateAQI(pm25, pm10).value : null;

                  return (
                    <tr
                      key={reg.id}
                      className="border-b border-border hover:bg-surface transition-colors"
                    >
                      <td className="py-3 pr-4">
                        <p className="font-medium text-foreground">
                          {formatSensorLabel(reg.topic, reg.label)}
                        </p>
                        <p className="text-xs text-muted font-mono truncate max-w-[16rem]" title={reg.topic}>
                          {reg.topic}
                        </p>
                      </td>
                      <td className="py-3 pr-4 text-muted">{reg.visibility}</td>
                      <td className="py-3 pr-4 text-right">
                        {aqi != null ? <AqiBadge aqi={aqi} showLabel={false} /> : '—'}
                      </td>
                      <td className="py-3 pr-4 text-right">
                        <Link
                          to={`/sensor/${encodeURIComponent(reg.topic)}`}
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
