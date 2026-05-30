import { PanelShell } from '../components/PanelShell';
import { RefreshLogTable } from '../components/RefreshLogTable';

export function LogsPanel() {
  return (
    <PanelShell
      title="Refresh logs"
      subtitle="Last 50 entries from ~/.sorelax/project_log.jsonl"
      badge="jsonl"
    >
      <RefreshLogTable />
    </PanelShell>
  );
}
