import React, { useEffect, useState } from "react";
import { Users, Activity, AlertCircle, Settings, Trash2, Edit2, Plus, X } from "lucide-react";
import { fetchHealth, fetchReadings, fetchUsers, createUser, updateUser, deleteUser } from "@/app/lib/api";
import { groupReadingsBySensor } from "@/app/lib/sensorData";
import {
  averageAqiFromSensors,
  totalReadingCount,
} from "@/app/lib/admin/adminMetrics";

function panel() {
  return "rounded-xl border border-gray-100 bg-white p-6 shadow-sm";
}

function tabBtn(active) {
  return `rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap ${
    active ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
  }`;
}

function pill(text, variant = "neutral") {
  const cls =
    variant === "ok"
      ? "bg-green-100 text-green-800"
      : variant === "warn"
        ? "bg-amber-100 text-amber-800"
        : "bg-gray-100 text-gray-800";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {text}
    </span>
  );
}

export default function AdminPanel() {
  const [tab, setTab] = useState("overview");
  const [health, setHealth] = useState(null);
  const [readError, setReadError] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState(null);
  
  // Add user modal state
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [addUserLoading, setAddUserLoading] = useState(false);
  const [addUserError, setAddUserError] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "USER",
  });
  
  // Edit role modal state
  const [editingUserId, setEditingUserId] = useState(null);
  const [editingRole, setEditingRole] = useState(null);
  const [editRoleLoading, setEditRoleLoading] = useState(false);
  const [editRoleError, setEditRoleError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      fetchHealth().catch(() => null),
      fetchReadings({ limit: 3000, page: 1, hours: 24 }).catch((e) => {
        if (!cancelled) setReadError(e.message);
        return { data: [] };
      }),
    ]).then(([h, json]) => {
      if (cancelled) return;
      setHealth(h);
      setRows(json.data || []);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (tab === "users") {
      let cancelled = false;
      setUsersLoading(true);
      setUsersError(null);
      fetchUsers()
        .then((data) => {
          if (!cancelled) {
            setUsers(data);
            setUsersLoading(false);
          }
        })
        .catch((error) => {
          if (!cancelled) {
            setUsersError(error.message);
            setUsersLoading(false);
          }
        });
      return () => {
        cancelled = true;
      };
    }
  }, [tab]);

  const handleAddUser = async (e) => {
    e.preventDefault();
    setAddUserLoading(true);
    setAddUserError(null);
    
    try {
      await createUser(formData);
      setFormData({ name: "", email: "", password: "", role: "USER" });
      setShowAddUserModal(false);
      
      // Refresh users list
      const updatedUsers = await fetchUsers();
      setUsers(updatedUsers);
    } catch (error) {
      setAddUserError(error.message);
    } finally {
      setAddUserLoading(false);
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    setEditRoleLoading(true);
    setEditRoleError(null);
    
    try {
      await updateUser(userId, { role: newRole });
      
      // Update local state
      setUsers(users.map((user) => 
        user.id === userId ? { ...user, role: newRole } : user
      ));
      
      setEditingUserId(null);
      setEditingRole(null);
    } catch (error) {
      setEditRoleError(error.message);
    } finally {
      setEditRoleLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm("Are you sure you want to delete this user?")) {
      return;
    }
    
    try {
      await deleteUser(userId);
      setUsers(users.filter((user) => user.id !== userId));
    } catch (error) {
      alert(`Failed to delete user: ${error.message}`);
    }
  };

  const sensorsGrouped = groupReadingsBySensor(rows);
  const cityAqi = averageAqiFromSensors(sensorsGrouped);
  const readingCount = totalReadingCount(rows);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin panel</h1>
         
        </div>

        <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-4">
          <div className={panel()}>
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <Activity className="h-5 w-5 text-blue-600" />
              </div>
              <span className="text-sm text-gray-600">Topics (24h)</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {loading ? "…" : sensorsGrouped.length}
            </div>
            <div className="mt-1 text-xs text-gray-500">Distinct Influx topics</div>
          </div>

          <div className={panel()}>
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <span className="text-sm text-gray-600">Rows loaded</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {loading ? "…" : readingCount}
            </div>
            <div className="mt-1 text-xs text-gray-500">Sample (limit 3000)</div>
          </div>

          <div className={panel()}>
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              </div>
              <span className="text-sm text-gray-600">Pending requests</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">—</div>
            <div className="mt-1 text-xs text-gray-500">No backend endpoint</div>
          </div>

          <div className={panel()}>
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                <Settings className="h-5 w-5 text-purple-600" />
              </div>
              <span className="text-sm text-gray-600">Avg AQI</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {loading ? "…" : Math.round(cityAqi)}
            </div>
            <div className="mt-1 text-xs text-gray-500">From latest PM2.5/PM10</div>
          </div>
        </div>

        {readError && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            Readings: {readError}
          </div>
        )}

        <div className="mb-4 flex flex-wrap gap-2 border-b border-gray-200 pb-3">
          {[
            { id: "overview", label: "Overview" },
            { id: "requests", label: "Pending requests" },
            { id: "users", label: "Users" },
            { id: "api", label: "API keys" },
            { id: "system", label: "System" },
          ].map((t) => (
            <button key={t.id} type="button" className={tabBtn(tab === t.id)} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <div className={panel()}>
            <h3 className="mb-3 text-lg font-semibold">Influx snapshot</h3>
            <ul className="list-inside list-disc space-y-2 text-sm text-gray-700">
              <li>API health: {health?.ok ? "reachable" : "unreachable or error"}</li>
              <li>Server time: {health?.time || "—"}</li>
              <li>Topics with data in the last 24h: {sensorsGrouped.length}</li>
              <li>Rows in this admin sample: {readingCount}</li>
            </ul>
          </div>
        )}

        {tab === "requests" && (
          <div className={panel()}>
            <h3 className="mb-2 text-lg font-semibold">Private sensor requests</h3>
            <p className="mb-4 text-sm text-gray-600">
              There is no POST/approval API in{" "}
              <code className="rounded bg-gray-100 px-1">server.js</code>. Wire this tab to your user
              database when available.
            </p>
            <div className="py-12 text-center text-gray-500">No pending requests</div>
          </div>
        )}

        {tab === "users" && (
          <>
            <div className={panel()}>
              <div className="mb-4 flex items-center justify-between gap-2">
                <h3 className="text-lg font-semibold">User accounts</h3>
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(true)}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  Add user
                </button>
              </div>
              {usersError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    <span>{usersError}</span>
                  </div>
                </div>
              ) : usersLoading ? (
                <div className="py-12 text-center text-gray-500">Loading users...</div>
              ) : users.length === 0 ? (
                <div className="py-12 text-center text-gray-500">No users found</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-gray-200 bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700">ID</th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700">Name</th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700">Email</th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700">Role</th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {users.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-gray-900">{user.id}</td>
                          <td className="px-4 py-2 text-gray-900">{user.name}</td>
                          <td className="px-4 py-2 text-gray-700">{user.email}</td>
                          <td className="px-4 py-2">
                            {editingUserId === user.id ? (
                              <select
                                value={editingRole || user.role}
                                onChange={(e) => setEditingRole(e.target.value)}
                                className="rounded border border-gray-300 px-2 py-1 text-sm"
                              >
                                <option value="USER">USER</option>
                                <option value="ADMIN">ADMIN</option>
                                <option value="OWNER">OWNER</option>
                              </select>
                            ) : (
                              pill(user.role, user.role === "ADMIN" ? "warn" : user.role === "OWNER" ? "ok" : "neutral")
                            )}
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex gap-2">
                              {editingUserId === user.id ? (
                                <>
                                  <button
                                    onClick={() => handleUpdateRole(user.id, editingRole || user.role)}
                                    disabled={editRoleLoading}
                                    className="rounded bg-green-600 px-2 py-1 text-xs text-white hover:bg-green-700 disabled:bg-gray-400"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingUserId(null);
                                      setEditingRole(null);
                                      setEditRoleError(null);
                                    }}
                                    className="rounded bg-gray-400 px-2 py-1 text-xs text-white hover:bg-gray-500"
                                  >
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => {
                                      setEditingUserId(user.id);
                                      setEditingRole(user.role);
                                    }}
                                    className="flex items-center gap-1 rounded bg-blue-100 px-2 py-1 text-xs text-blue-700 hover:bg-blue-200"
                                  >
                                    <Edit2 className="h-3 w-3" />
                                    Role
                                  </button>
                                  <button
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="flex items-center gap-1 rounded bg-red-100 px-2 py-1 text-xs text-red-700 hover:bg-red-200"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                    Delete
                                  </button>
                                </>
                              )}
                            </div>
                            {editRoleError && <div className="mt-1 text-xs text-red-600">{editRoleError}</div>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Add User Modal */}
            {showAddUserModal && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"> 
                <div className={`${panel()} max-w-md w-full mx-4`}>
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Add new user</h3>
                    <button
                      onClick={() => {
                        setShowAddUserModal(false);
                        setAddUserError(null);
                        setFormData({ name: "", email: "", password: "", role: "USER" });
                      }}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  
                  {addUserError && (
                    <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                      {addUserError}
                    </div>
                  )}
                  
                  <form onSubmit={handleAddUser} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                        placeholder="John Doe"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                        placeholder="john@example.com"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Password
                      </label>
                      <input
                        type="password"
                        required
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                        placeholder="Secure password"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Role
                      </label>
                      <select
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      >
                        <option value="USER">User</option>
                        <option value="ADMIN">Admin</option>
                        <option value="OWNER">Owner</option>
                      </select>
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <button
                        type="submit"
                        disabled={addUserLoading}
                        className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-400"
                      >
                        {addUserLoading ? "Creating..." : "Create User"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddUserModal(false);
                          setAddUserError(null);
                          setFormData({ name: "", email: "", password: "", role: "USER" });
                        }}
                        className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </>
        )}

        {tab === "api" && (
          <div className={panel()}>
            <h3 className="mb-2 text-lg font-semibold">API keys</h3>
            <p className="mb-4 text-sm text-gray-600">
              Key management is not implemented on this server. Use Influx tokens and env vars on
              the backend.
            </p>
            <div className="py-12 text-center text-gray-500">No keys exposed here</div>
          </div>
        )}

        {tab === "system" && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className={panel()}>
              <h3 className="mb-4 text-lg font-semibold">Status</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">HTTP API</span>
                  {pill(health?.ok ? "Online" : "Unknown", health?.ok ? "ok" : "warn")}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Readings query</span>
                  {pill(readError ? "Error" : "OK", readError ? "warn" : "ok")}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">InfluxDB</span>
                  {pill(readError ? "Check logs" : "Responding", readError ? "warn" : "ok")}
                </div>
              </div>
            </div>

            <div className={panel()}>
              <h3 className="mb-4 text-lg font-semibold">Activity</h3>
              <div className="space-y-3 text-sm text-gray-700">
                <div className="flex gap-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                  <div>
                    <div>Loaded {readingCount} raw points for admin overview</div>
                    <div className="text-xs text-gray-500">Last refresh on mount</div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-green-500" />
                  <div>
                    <div>{sensorsGrouped.length} topics seen in the rolling window</div>
                    <div className="text-xs text-gray-500">Based on grouped readings</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
