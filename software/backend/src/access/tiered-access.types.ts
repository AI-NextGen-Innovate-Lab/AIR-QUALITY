export type AccessTier = 'PUBLIC' | 'AUTHENTICATED' | 'API_KEY';

export interface TierLimits {
  maxLimit: number;
  maxHours: number;
  cacheTtlMs: number;
}

export const TIER_LIMITS: Record<AccessTier, TierLimits> = {
  PUBLIC: { maxLimit: 100, maxHours: 24, cacheTtlMs: 60_000 },
  AUTHENTICATED: { maxLimit: 500, maxHours: 168, cacheTtlMs: 30_000 },
  API_KEY: { maxLimit: 5000, maxHours: 720, cacheTtlMs: 15_000 },
};

export interface ClampedReadingsQuery {
  limit: number;
  page: number;
  hours: number;
  sensorId?: string;
  measurements?: string[];
}

export function clampReadingsQuery(
  query: {
    limit?: string;
    page?: string;
    hours?: string;
    sensorId?: string;
    measurement?: string;
  },
  tier: AccessTier,
): ClampedReadingsQuery {
  const limits = TIER_LIMITS[tier];
  const limitRaw = Number.parseInt(query.limit ?? String(limits.maxLimit), 10);
  const pageRaw = Number.parseInt(query.page ?? '1', 10);
  const hoursRaw = Number.parseInt(query.hours ?? '24', 10);

  return {
    limit: Math.min(Math.max(Number.isNaN(limitRaw) ? limits.maxLimit : limitRaw, 1), limits.maxLimit),
    page: Math.max(Number.isNaN(pageRaw) ? 1 : pageRaw, 1),
    hours: Math.min(Math.max(Number.isNaN(hoursRaw) ? 24 : hoursRaw, 1), limits.maxHours),
    sensorId: query.sensorId?.trim() || undefined,
    measurements: query.measurement
      ? query.measurement
          .split(',')
          .map((m) => m.trim())
          .filter(Boolean)
      : undefined,
  };
}
