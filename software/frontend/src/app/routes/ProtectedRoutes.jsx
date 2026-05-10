
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Component to protect routes and enforce role-based access control
 * 
 * @param {React.ReactNode} children - The component to render if authorized
 * @param {string[]} roles - Array of allowed roles (case-insensitive, e.g., ["admin", "owner"])
 * @param {string} fallbackRoute - Route to redirect to if user lacks permission (default: "/")
 */
export default function ProtectedRoutes({ 
  children, 
  roles, 
  fallbackRoute = "/" 
}) {
  const { user, loading } = useAuth();

  if (loading) return <p>Loading...</p>;

  if (!user) {
    // Not logged in, redirect to login
    return <Navigate to="/login" />;
  }

  // If specific roles are required, check if user has permission
  if (roles && roles.length > 0) {
    // Normalize user role to lowercase for comparison
    const normalizedUserRole = user.role?.toLowerCase() || "user";
    const normalizedAllowedRoles = roles.map((role) => role.toLowerCase());

    if (!normalizedAllowedRoles.includes(normalizedUserRole)) {
      // User doesn't have required role, redirect to fallback route
      return <Navigate to={fallbackRoute} />;
    }
  }

  return children;
}