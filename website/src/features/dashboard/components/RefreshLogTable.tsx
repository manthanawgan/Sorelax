import { useState } from 'react';
import { useRefreshLogs } from '@/lib/hooks/useRefreshLogs';
import type { RefreshLogEntry } from '@/lib/types/logs';
import { cn } from '@/lib/utils';
import { LogEntryRow } from './LogEntryRow';
import { LogDetailDrawer } from './LogDetailDrawer';
import { EmptyState, ErrorState, LoadingSkeleton } from './StateViews';

interface RefreshLogTableProps {
  compact?: boolean;
  className?: string;
}

function sortNewestFirst(entries: RefreshLogEntry[]): RefreshLogEntry[] {
  return [...entries].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
}

export function RefreshLogTable({ compact = false, className }: RefreshLogTableProps) {
  const { data, isLoading, isError, error } = useRefreshLogs();
  const [selected, setSelected] = useState<RefreshLogEntry | null>(null);

  if (isLoading) {
    return <LoadingSkeleton lines={compact ? 5 : 6} className={className} />;
  }

  if (isError) {
    return <ErrorState message={error?.message ?? 'Failed to load refresh logs'} className={className} />;
  }

  const logs = sortNewestFirst(data ?? []);

  if (logs.length === 0) {
    return (
      <EmptyState
        title="No refresh logs"
        description="Logs appear in ~/.sorelax/project_log.jsonl after the first successful refresh."
        className={className}
      />
    );
  }

  const handleSelect = (entry: RefreshLogEntry) => {
    setSelected(entry);
  };

  if (compact) {
    return (
      <>
        <div className={cn('overflow-hidden rounded-md border border-zinc-800/50 font-mono text-[13px]', className)}>
          {logs.slice(0, 12).map((entry) => (
            <LogEntryRow
              key={entry.timestamp}
              entry={entry}
              compact
              onSelect={() => handleSelect(entry)}
            />
          ))}
        </div>
        <LogDetailDrawer entry={selected} onClose={() => setSelected(null)} />
      </>
    );
  }

  return (
    <>
      <div className={cn('overflow-hidden rounded-md border border-zinc-800/50 font-mono text-[13px]', className)}>
        <div className="grid grid-cols-[180px_80px_80px_1fr] gap-4 border-b border-zinc-800/50 bg-zinc-900/30 px-4 py-2.5 text-[10px] uppercase tracking-widest text-zinc-600">
          <span>Timestamp</span>
          <span>Rows</span>
          <span>Status</span>
          <span>Source counts</span>
        </div>
        {logs.map((entry) => (
          <LogEntryRow key={entry.timestamp} entry={entry} onSelect={() => handleSelect(entry)} />
        ))}
      </div>
      <LogDetailDrawer entry={selected} onClose={() => setSelected(null)} />
    </>
  );
}
