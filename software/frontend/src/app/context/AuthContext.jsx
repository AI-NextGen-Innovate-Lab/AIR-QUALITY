import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  //  Load user from localStorage on refresh
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  //  Save user to localStorage
  const saveUser = (userData) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const login = async (email, password) => {
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (email === "admin@airquality.tz") {
      saveUser({
        id: "1",
        name: "Admin User",
        email,
        role: "admin",
        verified: true,
      });
      return true;
    } else if (email === "owner@company.com") {
      saveUser({
        id: "2",
        name: "Sensor Owner",
        email,
        role: "private_owner",
        verified: true,
      });
      return true;
    } else if (email.includes("@")) {
      saveUser({
        id: "3",
        name: "Data User",
        email,
        role: "registered",
        verified: true,
      });
      return true;
    }

    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  const register = async (name, email, password) => {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const newUser = {
      id: Date.now().toString(),
      name,
      email,
      role: "registered",
      verified: false,
    };

    saveUser(newUser);
    return true;
  };

  const verifyEmail = async (code) => {
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (user && code === "123456") {
      const updatedUser = { ...user, verified: true };
      saveUser(updatedUser);
      return true;
    }

    return false;
  };

  const switchRole = (role) => {
    if (user) {
      const updatedUser = { ...user, role };
      saveUser(updatedUser);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout, register, verifyEmail, switchRole }}
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