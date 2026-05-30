import * as Dialog from '@radix-ui/react-dialog';
import { type ReactNode } from 'react';
import { X } from 'lucide-react';
import type { RefreshLogEntry } from '@/lib/types/logs';
import { cn } from '@/lib/utils';
import { formatLogTimestamp, formatSourceCounts } from '../utils/format';

interface LogDetailDrawerProps {
  entry: RefreshLogEntry | null;
  onClose: () => void;
}

export function LogDetailDrawer({ entry, onClose }: LogDetailDrawerProps) {
  const open = entry !== null;

  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />
        <Dialog.Content
          className={cn(
            'fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-zinc-800 bg-[#0a0a0a] shadow-2xl',
            'focus:outline-none',
          )}
        >
          <div className="flex items-start justify-between border-b border-zinc-800/60 px-5 py-4">
            <div>
              <Dialog.Title className="font-mono text-sm font-medium text-white">
                Refresh log entry
              </Dialog.Title>
              <Dialog.Description className="mt-1 font-mono text-[11px] text-zinc-600">
                {entry ? formatLogTimestamp(entry.timestamp) : ''}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-900 hover:text-zinc-300"
                aria-label="Close log detail"
              >
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          {entry ? (
            <div className="flex-1 space-y-5 overflow-y-auto p-5 font-mono text-[13px]">
              <DetailRow label="Status">
                <span
                  className={cn(
                    'uppercase',
                    entry.status === 'ok' ? 'text-emerald-400' : 'text-red-400',
                  )}
                >
                  {entry.status}
                </span>
              </DetailRow>
              <DetailRow label="Rows joined">{entry.row_count}</DetailRow>
              <DetailRow label="Source counts">
                <span className="text-zinc-400">{formatSourceCounts(entry.source_counts)}</span>
              </DetailRow>
              {entry.warnings.length > 0 ? (
                <div>
                  <p className="mb-2 text-[10px] uppercase tracking-widest text-zinc-600">Warnings</p>
                  <ul className="space-y-2">
                    {entry.warnings.map((warning, index) => (
                      <li
                        key={`${warning}-${index}`}
                        className="rounded-md border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-[12px] text-amber-300/90"
                      >
                        {warning}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <DetailRow label="Warnings">
                  <span className="text-zinc-600">None</span>
                </DetailRow>
              )}
            </div>
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-[10px] uppercase tracking-widest text-zinc-600">{label}</p>
      <div className="text-zinc-300">{children}</div>
    </div>
  );
}
