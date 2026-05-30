import { z } from 'zod';
import { apiGet } from './client';

const healthSchema = z.object({
  status: z.literal('ok'),
});

export type HealthResponse = z.infer<typeof healthSchema>;

export function fetchHealth(): Promise<HealthResponse> {
  return apiGet('/api/health', healthSchema);
}
