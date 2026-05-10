import { apiGet, apiPost, apiPatch, apiDelete } from "./client";

const API_BASE = "/users";

export const getUsersApi = {
  /**
   * Get all users (admin only)
   */
  async getAllUsers() {
    try {
      return await apiGet(API_BASE);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      throw error;
    }
  },

  /**
   * Get a single user by ID (admin only)
   */
  async getUserById(id) {
    try {
      return await apiGet(`${API_BASE}/${id}`);
    } catch (error) {
      console.error(`Failed to fetch user ${id}:`, error);
      throw error;
    }
  },

  /**
   * Create a new user (admin only)
   */
  async createUser(userData) {
    try {
      return await apiPost(API_BASE, userData);
    } catch (error) {
      console.error("Failed to create user:", error);
      throw error;
    }
  },

  /**
   * Update user details (admin only)
   */
  async updateUser(id, userData) {
    try {
      return await apiPatch(`${API_BASE}/${id}`, userData);
    } catch (error) {
      console.error(`Failed to update user ${id}:`, error);
      throw error;
    }
  },

  /**
   * Update user role (admin only)
   */
  async updateUserRole(id, role) {
    try {
      return await apiPatch(`${API_BASE}/${id}/role`, { role });
    } catch (error) {
      console.error(`Failed to update user role for ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete a user (admin only)
   */
  async deleteUser(id) {
    try {
      return await apiDelete(`${API_BASE}/${id}`);
    } catch (error) {
      console.error(`Failed to delete user ${id}:`, error);
      throw error;
    }
  },
};
