import { Play, Square } from 'lucide-react';
import { useSourceStatus } from '@/lib/hooks/useSourceStatus';
import {
  useSchedulerStartMutation,
  useSchedulerStopMutation,
} from '@/lib/hooks/useSchedulerMutation';
import { cn } from '@/lib/utils';
import { ErrorState } from './StateViews';

interface SchedulerToggleProps {
  className?: string;
}

export function SchedulerToggle({ className }: SchedulerToggleProps) {
  const { data: status } = useSourceStatus();
  const start = useSchedulerStartMutation();
  const stop = useSchedulerStopMutation();

  const running = status?.schedulerRunning ?? false;
  const pending = start.isPending || stop.isPending;
  const error = start.error ?? stop.error;

  const handleClick = () => {
    if (pending) return;
    if (running) {
      stop.mutate();
    } else {
      start.mutate();
    }
  };

  return (
    <div className={cn('flex flex-col items-end gap-1', className)}>
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className={cn(
          'inline-flex items-center gap-2 rounded-md border px-3 py-1.5 font-mono text-[12px] transition-colors disabled:cursor-not-allowed disabled:opacity-60',
          running
            ? 'border-red-500/30 bg-red-500/5 text-red-300 hover:border-red-500/50 hover:bg-red-500/10'
            : 'border-emerald-500/30 bg-emerald-500/5 text-emerald-300 hover:border-emerald-500/50 hover:bg-emerald-500/10',
        )}
        title={running ? 'Stop 6h refresh scheduler' : 'Start 6h refresh scheduler'}
      >
        {running ? (
          <>
            <Square className="h-3.5 w-3.5" strokeWidth={2} />
            Stop scheduler
          </>
        ) : (
          <>
            <Play className="h-3.5 w-3.5" strokeWidth={2} />
            Start scheduler
          </>
        )}
      </button>
      {error ? <ErrorState message={error.message} className="max-w-xs text-left" /> : null}
    </div>
  );
}
