import React, { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from '@/app/lib/utils/cn';

export function ThemeToggle({ className, size = 'default' }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const iconClass = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
  const btnClass =
    size === 'sm'
      ? 'rounded-lg p-2'
      : 'rounded-xl p-2.5';

  if (!mounted) {
    return (
      <button
        type="button"
        className={cn(btnClass, 'text-muted', className)}
        aria-label="Theme"
        disabled
      >
        <Sun className={iconClass} />
      </button>
    );
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={cn(
        btnClass,
        'text-muted hover:bg-surface hover:text-foreground transition-colors',
        className
      )}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
    >
      {isDark ? <Sun className={iconClass} /> : <Moon className={iconClass} />}
    </button>
  );
}
