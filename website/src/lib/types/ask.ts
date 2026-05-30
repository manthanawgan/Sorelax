import { z } from 'zod';

export const askRowSchema = z.object({
  source_type: z.string(),
  title: z.string(),
  detail: z.string(),
  extra: z.string(),
});

export type AskRow = z.infer<typeof askRowSchema>;

export const askRequestSchema = z.object({
  question: z.string().min(1),
});

export type AskRequest = z.infer<typeof askRequestSchema>;

export const askResponseSchema = z.object({
  question: z.string(),
  keyword: z.string(),
  rows: z.array(askRowSchema),
});

export type AskResponse = z.infer<typeof askResponseSchema>;
