import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BarChart3,
  Map,
  RadioTower,
  KeyRound,
  BookOpen,
  Settings,
  Users,
  ClipboardCheck,
  Shield,
  ScrollText,
  PanelLeftClose,
  PanelLeft,
  X,
} from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { useSidebar } from '@/app/context/SidebarContext';
import { cn } from '@/app/lib/utils/cn';
import logo from '@/assets/logo.jpg';

const PUBLIC_NAV = [
  { path: '/', label: 'Overview', icon: LayoutDashboard },
  { path: '/map', label: 'Live Map', icon: Map },
  { path: '/api-docs', label: 'Documentation', icon: BookOpen },
];

const USER_NAV = [
  { path: '/user-dashboard', label: 'Analytics & Reports', icon: BarChart3 },
  { path: '/api-access', label: 'API Access', icon: KeyRound },
  { path: '/profile', label: 'Settings', icon: Settings },
];

const OWNER_NAV = [
  { path: '/private-sensors', label: 'My sensors', icon: RadioTower },
  { path: '/user-dashboard', label: 'Analytics & Reports', icon: BarChart3 },
  { path: '/api-access', label: 'API Access', icon: KeyRound },
  { path: '/profile', label: 'Settings', icon: Settings },
];

const ADMIN_NAV = [
  // { path: '/user-dashboard', label: 'Analytics & Reports', icon: BarChart3 },
  // { path: '/sensor-status', label: 'Sensor health', icon: RadioTower },
  // { path: '/api-access', label: 'API Access', icon: KeyRound },
  { path: '/profile', label: 'Settings', icon: Settings },
];

const ADMIN_SECTION = [
  { path: '/admin', label: 'Admin panel', icon: Users, tab: 'overview' },
  { path: '/admin', label: 'Users', icon: Users, tab: 'users' },
  { path: '/admin', label: 'Sensors', icon: RadioTower, tab: 'sensors' },
  { path: '/admin', label: 'API Requests', icon: ClipboardCheck, tab: 'requests' },
  { path: '/admin', label: 'API Keys', icon: Shield, tab: 'api' },
  { path: '/admin', label: 'Audit logs', icon: ScrollText, tab: 'audit' },
  { path: '/admin', label: 'System', icon: ScrollText, tab: 'system' },
];

function NavItem({ item, currentPath, collapsed, onNavigate }) {
  const isActive =
    item.path === '/'
      ? currentPath === '/'
      : currentPath === item.path || currentPath.startsWith(`${item.path}/`);

  const to = item.tab ? `${item.path}?tab=${item.tab}` : item.path;

  const className = cn(
    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
    isActive
      ? 'bg-brand-50 text-brand-800 dark:bg-brand-100/40 dark:text-brand-800'
      : 'text-muted hover:bg-surface hover:text-foreground'
  );

  if (onNavigate) {
    return (
      <button type="button" onClick={() => onNavigate(to)} className={cn(className, 'w-full text-left')}>
        <item.icon className="h-4 w-4 shrink-0" />
        {!collapsed && <span>{item.label}</span>}
      </button>
    );
  }

  return (
    <Link to={to} className={className} title={collapsed ? item.label : undefined}>
      <item.icon className="h-4 w-4 shrink-0" />
      {!collapsed && <span>{item.label}</span>}
    </Link>
  );
}

function navForRole(role) {
  const roleNav =
    role === 'admin' ? ADMIN_NAV :
    role === 'owner' ? OWNER_NAV :
    role === 'user' ? USER_NAV : [];
  return [...PUBLIC_NAV, ...roleNav];
}

export default function Sidebar() {
  const { user } = useAuth();
  const { collapsed, setCollapsed, mobileOpen, setMobileOpen } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const role = user?.role?.toLowerCase() || 'guest';

  const mobileNavigate = (to) => {
    navigate(to);
    setMobileOpen(false);
  };

  const mainNav = navForRole(role);
  const adminNav = role === 'admin' ? ADMIN_SECTION : [];

  const content = (
    <div className="flex h-full flex-col">
      <div className={cn('flex items-center gap-3 border-b border-border p-4', collapsed && 'justify-center')}>
        <img src={logo} alt="" className="h-9 w-9 rounded-lg object-cover ring-1 ring-border" />
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate font-semibold text-foreground">AirQuality DSM</p>
            <p className="truncate text-xs text-muted">Environmental intelligence</p>
          </div>
        )}
        {mobileOpen && (
          <button
            type="button"
            className="ml-auto rounded-lg p-1 text-muted hover:bg-surface lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {mainNav.map((item) => (
          <NavItem
            key={`${item.path}-${item.label}`}
            item={item}
            currentPath={location.pathname}
            collapsed={collapsed}
            onNavigate={mobileOpen ? mobileNavigate : undefined}
          />
        ))}

        {adminNav.length > 0 && (
          <>
            {!collapsed && (
              <p className="mb-2 mt-6 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Administration
              </p>
            )}
            {adminNav.map((item) => (
              <NavItem
                key={`${item.path}-${item.label}-${item.tab}`}
                item={item}
                currentPath={location.pathname}
                collapsed={collapsed}
                onNavigate={mobileOpen ? mobileNavigate : undefined}
              />
            ))}
          </>
        )}
      </nav>

      <div className="shrink-0 border-t border-border p-3">
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="hidden w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm text-muted hover:bg-surface hover:text-foreground lg:flex"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-border bg-surface-elevated shadow-sm transition-all duration-200 lg:flex',
          collapsed ? 'w-[72px]' : 'w-[260px]'
        )}
      >
        {content}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-foreground/20"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu overlay"
          />
          <aside className="relative flex h-full w-[280px] flex-col border-r border-border bg-surface-elevated shadow-xl">
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
