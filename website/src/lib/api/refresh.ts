import { z } from 'zod';
import { queryClient } from '@/lib/query-client';
import { queryKeys } from '@/lib/query-keys';
import { fetchOrThrow, API_BASE_URL, ApiError, normalizeApiError } from './client';

export const refreshResultSchema = z.object({
  status: z.string(),
  row_count: z.number(),
  source_counts: z.record(z.string(), z.unknown()),
  claude_md: z.string(),
  elapsed_seconds: z.number(),
  warnings: z.array(z.string()),
  skill_hints: z.array(z.string()),
  sources_joined: z.number(),
  sql_queries: z.number(),
});

export type RefreshResult = z.infer<typeof refreshResultSchema>;

const refreshStartSchema = z.object({
  message: z.string(),
});

const refreshLogSchema = z.object({
  line: z.string(),
});

const refreshErrorSchema = z.object({
  message: z.string(),
  raw: z.string().optional(),
});

export interface RefreshStreamHandlers {
  onStart?: (message: string) => void;
  onLog?: (line: string) => void;
  onResult?: (result: RefreshResult) => void;
  onError?: (message: string) => void;
  signal?: AbortSignal;
}

function parseSseBlock(block: string): { event: string; data: string } | null {
  const lines = block.split('\n');
  let event = 'message';
  const dataLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith('event:')) {
      event = line.slice(6).trim();
    } else if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).trim());
    }
  }

  if (dataLines.length === 0) {
    return null;
  }

  return { event, data: dataLines.join('\n') };
}

async function readResponseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

export async function streamRefresh(
  handlers: RefreshStreamHandlers = {},
): Promise<RefreshResult | null> {
  const response = await fetchOrThrow(`${API_BASE_URL}/api/refresh`, {
    method: 'POST',
    headers: { Accept: 'text/event-stream' },
    signal: handlers.signal,
  });

  if (!response.ok) {
    const body = await readResponseBody(response);
    const message = normalizeApiError(response.status, body);
    handlers.onError?.(message);
    throw new ApiError(message, response.status, body);
  }

  if (!response.body) {
    const message = 'Refresh stream returned no body';
    handlers.onError?.(message);
    throw new ApiError(message, response.status, null);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let result: RefreshResult | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    let boundary = buffer.indexOf('\n\n');
    while (boundary !== -1) {
      const block = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);

      const parsed = parseSseBlock(block);
      if (parsed) {
        const payload = JSON.parse(parsed.data) as unknown;

        switch (parsed.event) {
          case 'start': {
            const start = refreshStartSchema.parse(payload);
            handlers.onStart?.(start.message);
            break;
          }
          case 'log': {
            const log = refreshLogSchema.parse(payload);
            handlers.onLog?.(log.line);
            break;
          }
          case 'result': {
            result = refreshResultSchema.parse(payload);
            handlers.onResult?.(result);
            void queryClient.invalidateQueries({ queryKey: queryKeys.context });
            void queryClient.invalidateQueries({ queryKey: queryKeys.logs });
            void queryClient.invalidateQueries({ queryKey: queryKeys.status });
            break;
          }
          case 'error': {
            const error = refreshErrorSchema.parse(payload);
            handlers.onError?.(error.message);
            throw new ApiError(error.message, response.status, error);
          }
          default:
            break;
        }
      }

      boundary = buffer.indexOf('\n\n');
    }
  }

  return result;
}
