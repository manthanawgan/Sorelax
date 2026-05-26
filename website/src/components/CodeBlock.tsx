import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CodeBlockProps {
  code: string;
  language?: string;
  showCopy?: boolean;
  className?: string;
  maxWidth?: string;
}

export default function CodeBlock({ code, language, showCopy = true, className = '', maxWidth }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [code]);

  return (
    <div
      className={`relative rounded-card border border-border bg-code-bg overflow-hidden ${className}`}
      style={maxWidth ? { maxWidth } : undefined}
    >
      {language && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-surface/50">
          <span className="text-[11px] text-text-tertiary uppercase tracking-wider">{language}</span>
        </div>
      )}
      <div className="relative group">
        <pre className="p-4 overflow-x-auto">
          <code className="font-mono text-[13px] leading-relaxed text-text-primary whitespace-pre">
            {code}
          </code>
        </pre>
        {showCopy && (
          <button
            onClick={handleCopy}
            className="absolute top-3 right-3 p-2 rounded-button border border-border bg-surface/80 
                       text-text-tertiary hover:text-text-primary hover:border-text-tertiary 
                       transition-colors duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100"
            aria-label="Copy to clipboard"
          >
            <AnimatePresence mode="wait" initial={false}>
              {copied ? (
                <motion.svg
                  key="check"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-success"
                >
                  <polyline points="20 6 9 17 4 12" />
                </motion.svg>
              ) : (
                <motion.svg
                  key="copy"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </motion.svg>
              )}
            </AnimatePresence>
          </button>
        )}
      </div>
      {/* Copied tooltip */}
      <AnimatePresence>
        {copied && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute top-3 right-12 px-2 py-1 rounded-badge bg-surface border border-border 
                       text-[11px] text-text-secondary pointer-events-none"
          >
            Copied!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
