import { AgentStatusBadge } from '../components/AgentStatusBadge';
import { RefreshButton } from '../components/RefreshButton';
import { SchedulerToggle } from '../components/SchedulerToggle';
import { useSourceStatus } from '@/lib/hooks/useSourceStatus';
import type { DashboardSection } from '../types';
import { NAV_ITEMS } from '../nav';
import { formatAbsoluteTime, formatRelativeTime } from '../utils/format';
import { LoadingSkeleton } from '../components/StateViews';

interface TopBarProps {
  activeSection: DashboardSection;
}

export function TopBar({ activeSection }: TopBarProps) {
  const { data: status, isLoading, isError } = useSourceStatus();
  const section = NAV_ITEMS.find((item) => item.id === activeSection);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-800/60 bg-[#0a0a0a]/80 px-6 backdrop-blur-sm">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="font-mono text-sm font-medium text-white">{section?.label ?? 'Dashboard'}</h1>
          <p className="font-sans text-[12px] text-zinc-600">{section?.description}</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden items-center gap-3 sm:flex">
          {isLoading ? (
            <LoadingSkeleton lines={2} className="w-28" />
          ) : (
            <>
              <div className="text-right">
                <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-600">
                  Last refresh
                </p>
                <p
                  className="font-mono text-[13px] text-zinc-400"
                  title={formatAbsoluteTime(status?.lastRefresh ?? null)}
                >
                  {isError ? '—' : formatRelativeTime(status?.lastRefresh ?? null)}
                </p>
              </div>
              <div className="h-8 w-px bg-zinc-800" />
              <div className="text-right">
                <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-600">
                  Next refresh
                </p>
                <p
                  className="font-mono text-[13px] text-zinc-500"
                  title={formatAbsoluteTime(status?.nextRefresh ?? null)}
                >
                  {status?.schedulerRunning && status.nextRefresh
                    ? formatAbsoluteTime(status.nextRefresh)
                    : 'manual'}
                </p>
              </div>
            </>
          )}
        </div>

        {status ? (
          <AgentStatusBadge
            state={status.agentState}
            schedulerRunning={status.schedulerRunning}
          />
        ) : null}

        <SchedulerToggle />
        <RefreshButton />
      </div>
    </header>
  );
}
