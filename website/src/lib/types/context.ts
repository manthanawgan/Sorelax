import { z } from 'zod';

export const projectContextSchema = z.object({
  active_work: z.array(z.string()),
  recent_commits: z.array(z.string()),
  open_prs: z.array(z.string()),
  sprint_goal: z.string(),
  key_decisions: z.array(z.string()),
  relevant_slack_threads: z.array(z.string()),
  architecture_docs: z.array(z.string()),
  updated_at: z.string(),
  row_count: z.number(),
});

export type ProjectContext = z.infer<typeof projectContextSchema>;
