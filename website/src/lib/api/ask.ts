import {
  askRequestSchema,
  askResponseSchema,
  type AskRequest,
  type AskResponse,
} from '@/lib/types/ask';
import { apiPost } from './client';

export function postAskQuestion(body: AskRequest): Promise<AskResponse> {
  return apiPost('/api/ask', body, askResponseSchema, askRequestSchema);
}
