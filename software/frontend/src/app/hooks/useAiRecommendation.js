import { useQuery } from '@tanstack/react-query';
import { fetchAiRecommendation } from '@/app/lib/api';

/**
 * Loads GET /api/ai/recommend (LLM health advice). Never throws — callers
 * should fall back to the local heuristic advice when `error` is set.
 */
export function useAiRecommendation() {
  const query = useQuery({
    queryKey: ['ai', 'recommend'],
    queryFn: fetchAiRecommendation,
    staleTime: 15 * 60_000,
    retry: 1,
  });

  return {
    advice: query.data?.advice ?? null,
    aqi: query.data?.aqi ?? null,
    aqiCategory: query.data?.aqi_category ?? null,
    loading: query.isLoading,
    error: query.error?.message ?? null,
  };
}
