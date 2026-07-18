import { useReadingsQuery } from './useReadingsQuery.js';

/**
 * Load paginated readings from GET /api/readings (TanStack Query).
 */
export function useReadings(options = {}) {
  return useReadingsQuery(options);
}
