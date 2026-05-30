import { PanelShell } from '../components/PanelShell';

const SETTINGS_GROUPS = [
  {
    title: 'Repository',
    fields: [
      { label: 'GITHUB_OWNER', value: '—', hint: 'from .env' },
      { label: 'GITHUB_REPO', value: '—', hint: 'from .env' },
    ],
  },
  {
    title: 'Scheduler',
    fields: [
      { label: 'Interval', value: '6 hours', hint: 'APScheduler daemon' },
      { label: 'PID file', value: '~/.sorelax/sorelax.pid', hint: '' },
    ],
  },
  {
    title: 'Paths',
    fields: [
      { label: 'Context', value: '~/.sorelax/project_context.json', hint: '' },
      { label: 'Logs', value: '~/.sorelax/project_log.jsonl', hint: '' },
      { label: 'Output', value: './CLAUDE.md', hint: 'repo root' },
    ],
  },
] as const;

export function SettingsPanel() {
  return (
    <div className="space-y-4">
      {SETTINGS_GROUPS.map((group) => (
        <PanelShell key={group.title} title={group.title}>
          <dl className="space-y-3">
            {group.fields.map((field) => (
              <div
                key={field.label}
                className="flex flex-col gap-1 rounded-md border border-zinc-800/40 bg-zinc-950/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <dt className="font-mono text-[12px] text-zinc-500">{field.label}</dt>
                <dd className="text-right">
                  <span className="font-mono text-[13px] text-zinc-300">{field.value}</span>
                  {field.hint && (
                    <span className="ml-2 font-sans text-[11px] text-zinc-600">{field.hint}</span>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </PanelShell>
      ))}
    </div>
  );
}
