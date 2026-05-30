import { useCallback, useEffect, useState, type ComponentType } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { DashboardPanel } from '../panels/DashboardPanel';
import { AskPanel } from '../panels/AskPanel';
import { LogsPanel } from '../panels/LogsPanel';
import { SourcesPanel } from '../panels/SourcesPanel';
import { SettingsPanel } from '../panels/SettingsPanel';
import { NAV_ITEMS } from '../nav';
import type { DashboardSection } from '../types';
import '../dashboard.css';

const PANELS: Record<DashboardSection, ComponentType> = {
  dashboard: DashboardPanel,
  ask: AskPanel,
  logs: LogsPanel,
  sources: SourcesPanel,
  settings: SettingsPanel,
};

export function DashboardShell() {
  const [active, setActive] = useState<DashboardSection>('dashboard');

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const match = NAV_ITEMS.find((item) => item.shortcut === e.key);
    if (match) {
      e.preventDefault();
      setActive(match.id);
    }
  }, []);

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
              <ActivePanel />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
