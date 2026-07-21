import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const TREND_META = {
  rising: { label: 'Rising', Icon: TrendingUp, className: 'text-aqi-unhealthy' },
  falling: { label: 'Falling', Icon: TrendingDown, className: 'text-aqi-good' },
  stable: { label: 'Stable', Icon: Minus, className: 'text-muted' },
};

/** Icon/label/color for an AI trend_direction value ('rising' | 'falling' | 'stable'). */
export function trendMeta(direction) {
  const key = String(direction || '').toLowerCase();
  return TREND_META[key] ?? { label: direction || 'Unknown', Icon: Minus, className: 'text-muted' };
}
