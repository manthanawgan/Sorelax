import { cn } from '@/lib/utils';

interface RefreshProgressProps {
  lines: string[];
  className?: string;
}

export function RefreshProgress({ lines, className }: RefreshProgressProps) {
  if (lines.length === 0) {
    return (
      <div
        className={cn(
          'rounded-md border border-zinc-800/50 bg-zinc-950/80 px-3 py-2 font-mono text-[11px] text-zinc-500',
          className,
        )}
      >
        Starting refresh pipeline…
      </div>
    );
  }

  return (
    <div
      className={cn(
        'max-h-40 overflow-y-auto rounded-md border border-zinc-800/50 bg-zinc-950/80 px-3 py-2',
        className,
      )}
    >
      {lines.map((line, index) => (
        <p key={`${line}-${index}`} className="font-mono text-[11px] leading-relaxed text-zinc-500">
          {line}
        </p>
      ))}
    </div>
  );
}
