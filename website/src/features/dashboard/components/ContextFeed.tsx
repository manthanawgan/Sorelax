import { ApiError } from '@/lib/api/client';
import { useProjectContext } from '@/lib/hooks/useProjectContext';
import { PanelShell } from './PanelShell';
import { EmptyState, ErrorState, LoadingSkeleton } from './StateViews';
import { ListContextSection } from './context/ListContextSection';
import { TextContextSection } from './context/TextContextSection';

export function ContextFeed() {
  const { data, isLoading, isError, error, isFetching } = useProjectContext();

  if (isLoading) {
    return (
      <PanelShell title="Context feed" subtitle="Loading project context…" badge="live">
        <LoadingSkeleton lines={8} />
      </PanelShell>
    );
  }

  if (isError) {
    const isMissing = error instanceof ApiError && error.status === 404;

    return (
      <PanelShell title="Context feed" subtitle="Gemini-summarised project snapshot" badge="live">
        {isMissing ? (
          <EmptyState
            title="No context yet"
            description="Run your first refresh to generate ~/.sorelax/project_context.json from Coral + Gemini."
          />
        ) : (
          <ErrorState message={error.message} />
        )}
      </PanelShell>
    );
  }

  if (!data) {
    return (
      <PanelShell title="Context feed" subtitle="Gemini-summarised project snapshot" badge="live">
        <EmptyState
          title="No context yet"
          description="Run your first refresh to generate ~/.sorelax/project_context.json from Coral + Gemini."
        />
      </PanelShell>
    );
  }

  return (
    <PanelShell
      title="Context feed"
      subtitle="Gemini-summarised snapshot from GitHub, Linear, Slack, and Notion"
      badge={isFetching ? 'syncing' : 'live'}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <ListContextSection title="Active work" items={data.active_work} storageKey="active-work" />
        <ListContextSection title="Recent commits" items={data.recent_commits} storageKey="recent-commits" />
        <ListContextSection title="Open PRs" items={data.open_prs} storageKey="open-prs" />
        <TextContextSection title="Sprint goal" value={data.sprint_goal} storageKey="sprint-goal" />
        <ListContextSection title="Key decisions" items={data.key_decisions} storageKey="key-decisions" />
        <ListContextSection
          title="Slack threads"
          items={data.relevant_slack_threads}
          storageKey="slack-threads"
        />
        <ListContextSection
          title="Architecture docs"
          items={data.architecture_docs}
          storageKey="architecture-docs"
        />
      </div>
    </PanelShell>
  );
}
