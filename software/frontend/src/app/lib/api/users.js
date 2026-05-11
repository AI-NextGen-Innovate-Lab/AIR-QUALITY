import { apiGet, apiPost, buildUrl } from "./client.js";

export async function fetchUsers() {
  try {
    return await apiGet("/users");
  } catch (error) {
    console.error("Failed to fetch users:", error);
    throw error;
  }
}

export async function fetchUser(id) {
  try {
    return await apiGet(`/users/${id}`);
  } catch (error) {
    console.error(`Failed to fetch user ${id}:`, error);
    throw error;
  }
}

export async function createUser(userData) {
  try {
    const url = buildUrl("/users");
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(userData),
    });
    if (!res.ok) {
      throw new Error(`Failed to create user (${res.status})`);
    }
    return res.json();
  } catch (error) {
    console.error("Failed to create user:", error);
    throw error;
  }
}

export async function updateUser(id, userData) {
  try {
    const url = buildUrl(`/users/${id}`);
    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(userData),
    });
    if (!res.ok) {
      throw new Error(`Failed to update user (${res.status})`);
    }
    return res.json();
  } catch (error) {
    console.error("Failed to update user:", error);
    throw error;
  }
}

export async function deleteUser(id) {
  try {
    const url = buildUrl(`/users/${id}`);
    const res = await fetch(url, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    if (!res.ok) {
      throw new Error(`Failed to delete user (${res.status})`);
    }
    return res.json();
  } catch (error) {
    console.error("Failed to delete user:", error);
    throw error;
  }
}
