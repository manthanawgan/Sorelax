import { useQuery } from '@tanstack/react-query';
import { fetchDashboardStatus } from '@/lib/api/status';
import type { DashboardStatus } from '@/lib/types/status';
import { queryKeys } from '@/lib/query-keys';

const REFETCH_INTERVAL_MS = 30_000;

export function useSourceStatus() {
  return useQuery<DashboardStatus>({
    queryKey: queryKeys.status,
    queryFn: fetchDashboardStatus,
    refetchInterval: REFETCH_INTERVAL_MS,
  });
}
