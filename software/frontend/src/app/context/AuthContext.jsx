import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const login = async (email, password) => {
    // Mock login - in real app this would call an API
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Demo users
    if (email === 'admin@airquality.tz') {
      setUser({
        id: '1',
        name: 'Admin User',
        email,
        role: 'admin',
        verified: true,
      });
      return true;
    } else if (email === 'owner@company.com') {
      setUser({
        id: '2',
        name: 'Sensor Owner',
        email,
        role: 'private_owner',
        verified: true,
      });
      return true;
    } else if (email.includes('@')) {
      setUser({
        id: '3',
        name: 'Data User',
        email,
        role: 'registered',
        verified: true,
      });
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
  };

  const register = async (name, email, password) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    setUser({
      id: Date.now().toString(),
      name,
      email,
      role: 'registered',
      verified: false,
    });
    return true;
  };

  const verifyEmail = async (code) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    if (user && code === '123456') {
      setUser({ ...user, verified: true });
      return true;
    }
    return false;
  };

  const switchRole = (role) => {
    if (user) {
      setUser({ ...user, role });
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register, verifyEmail, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}