import { ChevronDown } from 'lucide-react';
import { type ReactNode } from 'react';
import { useLocalStorage } from '@/lib/hooks/useLocalStorage';
import { cn } from '@/lib/utils';

interface CollapsibleSectionProps {
  title: string;
  count?: number;
  defaultOpen?: boolean;
  storageKey?: string;
  children: ReactNode;
}

export function CollapsibleSection({
  title,
  count,
  defaultOpen = true,
  storageKey,
  children,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useLocalStorage(
    storageKey ? `sorelax:section:${storageKey}` : `sorelax:section:ephemeral:${title}`,
    defaultOpen,
  );

  return (
    <section className="rounded-md border border-zinc-800/50 bg-zinc-950/50">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-zinc-900/30"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2">
          <h3 className="font-mono text-[11px] font-medium uppercase tracking-widest text-zinc-500">
            {title}
          </h3>
          {typeof count === 'number' && (
            <span className="rounded border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-zinc-600">
              {count}
            </span>
          )}
        </div>
        <ChevronDown
          className={cn('h-4 w-4 text-zinc-600 transition-transform', open && 'rotate-180')}
        />
      </button>
      {open ? <div className="border-t border-zinc-800/40 px-4 py-3">{children}</div> : null}
    </section>
  );
}
