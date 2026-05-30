import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface PanelShellProps {
  title: string;
  subtitle?: string;
  badge?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function PanelShell({
  title,
  subtitle,
  badge,
  action,
  children,
  className,
}: PanelShellProps) {
  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-lg border border-zinc-800/60 bg-zinc-950/40',
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(56,189,176,0.04),transparent_50%)]" />
      <header className="relative flex items-start justify-between gap-4 border-b border-zinc-800/50 px-5 py-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="font-mono text-sm font-semibold tracking-tight text-white">{title}</h2>
            {badge && (
              <span className="rounded border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="mt-1 font-sans text-[13px] text-zinc-500">{subtitle}</p>
          )}
        </div>
        {action}
      </header>
      <div className="relative p-5">{children}</div>
    </section>
  );
}

interface PlaceholderBlockProps {
  lines?: number;
  label?: string;
}

export function PlaceholderBlock({ lines = 4, label }: PlaceholderBlockProps) {
  return (
    <div className="space-y-3">
      {label && (
        <p className="font-mono text-[11px] uppercase tracking-widest text-zinc-600">{label}</p>
      )}
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-3 rounded-sm bg-zinc-800/40"
          style={{ width: `${Math.max(40, 95 - i * 12)}%`, animationDelay: `${i * 80}ms` }}
        />
      ))}
    </div>
  );
}

interface EmptyMetricProps {
  label: string;
  value: string;
  hint?: string;
}

export function EmptyMetric({ label, value, hint }: EmptyMetricProps) {
  return (
    <div className="rounded-md border border-dashed border-zinc-800/80 bg-zinc-950/30 px-4 py-3">
      <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-600">{label}</p>
      <p className="mt-1 font-mono text-lg font-medium text-zinc-400">{value}</p>
      {hint && <p className="mt-1 text-[12px] text-zinc-600">{hint}</p>}
    </div>
  );
}
