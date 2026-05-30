import { Check } from 'lucide-react';
import { useCopyToClipboard } from '@/lib/hooks/useCopyToClipboard';
import { cn } from '@/lib/utils';

interface CopyButtonProps {
  value: string;
  id: string;
  label?: string;
  className?: string;
}

export function CopyButton({ value, id, label = 'Copy', className }: CopyButtonProps) {
  const { copy, isCopied } = useCopyToClipboard();

  return (
    <button
      type="button"
      onClick={() => void copy(value, id)}
      className={cn(
        'inline-flex items-center gap-1.5 rounded border border-zinc-800 bg-zinc-950 px-2 py-1 font-mono text-[10px] text-zinc-500 transition-colors hover:border-zinc-700 hover:text-zinc-300',
        className,
      )}
      aria-label={`Copy ${label}`}
    >
      {isCopied(id) ? (
        <>
          <Check className="h-3 w-3 text-emerald-400" />
          <span className="text-emerald-400">Copied</span>
        </>
      ) : (
        label
      )}
    </button>
  );
}
