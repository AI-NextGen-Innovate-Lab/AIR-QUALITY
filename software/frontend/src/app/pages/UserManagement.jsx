import React, { useEffect, useState } from "react";
import { getUsersApi } from "@/app/lib/api/users";
import { Trash2, Plus, Edit2, Check, X } from "lucide-react";

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "USER",
  });

  // Fetch users on mount
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getUsersApi.getAllUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load users");
      console.error("Error loading users:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      const newUser = await getUsersApi.createUser(formData);
      setUsers((prev) => [newUser, ...prev]);
      setFormData({ name: "", email: "", password: "", role: "USER" });
      setShowCreateForm(false);
      alert("User created successfully!");
    } catch (err) {
      setError(err.message || "Failed to create user");
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      setError(null);
      const updatedUser = await getUsersApi.updateUserRole(userId, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? updatedUser : u))
      );
      setEditingId(null);
    } catch (err) {
      setError(err.message || "Failed to update user role");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) {
      return;
    }
    try {
      setError(null);
      await getUsersApi.deleteUser(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      alert("User deleted successfully!");
    } catch (err) {
      setError(err.message || "Failed to delete user");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Create User Form */}
      {showCreateForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Create New User</h3>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleInputChange}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleInputChange}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="password"
                name="password"
                placeholder="Password (min 8 chars, uppercase, lowercase, number, special char)"
                value={formData.password}
                onChange={handleInputChange}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="USER">User</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Create User
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Create Button */}
      {!showCreateForm && (
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus size={18} />
          Add New User
        </button>
      )}

      {/* Users Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {user.id}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {user.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {editingId === user.id ? (
                        <div className="flex gap-2 items-center">
                          <select
                            value={formData.role}
                            onChange={handleInputChange}
                            name="role"
                            className="px-2 py-1 border border-gray-300 rounded text-sm"
                          >
                            <option value="USER">User</option>
                            <option value="ADMIN">Admin</option>
                            <option value="OWNER">Owner</option>
                          </select>
                          <button
                            onClick={() =>
                              handleUpdateRole(user.id, formData.role)
                            }
                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                            title="Save"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                            title="Cancel"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                              user.role === "ADMIN"
                                ? "bg-purple-100 text-purple-800"
                                : user.role === "OWNER"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {user.role}
                          </span>
                          <button
                            onClick={() => {
                              setEditingId(user.id);
                              setFormData({ ...formData, role: user.role });
                            }}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="Edit role"
                          >
                            <Edit2 size={16} />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                        title="Delete user"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default UserManagement;
