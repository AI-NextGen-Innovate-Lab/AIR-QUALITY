import { apiGet, apiPatch } from './client';

export async function fetchMyProfile() {
  return apiGet('/users/me');
}

export async function updateMyProfile({ name }) {
  return apiPatch('/users/me', { name });
}
