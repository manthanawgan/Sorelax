import { cn } from '@/lib/utils';
import type { NavItem as NavItemConfig } from '../nav';
import type { DashboardSection } from '../types';

interface SidebarNavItemProps {
  item: NavItemConfig;
  active: boolean;
  onSelect: (id: DashboardSection) => void;
}

export function SidebarNavItem({ item, active, onSelect }: SidebarNavItemProps) {
  const Icon = item.icon;

  return (
    <button
      type="button"
      onClick={() => onSelect(item.id)}
      className={cn(
        'group relative flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-all duration-200',
        active
          ? 'bg-white/[0.06] text-white'
          : 'text-zinc-500 hover:bg-white/[0.03] hover:text-zinc-300',
      )}
    >
      {active && (
        <span
          className="absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-full bg-coral-400 shadow-[0_0_12px_rgba(56,189,176,0.6)]"
          aria-hidden
        />
      )}
      <Icon
        className={cn(
          'h-[18px] w-[18px] shrink-0 transition-colors',
          active ? 'text-coral-400' : 'text-zinc-600 group-hover:text-zinc-400',
        )}
        strokeWidth={1.75}
      />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="font-mono text-[13px] font-medium tracking-tight">{item.label}</span>
        <span className="truncate font-sans text-[11px] text-zinc-600 group-hover:text-zinc-500">
          {item.description}
        </span>
      </span>
      {item.shortcut && (
        <kbd
          className={cn(
            'hidden rounded border px-1.5 py-0.5 font-mono text-[10px] lg:inline',
            active
              ? 'border-zinc-700 bg-zinc-900 text-zinc-500'
              : 'border-zinc-800 bg-zinc-950 text-zinc-700',
          )}
        >
          {item.shortcut}
        </kbd>
      )}
    </button>
  );
}
