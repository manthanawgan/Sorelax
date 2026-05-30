import { PanelShell, PlaceholderBlock } from '../components/PanelShell';

const MOCK_LOGS = [
  { time: '2026-05-30 08:14', rows: 847, status: 'ok' as const },
  { time: '2026-05-30 02:14', rows: 831, status: 'ok' as const },
  { time: '2026-05-29 20:14', rows: 819, status: 'ok' as const },
  { time: '2026-05-29 14:14', rows: 0, status: 'error' as const },
  { time: '2026-05-29 08:14', rows: 802, status: 'ok' as const },
];

export function LogsPanel() {
  return (
    <PanelShell
      title="Refresh logs"
      subtitle="Last 10 entries from ~/.sorelax/project_log.jsonl"
      badge="jsonl"
    >
      <div className="overflow-hidden rounded-md border border-zinc-800/50 font-mono text-[13px]">
        <div className="grid grid-cols-[180px_80px_80px_1fr] gap-4 border-b border-zinc-800/50 bg-zinc-900/30 px-4 py-2.5 text-[10px] uppercase tracking-widest text-zinc-600">
          <span>Timestamp</span>
          <span>Rows</span>
          <span>Status</span>
          <span>Source counts</span>
        </div>
        {MOCK_LOGS.map((log, i) => (
          <div
            key={i}
            className="grid grid-cols-[180px_80px_80px_1fr] items-center gap-4 border-b border-zinc-800/30 px-4 py-3 last:border-0 hover:bg-zinc-900/20"
          >
            <span className="text-zinc-500">{log.time}</span>
            <span className="text-zinc-400">{log.rows || '—'}</span>
            <span className={log.status === 'ok' ? 'text-emerald-500' : 'text-red-400'}>
              {log.status}
            </span>
            <PlaceholderBlock lines={1} />
          </div>
        ))}
      </div>
    </PanelShell>
  );
}
