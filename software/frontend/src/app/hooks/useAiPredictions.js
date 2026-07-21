import { useQuery } from '@tanstack/react-query';
import { fetchAiPredictions } from '@/app/lib/api';

/** Loads GET /api/ai/predict (per-sensor AQI forecast + trend). */
export function useAiPredictions() {
  const query = useQuery({
    queryKey: ['ai', 'predict'],
    queryFn: fetchAiPredictions,
    staleTime: 4 * 60_000,
    retry: 1,
  });

  return {
    sensors: query.data?.sensors ?? [],
    loading: query.isLoading,
    error: query.error?.message ?? null,
  };
}
