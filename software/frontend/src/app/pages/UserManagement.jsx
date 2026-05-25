import React, { useEffect, useState } from 'react';
import { getUsersApi } from '@/app/lib/api/users';
import { Trash2, Plus, Edit2, Check, X } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { LoadingBlock } from '@/app/components/data/DataState';
import { inputClass, selectClass, labelClass, panelClass } from '@/app/lib/dashboardStyles';
import { cn } from '@/app/lib/utils/cn';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'USER',
  });

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
      setError(err.message || 'Failed to load users');
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      const newUser = await getUsersApi.createUser(formData);
      setUsers((prev) => [newUser, ...prev]);
      setFormData({ name: '', email: '', password: '', role: 'USER' });
      setShowCreateForm(false);
      alert('User created successfully!');
    } catch (err) {
      setError(err.message || 'Failed to create user');
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      setError(null);
      const updatedUser = await getUsersApi.updateUserRole(userId, newRole);
      setUsers((prev) => prev.map((u) => (u.id === userId ? updatedUser : u)));
      setEditingId(null);
    } catch (err) {
      setError(err.message || 'Failed to update user role');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      setError(null);
      await getUsersApi.deleteUser(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      alert('User deleted successfully!');
    } catch (err) {
      setError(err.message || 'Failed to delete user');
    }
  };

  if (loading) {
    return <LoadingBlock message="Loading users…" />;
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl border border-aqi-unhealthy/30 bg-aqi-unhealthy-soft/30 px-4 py-3 text-sm text-aqi-unhealthy">
          {error}
        </div>
      )}

      {showCreateForm && (
        <div className={cn(panelClass, 'p-6')}>
          <h3 className="mb-4 text-lg font-semibold text-foreground">Create new user</h3>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <input
                type="text"
                name="name"
                placeholder="Full name"
                value={formData.name}
                onChange={handleInputChange}
                className={inputClass}
                required
              />
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleInputChange}
                className={inputClass}
                required
              />
              <input
                type="password"
                name="password"
                placeholder="Password (min 8 chars, mixed case, number, special)"
                value={formData.password}
                onChange={handleInputChange}
                className={inputClass}
                required
              />
              <div>
                <label className={labelClass}>Role</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className={selectClass}
                >
                  <option value="USER">User</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit">Create user</Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowCreateForm(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {!showCreateForm && (
        <Button type="button" onClick={() => setShowCreateForm(true)}>
          <Plus size={18} />
          Add new user
        </Button>
      )}

      <div className={cn(panelClass, 'overflow-hidden')}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-surface">
              <tr>
                {['ID', 'Name', 'Email', 'Role', 'Actions'].map((h) => (
                  <th
                    key={h}
                    className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-surface transition-colors">
                    <td className="px-6 py-4 text-foreground">{user.id}</td>
                    <td className="px-6 py-4 text-foreground">{user.name}</td>
                    <td className="px-6 py-4 text-muted">{user.email}</td>
                    <td className="px-6 py-4">
                      {editingId === user.id ? (
                        <div className="flex items-center gap-2">
                          <select
                            value={formData.role}
                            onChange={handleInputChange}
                            name="role"
                            className={cn(selectClass, 'w-auto py-1')}
                          >
                            <option value="USER">User</option>
                            <option value="ADMIN">Admin</option>
                            <option value="OWNER">Owner</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => handleUpdateRole(user.id, formData.role)}
                            className="p-1 text-aqi-good hover:bg-aqi-good-soft rounded"
                            title="Save"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="p-1 text-muted hover:bg-surface rounded"
                            title="Cancel"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              'inline-block rounded-full px-3 py-1 text-xs font-medium',
                              user.role === 'ADMIN'
                                ? 'bg-brand-50 text-brand-800'
                                : user.role === 'OWNER'
                                  ? 'bg-aqi-unhealthy-soft text-aqi-unhealthy'
                                  : 'bg-surface text-foreground border border-border'
                            )}
                          >
                            {user.role}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(user.id);
                              setFormData({ ...formData, role: user.role });
                            }}
                            className="p-1 text-brand-700 hover:bg-brand-50 rounded"
                            title="Edit role"
                          >
                            <Edit2 size={16} />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => handleDeleteUser(user.id)}
                        className="rounded p-2 text-aqi-unhealthy transition hover:bg-aqi-unhealthy-soft"
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
