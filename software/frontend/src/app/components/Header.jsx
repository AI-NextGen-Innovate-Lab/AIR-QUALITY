import React, { useState } from "react";
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
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const currentPath = location.pathname;

  const publicLinks = [
    { path: "/", label: "Home", icon: Home },
    { path: "/map", label: "Map View", icon: Map },
  ];

  const registeredLinks = [
    ...publicLinks,
    { path: "/dashboard", label: "Data Dashboard", icon: Database },
    { path: "/download", label: "Download Center", icon: Cloud },
  ];

  const privateOwnerLinks = [
    ...registeredLinks,
    { path: "/private-sensors", label: "My Sensors", icon: Settings },
  ];

  const adminLinks = [
    ...publicLinks,
    { path: "/admin", label: "Admin Panel", icon: Shield },
    { path: "/sensor-status", label: "Sensor Status", icon: Settings },
    { path: "/dashboard", label: "Data Dashboard", icon: Database },
  ];

  const getLinks = () => {
    if (!user) return publicLinks;
    if (user.role === "admin") return adminLinks;
    if (user.role === "private_owner") return privateOwnerLinks;
    return registeredLinks;
  };

  const links = getLinks();

  const NavLinks = ({ mobile }) => (
    <>
      {links.map((link) => {
        const Icon = link.icon;
        return (
          <button
            key={link.path}
            onClick={() => {
              navigate(link.path);
              setMobileOpen(false);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              currentPath === link.path
                ? "bg-blue-500 text-white"
                : "text-gray-700 hover:bg-gray-100"
            } ${mobile ? "w-full text-left" : ""}`}
          >
            <Icon className="w-4 h-4" />
            {link.label}
          </button>
        );
      })}

      {!user && (
        <button
          onClick={() => navigate("/login")}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100"
        >
          <User className="w-4 h-4" />
          Login
        </button>
      )}

      <button
        onClick={() => navigate("/api-docs")}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
          currentPath === "/api-docs"
            ? "bg-blue-500 text-white"
            : "text-gray-700 hover:bg-gray-100"
        }`}
      >
        <BookOpen className="w-4 h-4" />
        API Docs
      </button>
    </>
  );

  return (
    <header className="bg-white shadow border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 flex justify-between items-center h-16">
        
        {/* Logo */}
        <div
          onClick={() => navigate("/")}
          className="flex items-center gap-3 cursor-pointer"
        >
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
            <Cloud className="text-white w-5 h-5" />
          </div>
          <div className="hidden sm:block">
            <h1 className="font-bold text-lg">AirQuality DSM</h1>
            <p className="text-xs text-gray-500">Air Monitoring</p>
          </div>
        </div>

        {/* Desktop */}
        <div className="hidden lg:flex gap-2">
          <NavLinks />
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          
          {/* User dropdown */}
          {user && (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-lg"
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">{user.name}</span>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border rounded-lg shadow">
                  <div className="p-3 border-b">
                    <p className="font-medium">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                    <p className="text-xs text-blue-600 capitalize">
                      {user.role.replace("_", " ")}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      navigate("/profile");
                      setDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100"
                  >
                    Profile
                  </button>

                  <button
                    onClick={() => {
                      logout();
                      navigate("/");
                    }}
                    className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden px-4 pb-4 flex flex-col gap-2">
          <NavLinks mobile />

          {user && (
            <>
              <hr />
              <button
                onClick={() => {
                  navigate("/profile");
                  setMobileOpen(false);
                }}
                className="text-left px-4 py-2 hover:bg-gray-100"
              >
                Profile
              </button>

              <button
                onClick={() => {
                  logout();
                  navigate("/");
                }}
                className="text-left px-4 py-2 text-red-600 hover:bg-red-50"
              >
                Logout
              </button>
            </>
          )}
        </div>
      )}
    </header>
  );
}