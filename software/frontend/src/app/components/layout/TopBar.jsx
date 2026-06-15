import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, User, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { useSidebar } from '@/app/context/SidebarContext';
import { Button } from '@/app/components/ui/button';

export default function TopBar() {
  const { user, logout } = useAuth();
  const { setMobileOpen } = useSidebar();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border bg-surface-elevated/95 px-4 backdrop-blur-md sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="rounded-lg p-2 text-muted hover:bg-surface hover:text-foreground lg:hidden"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <p className="hidden text-sm font-medium text-muted sm:block">
          Dar es Salaam · Live environmental data
        </p>
      </div>

      <div className="flex items-center gap-2">
        {user ? (
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-surface"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-semibold text-white">
                {user.name?.charAt(0)?.toUpperCase() ?? 'U'}
              </div>
              <span className="hidden text-sm font-medium text-foreground sm:block">{user.name}</span>
              <ChevronDown className="hidden h-4 w-4 text-muted sm:block" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-surface-elevated py-2 shadow-lg">
                <div className="border-b border-border px-4 py-3">
                  <p className="font-medium text-foreground">{user.name}</p>
                  <p className="truncate text-xs text-muted">{user.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigate('/profile');
                    setDropdownOpen(false);
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-foreground hover:bg-surface"
                >
                  <User className="h-4 w-4 text-muted" /> Profile
                </button>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    navigate('/');
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-aqi-unhealthy hover:bg-surface"
                >
                  <LogOut className="h-4 w-4" /> Log out
                </button>
              </div>
            )}
          </div>
        ) : (
          <Button size="sm" onClick={() => navigate('/login')}>
            Sign in
          </Button>
        )}
      </div>
    </header>
  );
}
