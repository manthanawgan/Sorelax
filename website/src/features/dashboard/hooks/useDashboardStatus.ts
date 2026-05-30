import { useMemo } from 'react';
import type { DashboardStatus } from '../types';

/** Placeholder status until the FastAPI layer is wired. */
export function useDashboardStatus(): DashboardStatus {
  return useMemo(
    () => ({
      agentState: 'active',
      schedulerRunning: true,
      lastRefresh: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      nextRefresh: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    }),
    [],
  );
}
