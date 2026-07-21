import { chartLineBrand, chartLineAccent } from './chartTheme';

/** Shared AQI/PM2.5/PM10 metric definitions for AI forecast + history charts. */
export const FORECAST_METRICS = [
  { key: 'aqi', label: 'AQI', unit: '', color: chartLineBrand, field: 'forecast_6h' },
  { key: 'pm25', label: 'PM2.5', unit: ' µg/m³', color: chartLineAccent, field: 'pm25_forecast_6h' },
  { key: 'pm10', label: 'PM10', unit: ' µg/m³', color: '#f59e0b', field: 'pm10_forecast_6h' },
];

export const HISTORY_METRICS = [
  { key: 'aqi', label: 'AQI', unit: '', color: chartLineBrand },
  { key: 'pm25', label: 'PM2.5', unit: ' µg/m³', color: chartLineAccent },
  { key: 'pm10', label: 'PM10', unit: ' µg/m³', color: '#f59e0b' },
];

export const HISTORY_RANGES = [
  { key: '24h', label: '24 Hours', hours: 24 },
  { key: '7d', label: '7 Days', hours: 168 },
  { key: '2w', label: '2 Weeks', hours: 336 },
  { key: '30d', label: '30 Days', hours: 720 },
];
