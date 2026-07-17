import { apiGet, apiPost, apiPatch, apiDelete } from './client.js';

export function fetchAllSensors() {
  return apiGet('/sensors');
}

export function fetchAvailableSensors(hours = 168) {
  return apiGet('/sensors/available', { hours });
}

export function fetchMapMetadata() {
  return apiGet('/sensors/map-metadata');
}

export function fetchMySensors() {
  return apiGet('/sensors/mine');
}

export function createSensor(payload) {
  return apiPost('/sensors', payload);
}

export function updateSensor(id, payload) {
  return apiPatch(`/sensors/${id}`, payload);
}

export function deleteSensor(id) {
  return apiDelete(`/sensors/${id}`);
}
