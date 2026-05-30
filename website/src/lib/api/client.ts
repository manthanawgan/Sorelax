import type { ZodType } from 'zod';
import { z } from 'zod';

export const API_BASE_URL = 'http://localhost:8000';

export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
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

export function normalizeApiError(status: number, body: unknown): string {
  if (typeof body === 'string' && body.trim()) {
    return body;
  }

  if (body && typeof body === 'object' && 'detail' in body) {
    const detail = (body as { detail: unknown }).detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) {
      return detail
        .map((item) => {
          if (item && typeof item === 'object' && 'msg' in item) {
            return String((item as { msg: unknown }).msg);
          }
          return String(item);
        })
        .join('; ');
    }
  }

  return `Request failed with status ${status}`;
}

async function parseJsonResponse<T>(response: Response, schema: ZodType<T>): Promise<T> {
  const body = await readResponseBody(response);

  if (!response.ok) {
    throw new ApiError(normalizeApiError(response.status, body), response.status, body);
  }

  try {
    return schema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.issues.map((issue) => issue.message).join('; ');
      throw new ApiError(`Invalid API response: ${message}`, response.status, body);
    }
    throw error;
  }
}

export async function fetchOrThrow(input: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(input, init);
  } catch {
    throw new ApiError(
      `Cannot reach API at ${API_BASE_URL}. Run: sorelax-api`,
      0,
      null,
    );
  }
}

export async function apiGet<T>(path: string, schema: ZodType<T>): Promise<T> {
  const response = await fetchOrThrow(`${API_BASE_URL}${path}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  return parseJsonResponse(response, schema);
}

export async function apiPost<TResponse, TBody>(
  path: string,
  body: TBody,
  responseSchema: ZodType<TResponse>,
  requestSchema?: ZodType<TBody>,
): Promise<TResponse> {
  const payload = requestSchema ? requestSchema.parse(body) : body;

  const response = await fetchOrThrow(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return parseJsonResponse(response, responseSchema);
}
