import { useState, useEffect, useCallback, useRef } from 'react';
import CodeBlock from '../components/CodeBlock';
import Terminal from '../components/Terminal';
import InfoBox from '../components/InfoBox';
import {
  firstRunTerminalLines,
  refreshCommandLines,
  askCommandLines,
  statusCommandLines,
  logsCommandLines,
  startStopCommandLines,
} from '../lib/terminal-lines';

interface NavSection {
  title: string;
  items: { id: string; label: string }[];
}

const navSections: NavSection[] = [
  {
    title: 'Getting started',
    items: [
      { id: 'installation', label: 'Installation' },
      { id: 'api-tokens', label: 'API tokens' },
      { id: 'first-run', label: 'First run' },
    ],
  },
  {
    title: 'Configuration',
    items: [
      { id: 'environment-variables', label: 'Environment variables' },
      { id: 'changing-refresh-interval', label: 'Changing refresh interval' },
      { id: 'customising-sources', label: 'Customising sources' },
    ],
  },
  {
    title: 'CLI reference',
    items: [
      { id: 'sorelax-refresh', label: 'sorelax refresh' },
      { id: 'sorelax-ask', label: 'sorelax ask' },
      { id: 'sorelax-status', label: 'sorelax status' },
      { id: 'sorelax-logs', label: 'sorelax logs' },
      { id: 'sorelax-start', label: 'sorelax start' },
      { id: 'sorelax-stop', label: 'sorelax stop' },
    ],
  },
  {
    title: 'How it works',
    items: [
      { id: 'the-coral-sql-query', label: 'The Coral SQL query' },
      { id: 'gemini-summarisation', label: 'Gemini summarisation' },
      { id: 'claude-md-output', label: 'CLAUDE.md output' },
      { id: 'hermes-agent-memory', label: 'Hermes Agent memory' },
    ],
  },
  {
    title: 'Troubleshooting',
    items: [
      { id: 'slack-auth-issues', label: 'Slack auth issues' },
      { id: 'source-not-found', label: 'Source not found' },
      { id: 'gemini-errors', label: 'Gemini errors' },
    ],
  },
];

function Sidebar({ activeId, onNavigate }: { activeId: string; onNavigate: (id: string) => void }) {
  return (
    <aside className="hidden md:block w-[240px] flex-shrink-0">
      <div className="sticky top-[72px] overflow-y-auto max-h-[calc(100vh-100px)] pr-4">
        {navSections.map((section) => (
          <div key={section.title} className="mb-6">
            <h3 className="text-[11px] text-[#333333] uppercase tracking-[0.12em] font-medium mb-2 px-3">
              {section.title}
            </h3>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = activeId === item.id;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => onNavigate(item.id)}
                      className={`w-full text-left px-3 py-1.5 text-sm rounded-button transition-colors duration-150 border-l-2 ${
                        isActive
                          ? 'text-white border-l-accent'
                          : 'text-text-tertiary border-l-transparent hover:text-text-secondary'
                      }`}
                    >
                      {item.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </aside>
  );
}

function MobileNav({ activeId, onNavigate }: { activeId: string; onNavigate: (id: string) => void }) {
  return (
    <div className="md:hidden mb-8">
      <select
        value={activeId}
        onChange={(e) => onNavigate(e.target.value)}
        className="w-full px-4 py-2.5 rounded-card border border-border bg-surface text-sm text-white appearance-none cursor-pointer focus:outline-none focus:border-text-tertiary"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23555555' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 12px center',
        }}
      >
        {navSections.map((section) => (
          <optgroup key={section.title} label={section.title}>
            {section.items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
}

export default function DocsPage() {
  const [activeId, setActiveId] = useState('installation');
  const contentRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());

  const handleNavigate = useCallback((id: string) => {
    setActiveId(id);
    const el = sectionRefs.current.get(id);
    if (el) {
      const navHeight = 72;
      const top = el.getBoundingClientRect().top + window.scrollY - navHeight - 16;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }, []);

  // Track active section on scroll
  useEffect(() => {
    const handleScroll = () => {
      const navHeight = 72;
      let current = 'installation';

      for (const [id, el] of sectionRefs.current) {
        const rect = el.getBoundingClientRect();
        if (rect.top <= navHeight + 50) {
          current = id;
        }
      }
      setActiveId(current);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const setSectionRef = useCallback((id: string, el: HTMLElement | null) => {
    if (el) {
      sectionRefs.current.set(id, el);
    }
  }, []);

  return (
    <div className="max-w-[1000px] mx-auto px-6 py-12 flex gap-20">
      <Sidebar activeId={activeId} onNavigate={handleNavigate} />

      <div ref={contentRef} className="flex-1 min-w-0 max-w-content">
        <MobileNav activeId={activeId} onNavigate={handleNavigate} />

        {/* ─── GETTING STARTED ─── */}
        <section className="mb-16">
          <h2 className="text-xs uppercase tracking-[0.12em] text-[#333333] font-medium mb-6">Getting started</h2>

          {/* Installation */}
          <div ref={(el) => setSectionRef('installation', el)} id="installation" className="mb-12 scroll-mt-[88px]">
            <h3 className="text-xl font-semibold text-white mb-4">Installation</h3>
            <p className="text-text-secondary text-[15px] leading-relaxed mb-4">
              Sorelax installs everything in one command. You'll need Homebrew on macOS or Linux.
            </p>
            <CodeBlock code="curl -fsSL https://sorelax.dev/install.sh | bash" className="mb-6" />
            <p className="text-text-secondary text-[15px] leading-relaxed mb-4">The installer will:</p>
            <ul className="space-y-2 mb-6">
              {[
                'Install Coral via Homebrew',
                'Install Hermes Agent and Python dependencies',
                'Walk you through adding your API tokens',
                'Connect all four data sources',
                'Run your first context refresh automatically',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-[15px] text-text-secondary">
                  <span className="text-success mt-1 flex-shrink-0">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* API tokens */}
          <div ref={(el) => setSectionRef('api-tokens', el)} id="api-tokens" className="mb-12 scroll-mt-[88px]">
            <h3 className="text-xl font-semibold text-white mb-4">API tokens</h3>
            <p className="text-text-secondary text-[15px] leading-relaxed mb-4">
              You need five tokens. The installer will ask for each one interactively.
            </p>

            {/* Token table */}
            <div className="rounded-card border border-border overflow-hidden mb-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface/50">
                      <th className="text-left px-4 py-3 text-text-secondary font-medium">Token</th>
                      <th className="text-left px-4 py-3 text-text-secondary font-medium">Where to get it</th>
                      <th className="text-left px-4 py-3 text-text-secondary font-medium">Required scope</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { token: 'GITHUB_TOKEN', url: 'github.com/settings/tokens', scope: 'repo, read:org' },
                      { token: 'LINEAR_API_KEY', url: 'linear.app/settings/api', scope: 'read access' },
                      { token: 'SLACK_BOT_TOKEN', url: 'api.slack.com/apps', scope: 'channels:read messages:read' },
                      { token: 'NOTION_TOKEN', url: 'notion.so/my-integrations', scope: 'read content' },
                      { token: 'GEMINI_API_KEY', url: 'aistudio.google.com', scope: 'full access' },
                    ].map((row, i, arr) => (
                      <tr key={row.token} className={i < arr.length - 1 ? 'border-b border-border' : ''}>
                        <td className="px-4 py-3 font-mono text-xs text-white">{row.token}</td>
                        <td className="px-4 py-3 text-text-secondary">{row.url}</td>
                        <td className="px-4 py-3 text-text-secondary font-mono text-xs">{row.scope}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <InfoBox>
              Tokens are stored locally in <code className="font-mono text-xs text-text-primary bg-code-bg px-1 py-0.5 rounded">~/.sorelax/.env</code> and in Coral's local secrets store. They are never sent anywhere except to their respective APIs.
            </InfoBox>
          </div>

          {/* First run */}
          <div ref={(el) => setSectionRef('first-run', el)} id="first-run" className="mb-12 scroll-mt-[88px]">
            <h3 className="text-xl font-semibold text-white mb-4">First run</h3>
            <p className="text-text-secondary text-[15px] leading-relaxed mb-4">
              After installation, Sorelax runs automatically. You should see:
            </p>
            <div className="mb-6">
              <Terminal
                lines={firstRunTerminalLines}
                title="first run"
                loop={false}
                typingSpeed={80}
                showWindowDots={false}
              />
            </div>
            <p className="text-text-secondary text-[15px] leading-relaxed">
              Open your repo in Claude Code or Cursor. Your AI coding agent will read CLAUDE.md automatically and start the session already knowing your project state.
            </p>
          </div>
        </section>

        {/* ─── CONFIGURATION ─── */}
        <section className="mb-16">
          <h2 className="text-xs uppercase tracking-[0.12em] text-[#333333] font-medium mb-6">Configuration</h2>

          <div ref={(el) => setSectionRef('environment-variables', el)} id="environment-variables" className="mb-12 scroll-mt-[88px]">
            <h3 className="text-xl font-semibold text-white mb-4">Environment variables</h3>
            <p className="text-text-secondary text-[15px] leading-relaxed mb-4">
              Sorelax reads configuration from <code className="font-mono text-xs text-text-primary bg-code-bg px-1 py-0.5 rounded">~/.sorelax/.env</code>. You can edit this file directly or use the CLI.
            </p>
            <CodeBlock
              code={`# ~/.sorelax/.env
GITHUB_TOKEN=ghp_xxxxxxxxxxxx
LINEAR_API_KEY=lin_api_xxxxxxxx
SLACK_BOT_TOKEN=xoxb-xxxxxxxxxx
NOTION_TOKEN=secret_xxxxxxxxxx
GEMINI_API_KEY=AIzaSyxxxxxxxxxx
REPO_PATH=/Users/you/code/your-project`}
              className="mb-4"
            />
          </div>

          <div ref={(el) => setSectionRef('changing-refresh-interval', el)} id="changing-refresh-interval" className="mb-12 scroll-mt-[88px]">
            <h3 className="text-xl font-semibold text-white mb-4">Changing refresh interval</h3>
            <p className="text-text-secondary text-[15px] leading-relaxed mb-4">
              The default refresh interval is 6 hours. To change it, set the <code className="font-mono text-xs text-text-primary bg-code-bg px-1 py-0.5 rounded">REFRESH_INTERVAL_HOURS</code> environment variable:
            </p>
            <CodeBlock code="echo 'REFRESH_INTERVAL_HOURS=2' >> ~/.sorelax/.env" className="mb-4" />
            <p className="text-text-secondary text-[15px] leading-relaxed">
              Then restart the daemon with <code className="font-mono text-xs text-text-primary bg-code-bg px-1 py-0.5 rounded">sorelax stop && sorelax start</code>.
            </p>
          </div>

          <div ref={(el) => setSectionRef('customising-sources', el)} id="customising-sources" className="mb-12 scroll-mt-[88px]">
            <h3 className="text-xl font-semibold text-white mb-4">Customising sources</h3>
            <p className="text-text-secondary text-[15px] leading-relaxed mb-4">
              You can disable individual sources by setting their token to an empty value, or by using the Coral CLI directly:
            </p>
            <CodeBlock
              code={`# Disable Slack
coral source remove slack

# Re-add later
coral source add --interactive slack

# List active sources
coral source list`}
              className="mb-4"
            />
          </div>
        </section>

        {/* ─── CLI REFERENCE ─── */}
        <section className="mb-16">
          <h2 className="text-xs uppercase tracking-[0.12em] text-[#333333] font-medium mb-6">CLI reference</h2>

          {/* sorelax refresh */}
          <div ref={(el) => setSectionRef('sorelax-refresh', el)} id="sorelax-refresh" className="mb-12 scroll-mt-[88px]">
            <h3 className="text-xl font-semibold text-white mb-4">sorelax refresh</h3>
            <p className="text-text-secondary text-[15px] leading-relaxed mb-4">
              Runs the full pipeline immediately. Queries all four Coral sources, summarises with Gemini, and updates CLAUDE.md.
            </p>
            <CodeBlock code="sorelax refresh" className="mb-4" />
            <Terminal lines={refreshCommandLines} title="sorelax refresh" loop={false} showWindowDots={false} />
          </div>

          {/* sorelax ask */}
          <div ref={(el) => setSectionRef('sorelax-ask', el)} id="sorelax-ask" className="mb-12 scroll-mt-[88px]">
            <h3 className="text-xl font-semibold text-white mb-4">sorelax ask</h3>
            <p className="text-text-secondary text-[15px] leading-relaxed mb-4">
              Runs an on-demand Coral query for the given topic and returns relevant issues, PRs, and discussions.
            </p>
            <CodeBlock code='sorelax ask "who is working on auth?"' className="mb-4" />
            <Terminal lines={askCommandLines} title="sorelax ask" loop={false} showWindowDots={false} />
          </div>

          {/* sorelax status */}
          <div ref={(el) => setSectionRef('sorelax-status', el)} id="sorelax-status" className="mb-12 scroll-mt-[88px]">
            <h3 className="text-xl font-semibold text-white mb-4">sorelax status</h3>
            <p className="text-text-secondary text-[15px] leading-relaxed mb-4">
              Shows last refresh time, next scheduled refresh, and health status of all four data sources.
            </p>
            <CodeBlock code="sorelax status" className="mb-4" />
            <Terminal lines={statusCommandLines} title="sorelax status" loop={false} showWindowDots={false} />
          </div>

          {/* sorelax logs */}
          <div ref={(el) => setSectionRef('sorelax-logs', el)} id="sorelax-logs" className="mb-12 scroll-mt-[88px]">
            <h3 className="text-xl font-semibold text-white mb-4">sorelax logs</h3>
            <p className="text-text-secondary text-[15px] leading-relaxed mb-4">
              Shows the last 10 refresh entries from <code className="font-mono text-xs text-text-primary bg-code-bg px-1 py-0.5 rounded">~/.sorelax/project_log.jsonl</code>.
            </p>
            <CodeBlock code="sorelax logs" className="mb-4" />
            <Terminal lines={logsCommandLines} title="sorelax logs" loop={false} showWindowDots={false} />
          </div>

          {/* sorelax start/stop */}
          <div ref={(el) => setSectionRef('sorelax-start', el)} id="sorelax-start" className="mb-12 scroll-mt-[88px]">
            <h3 className="text-xl font-semibold text-white mb-4">sorelax start</h3>
            <p className="text-text-secondary text-[15px] leading-relaxed mb-4">
              Starts the background scheduler daemon that runs <code className="font-mono text-xs text-text-primary bg-code-bg px-1 py-0.5 rounded">sorelax refresh</code> every 6 hours automatically.
            </p>
            <CodeBlock code="sorelax start" className="mb-4" />
            <Terminal lines={startStopCommandLines} title="sorelax start" loop={false} showWindowDots={false} />
          </div>

          <div ref={(el) => setSectionRef('sorelax-stop', el)} id="sorelax-stop" className="mb-12 scroll-mt-[88px]">
            <h3 className="text-xl font-semibold text-white mb-4">sorelax stop</h3>
            <p className="text-text-secondary text-[15px] leading-relaxed mb-4">
              Stops the background scheduler daemon.
            </p>
            <CodeBlock code="sorelax stop" className="mb-4" />
            <Terminal
              lines={[
                { text: '$ sorelax stop', color: 'tertiary', delay: 100 },
                { text: '[Sorelax] Daemon stopped.', color: 'green', delay: 300 },
              ]}
              title="sorelax stop"
              loop={false}
              showWindowDots={false}
            />
          </div>
        </section>

        {/* ─── HOW IT WORKS ─── */}
        <section className="mb-16">
          <h2 className="text-xs uppercase tracking-[0.12em] text-[#333333] font-medium mb-6">How it works</h2>

          <div ref={(el) => setSectionRef('the-coral-sql-query', el)} id="the-coral-sql-query" className="mb-12 scroll-mt-[88px]">
            <h3 className="text-xl font-semibold text-white mb-4">The Coral SQL query</h3>
            <p className="text-text-secondary text-[15px] leading-relaxed mb-4">
              Coral is a local SQL engine that exposes APIs as database tables. Sorelax builds a single <code className="font-mono text-xs text-text-primary bg-code-bg px-1 py-0.5 rounded">FULL OUTER JOIN</code> query that pulls from all four sources at once.
            </p>
            <p className="text-text-secondary text-[15px] leading-relaxed mb-4">
              Because Coral runs locally, your data never leaves your machine. The SQL engine translates queries into API calls, streams results, and joins them in memory.
            </p>
          </div>

          <div ref={(el) => setSectionRef('gemini-summarisation', el)} id="gemini-summarisation" className="mb-12 scroll-mt-[88px]">
            <h3 className="text-xl font-semibold text-white mb-4">Gemini summarisation</h3>
            <p className="text-text-secondary text-[15px] leading-relaxed mb-4">
              After joining the data, Sorelax sends the results to Gemini API for summarisation. The model extracts key themes, active workstreams, open decisions, and sprint priorities from the raw data.
            </p>
            <p className="text-text-secondary text-[15px] leading-relaxed mb-4">
              This step is what makes CLAUDE.md genuinely useful — it transforms raw API data into contextual narrative that an AI coding agent can reason about.
            </p>
          </div>

          <div ref={(el) => setSectionRef('claude-md-output', el)} id="claude-md-output" className="mb-12 scroll-mt-[88px]">
            <h3 className="text-xl font-semibold text-white mb-4">CLAUDE.md output</h3>
            <p className="text-text-secondary text-[15px] leading-relaxed mb-4">
              The final output is a structured markdown file written to your repo root. Claude Code and Cursor automatically read this file at the start of every session.
            </p>
            <p className="text-text-secondary text-[15px] leading-relaxed mb-4">
              The file includes sections for active work, open PRs, sprint goals, recent decisions, architecture notes, and team context. It updates every 6 hours or on demand.
            </p>
          </div>

          <div ref={(el) => setSectionRef('hermes-agent-memory', el)} id="hermes-agent-memory" className="mb-12 scroll-mt-[88px]">
            <h3 className="text-xl font-semibold text-white mb-4">Hermes Agent memory</h3>
            <p className="text-text-secondary text-[15px] leading-relaxed mb-4">
              Hermes Agent is the background scheduler that powers Sorelax. It manages the refresh cycle, handles API retries, and maintains local state between runs.
            </p>
            <p className="text-text-secondary text-[15px] leading-relaxed">
              The agent stores its state in <code className="font-mono text-xs text-text-primary bg-code-bg px-1 py-0.5 rounded">~/.sorelax/</code>, including logs, cached tokens, and the last refresh timestamp. This means Sorelax survives reboots and continues scheduling automatically.
            </p>
          </div>
        </section>

        {/* ─── TROUBLESHOOTING ─── */}
        <section className="mb-16">
          <h2 className="text-xs uppercase tracking-[0.12em] text-[#333333] font-medium mb-6">Troubleshooting</h2>

          <div ref={(el) => setSectionRef('slack-auth-issues', el)} id="slack-auth-issues" className="mb-12 scroll-mt-[88px]">
            <h3 className="text-xl font-semibold text-white mb-4">Slack auth issues</h3>
            <p className="text-text-secondary text-[15px] leading-relaxed mb-4">
              Slack OAuth can sometimes be slow. If the Slack source fails, Sorelax will continue with the other three sources and warn you. To retry:
            </p>
            <CodeBlock code="coral source add --interactive slack" className="mb-4" />
          </div>

          <div ref={(el) => setSectionRef('source-not-found', el)} id="source-not-found" className="mb-12 scroll-mt-[88px]">
            <h3 className="text-xl font-semibold text-white mb-4">Source not found</h3>
            <p className="text-text-secondary text-[15px] leading-relaxed mb-4">
              If <code className="font-mono text-xs text-text-primary bg-code-bg px-1 py-0.5 rounded">coral source list</code> does not show all four sources, re-run the setup for the missing one:
            </p>
            <CodeBlock
              code={`# Add each source individually
coral source add --interactive github
coral source add --interactive linear
coral source add --interactive slack
coral source add --interactive notion`}
              className="mb-4"
            />
          </div>

          <div ref={(el) => setSectionRef('gemini-errors', el)} id="gemini-errors" className="mb-12 scroll-mt-[88px]">
            <h3 className="text-xl font-semibold text-white mb-4">Gemini errors</h3>
            <p className="text-text-secondary text-[15px] leading-relaxed mb-4">
              If Gemini summarisation fails, Sorelax will still write the raw joined data to CLAUDE.md so your agent has context. Check your API key and rate limits:
            </p>
            <CodeBlock code="sorelax status" className="mb-4" />
            <InfoBox>
              Gemini API has rate limits. If you hit them frequently, consider increasing the refresh interval to 12 hours.
            </InfoBox>
          </div>
        </section>
      </div>
    </div>
  );
}
