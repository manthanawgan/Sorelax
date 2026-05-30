import { useQuery } from '@tanstack/react-query';
import { fetchRefreshLogs } from '@/lib/api/logs';
import type { RefreshLogEntry } from '@/lib/types/logs';
import { queryKeys } from '@/lib/query-keys';

export function useRefreshLogs() {
  return useQuery<RefreshLogEntry[]>({
    queryKey: queryKeys.logs,
    queryFn: fetchRefreshLogs,
  });
}
