export type DashboardSection =
  | 'dashboard'
  | 'ask'
  | 'logs'
  | 'sources'
  | 'settings';

export type AgentState = 'active' | 'idle' | 'stopped' | 'error';

export interface DashboardStatus {
  agentState: AgentState;
  schedulerRunning: boolean;
  lastRefresh: string | null;
  nextRefresh: string | null;
}
