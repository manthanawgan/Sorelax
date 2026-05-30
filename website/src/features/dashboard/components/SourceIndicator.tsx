import { cn } from '@/lib/utils';
import type { SourceIndicator as SourceIndicatorType } from '@/lib/types/status';

interface SourceIndicatorProps {
  source: SourceIndicatorType;
  compact?: boolean;
}

function healthColor(healthy: boolean, loading: boolean): string {
  if (loading) return 'bg-zinc-600';
  if (healthy) return 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.45)]';
  return 'bg-red-500/80 shadow-[0_0_8px_rgba(248,113,113,0.35)]';
}

export function SourceIndicator({ source, compact = false }: SourceIndicatorProps) {
  const dotClass = healthColor(source.healthy, false);

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-md border border-zinc-800/50 bg-zinc-950/60',
        compact ? 'px-2 py-1' : 'px-3 py-2',
      )}
      title={`${source.name}: ${source.healthy ? 'healthy' : 'unavailable'} · ${source.count} items`}
    >
      <span className={cn('h-2 w-2 shrink-0 rounded-full', dotClass)} />
      <span className="font-mono text-[11px] text-zinc-400">{source.name}</span>
      {!compact && (
        <span className="ml-auto rounded border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-zinc-500">
          {source.count}
        </span>
      )}
    </div>
  );
}

interface SourceIndicatorDotProps {
  healthy: boolean | null;
  title: string;
}

export function SourceIndicatorDot({ healthy, title }: SourceIndicatorDotProps) {
  const dotClass =
    healthy === null
      ? 'bg-zinc-600'
      : healthy
        ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]'
        : 'bg-red-500/80 shadow-[0_0_6px_rgba(248,113,113,0.35)]';

  return (
    <span
      title={title}
      className={cn('inline-block h-1.5 w-1.5 rounded-full', dotClass)}
    />
  );
}
