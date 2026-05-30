import { AlertTriangle } from 'lucide-react';
import { useApiHealth } from '@/lib/hooks/useApiHealth';
import { API_BASE_URL } from '@/lib/api/client';

export function ApiHealthBanner() {
  const { isError, isLoading, isSuccess } = useApiHealth();

  if (isLoading || isSuccess) {
    return null;
  }

  return (
    <div
      role="alert"
      className="flex items-center gap-3 border-b border-amber-500/30 bg-amber-500/10 px-6 py-2.5"
    >
      <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" strokeWidth={2} />
      <p className="font-mono text-[12px] text-amber-200/90">
        Backend unreachable at{' '}
        <span className="text-amber-100">{API_BASE_URL}</span>. Start the API with{' '}
        <code className="rounded bg-black/30 px-1.5 py-0.5 text-amber-100">sorelax-api</code>{' '}
        before using the dashboard.
      </p>
      {isError ? (
        <span className="ml-auto hidden font-mono text-[11px] text-amber-400/70 sm:inline">
          Retrying every 15s
        </span>
      ) : null}
    </div>
  );
}
