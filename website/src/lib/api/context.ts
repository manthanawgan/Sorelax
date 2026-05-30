import { projectContextSchema, type ProjectContext } from '@/lib/types/context';
import { apiGet } from './client';

export function fetchProjectContext(): Promise<ProjectContext> {
  return apiGet('/api/context', projectContextSchema);
}
