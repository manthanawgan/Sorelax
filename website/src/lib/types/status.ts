import { z } from 'zod';

export const agentStateSchema = z.enum(['active', 'idle', 'stopped', 'error']);

export type AgentState = z.infer<typeof agentStateSchema>;

export const sourceIndicatorSchema = z.object({
  id: z.enum(['github', 'linear', 'slack', 'notion']),
  name: z.string(),
  healthy: z.boolean(),
  count: z.number(),
});

export type SourceIndicator = z.infer<typeof sourceIndicatorSchema>;

export const dashboardStatusSchema = z.object({
  agentState: agentStateSchema,
  schedulerRunning: z.boolean(),
  lastRefresh: z.string().nullable(),
  nextRefresh: z.string().nullable(),
  sources: z.array(sourceIndicatorSchema),
});

export type DashboardStatus = z.infer<typeof dashboardStatusSchema>;
