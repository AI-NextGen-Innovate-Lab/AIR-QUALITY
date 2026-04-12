import { calculateAQI } from "@/app/lib/airQuality";
import { groupReadingsBySensor, sensorSummary } from "@/app/lib/sensorData";

export function averageAqiFromSensors(sensorsGrouped) {
  if (!sensorsGrouped.length) return 0;
  const values = sensorsGrouped
    .map((s) => {
      const { pm25, pm10 } = sensorSummary(s);
      return calculateAQI(pm25, pm10).value;
    })
    .filter((v) => v > 0);
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function totalReadingCount(rows) {
  return rows?.length ?? 0;
}
