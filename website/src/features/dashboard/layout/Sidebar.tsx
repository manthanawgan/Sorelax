import { NAV_ITEMS } from '../nav';
import { SidebarNavItem } from '../components/SidebarNavItem';
import { SourceHealthList } from '../components/SourceHealthList';
import { SidebarFooter } from '../components/SidebarFooter';
import type { DashboardSection } from '../types';

interface SidebarProps {
  active: DashboardSection;
  onNavigate: (section: DashboardSection) => void;
}

export function Sidebar({ active, onNavigate }: SidebarProps) {
  return (
    <aside className="flex w-[240px] shrink-0 flex-col border-r border-zinc-800/60 bg-[#080808]">
      <div className="border-b border-zinc-800/50 px-5 py-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md border border-coral-500/20 bg-coral-500/10">
            <span className="font-mono text-sm font-bold text-coral-400">S</span>
          </div>
          <div>
            <p className="font-mono text-[13px] font-semibold tracking-tight text-white">
              sorelax
            </p>
            <p className="font-mono text-[10px] text-zinc-600">context agent</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        <p className="mb-2 px-3 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-700">
          Navigate
        </p>
        {NAV_ITEMS.map((item) => (
          <SidebarNavItem
            key={item.id}
            item={item}
            active={active === item.id}
            onSelect={onNavigate}
          />
        ))}
      </nav>

      <div className="border-t border-zinc-800/50 px-4 py-4">
        <p className="mb-2.5 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-700">
          Sources
        </p>
        <SourceHealthList />
      </div>

      <div className="border-t border-zinc-800/50 px-4 py-4">
        <SidebarFooter />
      </div>
    </aside>
  );
}
