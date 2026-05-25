import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { fetchMyProfile } from "@/app/lib/api/profile";

const API_BASE_URL = import.meta.env.VITE_API_URL || "/backend/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  const [error, setError] = useState(null);

  const clearSession = useCallback(() => {
    setUserState(null);
    setToken(null);
    setError(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  }, []);

  const saveSession = useCallback((userData, authToken) => {
    setUserState(userData);
    setToken(authToken);
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", authToken);
  }, []);

  const setUser = useCallback((userData) => {
    setUserState(userData);
    if (userData) {
      localStorage.setItem("user", JSON.stringify(userData));
    } else {
      localStorage.removeItem("user");
    }
  }, []);

  // Restore session: validate JWT, then refresh profile from API
  useEffect(() => {
    let cancelled = false;

    async function initSession() {
      const savedToken = localStorage.getItem("token");
      const savedUser = localStorage.getItem("user");

      if (!savedToken) {
        if (savedUser) localStorage.removeItem("user");
        if (!cancelled) setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/auth/validate-token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: savedToken }),
        });

        if (!res.ok) {
          clearSession();
          if (!cancelled) setLoading(false);
          return;
        }

        if (!cancelled) setToken(savedToken);

        try {
          const profile = await fetchMyProfile();
          if (!cancelled) {
            saveSession(profile, savedToken);
          }
        } catch (profileErr) {
          console.warn("Profile refresh failed:", profileErr);
          if (savedUser && !cancelled) {
            try {
              setUserState(JSON.parse(savedUser));
            } catch {
              clearSession();
            }
          }
        }
      } catch (err) {
        console.error("Session init failed:", err);
        clearSession();
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    initSession();
    return () => {
      cancelled = true;
    };
  }, [clearSession, saveSession]);

  const login = async (email, password) => {
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Login failed");
      }

      const data = await response.json();
      const { user: userData, access_token } = data;

      if (!access_token) {
        throw new Error("Login succeeded but no access token was returned");
      }

      saveSession(userData, access_token);
      return true;
    } catch (err) {
      const errorMessage = err.message || "Login error";
      setError(errorMessage);
      console.error("Login error:", err);
      return false;
    }
  };

  const logout = clearSession;

  const register = async (name, email, password) => {
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        let errorMessage = "Registration failed";

        if (errorData.message) {
          errorMessage = errorData.message;
        }

        if (errorData.errors && Array.isArray(errorData.errors)) {
          const detailedErrors = errorData.errors
            .map((err) => `${err.field}: ${Object.values(err.errors || {}).join(", ")}`)
            .join("; ");
          if (detailedErrors) {
            errorMessage = detailedErrors;
          }
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();
      const { user: userData, access_token } = data;

      if (!access_token) {
        throw new Error("Registration succeeded but no access token was returned");
      }

      saveSession(userData, access_token);
      return true;
    } catch (err) {
      const errorMessage = err.message || "Registration error";
      setError(errorMessage);
      console.error("Registration error:", err);
      return false;
    }
  };

  const validateToken = async (authToken) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/validate-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: authToken }),
      });

      if (!response.ok) {
        clearSession();
        return false;
      }

      return true;
    } catch (err) {
      console.error("Token validation error:", err);
      clearSession();
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        token,
        error,
        login,
        logout,
        register,
        validateToken,
        setUser,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
