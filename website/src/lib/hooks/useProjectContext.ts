import { useQuery } from '@tanstack/react-query';
import { ApiError } from '@/lib/api/client';
import { fetchProjectContext } from '@/lib/api/context';
import type { ProjectContext } from '@/lib/types/context';
import { queryKeys } from '@/lib/query-keys';

const STALE_TIME_MS = 60_000;

export function useProjectContext() {
  return useQuery<ProjectContext>({
    queryKey: queryKeys.context,
    queryFn: fetchProjectContext,
    staleTime: STALE_TIME_MS,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status === 404) return false;
      return failureCount < 1;
    },
  });
}
