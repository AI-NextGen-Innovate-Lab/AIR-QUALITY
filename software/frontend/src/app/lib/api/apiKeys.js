import { apiGet, apiPost, apiDelete } from './client.js';

export function createApiKeyRequest(purpose) {
  return apiPost('/api-keys/requests', { purpose });
}

export function fetchMyApiKeyRequests() {
  return apiGet('/api-keys/requests/mine');
}

export function fetchApiKeyRequests(status) {
  return apiGet('/api-keys/requests', status ? { status } : {});
}

export function approveApiKeyRequest(id) {
  return apiPost(`/api-keys/requests/${id}/approve`);
}

export function rejectApiKeyRequest(id, reviewNote) {
  return apiPost(`/api-keys/requests/${id}/reject`, { reviewNote });
}

export function fetchMyApiKeys() {
  return apiGet('/api-keys/mine');
}

export function fetchMyKeyDeliveries() {
  return apiGet('/api-keys/mine/deliveries');
}

export function fetchAllApiKeys(status) {
  return apiGet('/api-keys', status ? { status } : {});
}

export function fetchApiKeySecret(id) {
  return apiGet(`/api-keys/${id}/secret`);
}

export function revokeApiKey(id) {
  return apiPost(`/api-keys/${id}/revoke`);
}

export function deleteApiKey(id) {
  return apiDelete(`/api-keys/${id}`);
}
