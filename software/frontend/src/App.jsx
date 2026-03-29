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
import ProtectedRoutes from "./app/routes/ProtectedRoutes";
import APIDocumentation from "./app/pages/APIDocumentation";


function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Header />

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/api-docs" element={<APIDocumentation />} />


          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoutes>
                <DataDashboard />
              </ProtectedRoutes>
            }
          />

          <Route
            path="/download"
            element={
              <ProtectedRoutes>
                <Download />
              </ProtectedRoutes>
            }
          />

          <Route
            path="/private-sensors"
            element={
              <ProtectedRoutes roles={["private_owner", "admin"]}>
                <PrivateSensor />
              </ProtectedRoutes>
            }
          />

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
          

          <Route
            path="/profile"
            element={
              <ProtectedRoutes>
                <UserProfile />
              </ProtectedRoutes>
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