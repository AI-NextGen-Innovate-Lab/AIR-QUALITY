import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Edit2, RadioTower, Globe, Lock } from 'lucide-react';
import { toast } from 'sonner';
import {
  fetchAvailableSensors,
  createSensor,
  updateSensor,
  deleteSensor,
} from '@/app/lib/api/sensors';
import { getUsersApi } from '@/app/lib/api/users';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { LoadingBlock } from '@/app/components/data/DataState';
import { inputClass, selectClass, labelClass } from '@/app/lib/dashboardStyles';
import { cn } from '@/app/lib/utils/cn';

const HOUR_OPTIONS = [
  { value: 24, label: 'Last 24 hours' },
  { value: 168, label: 'Last 7 days' },
  { value: 720, label: 'Last 30 days' },
];

const emptyForm = {
  topic: '',
  label: '',
  latitude: '',
  longitude: '',
  visibility: 'PUBLIC',
  ownerId: '',
};

export default function SensorManagement() {
  const queryClient = useQueryClient();
  const [hours, setHours] = useState(168);
  const [filter, setFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [privateOwnerByTopic, setPrivateOwnerByTopic] = useState({});

  const sensorsQuery = useQuery({
    queryKey: ['sensors', 'available', hours],
    queryFn: () => fetchAvailableSensors(hours),
  });

  const ownersQuery = useQuery({
    queryKey: ['users', 'owners'],
    queryFn: async () => {
      const users = await getUsersApi.getAllUsers();
      return (users || []).filter((u) => u.role === 'OWNER');
    },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['sensors'] });
  };

  const createMutation = useMutation({
    mutationFn: createSensor,
    onSuccess: () => {
      toast.success('Sensor registered');
      invalidate();
      setShowForm(false);
      setForm(emptyForm);
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateSensor(id, payload),
    onSuccess: () => {
      toast.success('Sensor updated');
      invalidate();
      setEditingId(null);
      setForm(emptyForm);
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSensor,
    onSuccess: () => {
      toast.success('Sensor removed from registry');
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const owners = ownersQuery.data ?? [];

  const filteredSensors = useMemo(() => {
    const rows = sensorsQuery.data ?? [];
    if (filter === 'unregistered') return rows.filter((s) => !s.registered);
    if (filter === 'registered') return rows.filter((s) => s.registered);
    return rows;
  }, [sensorsQuery.data, filter]);

  const startEdit = (sensor) => {
    if (!sensor.id) return;
    setEditingId(sensor.id);
    setForm({
      topic: sensor.topic,
      label: sensor.label || '',
      latitude: sensor.latitude ?? '',
      longitude: sensor.longitude ?? '',
      visibility: sensor.visibility || 'PUBLIC',
      ownerId: sensor.ownerId ?? '',
    });
    setShowForm(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      topic: form.topic.trim(),
      label: form.label.trim() || undefined,
      latitude: form.latitude === '' ? undefined : Number(form.latitude),
      longitude: form.longitude === '' ? undefined : Number(form.longitude),
      visibility: form.visibility,
      ownerId: form.ownerId === '' ? null : Number(form.ownerId),
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const markVisibility = (sensor, visibility) => {
    if (visibility === 'PRIVATE') {
      const ownerId = privateOwnerByTopic[sensor.topic] || sensor.ownerId;
      if (!ownerId) {
        toast.error('Select a sensor owner before marking as private');
        return;
      }
      if (sensor.registered && sensor.id) {
        updateMutation.mutate({
          id: sensor.id,
          payload: { visibility: 'PRIVATE', ownerId: Number(ownerId) },
        });
      } else {
        createMutation.mutate({
          topic: sensor.topic,
          visibility: 'PRIVATE',
          ownerId: Number(ownerId),
        });
      }
      return;
    }

    if (sensor.registered && sensor.id) {
      updateMutation.mutate({
        id: sensor.id,
        payload: { visibility: 'PUBLIC', ownerId: null },
      });
    } else {
      createMutation.mutate({ topic: sensor.topic, visibility: 'PUBLIC' });
    }
  };

  if (sensorsQuery.isLoading) {
    return <LoadingBlock message="Loading sensors from Influx…" />;
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">
        View all topics reporting to Influx, register them, and mark each as public or private.
        Administrators see metadata only — private measurements stay hidden.
      </p>

      <div className="flex flex-wrap items-end gap-4 rounded-xl border border-border bg-surface p-4">
        <div>
          <label className={labelClass}>Activity window</label>
          <select
            className={cn(selectClass, 'mt-1 min-w-[10rem]')}
            value={hours}
            onChange={(e) => setHours(Number(e.target.value))}
          >
            {HOUR_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Show</label>
          <select
            className={cn(selectClass, 'mt-1 min-w-[10rem]')}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All sensors</option>
            <option value="unregistered">Unregistered only</option>
            <option value="registered">Registered only</option>
          </select>
        </div>
        <div className="ml-auto text-sm text-muted">
          {filteredSensors.length} sensor{filteredSensors.length === 1 ? '' : 's'}
        </div>
      </div>

      {(showForm || editingId) && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-surface p-6 space-y-4">
          <h4 className="font-semibold text-foreground">
            {editingId ? 'Edit sensor' : 'Register sensor manually'}
          </h4>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className={labelClass}>MQTT topic / Influx id</label>
              <input
                className={cn(inputClass, 'mt-1')}
                value={form.topic}
                onChange={(e) => setForm({ ...form, topic: e.target.value })}
                required
                disabled={!!editingId}
              />
            </div>
            <div>
              <label className={labelClass}>Label</label>
              <input
                className={cn(inputClass, 'mt-1')}
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                placeholder="e.g. Kinondoni Station A"
              />
            </div>
            <div>
              <label className={labelClass}>Latitude</label>
              <input
                type="number"
                step="any"
                className={cn(inputClass, 'mt-1')}
                value={form.latitude}
                onChange={(e) => setForm({ ...form, latitude: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass}>Longitude</label>
              <input
                type="number"
                step="any"
                className={cn(inputClass, 'mt-1')}
                value={form.longitude}
                onChange={(e) => setForm({ ...form, longitude: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass}>Visibility</label>
              <select
                className={cn(selectClass, 'mt-1')}
                value={form.visibility}
                onChange={(e) => setForm({ ...form, visibility: e.target.value })}
              >
                <option value="PUBLIC">Public</option>
                <option value="PRIVATE">Private</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Sensor owner</label>
              <select
                className={cn(selectClass, 'mt-1')}
                value={form.ownerId}
                onChange={(e) => setForm({ ...form, ownerId: e.target.value })}
                required={form.visibility === 'PRIVATE'}
              >
                <option value="">— Unassigned —</option>
                {owners.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name} ({o.email})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {editingId ? 'Save changes' : 'Register sensor'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
                setForm(emptyForm);
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      {!showForm && !editingId && (
        <Button type="button" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4" />
          Register manually
        </Button>
      )}

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-surface text-left text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Topic</th>
              <th className="px-4 py-3 font-medium">Last seen</th>
              <th className="px-4 py-3 font-medium">Registry</th>
              <th className="px-4 py-3 font-medium">Visibility</th>
              <th className="px-4 py-3 font-medium">Owner</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {!filteredSensors.length ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted">
                  No sensors found for this window.
                </td>
              </tr>
            ) : (
              filteredSensors.map((sensor) => (
                <tr key={sensor.topic} className="hover:bg-surface">
                  <td className="px-4 py-3 font-mono text-xs text-foreground max-w-[14rem] truncate" title={sensor.topic}>
                    {sensor.label ? (
                      <>
                        <span className="block font-sans text-sm text-foreground">{sensor.label}</span>
                        <span className="text-muted">{sensor.topic}</span>
                      </>
                    ) : (
                      sensor.topic
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">
                    {sensor.lastSeen
                      ? new Date(sensor.lastSeen).toLocaleString()
                      : 'No recent data'}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={sensor.registered ? 'default' : 'outline'}>
                      {sensor.registered ? 'Registered' : 'Available'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {sensor.registered ? (
                      <Badge variant={sensor.visibility === 'PRIVATE' ? 'secondary' : 'default'}>
                        {sensor.visibility}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted">Unregistered (public)</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted text-xs min-w-[10rem]">
                    {sensor.owner ? (
                      <span>
                        {sensor.owner.name}
                        <span className="block">{sensor.owner.email}</span>
                      </span>
                    ) : (
                      <select
                        className={cn(selectClass, 'py-1 text-xs')}
                        value={privateOwnerByTopic[sensor.topic] ?? ''}
                        onChange={(e) =>
                          setPrivateOwnerByTopic((prev) => ({
                            ...prev,
                            [sensor.topic]: e.target.value,
                          }))
                        }
                      >
                        <option value="">Assign owner…</option>
                        {owners.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant={sensor.visibility === 'PUBLIC' && sensor.registered ? 'default' : 'secondary'}
                        onClick={() => markVisibility(sensor, 'PUBLIC')}
                        disabled={createMutation.isPending || updateMutation.isPending}
                        title="Mark public"
                      >
                        <Globe className="h-3.5 w-3.5" />
                        Public
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={sensor.visibility === 'PRIVATE' ? 'default' : 'secondary'}
                        onClick={() => markVisibility(sensor, 'PRIVATE')}
                        disabled={createMutation.isPending || updateMutation.isPending}
                        title="Mark private"
                      >
                        <Lock className="h-3.5 w-3.5" />
                        Private
                      </Button>
                      {sensor.registered && sensor.id && (
                        <>
                          <button
                            type="button"
                            onClick={() => startEdit(sensor)}
                            className="rounded p-2 text-brand-700 hover:bg-brand-50"
                            title="Edit details"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Remove ${sensor.topic} from registry?`)) {
                                deleteMutation.mutate(sensor.id);
                              }
                            }}
                            className="rounded p-2 text-aqi-unhealthy hover:bg-aqi-unhealthy-soft"
                            title="Remove from registry"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-border bg-surface p-4 text-sm text-muted">
        <RadioTower className="h-5 w-5 shrink-0 text-brand-700" />
        <p>
          <strong>Available</strong> sensors are topics seen in Influx but not yet in the registry.
          Marking them public or private registers them automatically. Unregistered topics remain publicly readable until registered as private.
        </p>
      </div>
    </div>
  );
}
