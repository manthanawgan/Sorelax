import { RefreshCw } from 'lucide-react';
import { AgentStatusBadge } from '../components/AgentStatusBadge';
import { useDashboardStatus } from '../hooks/useDashboardStatus';
import type { DashboardSection } from '../types';
import { NAV_ITEMS } from '../nav';

interface TopBarProps {
  activeSection: DashboardSection;
}

function formatRelativeTime(iso: string | null): string {
  if (!iso) return 'never';
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor(diff / (1000 * 60));
  if (hours >= 1) return `${hours}h ago`;
  if (minutes >= 1) return `${minutes}m ago`;
  return 'just now';
}

function formatAbsoluteTime(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function TopBar({ activeSection }: TopBarProps) {
  const status = useDashboardStatus();
  const section = NAV_ITEMS.find((n) => n.id === activeSection);

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
          <div className="text-right">
            <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-600">
              Last refresh
            </p>
            <p
              className="font-mono text-[13px] text-zinc-400"
              title={formatAbsoluteTime(status.lastRefresh)}
            >
              {formatRelativeTime(status.lastRefresh)}
            </p>
          </div>
          <div className="h-8 w-px bg-zinc-800" />
          <div className="text-right">
            <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-600">
              Next refresh
            </p>
            <p
              className="font-mono text-[13px] text-zinc-500"
              title={formatAbsoluteTime(status.nextRefresh)}
            >
              {status.schedulerRunning && status.nextRefresh
                ? formatAbsoluteTime(status.nextRefresh)
                : 'manual'}
            </p>
          </div>
        </div>

        <AgentStatusBadge
          state={status.agentState}
          schedulerRunning={status.schedulerRunning}
        />

        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-950 px-3 py-1.5 font-mono text-[12px] text-zinc-400 transition-colors hover:border-coral-500/30 hover:bg-coral-500/5 hover:text-coral-400"
          title="Refresh context (coming soon)"
        >
          <RefreshCw className="h-3.5 w-3.5" strokeWidth={2} />
          <span className="hidden md:inline">Refresh</span>
        </button>
      </div>
    </header>
  );
}
