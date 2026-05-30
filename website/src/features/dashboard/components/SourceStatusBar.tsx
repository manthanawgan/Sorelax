import { useSourceStatus } from '@/lib/hooks/useSourceStatus';
import { SourceIndicator } from './SourceIndicator';
import { ErrorState, LoadingSkeleton } from './StateViews';

export function SourceStatusBar() {
  const { data, isLoading, isError, error } = useSourceStatus();

  if (isLoading) {
    return (
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <LoadingSkeleton key={index} lines={1} className="h-10 rounded-md border border-zinc-800/40 px-3 py-2" />
        ))}
      </div>
    );
  }

  if (isError) {
    return <ErrorState message={error?.message ?? 'Failed to load source status'} />;
  }

  if (!data?.sources.length) {
    return null;
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {data.sources.map((source) => (
        <SourceIndicator key={source.id} source={source} />
      ))}
    </div>
  );
}
