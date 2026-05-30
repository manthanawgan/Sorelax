import { useSourceStatus } from '@/lib/hooks/useSourceStatus';
import { formatAbsoluteTime, formatRelativeTime } from '../utils/format';
import { LoadingSkeleton } from './StateViews';

export function SidebarFooter() {
  const { data, isLoading, isError } = useSourceStatus();

  if (isLoading) {
    return (
      <div className="space-y-2">
        <LoadingSkeleton lines={2} />
      </div>
    );
  }

  const lastRefresh = data?.lastRefresh ?? null;
  const schedulerLabel = data?.schedulerRunning ? 'scheduler on' : 'scheduler off';

  return (
    <div className="space-y-1.5 font-mono text-[11px]">
      <div className="flex items-center justify-between gap-2 text-zinc-500">
        <span className="uppercase tracking-widest text-zinc-600">Last refresh</span>
        <span className="text-zinc-400" title={formatAbsoluteTime(lastRefresh)}>
          {isError ? 'unavailable' : formatRelativeTime(lastRefresh)}
        </span>
      </div>
      <div className="flex items-center justify-between gap-2 text-zinc-500">
        <span className="uppercase tracking-widest text-zinc-600">Scheduler</span>
        <span className={data?.schedulerRunning ? 'text-emerald-400' : 'text-zinc-600'}>
          {isError ? 'unknown' : schedulerLabel}
        </span>
      </div>
    </div>
  );
}
