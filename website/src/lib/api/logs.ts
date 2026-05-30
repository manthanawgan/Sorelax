import { refreshLogEntrySchema, type RefreshLogEntry } from '@/lib/types/logs';
import { z } from 'zod';
import { apiGet } from './client';

const refreshLogsSchema = z.array(refreshLogEntrySchema);

export function fetchRefreshLogs(): Promise<RefreshLogEntry[]> {
  return apiGet('/api/logs', refreshLogsSchema);
}
