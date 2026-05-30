import { motion } from 'framer-motion';
import { GitHubIcon } from '../lib/icons';

const README_CONTENT = `  # Sorelax

  Autonomous project context for AI coding sessions.
  Coral SQL → Gemini → CLAUDE.md every 6 hours.

  ## Install

  git clone …/sorelax && cd sorelax
  ./install.sh
  hermes model && hermes gateway

  ## Stack

  Coral · Gemini · Hermes Agent · Python · Typer`;

const t = { duration: 0.5, ease: 'easeOut' as const };
const t2 = { duration: 0.4, ease: 'easeOut' as const };

export default function GitHubPage() {
  return (
    <main className="max-w-[560px] mx-auto px-6 py-20">
      {/* GitHub icon */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={t} className="flex justify-center mb-6">
        <GitHubIcon className="text-white" size={48} />
      </motion.div>

      {/* Heading */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...t, delay: 0.1 }} className="text-center mb-4">
        <h1 className="text-3xl font-bold text-white">Open source</h1>
      </motion.div>

      {/* Subheading */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...t, delay: 0.2 }}
        className="text-center text-text-secondary mb-8"
      >
        Sorelax is fully open source. Read the code, open issues, or contribute.
      </motion.p>

      {/* Big CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...t, delay: 0.3 }}
        className="mb-12"
      >
        <a
          href="https://github.com/manthanawgan/Sorelax"
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full py-4 px-6 rounded-card bg-white text-black text-center font-medium hover:bg-[#e5e5e5] transition-colors duration-200"
        >
          View on GitHub →
        </a>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3 mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...t2, delay: 0.35 }}
          className="rounded-card border border-border bg-surface p-4 text-center"
        >
          <div className="text-lg font-semibold text-white">⭐ Star us</div>
          <div className="text-xs text-text-tertiary mt-1">Stars</div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...t2, delay: 0.4 }}
          className="rounded-card border border-border bg-surface p-4 text-center"
        >
          <div className="text-lg font-semibold text-white">MIT</div>
          <div className="text-xs text-text-tertiary mt-1">License</div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...t2, delay: 0.45 }}
          className="rounded-card border border-border bg-surface p-4 text-center"
        >
          <div className="text-sm font-semibold text-white leading-tight">Coral + Gemini</div>
          <div className="text-xs text-text-tertiary mt-1">Built with</div>
        </motion.div>
      </div>

      {/* README preview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...t, delay: 0.5 }}
      >
        <h2 className="text-xs uppercase tracking-[0.12em] text-[#333333] font-medium mb-4">README</h2>
        <div className="rounded-card border border-border bg-code-bg overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-surface/50">
            <span className="w-2 h-2 rounded-full bg-[#ef4444]" />
            <span className="w-2 h-2 rounded-full bg-[#f59e0b]" />
            <span className="w-2 h-2 rounded-full bg-[#22c55e]" />
            <span className="ml-2 text-[11px] text-text-tertiary">CLAUDE.md</span>
          </div>
          <pre className="p-5 overflow-x-auto">
            <code className="font-mono text-[13px] leading-relaxed text-text-primary whitespace-pre">
              {README_CONTENT}
            </code>
          </pre>
        </div>
      </motion.div>
    </main>
  );
}
