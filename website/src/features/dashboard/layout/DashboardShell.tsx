import { useCallback, useEffect, useRef, useState, type ComponentType, type RefObject } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { DashboardPanel } from '../panels/DashboardPanel';
import { AskPanel } from '../panels/AskPanel';
import { LogsPanel } from '../panels/LogsPanel';
import { SourcesPanel } from '../panels/SourcesPanel';
import { SettingsPanel } from '../panels/SettingsPanel';
import { useLocalStorage } from '@/lib/hooks/useLocalStorage';
import { ApiHealthBanner } from '../components/ApiHealthBanner';
import { RefreshLogTable } from '../components/RefreshLogTable';
import { NAV_ITEMS } from '../nav';
import type { DashboardSection } from '../types';
import { cn } from '@/lib/utils';
import '../dashboard.css';

const PANELS: Record<DashboardSection, ComponentType<{ inputRef?: RefObject<HTMLInputElement | null> }>> = {
  dashboard: DashboardPanel,
  ask: AskPanel,
  logs: LogsPanel,
  sources: SourcesPanel,
  settings: SettingsPanel,
};

export function DashboardShell() {
  const [active, setActive] = useState<DashboardSection>('dashboard');
  const [logsOpen, setLogsOpen] = useLocalStorage('sorelax:logs-panel-open', false);
  const askInputRef = useRef<HTMLInputElement>(null);

  const focusAskInput = useCallback(() => {
    setActive('ask');
    requestAnimationFrame(() => {
      askInputRef.current?.focus();
    });
  }, []);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable;

      if (event.key === '/' && !event.metaKey && !event.ctrlKey && !event.altKey && !isTyping) {
        event.preventDefault();
        focusAskInput();
        return;
      }

      if (event.metaKey || event.ctrlKey || event.altKey || isTyping) return;

      const match = NAV_ITEMS.find((item) => item.shortcut === event.key);
      if (match) {
        event.preventDefault();
        setActive(match.id);
      }
    },
    [focusAskInput],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const ActivePanel = PANELS[active];

  return (
    <div className="dashboard-root flex h-screen overflow-hidden bg-[#0a0a0a] text-white">
      <div className="dashboard-grid pointer-events-none fixed inset-0" aria-hidden />
      <Sidebar active={active} onNavigate={setActive} />

      <div className="relative flex min-w-0 flex-1 flex-col">
        <ApiHealthBanner />
        <div className="relative flex min-w-0 flex-1">
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar activeSection={active} />
          <main className="flex-1 overflow-y-auto p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
              >
                <ActivePanel inputRef={active === 'ask' ? askInputRef : undefined} />
              </motion.div>
            </AnimatePresence>
          </main>
        </div>

        <aside
          className={cn(
            'hidden w-80 shrink-0 flex-col border-l border-zinc-800/60 bg-[#080808]/90 xl:flex',
          )}
        >
          <div className="border-b border-zinc-800/50 px-4 py-4">
            <p className="font-mono text-sm font-medium text-white">Live logs</p>
            <p className="mt-1 font-sans text-[12px] text-zinc-600">Refresh history</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <RefreshLogTable compact />
          </div>
        </aside>

        <div className="xl:hidden">
          <button
            type="button"
            onClick={() => setLogsOpen((open) => !open)}
            className="fixed bottom-5 right-5 z-20 inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950/95 px-4 py-2 font-mono text-[12px] text-zinc-400 shadow-lg backdrop-blur-sm"
          >
            {logsOpen ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            Logs
          </button>

          {logsOpen ? (
            <aside className="fixed inset-y-0 right-0 z-10 flex w-[min(100%,20rem)] flex-col border-l border-zinc-800/60 bg-[#080808]/98 pt-14 shadow-2xl">
              <div className="border-b border-zinc-800/50 px-4 py-3">
                <p className="font-mono text-sm font-medium text-white">Live logs</p>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <RefreshLogTable compact />
              </div>
            </aside>
          ) : null}
        </div>
        </div>
      </div>
    </div>
  );
}
