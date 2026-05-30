import { PanelShell, PlaceholderBlock, EmptyMetric } from '../components/PanelShell';

const CONTEXT_SECTIONS = [
  { key: 'active_work', label: 'Active work' },
  { key: 'recent_commits', label: 'Recent commits' },
  { key: 'open_prs', label: 'Open PRs' },
  { key: 'sprint_goal', label: 'Sprint goal' },
  { key: 'key_decisions', label: 'Key decisions' },
  { key: 'slack_threads', label: 'Slack threads' },
  { key: 'architecture', label: 'Architecture docs' },
] as const;

export function DashboardPanel() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <EmptyMetric label="Rows joined" value="—" hint="From last Coral refresh" />
        <EmptyMetric label="Sources" value="3 / 4" hint="Notion pending connection" />
        <EmptyMetric label="Context age" value="2h" hint="project_context.json" />
      </div>

      <PanelShell
        title="Context feed"
        subtitle="Gemini-summarised snapshot from GitHub, Linear, Slack, and Notion"
        badge="live"
      >
        <div className="grid gap-4 lg:grid-cols-2">
          {CONTEXT_SECTIONS.map((section) => (
            <div
              key={section.key}
              className="rounded-md border border-zinc-800/50 bg-zinc-950/50 p-4"
            >
              <h3 className="mb-3 font-mono text-[11px] font-medium uppercase tracking-widest text-zinc-500">
                {section.label}
              </h3>
              <PlaceholderBlock lines={3} />
            </div>
          ))}
        </div>
      </PanelShell>
    </div>
  );
}
