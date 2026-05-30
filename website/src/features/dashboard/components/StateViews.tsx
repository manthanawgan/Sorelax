import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-md border border-dashed border-zinc-800/80 bg-zinc-950/30 px-6 py-10 text-center',
        className,
      )}
    >
      <p className="font-mono text-sm font-medium text-zinc-300">{title}</p>
      <p className="mt-2 max-w-md font-sans text-[13px] leading-relaxed text-zinc-500">
        {description}
      </p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

interface LoadingSkeletonProps {
  lines?: number;
  className?: string;
}

export function LoadingSkeleton({ lines = 4, className }: LoadingSkeletonProps) {
  return (
    <div className={cn('animate-pulse space-y-3', className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className="h-3 rounded-sm bg-zinc-800/50"
          style={{ width: `${Math.max(35, 92 - index * 14)}%` }}
        />
      ))}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  message: string;
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'rounded-md border border-red-500/20 bg-red-500/5 px-4 py-3',
        className,
      )}
    >
      <p className="font-mono text-sm font-medium text-red-300">{title}</p>
      <p className="mt-1 font-sans text-[13px] text-red-200/70">{message}</p>
    </div>
  );
}
