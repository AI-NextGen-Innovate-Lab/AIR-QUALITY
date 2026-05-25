import { cn } from '@/app/lib/utils/cn';
import { getAQICategory } from '@/app/lib/airQuality';

export const panelClass =
  'rounded-2xl border border-border bg-surface-elevated shadow-[var(--shadow-card)]';

export function panel(extra) {
  return cn(panelClass, 'p-6', extra);
}

export const inputClass =
  'w-full rounded-xl border border-border bg-surface-elevated px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500';

export const selectClass =
  'w-full rounded-xl border border-border bg-surface-elevated px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500';

export const labelClass = 'block text-xs font-medium text-muted mb-1';

export function tabBtn(active) {
  return cn(
    'rounded-xl px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap',
    active
      ? 'bg-brand-600 text-white shadow-sm'
      : 'bg-surface text-muted hover:text-foreground border border-border'
  );
}

export function aqiBadgeClass(aqi) {
  const c = getAQICategory(Number(aqi) || 0);
  return cn('inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold');
}

export function aqiBadgeStyle(aqi) {
  const c = getAQICategory(Number(aqi) || 0);
  return { backgroundColor: c.bgSoft, color: c.color };
}
