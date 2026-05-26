import type { TerminalLine } from '../components/Terminal';

export const heroTerminalLines: TerminalLine[] = [
  { text: '╔══════════════════════════════════╗', color: 'white', delay: 100 },
  { text: '║         SORELAX v1.0             ║', color: 'white', delay: 80 },
  { text: '╚══════════════════════════════════╝', color: 'white', delay: 80 },
  { text: '', color: 'empty', delay: 60 },
  { text: 'Querying sources via Coral SQL...', color: 'secondary', delay: 500 },
  { text: '', color: 'empty', delay: 60 },
  { text: 'GitHub    ████████████████  ✓  31 commits · 4 PRs', color: 'white', progressBar: true, delay: 80 },
  { text: 'Linear    ████████████████  ✓  12 issues · Sprint Q3', color: 'white', progressBar: true, delay: 80 },
  { text: 'Slack     ████████████████  ✓  47 messages', color: 'white', progressBar: true, delay: 80 },
  { text: 'Notion    ████████████████  ✓  6 arch docs', color: 'white', progressBar: true, delay: 80 },
  { text: '', color: 'empty', delay: 60 },
  { text: 'Joined 4 sources · 94 rows · 1 SQL query · 1.2s', color: 'secondary', delay: 400 },
  { text: '', color: 'empty', delay: 60 },
  { text: 'Summarising with Gemini...  ✓', color: 'secondary', delay: 600 },
  { text: '', color: 'empty', delay: 60 },
  { text: '──────────────────────────────────', color: 'tertiary', delay: 80 },
  { text: 'Active work   → Auth refactor (maria)', color: 'white', delay: 80 },
  { text: 'Open PRs      → #312 auth middleware', color: 'white', delay: 80 },
  { text: 'Sprint goal   → Q3 Infrastructure', color: 'white', delay: 80 },
  { text: 'Key decision  → Moving to Redis', color: 'white', delay: 80 },
  { text: '──────────────────────────────────', color: 'tertiary', delay: 80 },
  { text: '', color: 'empty', delay: 60 },
  { text: '✓  CLAUDE.md written', color: 'green', delay: 80 },
  { text: '✓  Next refresh in 6h 00m', color: 'green', delay: 80 },
];

export const firstRunTerminalLines: TerminalLine[] = [
  { text: '[Sorelax] Querying GitHub, Linear, Slack, Notion via Coral...', color: 'secondary', delay: 100 },
  { text: '[Sorelax] 4 sources joined. 94 rows returned.', color: 'white', delay: 100 },
  { text: '[Sorelax] Summarising with Gemini...', color: 'secondary', delay: 100 },
  { text: '[Sorelax] Done. CLAUDE.md written.', color: 'green', delay: 100 },
  { text: '[Sorelax] Next refresh in 6h 00m.', color: 'green', delay: 100 },
];

export const refreshCommandLines: TerminalLine[] = [
  { text: '$ sorelax refresh', color: 'tertiary', delay: 100 },
  { text: '[Sorelax] Querying all 4 Coral sources...', color: 'secondary', delay: 600 },
  { text: '[Sorelax] Joining data... 94 rows.', color: 'secondary', delay: 400 },
  { text: '[Sorelax] Summarising with Gemini...', color: 'secondary', delay: 800 },
  { text: '[Sorelax] CLAUDE.md updated.', color: 'green', delay: 200 },
];

export const askCommandLines: TerminalLine[] = [
  { text: '$ sorelax ask "who is working on auth?"', color: 'tertiary', delay: 100 },
  { text: '[Sorelax] Running Coral query for "auth"...', color: 'secondary', delay: 600 },
  { text: '', color: 'empty', delay: 100 },
  { text: 'Open PRs:', color: 'white', delay: 100 },
  { text: '  #312 auth middleware — maria', color: 'secondary', delay: 100 },
  { text: '  #298 jwt token refresh — alex', color: 'secondary', delay: 100 },
  { text: '', color: 'empty', delay: 100 },
  { text: 'Linear issues:', color: 'white', delay: 100 },
  { text: '  AUTH-45 Fix password reset flow', color: 'secondary', delay: 100 },
  { text: '  AUTH-52 Add 2FA support', color: 'secondary', delay: 100 },
];

export const statusCommandLines: TerminalLine[] = [
  { text: '$ sorelax status', color: 'tertiary', delay: 100 },
  { text: '', color: 'empty', delay: 100 },
  { text: 'Last refresh:  2 hours ago', color: 'white', delay: 100 },
  { text: 'Next refresh:  4 hours', color: 'white', delay: 100 },
  { text: '', color: 'empty', delay: 100 },
  { text: 'Sources:', color: 'white', delay: 100 },
  { text: '  GitHub   ✓ healthy', color: 'green', delay: 100 },
  { text: '  Linear   ✓ healthy', color: 'green', delay: 100 },
  { text: '  Slack    ✓ healthy', color: 'green', delay: 100 },
  { text: '  Notion   ✓ healthy', color: 'green', delay: 100 },
];

export const logsCommandLines: TerminalLine[] = [
  { text: '$ sorelax logs', color: 'tertiary', delay: 100 },
  { text: '', color: 'empty', delay: 100 },
  { text: '2026-05-27T08:00:01Z  refresh  success  94 rows', color: 'secondary', delay: 80 },
  { text: '2026-05-27T02:00:01Z  refresh  success  87 rows', color: 'secondary', delay: 80 },
  { text: '2026-05-26T20:00:01Z  refresh  success  91 rows', color: 'secondary', delay: 80 },
  { text: '2026-05-26T14:00:01Z  refresh  success  82 rows', color: 'secondary', delay: 80 },
  { text: '2026-05-26T08:00:01Z  refresh  success  88 rows', color: 'secondary', delay: 80 },
  { text: '2026-05-26T02:00:01Z  refresh  success  95 rows', color: 'secondary', delay: 80 },
  { text: '2026-05-25T20:00:01Z  refresh  success  79 rows', color: 'secondary', delay: 80 },
  { text: '2026-05-25T14:00:01Z  refresh  success  86 rows', color: 'secondary', delay: 80 },
  { text: '2026-05-25T08:00:01Z  refresh  success  92 rows', color: 'secondary', delay: 80 },
  { text: '2026-05-25T02:00:01Z  refresh  success  81 rows', color: 'secondary', delay: 80 },
];

export const startStopCommandLines: TerminalLine[] = [
  { text: '$ sorelax start', color: 'tertiary', delay: 100 },
  { text: '[Sorelax] Daemon started.', color: 'green', delay: 300 },
  { text: '[Sorelax] Scheduled refresh every 6 hours.', color: 'secondary', delay: 200 },
];
