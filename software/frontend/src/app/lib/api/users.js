import { apiGet, apiPost, apiPatch, apiDelete } from './client.js';

const API_BASE = '/users';

export const getUsersApi = {
  async getAllUsers() {
    try {
      return await apiGet(API_BASE);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      throw error;
    }
  },

  async getUserById(id) {
    try {
      return await apiGet(`${API_BASE}/${id}`);
    } catch (error) {
      console.error(`Failed to fetch user ${id}:`, error);
      throw error;
    }
  },

  async createUser(userData) {
    try {
      return await apiPost(API_BASE, userData);
    } catch (error) {
      console.error('Failed to create user:', error);
      throw error;
    }
  },

  async updateUser(id, userData) {
    try {
      return await apiPatch(`${API_BASE}/${id}`, userData);
    } catch (error) {
      console.error(`Failed to update user ${id}:`, error);
      throw error;
    }
  },

  async updateUserRole(id, role) {
    try {
      return await apiPatch(`${API_BASE}/${id}/role`, { role });
    } catch (error) {
      console.error(`Failed to update user role for ${id}:`, error);
      throw error;
    }
  },

  async deleteUser(id) {
    try {
      return await apiDelete(`${API_BASE}/${id}`);
    } catch (error) {
      console.error(`Failed to delete user ${id}:`, error);
      throw error;
    }
  },

  async getAuditLogs(limit = 100) {
    try {
      return await apiGet(`${API_BASE}/audit-logs`, { limit });
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
      throw error;
    }
  },
};

/** @deprecated Prefer getUsersApi — kept for api/index.js re-exports */
export async function fetchUsers() {
  return getUsersApi.getAllUsers();
}

export async function fetchUser(id) {
  return getUsersApi.getUserById(id);
}

export async function createUser(userData) {
  return getUsersApi.createUser(userData);
}

export async function updateUser(id, userData) {
  return getUsersApi.updateUser(id, userData);
}

export async function deleteUser(id) {
  return getUsersApi.deleteUser(id);
}
