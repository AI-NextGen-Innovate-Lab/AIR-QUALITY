import React, { useState, useEffect, useRef } from "react";
import {
  Menu,
  User,
  LogOut,
  Home,
  Map,
  Database,
  Settings,
  Shield,
  BookOpen,
  Cloud,
  ChevronDown,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const dropdownRef = useRef();

  const currentPath = location.pathname;

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const publicLinks = [
    { path: "/", label: "Home", icon: Home },
    { path: "/map", label: "Map View", icon: Map },
  ];

  const registeredLinks = [
    ...publicLinks,
    { path: "/dashboard", label: "Dashboard", icon: Database },
    { path: "/download", label: "Download", icon: Cloud },
  ];

  const privateOwnerLinks = [
    ...registeredLinks,
    { path: "/private-sensors", label: "My Sensors", icon: Settings },
  ];

  const adminLinks = [
    { path: "/", label: "Home", icon: Home },
    { path: "/map", label: "Map View", icon: Map },
    { path: "/admin", label: "Admin Panel", icon: Shield },
    { path: "/sensor-status", label: "Sensor Status", icon: Settings },
    { path: "/dashboard", label: "Dashboard", icon: Database },
  ];

  const getLinks = () => {
    if (!user) return publicLinks;
    if (user.role === "admin") return adminLinks;
    if (user.role === "private_owner") return privateOwnerLinks;
    return registeredLinks;
  };

  const links = getLinks();

  return (
    <header className="bg-white/80 backdrop-blur border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <div
          onClick={() => navigate("/")}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-md group-hover:scale-110 transition">
            <Cloud className="text-white w-5 h-5" />
          </div>
          <div className="hidden sm:block">
            <h1 className="font-semibold text-lg">AirQuality DSM</h1>
            <p className="text-xs text-gray-500">Dar es Salaam</p>
          </div>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-2">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = currentPath === link.path;

            return (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition relative ${
                  isActive
                    ? "text-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Icon className="w-4 h-4" />
                {link.label}

                {isActive && (
                  <span className="absolute bottom-0 left-2 right-2 h-[2px] bg-blue-600 rounded-full" />
                )}
              </button>
            );
          })}

          <button
            onClick={() => navigate("/api-docs")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
              currentPath === "/api-docs"
                ? "text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <BookOpen className="w-4 h-4" /> API Docs
          </button>
        </nav>

        {/* Right Side */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100 transition"
              >
                <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-500 text-white rounded-xl flex items-center justify-center font-semibold">
                  {user.name?.charAt(0)}
                </div>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-xl border py-2 animate-in fade-in zoom-in-95">
                  <div className="px-4 py-3 border-b">
                    <p className="font-semibold">{user.name}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>

                  <button
                    onClick={() => {
                      navigate("/profile");
                      setDropdownOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                  >
                    <User className="w-4 h-4" /> Profile
                  </button>

                  <button
                    onClick={() => {
                      logout();
                      navigate("/");
                    }}
                    className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => navigate("/login")}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-xl transition"
            >
              Sign in
            </button>
          )}

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
          >
            <Menu />
          </button>
        </div>
      </div>

      {/* Mobile */}
      {mobileOpen && (
        <div className="lg:hidden border-t px-6 py-4 space-y-2">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <button
                key={link.path}
                onClick={() => {
                  navigate(link.path);
                  setMobileOpen(false);
                }}
                className="flex items-center gap-3 w-full px-3 py-3 rounded-xl hover:bg-gray-100"
              >
                <Icon /> {link.label}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
}