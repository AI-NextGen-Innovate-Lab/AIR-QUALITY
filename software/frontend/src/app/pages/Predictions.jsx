import React from 'react';
import { useAiPredictions } from '@/app/hooks/useAiPredictions';
import { DashboardPage } from '@/app/components/layout/DashboardPage';
import { PageHeader } from '@/app/components/layout/PageHeader';
import { SensorForecastCard } from '@/app/components/aqi/SensorForecastCard';
import { LoadingBlock, ErrorBlock } from '@/app/components/data/DataState';

export default function Predictions() {
  const { sensors, loading, error } = useAiPredictions();

  return (
    <DashboardPage>
      <PageHeader
        badge="Forecast"
        title="Predictions"
        description="6-hour AQI, PM2.5, and PM10 forecasts per sensor, from the AI prediction service."
      />

      {loading ? (
        <LoadingBlock message="Loading predictions…" />
      ) : error ? (
        <ErrorBlock message="AI predictions unavailable right now — please try again shortly." />
      ) : !sensors.length ? (
        <ErrorBlock message="No sensors have predictions yet." />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {sensors.map((sensor) => (
            <SensorForecastCard key={sensor.key} sensor={sensor} />
          ))}
        </div>
      )}
    </DashboardPage>
  );
}
