import { useSourceStatus } from '@/lib/hooks/useSourceStatus';
import { useProjectContext } from '@/lib/hooks/useProjectContext';
import { ContextFeed } from '../components/ContextFeed';
import { EmptyMetric } from '../components/PanelShell';
import { SourceStatusBar } from '../components/SourceStatusBar';
import { formatContextAge } from '../utils/format';

export function DashboardPanel() {
  const { data: context } = useProjectContext();
  const { data: status } = useSourceStatus();

  const healthyCount = status?.sources.filter((source) => source.healthy).length ?? 0;
  const totalSources = status?.sources.length ?? 4;
  const rowCount = context?.row_count ?? '—';
  const contextAge = context?.updated_at ? formatContextAge(context.updated_at) : '—';

  return (
    <div className="space-y-4">
      <SourceStatusBar />

      <div className="grid gap-4 sm:grid-cols-3">
        <EmptyMetric label="Rows joined" value={String(rowCount)} hint="From last Coral refresh" />
        <EmptyMetric
          label="Sources"
          value={status ? `${healthyCount} / ${totalSources}` : '—'}
          hint="Coral source health"
        />
        <EmptyMetric label="Context age" value={contextAge} hint="project_context.json" />
      </div>

      <ContextFeed />
    </div>
  );
}
