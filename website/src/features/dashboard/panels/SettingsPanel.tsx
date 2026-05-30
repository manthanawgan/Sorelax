import type { ReactNode } from 'react';
import { PanelShell } from '../components/PanelShell';
import { CopyButton } from '../components/CopyButton';
import { useSourceStatus } from '@/lib/hooks/useSourceStatus';
import { formatRelativeTime } from '../utils/format';
import { ErrorState, LoadingSkeleton } from '../components/StateViews';

const PATH_FIELDS = [
  { label: 'Context', value: '~/.sorelax/project_context.json', id: 'path-context' },
  { label: 'Logs', value: '~/.sorelax/project_log.jsonl', id: 'path-logs' },
  { label: 'PID file', value: '~/.sorelax/sorelax.pid', id: 'path-pid' },
  { label: 'Output', value: './CLAUDE.md', id: 'path-output' },
] as const;

export function SettingsPanel() {
  const { data: status, isLoading, isError, error } = useSourceStatus();

  return (
    <div className="space-y-4">
      <PanelShell title="Scheduler" subtitle="Background refresh daemon (6h interval)">
        {isLoading ? (
          <LoadingSkeleton lines={2} />
        ) : isError ? (
          <ErrorState message={error?.message ?? 'Failed to load scheduler status'} />
        ) : (
          <dl className="space-y-3">
            <SettingRow label="Status">
              <span className={status?.schedulerRunning ? 'text-emerald-400' : 'text-zinc-500'}>
                {status?.schedulerRunning ? 'Running' : 'Stopped'}
              </span>
            </SettingRow>
            <SettingRow label="Last refresh">
              {formatRelativeTime(status?.lastRefresh ?? null)}
            </SettingRow>
            <SettingRow label="Next refresh">
              {status?.schedulerRunning && status.nextRefresh
                ? formatRelativeTime(status.nextRefresh)
                : 'Manual only'}
            </SettingRow>
            <SettingRow label="Interval">6 hours</SettingRow>
          </dl>
        )}
        <p className="mt-4 font-sans text-[12px] text-zinc-600">
          Use Start/Stop scheduler in the top bar. Environment tokens are managed via{' '}
          <code className="rounded bg-zinc-900 px-1 py-0.5 font-mono text-[11px] text-zinc-400">
            sorelax init
          </code>{' '}
          — not editable from the dashboard.
        </p>
      </PanelShell>

      <PanelShell title="Paths" subtitle="Local files used by the agent">
        <dl className="space-y-3">
          {PATH_FIELDS.map((field) => (
            <div
              key={field.id}
              className="flex flex-col gap-2 rounded-md border border-zinc-800/40 bg-zinc-950/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <dt className="font-mono text-[12px] text-zinc-500">{field.label}</dt>
              <dd className="flex items-center gap-2 sm:justify-end">
                <code className="font-mono text-[13px] text-zinc-300">{field.value}</code>
                <CopyButton value={field.value} id={field.id} />
              </dd>
            </div>
          ))}
        </dl>
      </PanelShell>
    </div>
  );
}

function SettingRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 rounded-md border border-zinc-800/40 bg-zinc-950/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <dt className="font-mono text-[12px] text-zinc-500">{label}</dt>
      <dd className="font-mono text-[13px] text-zinc-300">{children}</dd>
    </div>
  );
}
