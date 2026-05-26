interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'dot';
}

export default function Badge({ children, variant = 'default' }: BadgeProps) {
  if (variant === 'dot') {
    return (
      <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-badge border border-border bg-surface text-text-secondary text-xs">
        <span className="w-1.5 h-1.5 rounded-full bg-accent" />
        {children}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-border text-text-tertiary text-[11px] font-medium">
      {children}
    </span>
  );
}
