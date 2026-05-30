import type { RefreshLogEntry } from '@/lib/types/logs';
import { cn } from '@/lib/utils';
import { formatLogTimestamp, formatSourceCounts } from '../utils/format';

interface LogEntryRowProps {
  entry: RefreshLogEntry;
  compact?: boolean;
  onSelect?: () => void;
}

export function LogEntryRow({ entry, compact = false, onSelect }: LogEntryRowProps) {
  const statusClass = entry.status === 'ok' ? 'text-emerald-500' : 'text-red-400';
  const interactive = Boolean(onSelect);

  const rowClass = cn(
    'border-b border-zinc-800/30 last:border-0',
    interactive && 'cursor-pointer hover:bg-zinc-900/30 focus-visible:bg-zinc-900/30 focus-visible:outline-none',
  );

  if (compact) {
    return (
      <button
        type="button"
        onClick={onSelect}
        disabled={!interactive}
        className={cn('w-full px-3 py-2.5 text-left', rowClass, !interactive && 'cursor-default')}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[11px] text-zinc-500">
            {formatLogTimestamp(entry.timestamp)}
          </span>
          <span className={cn('font-mono text-[11px] uppercase', statusClass)}>{entry.status}</span>
        </div>
        <p className="mt-1 font-mono text-[12px] text-zinc-400">{entry.row_count || '—'} rows</p>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={!interactive}
      className={cn(
        'grid w-full grid-cols-[180px_80px_80px_1fr] items-start gap-4 px-4 py-3 text-left',
        rowClass,
        !interactive && 'cursor-default',
      )}
    >
      <span className="font-mono text-[13px] text-zinc-500">
        {formatLogTimestamp(entry.timestamp)}
      </span>
      <span className="font-mono text-[13px] text-zinc-400">{entry.row_count || '—'}</span>
      <span className={cn('font-mono text-[13px] uppercase', statusClass)}>{entry.status}</span>
      <div className="min-w-0">
        <p className="truncate font-mono text-[12px] text-zinc-500">
          {formatSourceCounts(entry.source_counts)}
        </p>
        {entry.warnings.length > 0 ? (
          <p className="mt-1 font-mono text-[11px] text-amber-400/80">
            {entry.warnings.join(' · ')}
          </p>
        ) : null}
      </div>
    </button>
  );
}
