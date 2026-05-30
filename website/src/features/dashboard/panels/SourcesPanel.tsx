import { GitHubIcon, LinearIcon, NotionIcon, SlackIcon } from '@/lib/icons';
import { useSourceStatus } from '@/lib/hooks/useSourceStatus';
import { PanelShell } from '../components/PanelShell';
import { ErrorState, LoadingSkeleton } from '../components/StateViews';

const SOURCE_TABLES = {
  github: ['github.commits', 'github.pull_requests'],
  linear: ['linear.issues'],
  slack: ['slack.messages'],
  notion: ['notion.pages'],
} as const;

const SOURCE_ICONS = {
  github: GitHubIcon,
  linear: LinearIcon,
  slack: SlackIcon,
  notion: NotionIcon,
} as const;

function formatCount(sourceId: keyof typeof SOURCE_TABLES, count: number, healthy: boolean): string {
  if (!healthy) return 'Not connected';
  if (count === 0) return 'No rows in last refresh';

  switch (sourceId) {
    case 'github':
      return `${count} items in last refresh`;
    case 'linear':
      return `${count} issues indexed`;
    case 'slack':
      return `${count} messages indexed`;
    case 'notion':
      return `${count} docs indexed`;
    default:
      return `${count} rows`;
  }
}

export function SourcesPanel() {
  const { data, isLoading, isError, error } = useSourceStatus();

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <PanelShell key={index} title="Loading…" badge="…">
            <LoadingSkeleton lines={4} />
          </PanelShell>
        ))}
      </div>
    );
  }

  if (isError) {
    return <ErrorState message={error?.message ?? 'Failed to load sources'} />;
  }

  const sources = data?.sources ?? [];

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {sources.map((source) => {
        const Icon = SOURCE_ICONS[source.id];
        const tables = SOURCE_TABLES[source.id];

        return (
          <PanelShell
            key={source.id}
            title={source.name}
            badge={source.healthy ? 'connected' : 'offline'}
          >
            <div className="flex items-start gap-4">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md border ${
                  source.healthy
                    ? 'border-zinc-700 bg-zinc-900 text-zinc-300'
                    : 'border-zinc-800 bg-zinc-950 text-zinc-700'
                }`}
              >
                <Icon size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[13px] text-zinc-400">
                  {formatCount(source.id, source.count, source.healthy)}
                </p>
                <div className="mt-3 space-y-1">
                  {tables.map((table) => (
                    <code
                      key={table}
                      className="block truncate rounded bg-zinc-900/80 px-2 py-1 font-mono text-[11px] text-coral-400/80"
                    >
                      {table}
                    </code>
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      source.healthy
                        ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                        : 'bg-zinc-700'
                    }`}
                  />
                  <span className="font-mono text-[11px] text-zinc-600">
                    {source.healthy
                      ? 'Coral source healthy'
                      : `Run coral source add ${source.id}`}
                  </span>
                </div>
              </div>
            </div>
          </PanelShell>
        );
      })}
    </div>
  );
}
