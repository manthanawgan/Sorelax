import { GitHubIcon, LinearIcon, NotionIcon, SlackIcon } from '@/lib/icons';
import type { SourceIndicator } from '@/lib/types/status';
import { useSourceStatus } from '@/lib/hooks/useSourceStatus';
import { SourceIndicatorDot } from './SourceIndicator';
import { ErrorState, LoadingSkeleton } from './StateViews';

const SOURCE_ICONS = {
  github: GitHubIcon,
  linear: LinearIcon,
  slack: SlackIcon,
  notion: NotionIcon,
} as const;

export function SourceHealthList() {
  const { data, isLoading, isError, error } = useSourceStatus();

  if (isLoading) {
    return <LoadingSkeleton lines={1} className="h-8" />;
  }

  if (isError) {
    return <ErrorState message={error?.message ?? 'Failed to load sources'} className="py-2" />;
  }

  const sources = data?.sources ?? [];

  return (
    <div className="grid grid-cols-4 gap-1.5">
      {sources.map((source) => (
        <SourceHealthItem key={source.id} source={source} />
      ))}
    </div>
  );
}

function SourceHealthItem({ source }: { source: SourceIndicator }) {
  const Icon = SOURCE_ICONS[source.id];

  return (
    <div
      title={`${source.name}: ${source.healthy ? 'connected' : 'disconnected'} · ${source.count}`}
      className="group relative flex flex-col items-center gap-1 rounded-md border border-zinc-800/40 bg-zinc-950/50 px-1 py-2 transition-colors hover:border-zinc-700/60"
    >
      <Icon size={14} className={source.healthy ? 'text-zinc-400' : 'text-zinc-700'} />
      <SourceIndicatorDot
        healthy={source.healthy}
        title={source.healthy ? 'healthy' : 'unavailable'}
      />
    </div>
  );
}
