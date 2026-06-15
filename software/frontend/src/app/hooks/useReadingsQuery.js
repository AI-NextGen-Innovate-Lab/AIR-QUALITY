import { useQuery } from '@tanstack/react-query';
import { fetchReadings } from '@/app/lib/api';

export function readingsQueryKey({ limit, page, hours, sensorId } = {}) {
  return ['readings', { limit, page, hours, sensorId }];
}

export function useReadingsQuery(options = {}) {
  const { limit = 1000, page = 1, hours = 24, sensorId, refetchInterval } = options;

  const query = useQuery({
    queryKey: readingsQueryKey({ limit, page, hours, sensorId }),
    queryFn: () => fetchReadings({ limit, page, hours, sensorId }),
    staleTime: hours > 24 ? 60_000 : 30_000,
    refetchInterval: refetchInterval ?? (hours <= 24 ? 60_000 : false),
  });

  return {
    loading: query.isLoading,
    error: query.error?.message ?? null,
    data: query.data?.data ?? [],
    pagination: query.data?.pagination ?? null,
    refetch: query.refetch,
    isFetching: query.isFetching,
  };
}
