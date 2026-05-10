import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider } from "./app/context/AuthContext";

import HomePage from "./app/pages/HomePage";
import MapPage from "./app/pages/MapPage";
import LoginPage from "./app/pages/LoginPage";
import DataDashboard from "./app/pages/DataDashboard";
import Download from "./app/pages/Download";
import PrivateSensor from "./app/pages/PrivateSensor";
import AdminPanel from "./app/pages/AdminPanel";
import SensorStatus from "./app/pages/SensorStatus";
import UserProfile from "./app/pages/UserProfile";
import LocationDetails from "./app/pages/LocationDetails";

import Header from "./app/components/Header";
import ProtectedRoutes from "./app/routes/ProtectedRoutes";
import RoleRedirect from "./app/routes/RoleRedirect";
import APIDocumentation from "./app/pages/APIDocumentation";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Header />

        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/api-docs" element={<APIDocumentation />} />

          {/* Role-based Dashboard Redirect - Default for authenticated users */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoutes>
                <RoleRedirect />
              </ProtectedRoutes>
            }
          />

          {/* USER Dashboard Routes */}
          <Route
            path="/user-dashboard"
            element={
              <ProtectedRoutes roles={["user"]}>
                <DataDashboard />
              </ProtectedRoutes>
            }
          />

          <Route
            path="/download"
            element={
              <ProtectedRoutes roles={["user"]}>
                <Download />
              </ProtectedRoutes>
            }
          />

          {/* ADMIN Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoutes roles={["admin"]}>
                <AdminPanel />
              </ProtectedRoutes>
            }
          />

          <Route
            path="/sensor-status"
            element={
              <ProtectedRoutes roles={["admin"]}>
                <SensorStatus />
              </ProtectedRoutes>
            }
          />

          {/* OWNER Routes */}
          <Route
            path="/private-sensors"
            element={
              <ProtectedRoutes roles={["owner", "admin"]}>
                <PrivateSensor />
              </ProtectedRoutes>
            }
          />

          {/* Shared Protected Routes */}
          <Route
            path="/profile"
            element={
              <ProtectedRoutes>
                <UserProfile />
              </ProtectedRoutes>
            }
          />

          {/* Dynamic route for sensor details */}
          <Route path="/sensor/:sensorId" element={<LocationDetails />} />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
