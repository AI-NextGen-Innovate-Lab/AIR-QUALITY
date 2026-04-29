import { useEffect, useState } from "react";
import { fetchReadings } from "@/app/lib/api";

/**
 * Load paginated readings from GET /api/readings.
 */
export function useReadings(options = {}) {
  const { limit = 1000, page = 1, hours = 24, sensorId } = options;
  const [state, setState] = useState({
    loading: true,
    error: null,
    data: [],
    pagination: null,
  });

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    fetchReadings({ limit, page, hours, sensorId })
      .then((json) => {
        if (cancelled) return;
        setState({
          loading: false,
          error: null,
          data: json.data || [],
          pagination: json.pagination || null,
        });
      })
      .catch((e) => {
        if (cancelled) return;
        setState({
          loading: false,
          error: e.message || "Failed to load",
          data: [],
          pagination: null,
        });
      });
    return () => {
      cancelled = true;
    };
  }, [limit, page, hours, sensorId]);

  return state;
}
