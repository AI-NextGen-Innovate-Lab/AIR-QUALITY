import React, { useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { User, Mail, Shield, Key, Bell } from "lucide-react";
import { toast } from "sonner";

function panel() {
  return "rounded-xl border border-gray-100 bg-white p-6 shadow-sm";
}

function labelCls() {
  return "block text-sm font-medium text-gray-700";
}

function inputCls() {
  return "mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";
}

function tabBtn(active) {
  return `rounded-lg px-4 py-2 text-sm font-medium ${
    active ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
  }`;
}

function btnPrimary() {
  return "rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700";
}

function btnOutline() {
  return "rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50";
}

export default function UserProfile() {
  const { user, switchRole } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [tab, setTab] = useState("profile");

  const handleSaveProfile = () => {
    toast.success("Profile updated (demo only — not persisted)");
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className={`${panel()} max-w-md text-center`}>
          <p className="text-gray-600">Please log in to view your profile</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Profile settings</h1>
          <p className="text-gray-600">Manage your demo account (client-side auth only)</p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className={`${panel()} lg:col-span-1`}>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-400">
                <span className="text-3xl font-bold text-white">
                  {user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </span>
              </div>
              <h3 className="mb-1 text-lg font-semibold text-gray-900">{user.name}</h3>
              <p className="mb-3 text-sm text-gray-600">{user.email}</p>
              <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-medium capitalize text-blue-800">
                {user.role.replace("_", " ")}
              </span>

              <div className="mt-6 rounded-lg bg-blue-50 p-4 text-left">
                <p className="mb-2 text-xs font-semibold text-blue-900">Demo: switch role</p>
                <div className="space-y-2">
                  {["public", "registered", "private_owner", "admin"].map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => switchRole(role)}
                      className={`w-full rounded px-3 py-2 text-left text-sm transition-colors ${
                        user.role === role
                          ? "bg-blue-500 text-white"
                          : "bg-white text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {role.replace("_", " ").replace(/^\w/, (c) => c.toUpperCase())}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="mb-4 flex flex-wrap gap-2 border-b border-gray-200 pb-3">
              {[
                { id: "profile", label: "Profile" },
                { id: "security", label: "Security" },
                { id: "notifications", label: "Notifications" },
                { id: "api", label: "API access" },
              ].map((t) => (
                <button key={t.id} type="button" className={tabBtn(tab === t.id)} onClick={() => setTab(t.id)}>
                  {t.label}
                </button>
              ))}
            </div>

            {tab === "profile" && (
              <div className={panel()}>
                <h3 className="mb-4 text-lg font-semibold">Personal information</h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className={labelCls()}>
                      Full name
                    </label>
                    <div className="relative mt-1">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className={`${inputCls()} pl-10`}
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="email" className={labelCls()}>
                      Email
                    </label>
                    <div className="relative mt-1">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={`${inputCls()} pl-10`}
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="role" className={labelCls()}>
                      Role
                    </label>
                    <div className="relative mt-1">
                      <Shield className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <input
                        id="role"
                        readOnly
                        value={
                          user.role.replace("_", " ").replace(/^\w/, (c) => c.toUpperCase())
                        }
                        className={`${inputCls()} cursor-not-allowed bg-gray-50 pl-10`}
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Use the demo role switcher to change role.</p>
                  </div>
                  <button type="button" className={`${btnPrimary()} w-full`} onClick={handleSaveProfile}>
                    Save changes
                  </button>
                </div>
              </div>
            )}

            {tab === "security" && (
              <div className={panel()}>
                <h3 className="mb-4 text-lg font-semibold">Security</h3>
                <p className="text-sm text-gray-600">
                  Password and session management are not wired to this demo backend.
                </p>
                <div className="mt-6 space-y-3">
                  <div>
                    <label className={labelCls()}>Current password</label>
                    <input type="password" placeholder="••••••••" className={inputCls()} disabled />
                  </div>
                  <button type="button" className={`${btnOutline()} w-full`} disabled>
                    Update password (not available)
                  </button>
                </div>
              </div>
            )}

            {tab === "notifications" && (
              <div className={panel()}>
                <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                  <Bell className="h-5 w-5" />
                  Notifications
                </h3>
                <p className="mb-4 text-sm text-gray-600">
                  Preferences are not persisted. Toggle UI only.
                </p>
                {[
                  ["Email notifications", true],
                  ["Air quality alerts", true],
                  ["Weekly reports", false],
                ].map(([label, defaultOn]) => (
                  <label
                    key={label}
                    className="mb-3 flex cursor-pointer items-center justify-between border-b border-gray-100 py-2"
                  >
                    <span className="text-sm font-medium text-gray-800">{label}</span>
                    <input type="checkbox" defaultChecked={defaultOn} className="h-4 w-4 rounded border-gray-300" />
                  </label>
                ))}
              </div>
            )}

            {tab === "api" && (
              <div className={panel()}>
                <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                  <Key className="h-5 w-5" />
                  API access
                </h3>
                {user.role === "registered" || user.role === "private_owner" || user.role === "admin" ? (
                  <div className="space-y-4 text-sm text-gray-700">
                    <p>
                      The monitoring API is <code className="rounded bg-gray-100 px-1">GET /api/readings</code> and{" "}
                      <code className="rounded bg-gray-100 px-1">GET /api/health</code>. Keys are not issued through
                      this UI; configure <code className="rounded bg-gray-100 px-1">VITE_API_URL</code> or the Vite
                      proxy for the frontend.
                    </p>
                    <p className="text-xs text-gray-500">
                      InfluxDB credentials stay on the server via environment variables.
                    </p>
                  </div>
                ) : (
                  <div className="py-8 text-center text-gray-600">
                    <Key className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                    <p>API documentation is available after registering (demo role).</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
