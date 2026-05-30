import { cn } from '@/lib/utils';
import type { AgentState } from '@/lib/types/status';

const STATE_CONFIG: Record<
  AgentState,
  { label: string; dot: string; ring: string; text: string }
> = {
  active: {
    label: 'Agent active',
    dot: 'bg-emerald-400',
    ring: 'shadow-[0_0_0_3px_rgba(52,211,153,0.15)]',
    text: 'text-emerald-400',
  },
  idle: {
    label: 'Agent idle',
    dot: 'bg-amber-400',
    ring: 'shadow-[0_0_0_3px_rgba(251,191,36,0.12)]',
    text: 'text-amber-400',
  },
  stopped: {
    label: 'Agent stopped',
    dot: 'bg-zinc-500',
    ring: '',
    text: 'text-zinc-500',
  },
  error: {
    label: 'Agent error',
    dot: 'bg-red-400',
    ring: 'shadow-[0_0_0_3px_rgba(248,113,113,0.15)]',
    text: 'text-red-400',
  },
};

interface AgentStatusBadgeProps {
  state: AgentState;
  schedulerRunning?: boolean;
  compact?: boolean;
}

export function AgentStatusBadge({
  state,
  schedulerRunning,
  compact = false,
}: AgentStatusBadgeProps) {
  const config = STATE_CONFIG[state];

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full border border-zinc-800/80 bg-zinc-950/60',
        compact ? 'px-2.5 py-1' : 'px-3 py-1.5',
      )}
    >
      <span className="relative flex h-2 w-2">
        <span
          className={cn(
            'absolute inline-flex h-full w-full animate-ping rounded-full opacity-40',
            config.dot,
            state !== 'active' && 'hidden',
          )}
        />
        <span
          className={cn('relative inline-flex h-2 w-2 rounded-full', config.dot, config.ring)}
        />
      </span>
      <span className={cn('font-mono text-[11px] font-medium tracking-wide', config.text)}>
        {config.label}
      </span>
      {!compact && schedulerRunning !== undefined && (
        <>
          <span className="text-zinc-700">·</span>
          <span className="font-mono text-[11px] text-zinc-500">
            sched {schedulerRunning ? 'on' : 'off'}
          </span>
        </>
      )}
    </div>
  );
}
