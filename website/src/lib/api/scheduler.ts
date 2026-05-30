import { z } from 'zod';
import { queryClient } from '@/lib/query-client';
import { queryKeys } from '@/lib/query-keys';
import { apiPost } from './client';

const schedulerStartSchema = z.object({
  ok: z.literal(true),
  pid: z.number().nullable().optional(),
});

const schedulerStopSchema = z.object({
  ok: z.literal(true),
});

export async function startScheduler(): Promise<void> {
  await apiPost('/api/scheduler/start', {}, schedulerStartSchema);
  await queryClient.invalidateQueries({ queryKey: queryKeys.status });
}

export async function stopScheduler(): Promise<void> {
  await apiPost('/api/scheduler/stop', {}, schedulerStopSchema);
  await queryClient.invalidateQueries({ queryKey: queryKeys.status });
}
