import React, { useState, useEffect, useRef } from 'react';
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
} from 'lucide-react';
import logo from '../../assets/logo.jpg';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { cn } from '@/app/lib/utils/cn';
import { Button } from '@/app/components/ui/button';

const NAV_GROUPS = {
  airQuality: { label: 'Air quality', paths: ['/', '/map'] },
  data: { label: 'Data', paths: ['/api-docs'] },
};

function NavLink({ to, icon: Icon, label, currentPath, onNavigate }) {
  const isActive =
    to === '/'
      ? currentPath === '/'
      : currentPath === to || currentPath.startsWith(`${to}/`);

  const className = cn(
    'flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors',
    isActive
      ? 'text-brand-700 bg-brand-50'
      : 'text-muted hover:text-foreground hover:bg-surface'
  );

  if (onNavigate) {
    return (
      <button type="button" onClick={() => onNavigate(to)} className={className}>
        <Icon className="w-4 h-4 shrink-0" />
        {label}
      </button>
    );
  }

  return (
    <Link to={to} className={className}>
      <Icon className="w-4 h-4 shrink-0" />
      {label}
    </Link>
  );
}

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef();

  const currentPath = location.pathname;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [currentPath]);

  const publicLinks = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/map', label: 'Map', icon: Map },
  ];

  const userLinks = [
    ...publicLinks,
    { path: '/user-dashboard', label: 'Dashboard', icon: Database },
    { path: '/download', label: 'Download', icon: Cloud },
  ];

  const ownerLinks = [
    ...publicLinks,
    { path: '/private-sensors', label: 'My Sensors', icon: Settings },
    { path: '/user-dashboard', label: 'Dashboard', icon: Database },
    { path: '/download', label: 'Download', icon: Cloud },
  ];

  const adminLinks = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/map', label: 'Map', icon: Map },
    { path: '/admin', label: 'Admin', icon: Shield },
    { path: '/sensor-status', label: 'Sensors', icon: Settings },
    { path: '/user-dashboard', label: 'Dashboard', icon: Database },
    { path: '/download', label: 'Download', icon: Cloud },
  ];

  const getLinks = () => {
    if (!user) return publicLinks;
    const normalizedRole = user.role?.toLowerCase() || 'user';
    if (normalizedRole === 'admin') return adminLinks;
    if (normalizedRole === 'owner') return ownerLinks;
    return userLinks;
  };

  const links = getLinks();
  const airQualityLinks = links.filter((l) =>
    NAV_GROUPS.airQuality.paths.includes(l.path)
  );
  const appLinks = links.filter(
    (l) => !NAV_GROUPS.airQuality.paths.includes(l.path)
  );

  const mobileNavigate = (path) => {
    navigate(path);
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface-elevated/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-3 shrink-0 group">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-[var(--shadow-card)] ring-1 ring-border overflow-hidden group-hover:ring-brand-500/40 transition">
            <img
              src={logo}
              alt="AirQuality DSM"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="hidden sm:block">
            <p className="font-semibold text-foreground leading-tight">
              AirQuality DSM
            </p>
            <p className="text-xs text-muted">Dar es Salaam monitoring</p>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center">
          {airQualityLinks.length > 0 && (
            <div className="flex items-center gap-0.5 mr-2 pr-2 border-r border-border">
              <span className="sr-only">{NAV_GROUPS.airQuality.label}</span>
              {airQualityLinks.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  icon={link.icon}
                  label={link.label}
                  currentPath={currentPath}
                />
              ))}
            </div>
          )}

          {appLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              icon={link.icon}
              label={link.label}
              currentPath={currentPath}
            />
          ))}

          <div className="flex items-center gap-0.5 ml-2 pl-2 border-l border-border">
            <NavLink
              to="/api-docs"
              icon={BookOpen}
              label="API"
              currentPath={currentPath}
            />
          </div>
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-surface transition-colors"
                aria-expanded={dropdownOpen}
                aria-haspopup="menu"
              >
                <div className="w-9 h-9 bg-brand-600 text-white rounded-xl flex items-center justify-center font-semibold text-sm">
                  {user.name?.charAt(0)?.toUpperCase() ?? 'U'}
                </div>
                <ChevronDown className="w-4 h-4 text-muted hidden sm:block" />
              </button>

              {dropdownOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-64 bg-surface-elevated rounded-2xl shadow-[var(--shadow-card-hover)] border border-border py-2"
                >
                  <div className="px-4 py-3 border-b border-border">
                    <p className="font-semibold text-foreground">{user.name}</p>
                    <p className="text-sm text-muted truncate">{user.email}</p>
                  </div>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      navigate('/profile');
                      setDropdownOpen(false);
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-surface flex items-center gap-2 text-foreground"
                  >
                    <User className="w-4 h-4 text-muted" /> Profile
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      logout();
                      navigate('/');
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-aqi-unhealthy hover:bg-aqi-unhealthy-soft flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" /> Log out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Button size="sm" onClick={() => navigate('/login')}>
              Sign in
            </Button>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 rounded-xl hover:bg-surface text-foreground"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden border-t border-border px-4 py-4 bg-surface-elevated space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-3 mb-2">
              {NAV_GROUPS.airQuality.label}
            </p>
            <div className="space-y-1">
              {airQualityLinks.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  icon={link.icon}
                  label={link.label}
                  currentPath={currentPath}
                  onNavigate={mobileNavigate}
                />
              ))}
            </div>
          </div>

          <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-3 mb-2">
                {user ? 'Your account' : NAV_GROUPS.data.label}
              </p>
              <div className="space-y-1">
                {appLinks.map((link) => (
                  <NavLink
                    key={link.path}
                    to={link.path}
                    icon={link.icon}
                    label={link.label}
                    currentPath={currentPath}
                    onNavigate={mobileNavigate}
                  />
                ))}
                <NavLink
                  to="/api-docs"
                  icon={BookOpen}
                  label="API documentation"
                  currentPath={currentPath}
                  onNavigate={mobileNavigate}
                />
              </div>
            </div>
        </div>
      )}
    </header>
  );
}
