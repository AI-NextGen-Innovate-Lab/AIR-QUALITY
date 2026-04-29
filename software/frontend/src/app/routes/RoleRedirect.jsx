import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Component to redirect users to their role-specific dashboard
 * USER role -> /user-dashboard (Data Dashboard with Home, Map, API)
 * ADMIN role -> /admin (Admin Dashboard)
 * OWNER role -> /private-sensors (Private Sensor Owner Dashboard)
 */
export default function RoleRedirect() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      navigate("/login");
      return;
    }

    // Normalize role to lowercase for comparison
    const normalizedRole = user.role?.toLowerCase() || "user";

    // Redirect based on role
    switch (normalizedRole) {
      case "admin":
        navigate("/admin");
        break;
      case "owner":
        navigate("/private-sensors");
        break;
      case "user":
      default:
        navigate("/user-dashboard");
        break;
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Redirecting to your dashboard...</p>
    </div>
  );
}
