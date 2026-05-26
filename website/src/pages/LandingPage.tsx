import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Terminal from '../components/Terminal';
import Badge from '../components/Badge';
import { heroTerminalLines } from '../lib/terminal-lines';
import { highlightSQL } from '../lib/sql-highlighter';
import {
  GitHubIcon,
  LinearIcon,
  SlackIcon,
  NotionIcon,
  TerminalIcon,
  DatabaseIcon,
  SparkleIcon,
} from '../lib/icons';

const INSTALL_COMMAND = 'curl -fsSL https://sorelax.dev/install.sh | bash';

const SQL_QUERY = `-- Sorelax core query — run by Coral every 6 hours

WITH recent_commits AS (
  SELECT sha, message, author__login, committed_date
  FROM github.commits
  WHERE owner = 'your-org' AND repo = 'your-repo'
    AND committed_date > NOW() - INTERVAL '7 days'
),
active_issues AS (
  SELECT id, title, assignee__name, cycle__name
  FROM linear.issues
  WHERE state NOT IN ('done', 'cancelled')
),
recent_discussions AS (
  SELECT text, user__name, channel__name
  FROM slack.messages
  WHERE ts > NOW() - INTERVAL '3 days'
),
arch_docs AS (
  SELECT title, url FROM notion.pages
  WHERE title ILIKE '%architecture%'
)
SELECT c.message, p.title, i.title, s.text, d.title
FROM recent_commits c
FULL OUTER JOIN github.pulls p ON c.author__login = p.author__login
FULL OUTER JOIN active_issues i ON i.assignee__name = p.author__login
FULL OUTER JOIN recent_discussions s ON s.user__name = c.author__login
FULL OUTER JOIN arch_docs d ON TRUE
LIMIT 100`;

// Shared transition preset
const t = {
  fadeUp: {
    duration: 0.5,
    ease: 'easeOut' as const,
  },
  stagger: {
    duration: 0.4,
    ease: 'easeOut' as const,
  },
};

export default function LandingPage() {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(INSTALL_COMMAND).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  return (
    <main>
      {/* ─── HERO SECTION ─── */}
      <section className="relative min-h-[calc(100vh-56px)] flex flex-col items-center justify-center px-6 py-20 overflow-hidden">
        {/* Subtle background noise */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
            backgroundSize: '256px 256px',
          }}
        />

        {/* Subtle gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-accent/5 via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center max-w-3xl mx-auto">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            <Badge variant="dot">Built for Coral Hackathon</Badge>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
            className="mt-6 text-hero-mobile md:text-hero-tablet xl:text-hero text-white font-bold tracking-tight"
          >
            <span className="block">Your coding environment,</span>
            <span className="block">always context-aware.</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.2 }}
            className="mt-5 text-lg text-text-secondary max-w-[520px]"
          >
            Sorelax runs silently in the background, joins your GitHub, Linear, Slack, and Notion in a single SQL query, and keeps your AI coding agent permanently up to date.
          </motion.p>

          {/* Install Command */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.3 }}
            className="mt-8 w-full max-w-command"
          >
            <button
              onClick={handleCopy}
              className="w-full flex items-center justify-between gap-4 px-6 py-4 rounded-card border border-border bg-code-bg hover:border-text-tertiary transition-colors duration-200 cursor-pointer group"
            >
              <code className="font-mono text-[15px] text-white truncate">
                {INSTALL_COMMAND}
              </code>
              <span className="flex-shrink-0 text-text-tertiary group-hover:text-text-primary transition-colors">
                {copied ? (
                  <motion.svg
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </motion.svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                  </svg>
                )}
              </span>
            </button>

            {/* Small text below command */}
            <p className="mt-3 text-xs text-text-tertiary">
              Works on macOS and Linux · Requires Homebrew
            </p>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.4 }}
            className="mt-8 flex flex-col sm:flex-row items-center gap-3"
          >
            <Link
              to="/docs"
              className="px-5 py-2.5 rounded-button bg-white text-black text-sm font-medium hover:bg-[#e5e5e5] transition-colors duration-200"
            >
              Read the docs
            </Link>
            <Link
              to="/github"
              className="px-5 py-2.5 rounded-button border border-border text-text-secondary text-sm hover:border-text-tertiary hover:text-white transition-all duration-200"
            >
              View on GitHub
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ─── TERMINAL ANIMATION SECTION ─── */}
      <section className="py-20 px-6">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={t.fadeUp}
          className="text-center text-[11px] text-text-tertiary uppercase tracking-[0.15em] mb-10"
        >
          What happens when you run it
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <Terminal lines={heroTerminalLines} loopDelay={8000} />
        </motion.div>
      </section>

      {/* ─── HOW IT WORKS SECTION ─── */}
      <section className="py-20 px-6">
        <div className="max-w-[1200px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={t.fadeUp}
            className="text-center mb-14"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-white">How it works</h2>
            <p className="mt-2 text-text-secondary">Install once. It runs forever.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ ...t.stagger, delay: 0 }}
              className="relative rounded-card border border-border bg-surface p-8 hover:border-[#2a2a2a] transition-colors duration-200"
            >
              <span className="absolute top-4 left-4 text-5xl font-bold text-border select-none">01</span>
              <div className="mt-12">
                <TerminalIcon className="text-accent mb-4" size={24} />
                <h3 className="text-lg font-semibold text-white mb-2">Install in one command</h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  Run the install script. Paste your API tokens when prompted. Sorelax sets up everything automatically.
                </p>
              </div>
            </motion.div>

            {/* Card 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ ...t.stagger, delay: 0.1 }}
              className="relative rounded-card border border-border bg-surface p-8 hover:border-[#2a2a2a] transition-colors duration-200"
            >
              <span className="absolute top-4 left-4 text-5xl font-bold text-border select-none">02</span>
              <div className="mt-12">
                <DatabaseIcon className="text-accent mb-4" size={24} />
                <h3 className="text-lg font-semibold text-white mb-2">Coral joins your data</h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  Every 6 hours, Sorelax runs a single SQL JOIN across GitHub, Linear, Slack, and Notion simultaneously. No individual API calls. One query. Four systems.
                </p>
              </div>
            </motion.div>

            {/* Card 3 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ ...t.stagger, delay: 0.2 }}
              className="relative rounded-card border border-border bg-surface p-8 hover:border-[#2a2a2a] transition-colors duration-200"
            >
              <span className="absolute top-4 left-4 text-5xl font-bold text-border select-none">03</span>
              <div className="mt-12">
                <SparkleIcon className="text-accent mb-4" size={24} />
                <h3 className="text-lg font-semibold text-white mb-2">Your agent stays aware</h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  Claude Code and Cursor automatically read CLAUDE.md at session start. Your AI already knows your PRs, bugs, sprint, and decisions before you type a word.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── SOURCES SECTION ─── */}
      <section className="py-20 px-6">
        <div className="max-w-[1200px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={t.fadeUp}
            className="text-center mb-14"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-white">Four sources. One query.</h2>
            <p className="mt-2 text-text-secondary max-w-lg mx-auto">
              Sorelax doesn't call APIs one by one. It JOINs all four simultaneously via Coral SQL.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* GitHub */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ ...t.stagger, delay: 0 }}
              className="rounded-card border border-border bg-surface p-6 hover:border-[#2a2a2a] transition-colors duration-200"
            >
              <GitHubIcon className="text-white mb-4" size={28} />
              <h3 className="text-base font-semibold text-white mb-1">GitHub</h3>
              <p className="text-sm text-text-secondary mb-4">Commits, pull requests, issues, branches</p>
              <Badge>bundled source</Badge>
            </motion.div>

            {/* Linear */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ ...t.stagger, delay: 0.08 }}
              className="rounded-card border border-border bg-surface p-6 hover:border-[#2a2a2a] transition-colors duration-200"
            >
              <LinearIcon className="text-white mb-4" size={28} />
              <h3 className="text-base font-semibold text-white mb-1">Linear</h3>
              <p className="text-sm text-text-secondary mb-4">Issues, cycles, sprints, priorities</p>
              <Badge>bundled source</Badge>
            </motion.div>

            {/* Slack */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ ...t.stagger, delay: 0.16 }}
              className="rounded-card border border-border bg-surface p-6 hover:border-[#2a2a2a] transition-colors duration-200"
            >
              <SlackIcon className="text-white mb-4" size={28} />
              <h3 className="text-base font-semibold text-white mb-1">Slack</h3>
              <p className="text-sm text-text-secondary mb-4">Messages, threads, channels, discussions</p>
              <Badge>bundled source</Badge>
            </motion.div>

            {/* Notion */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ ...t.stagger, delay: 0.24 }}
              className="rounded-card border border-border bg-surface p-6 hover:border-[#2a2a2a] transition-colors duration-200"
            >
              <NotionIcon className="text-white mb-4" size={28} />
              <h3 className="text-base font-semibold text-white mb-1">Notion</h3>
              <p className="text-sm text-text-secondary mb-4">Pages, docs, ADRs, architecture notes</p>
              <Badge>bundled source</Badge>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── SQL QUERY SECTION ─── */}
      <section className="py-20 px-6">
        <div className="max-w-[800px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={t.fadeUp}
            className="text-center mb-14"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-white">One query. Four systems.</h2>
            <p className="mt-2 text-text-secondary max-w-lg mx-auto">
              This is what makes Sorelax different. A single SQL JOIN that no direct API integration can produce.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <div className="rounded-card border border-border bg-code-bg overflow-hidden">
              {/* Language label */}
              <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-surface/50">
                <span className="text-[11px] text-text-tertiary uppercase tracking-wider">SQL</span>
              </div>
              <pre className="p-5 overflow-x-auto">
                <code className="font-mono text-[13px] leading-relaxed whitespace-pre">
                  {highlightSQL(SQL_QUERY)}
                </code>
              </pre>
            </div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={t.fadeUp}
            className="mt-4 text-center text-xs text-text-tertiary"
          >
            Powered by Coral — a local SQL engine over APIs
          </motion.p>
        </div>
      </section>
    </main>
  );
}
