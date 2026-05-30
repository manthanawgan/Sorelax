import type { UseMutationResult } from '@tanstack/react-query';
import type { AskRequest, AskResponse, AskRow } from '@/lib/types/ask';
import { cn } from '@/lib/utils';
import { EmptyState, ErrorState } from './StateViews';

function sourceBadgeClass(sourceType: string): string {
  if (sourceType.startsWith('github')) return 'border-coral-500/30 text-coral-400 bg-coral-500/10';
  if (sourceType.startsWith('linear')) return 'border-violet-500/30 text-violet-300 bg-violet-500/10';
  if (sourceType.startsWith('slack')) return 'border-sky-500/30 text-sky-300 bg-sky-500/10';
  if (sourceType.startsWith('notion')) return 'border-amber-500/30 text-amber-300 bg-amber-500/10';
  return 'border-zinc-700 text-zinc-400 bg-zinc-900';
}

function SourceTypeBadge({ sourceType }: { sourceType: string }) {
  const label = sourceType.split('.')[1] ?? sourceType;

  return (
    <span
      className={cn(
        'inline-flex rounded border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide',
        sourceBadgeClass(sourceType),
      )}
    >
      {label}
    </span>
  );
}

function AskResultRow({ row }: { row: AskRow }) {
  return (
    <div className="grid grid-cols-[110px_1fr_1fr_100px] gap-4 border-b border-zinc-800/30 px-4 py-3 last:border-0 hover:bg-zinc-900/20">
      <SourceTypeBadge sourceType={row.source_type} />
      <span className="truncate font-mono text-[13px] text-zinc-300" title={row.title}>
        {row.title || '—'}
      </span>
      <span className="truncate font-mono text-[13px] text-zinc-500" title={row.detail}>
        {row.detail || '—'}
      </span>
      <span className="truncate font-mono text-[12px] text-zinc-600" title={row.extra}>
        {row.extra || '—'}
      </span>
    </div>
  );
}

interface AskResultsProps {
  ask: UseMutationResult<AskResponse, Error, AskRequest>;
}

export function AskResults({ ask }: AskResultsProps) {
  if (ask.isIdle) {
    return (
      <EmptyState
        title="Ask a question"
        description="Search across GitHub, Linear, Slack, and Notion with a natural-language query. Press / to focus the input."
      />
    );
  }

  if (ask.isPending) {
    return (
      <div className="space-y-3 px-1 py-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-10 animate-pulse rounded-md bg-zinc-800/40" />
        ))}
      </div>
    );
  }

  if (ask.isError) {
    return <ErrorState message={ask.error.message} />;
  }

  if (!ask.data || ask.data.rows.length === 0) {
    return (
      <EmptyState
        title="No matching rows"
        description={`Coral returned no results for keyword "${ask.data?.keyword ?? 'unknown'}". Try a more specific term.`}
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-md border border-zinc-800/50">
      <div className="border-b border-zinc-800/50 bg-zinc-900/30 px-4 py-2.5">
        <p className="font-mono text-[11px] text-zinc-500">
          Keyword <span className="text-coral-400">{ask.data.keyword}</span> · {ask.data.rows.length}{' '}
          row{ask.data.rows.length === 1 ? '' : 's'}
        </p>
      </div>
      <div className="grid grid-cols-[110px_1fr_1fr_100px] gap-4 border-b border-zinc-800/50 bg-zinc-900/30 px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest text-zinc-600">
        <span>Source</span>
        <span>Title</span>
        <span>Detail</span>
        <span>Extra</span>
      </div>
      {ask.data.rows.map((row, index) => (
        <AskResultRow key={`${row.source_type}-${row.title}-${index}`} row={row} />
      ))}
    </div>
  );
}
