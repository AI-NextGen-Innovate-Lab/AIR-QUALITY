import React, { useEffect, useState } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from '@/app/lib/utils/cn';

const OPTIONS = [
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'dark', label: 'Dark', icon: Moon },
  { id: 'system', label: 'System', icon: Monitor },
];

export function ThemeSelector({ className }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className={cn('grid grid-cols-3 gap-2', className)}>
        {OPTIONS.map((opt) => (
          <div
            key={opt.id}
            className="h-20 rounded-xl border border-border bg-surface animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className={cn('grid grid-cols-1 gap-2 sm:grid-cols-3', className)}>
      {OPTIONS.map((opt) => {
        const active = theme === opt.id;
        const Icon = opt.icon;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => setTheme(opt.id)}
            className={cn(
              'flex flex-col items-center gap-2 rounded-xl border px-4 py-4 text-sm font-medium transition-colors',
              active
                ? 'border-brand-500 bg-brand-50 text-brand-800 ring-1 ring-brand-500/30'
                : 'border-border bg-surface-elevated text-muted hover:border-border-strong hover:text-foreground'
            )}
          >
            <Icon className="h-5 w-5" />
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
