
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoutes({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) return <p>Loading...</p>;

  if (!user) {
    // not logged in  go to login
    return <Navigate to="/login" />;
  }

  if (roles && !roles.includes(user.role)) {
    // logged in but wrong role  show unauthorized page or redirect
    return <Navigate to="/" />;
  }

  return children;
}