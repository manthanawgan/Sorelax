import { RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { useRefreshMutation } from '@/lib/hooks/useRefreshMutation';
import { cn } from '@/lib/utils';
import { RefreshProgress } from './RefreshProgress';
import { ErrorState } from './StateViews';

interface RefreshButtonProps {
  compact?: boolean;
  className?: string;
}

export function RefreshButton({ compact = false, className }: RefreshButtonProps) {
  const refresh = useRefreshMutation();
  const [lines, setLines] = useState<string[]>([]);

  const handleRefresh = () => {
    setLines([]);
    refresh.mutate({
      onStart: (message) => setLines([message]),
      onLog: (line) => setLines((current) => [...current, line]),
    });
  };

  return (
    <div className={cn('flex flex-col items-end gap-2', className)}>
      <button
        type="button"
        onClick={handleRefresh}
        disabled={refresh.isPending}
        className="inline-flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-950 px-3 py-1.5 font-mono text-[12px] text-zinc-400 transition-colors hover:border-coral-500/30 hover:bg-coral-500/5 hover:text-coral-400 disabled:cursor-not-allowed disabled:opacity-60"
        title="Run full Coral → Gemini refresh"
      >
        <RefreshCw
          className={cn('h-3.5 w-3.5', refresh.isPending && 'animate-spin')}
          strokeWidth={2}
        />
        {!compact && <span className="hidden md:inline">Refresh</span>}
      </button>

      {refresh.isPending ? <RefreshProgress lines={lines} className="w-full min-w-[220px]" /> : null}
      {refresh.isError ? (
        <ErrorState message={refresh.error.message} className="w-full min-w-[220px] text-left" />
      ) : null}
    </div>
  );
}
