import { apiGet, apiPatch } from './client';

export async function fetchMyProfile() {
  return apiGet('/users/me');
}

export async function updateMyProfile({ name }) {
  return apiPatch('/users/me', { name });
}

export async function changeMyPassword({ currentPassword, newPassword }) {
  return apiPatch('/users/me/password', { currentPassword, newPassword });
}
