import { z } from 'zod';

export const refreshLogEntrySchema = z.object({
  timestamp: z.string(),
  row_count: z.number(),
  source_counts: z.record(z.string(), z.number()),
  status: z.enum(['ok', 'error']),
  warnings: z.array(z.string()),
});

export type RefreshLogEntry = z.infer<typeof refreshLogEntrySchema>;
