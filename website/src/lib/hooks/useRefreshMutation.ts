import { useMutation } from '@tanstack/react-query';
import { streamRefresh, type RefreshResult } from '@/lib/api/refresh';

export interface RefreshStreamOptions {
  onStart?: (message: string) => void;
  onLog?: (line: string) => void;
}

export function useRefreshMutation() {
  return useMutation<RefreshResult | null, Error, RefreshStreamOptions | void>({
    mutationFn: (options) =>
      streamRefresh({
        onStart: options?.onStart,
        onLog: options?.onLog,
      }),
  });
}
