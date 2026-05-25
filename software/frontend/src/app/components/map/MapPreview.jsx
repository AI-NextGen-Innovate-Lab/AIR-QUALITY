import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { calculateAQI, getAQICategory } from '@/app/lib/airQuality';
import {
  groupReadingsBySensor,
  sensorSummary,
  topicToLatLng,
} from '@/app/lib/sensorData';
import { Card } from '@/app/components/ui/card';
import { SensorMap } from './SensorMap';

export function MapPreview({ sensors = [], loading }) {
  const navigate = useNavigate();

  const mapSensors = useMemo(
    () =>
      sensors.map((s) => {
        const { lat, lng } = topicToLatLng(s.id);
        const { pm25, pm10 } = sensorSummary(s);
        const aqi = calculateAQI(pm25, pm10).value;
        return {
          id: s.id,
          lat,
          lng,
          aqi,
          category: getAQICategory(aqi),
        };
      }),
    [sensors]
  );

  return (
    <Card className="overflow-hidden border-border h-full min-h-[280px]">
      {loading ? (
        <div className="h-[280px] flex items-center justify-center text-muted text-sm animate-pulse">
          Loading map…
        </div>
      ) : (
        <SensorMap
          sensors={mapSensors}
          height={280}
          showLegend={false}
          showExpand
          onExpand={() => navigate('/map')}
          className="rounded-none border-0"
        />
      )}
    </Card>
  );
}
