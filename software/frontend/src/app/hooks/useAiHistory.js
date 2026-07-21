import { useQuery } from '@tanstack/react-query';
import { fetchAiHistory } from '@/app/lib/api';

/** Loads GET /api/ai/history?hours=... (AI-aggregated AQI/PM/CO2 history). */
export function useAiHistory(hours = 24) {
  const query = useQuery({
    queryKey: ['ai', 'history', hours],
    queryFn: () => fetchAiHistory({ hours }),
    staleTime: 4 * 60_000,
    retry: 1,
  });

  return {
    data: query.data?.data ?? [],
    freq: query.data?.freq ?? null,
    loading: query.isLoading,
    error: query.error?.message ?? null,
  };
}
