import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

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
import ProtectedRoute from "./app/routes/ProtectedRoute";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Header />

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DataDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/download"
            element={
              <ProtectedRoute>
                <Download />
              </ProtectedRoute>
            }
          />

          <Route
            path="/private-sensors"
            element={
              <ProtectedRoute roles={["private_owner", "admin"]}>
                <PrivateSensor />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminPanel />
              </ProtectedRoute>
            }
          />

          <Route
            path="/sensor-status"
            element={
              <ProtectedRoute roles={["admin"]}>
                <SensorStatus />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            }
          />

          {/* Dynamic route */}
          <Route path="/sensor/:sensorId" element={<LocationDetails />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;