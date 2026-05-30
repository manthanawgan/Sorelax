import { GitHubIcon, LinearIcon, NotionIcon, SlackIcon } from '@/lib/icons';
import { PanelShell } from '../components/PanelShell';

const SOURCES = [
  {
    name: 'GitHub',
    Icon: GitHubIcon,
    connected: true,
    tables: ['github.commits', 'github.pull_requests'],
    count: '312 commits · 4 PRs',
  },
  {
    name: 'Linear',
    Icon: LinearIcon,
    connected: true,
    tables: ['linear.issues'],
    count: '28 open issues',
  },
  {
    name: 'Slack',
    Icon: SlackIcon,
    connected: true,
    tables: ['slack.messages'],
    count: '1.2k messages (7d)',
  },
  {
    name: 'Notion',
    Icon: NotionIcon,
    connected: false,
    tables: ['notion.pages'],
    count: 'Not connected',
  },
] as const;

export function SourcesPanel() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {SOURCES.map(({ name, Icon, connected, tables, count }) => (
        <PanelShell
          key={name}
          title={name}
          badge={connected ? 'connected' : 'offline'}
        >
          <div className="flex items-start gap-4">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md border ${
                connected
                  ? 'border-zinc-700 bg-zinc-900 text-zinc-300'
                  : 'border-zinc-800 bg-zinc-950 text-zinc-700'
              }`}
            >
              <Icon size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-mono text-[13px] text-zinc-400">{count}</p>
              <div className="mt-3 space-y-1">
                {tables.map((table) => (
                  <code
                    key={table}
                    className="block truncate rounded bg-zinc-900/80 px-2 py-1 font-mono text-[11px] text-coral-400/80"
                  >
                    {table}
                  </code>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    connected
                      ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                      : 'bg-zinc-700'
                  }`}
                />
                <span className="font-mono text-[11px] text-zinc-600">
                  {connected ? 'Coral source healthy' : 'Run coral source add notion'}
                </span>
              </div>
            </div>
          </div>
        </PanelShell>
      ))}
    </div>
  );
}
