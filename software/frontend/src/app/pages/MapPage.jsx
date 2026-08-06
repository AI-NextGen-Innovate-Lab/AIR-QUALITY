import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchReadings } from '@/app/lib/api';
import { fetchMapMetadata } from '@/app/lib/api/sensors';
import { useAuth } from '@/app/context/AuthContext';
import { groupReadingsBySensor, formatSensorLabel } from '@/app/lib/sensorData';
import { enrichSensorsForMap, registryOnlyMapMarkers } from '@/app/lib/sensorMapUtils';
import { SensorMap } from '@/app/components/map/SensorMap';
import { PageSection } from '@/app/components/layout/PageSection';
import { LoadingBlock, ErrorBlock, EmptyBlock } from '@/app/components/data/DataState';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { cn } from '@/app/lib/utils/cn';

export function MapPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedSensor, setSelectedSensor] = useState(null);
  const [sensors, setSensors] = useState([]);
  const [registry, setRegistry] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [json, meta] = await Promise.all([
          fetchReadings({ limit: 1000, page: 1 }),
          fetchMapMetadata(),
        ]);
        if (cancelled) return;
        setSensors(groupReadingsBySensor(json.data || []));
        setRegistry(Array.isArray(meta) ? meta : []);
      } catch (e) {
        if (!cancelled) setError(e.message || 'Failed to load readings');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.role]);

  const sensorsWithCoords = useMemo(() => {
    const withData = enrichSensorsForMap(sensors, registry);
    const withoutData = registryOnlyMapMarkers(registry, sensors);
    return [...withData, ...withoutData].sort((a, b) => (b.aqi ?? 0) - (a.aqi ?? 0));
  }, [sensors, registry]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <PageSection
        title="Air quality map"
        description="OpenStreetMap view of Dar es Salaam. Colored markers show live AQI per station — not a heat map."
        className="py-0"
      />

      {loading && <LoadingBlock message="Loading sensor positions…" className="mb-6" />}
      {error && <ErrorBlock message={error} className="mb-6" />}

      {!loading && !error && sensorsWithCoords.length === 0 && (
        <EmptyBlock
          title="No stations on the map"
          description="No sensor readings in the last 24 hours."
          className="mb-6"
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 overflow-hidden p-0 border-border">
          <SensorMap
            sensors={sensorsWithCoords}
            selectedId={selectedSensor}
            onSelectSensor={setSelectedSensor}
            height={640}
            showLegend
            showExpand={false}
          />
        </Card>

        <Card className="border-border flex flex-col max-h-[640px]">
          <CardContent className="py-5 flex flex-col min-h-0 flex-1">
            <h3 className="font-semibold text-foreground mb-1">Stations</h3>
            <p className="text-xs text-muted mb-4">Sorted by current AQI</p>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 -mr-1">
              {sensorsWithCoords.map((sensor) => {
                const { category } = sensor;
                const isSelected = selectedSensor === sensor.id;
                const label = sensor.label || formatSensorLabel(sensor.id);

                return (
                  <div
                    key={sensor.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedSensor(sensor.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedSensor(sensor.id);
                      }
                    }}
                    className={cn(
                      'w-full text-left rounded-xl border p-3 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
                      isSelected
                        ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500/20'
                        : 'border-border hover:border-border-strong hover:bg-surface'
                    )}
                  >
                    <div className="flex justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-foreground truncate">
                          {label}
                        </p>
                        <p
                          className="text-xs mt-0.5 font-medium"
                          style={{ color: category.color }}
                        >
                          {category.label}
                        </p>
                      </div>
                      <div
                        className="h-10 w-10 shrink-0 rounded-full flex items-center justify-center text-sm font-bold"
                        style={{
                          backgroundColor: category.color,
                          color: category.textColor,
                        }}
                      >
                        {sensor.aqi}
                      </div>
                    </div>

                    {isSelected && (
                      <Button
                        type="button"
                        size="sm"
                        className="w-full mt-3"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(
                            user
                              ? `/sensor/${encodeURIComponent(sensor.id)}`
                              : '/login'
                          );
                        }}
                      >
                        View details
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default MapPage;
