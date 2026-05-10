import React, { createContext, useContext, useState, useEffect } from "react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "/backend/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  const [error, setError] = useState(null);

  // Load user and token from localStorage on mount/refresh
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const savedToken = localStorage.getItem("token");
    
    if (savedUser && savedToken) {
      try {
        setUser(JSON.parse(savedUser));
        setToken(savedToken);
      } catch (err) {
        console.error("Failed to parse saved user:", err);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
    }
    setLoading(false);
  }, []);

  // Save user and token to localStorage
  const saveSession = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", authToken);
  };

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

      saveSession(userData, access_token);
      return true;
    } catch (err) {
      const errorMessage = err.message || "Login error";
      setError(errorMessage);
      console.error("Login error:", err);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setError(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

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
        
        // Extract detailed error message from backend validation
        let errorMessage = "Registration failed";
        
        if (errorData.message) {
          errorMessage = errorData.message;
        }
        
        // If there's a detailed errors array, append it
        if (errorData.errors && Array.isArray(errorData.errors)) {
          const detailedErrors = errorData.errors
            .map((err) => `${err.field}: ${Object.values(err.errors || {}).join(", ")}`)
            .join("; ");
          if (detailedErrors) {
            errorMessage = detailedErrors;
          }
        }
        
        console.error("Backend error details:", errorData);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const { user: userData, access_token } = data;

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
        logout();
        return false;
      }

      return true;
    } catch (err) {
      console.error("Token validation error:", err);
      logout();
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