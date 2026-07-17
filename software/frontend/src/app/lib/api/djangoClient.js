const DJANGO_API_URL = "http://localhost:8000/api";

export async function fetchPredictions(sensorId, days, metric) {
  const url = `${DJANGO_API_URL}/predict/?sensor_id=${sensorId}&days=${days}&metric=${metric}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch predictions");
  return res.json();
}

export async function fetchHealthGuide(aqi) {
  const url = `${DJANGO_API_URL}/health-guide/${(aqi !== undefined && aqi !== null) ? `?aqi=${aqi}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch health guide");
  return res.json();
}

export async function fetchSensorSummary() {
  const url = `${DJANGO_API_URL}/sensor-summary/`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch sensor summary");
  return res.json();
}
