import { useMutation } from '@tanstack/react-query';
import { postAskQuestion } from '@/lib/api/ask';
import type { AskRequest, AskResponse } from '@/lib/types/ask';

export function useAskQuery() {
  return useMutation<AskResponse, Error, AskRequest>({
    mutationFn: postAskQuestion,
  });
}
