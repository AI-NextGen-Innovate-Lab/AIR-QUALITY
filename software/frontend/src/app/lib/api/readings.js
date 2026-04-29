import { apiGet } from "./client.js";


export function fetchReadings({
  limit = 500,
  page = 1,
  sensorId,
  hours = 24,
} = {}) {
  return apiGet("/api/readings", { limit, page, sensorId, hours });
}

export function fetchSensorReadings(sensorId, { limit = 2000, hours = 168 } = {}) {
  return fetchReadings({ limit, page: 1, sensorId, hours });
}
