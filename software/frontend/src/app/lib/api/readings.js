import { apiGet } from "./client.js";


export function fetchReadings({
  limit = 500,
  page = 1,
  sensorId,
  hours = 24,
  measurement,
} = {}) {
  const measurementParam = Array.isArray(measurement)
    ? measurement.join(',')
    : measurement;
  return apiGet("/readings", {
    limit,
    page,
    sensorId,
    hours,
    measurement: measurementParam,
  });
}

export function fetchSensorReadings(sensorId, { limit = 2000, hours = 168 } = {}) {
  return fetchReadings({ limit, page: 1, sensorId, hours });
}
