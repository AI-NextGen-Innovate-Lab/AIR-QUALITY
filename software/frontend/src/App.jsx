import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider } from './app/context/AuthContext';
import { ThemedToaster } from './app/components/ThemedToaster';
import AppShell from './app/components/layout/AppShell';

import HomePage from './app/pages/HomePage';
import MapPage from './app/pages/MapPage';
import LoginPage from './app/pages/LoginPage';
import DataDashboard from './app/pages/DataDashboard';
import Download from './app/pages/Download';
import PrivateSensor from './app/pages/PrivateSensor';
import AdminPanel from './app/pages/AdminPanel';
import SensorStatus from './app/pages/SensorStatus';
import UserProfile from './app/pages/UserProfile';
import LocationDetails from './app/pages/LocationDetails';
import APIDocumentation from './app/pages/APIDocumentation';
import ApiAccess from './app/pages/ApiAccess';

import ProtectedRoutes from './app/routes/ProtectedRoutes';
import RoleRedirect from './app/routes/RoleRedirect';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ThemedToaster />
        <Routes>
          <Route element={<AppShell />}>
            {/* Public */}
            <Route path="/" element={<HomePage />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/api-docs" element={<APIDocumentation />} />
            <Route path="/sensor/:sensorId" element={<LocationDetails />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoutes>
                  <RoleRedirect />
                </ProtectedRoutes>
              }
            />

            <Route
              path="/user-dashboard"
              element={
                <ProtectedRoutes roles={['user', 'owner']}>
                  <DataDashboard />
                </ProtectedRoutes>
              }
            />

            <Route
              path="/api-access"
              element={
                <ProtectedRoutes roles={['user', 'owner']}>
                  <ApiAccess />
                </ProtectedRoutes>
              }
            />

            <Route
              path="/download"
              element={
                <ProtectedRoutes roles={['user', 'owner']}>
                  <Download />
                </ProtectedRoutes>
              }
            />

            <Route
              path="/admin"
              element={
                <ProtectedRoutes roles={['admin']}>
                  <AdminPanel />
                </ProtectedRoutes>
              }
            />

            <Route
              path="/sensor-status"
              element={
                <ProtectedRoutes roles={['admin']}>
                  <SensorStatus />
                </ProtectedRoutes>
              }
            />

            <Route
              path="/private-sensors"
              element={
                <ProtectedRoutes roles={['owner']}>
                  <PrivateSensor />
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

            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
