import { dashboardStatusSchema, type DashboardStatus } from '@/lib/types/status';
import { apiGet } from './client';

export function fetchDashboardStatus(): Promise<DashboardStatus> {
  return apiGet('/api/status', dashboardStatusSchema);
}
