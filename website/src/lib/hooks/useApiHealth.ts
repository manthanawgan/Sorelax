import { useQuery } from '@tanstack/react-query';
import { fetchHealth } from '@/lib/api/health';
import { ApiError } from '@/lib/api/client';

export function useApiHealth() {
  return useQuery({
    queryKey: ['api-health'] as const,
    queryFn: fetchHealth,
    retry: 1,
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
  });
}

export function isApiUnreachable(error: unknown): boolean {
  if (error instanceof ApiError) {
    return error.status === 0 || error.status >= 500;
  }
  return error instanceof TypeError;
}
